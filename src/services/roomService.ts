import {
  collection,
  doc,
  getDoc,
  getDocFromServer,
  onSnapshot,
  runTransaction,
  setDoc,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from '../firebase';
import { DINER_COLORS } from '../data/menu';
import {
  Diner,
  MenuType,
  OrderLine,
  RoomSession,
  RoomState,
} from '../types';
import { getLineTotalUnits, round2 } from '../utils/calculations';

const SALAS_COLLECTION = 'salas';
const SESSION_STORAGE_KEY = 'sushisom_room_session_v1';

// Exclude ambiguous glyphs (0/O, 1/I) so spoken/WhatsApp codes are effortless to read
const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function toFriendlyFirestoreError(
  err: unknown,
  operationType: string,
  path: string
): Error {
  const code =
    typeof err === 'object' && err !== null && 'code' in err
      ? String((err as { code: unknown }).code)
      : '';
  const rawMessage = err instanceof Error ? err.message : String(err);

  console.error(
    'Firestore Error:',
    JSON.stringify({ operationType, path, code, error: rawMessage })
  );

  if (code === 'permission-denied' || rawMessage.includes('Missing or insufficient permissions')) {
    return new Error(
      'Permiso denegado en Firestore. Revisa las reglas de seguridad de la colección "salas".'
    );
  }
  if (code === 'unavailable' || rawMessage.toLowerCase().includes('offline')) {
    return new Error(
      'Sin conexión con Firestore. Comprueba tu conexión a internet e inténtalo de nuevo.'
    );
  }
  if (err instanceof Error) {
    return err;
  }
  return new Error(rawMessage || 'Error al sincronizar con Firestore.');
}

export async function checkFirestoreConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Firestore está sin conexión. Revisa la configuración de Firebase.');
    }
  }
}

export function createId(prefix: string): string {
  if (
    typeof crypto !== 'undefined' &&
    typeof crypto.randomUUID === 'function'
  ) {
    return `${prefix}-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

export function normalizeRoomCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function generateRoomCode(): string {
  let code = '';
  for (let i = 0; i < 4; i++) {
    const idx = Math.floor(Math.random() * CODE_ALPHABET.length);
    code += CODE_ALPHABET[idx];
  }
  return code;
}

/**
 * Firestore rejects `undefined` anywhere inside documents or arrays.
 * Recursively strips undefined object keys before persisting.
 */
function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) {
        out[k] = stripUndefined(v);
      }
    }
    return out as T;
  }
  return value;
}

export function loadRoomSession(): RoomSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<RoomSession>;
    if (
      typeof parsed.roomCode === 'string' &&
      parsed.roomCode.length > 0 &&
      typeof parsed.dinerId === 'string' &&
      parsed.dinerId.length > 0
    ) {
      return {
        roomCode: normalizeRoomCode(parsed.roomCode),
        dinerId: parsed.dinerId,
      };
    }
    return null;
  } catch {
    return null;
  }
}

export function saveRoomSession(session: RoomSession): void {
  try {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Ignore quota errors
  }
}

export function clearRoomSession(): void {
  try {
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch {
    // Ignore storage errors
  }
}

export function getRoomCodeFromUrl(): string {
  try {
    const params = new URLSearchParams(window.location.search);
    const sala = params.get('sala');
    return sala ? normalizeRoomCode(sala) : '';
  } catch {
    return '';
  }
}

export function buildInviteUrl(roomCode: string): string {
  if (typeof window === 'undefined') return `?sala=${roomCode}`;
  const url = new URL(window.location.href);
  url.search = '';
  url.searchParams.set('sala', roomCode);
  return url.toString();
}

export function syncUrlWithRoom(roomCode: string | null): void {
  try {
    const url = new URL(window.location.href);
    if (roomCode) {
      url.searchParams.set('sala', roomCode);
    } else {
      url.searchParams.delete('sala');
    }
    window.history.replaceState({}, '', url.toString());
  } catch {
    // Ignore history errors
  }
}

function normalizeRoomDocument(
  docId: string,
  raw: Record<string, unknown>
): RoomState {
  const rawDiners = Array.isArray(raw.diners) ? (raw.diners as Diner[]) : [];
  const hostDinerId =
    typeof raw.hostDinerId === 'string' && raw.hostDinerId
      ? raw.hostDinerId
      : rawDiners.find((d) => d.role === 'anfitrion')?.id ??
        rawDiners[0]?.id ??
        '';

  const diners: Diner[] = rawDiners.map((d) => ({
    ...d,
    role: d.id === hostDinerId ? 'anfitrion' : d.role ?? 'invitado',
    allergies: Array.isArray(d.allergies) ? d.allergies : [],
  }));

  return {
    code: typeof raw.code === 'string' ? raw.code : docId,
    hostDinerId,
    diners,
    currentRound:
      typeof raw.currentRound === 'number' && raw.currentRound >= 1
        ? raw.currentRound
        : 1,
    draftLines: Array.isArray(raw.draftLines)
      ? (raw.draftLines as OrderLine[])
      : [],
    sentLines: Array.isArray(raw.sentLines)
      ? (raw.sentLines as OrderLine[])
      : [],
    createdAt:
      typeof raw.createdAt === 'number' ? raw.createdAt : Date.now(),
    updatedAt:
      typeof raw.updatedAt === 'number' ? raw.updatedAt : Date.now(),
  };
}

export async function createRoom(params: {
  name: string;
  menuType: MenuType;
  allergies: number[];
}): Promise<RoomSession> {
  try {
    const salasCol = collection(db, SALAS_COLLECTION);
    let code = '';

    for (let attempt = 0; attempt < 8; attempt++) {
      const candidate = generateRoomCode();
      const snap = await getDoc(doc(salasCol, candidate));
      if (!snap.exists()) {
        code = candidate;
        break;
      }
    }

    if (!code) {
      throw new Error('No se pudo generar un código libre. Inténtalo de nuevo.');
    }

    const dinerId = createId('diner');
    const hostDiner: Diner = {
      id: dinerId,
      name: params.name.trim(),
      color: DINER_COLORS[0].hex,
      menuType: params.menuType,
      role: 'anfitrion',
      allergies: params.allergies,
    };

    const now = Date.now();
    const roomDoc: RoomState = {
      code,
      hostDinerId: dinerId,
      diners: [hostDiner],
      currentRound: 1,
      draftLines: [],
      sentLines: [],
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(doc(db, SALAS_COLLECTION, code), stripUndefined(roomDoc));

    const session: RoomSession = { roomCode: code, dinerId };
    saveRoomSession(session);
    syncUrlWithRoom(code);
    return session;
  } catch (err) {
    throw toFriendlyFirestoreError(err, 'create', SALAS_COLLECTION);
  }
}

export async function joinRoom(params: {
  code: string;
  name: string;
  menuType: MenuType;
  allergies: number[];
}): Promise<RoomSession> {
  const normalizedCode = normalizeRoomCode(params.code);
  if (normalizedCode.length !== 4) {
    throw new Error('El código de sala debe tener 4 caracteres (ej. SM42).');
  }

  const roomRef = doc(db, SALAS_COLLECTION, normalizedCode);
  const dinerId = createId('diner');

  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(roomRef);
      if (!snap.exists()) {
        throw new Error(
          `No existe ninguna mesa con el código "${normalizedCode}". Revisa el código con el anfitrión.`
        );
      }

      const room = normalizeRoomDocument(
        snap.id,
        snap.data() as Record<string, unknown>
      );

      const usedColors = new Set(room.diners.map((d) => d.color));
      const availableColor =
        DINER_COLORS.find((c) => !usedColors.has(c.hex))?.hex ??
        DINER_COLORS[room.diners.length % DINER_COLORS.length].hex;

      const guestDiner: Diner = {
        id: dinerId,
        name: params.name.trim(),
        color: availableColor,
        menuType: params.menuType,
        role: 'invitado',
        allergies: params.allergies,
      };

      tx.update(
        roomRef,
        stripUndefined({
          diners: [...room.diners, guestDiner],
          updatedAt: Date.now(),
        })
      );
    });
  } catch (err) {
    throw toFriendlyFirestoreError(err, 'update', `${SALAS_COLLECTION}/${normalizedCode}`);
  }

  const session: RoomSession = { roomCode: normalizedCode, dinerId };
  saveRoomSession(session);
  syncUrlWithRoom(normalizedCode);
  return session;
}

export function subscribeToRoom(
  roomCode: string,
  onRoomData: (room: RoomState) => void,
  onRoomMissing: () => void,
  onError: (err: Error) => void
): Unsubscribe {
  const roomRef = doc(db, SALAS_COLLECTION, normalizeRoomCode(roomCode));
  return onSnapshot(
    roomRef,
    (snap) => {
      if (!snap.exists()) {
        onRoomMissing();
        return;
      }
      onRoomData(
        normalizeRoomDocument(snap.id, snap.data() as Record<string, unknown>)
      );
    },
    (err) => {
      onError(err);
    }
  );
}

async function mutateRoom(
  roomCode: string,
  mutator: (room: RoomState) => Partial<RoomState> | null
): Promise<void> {
  const normalized = normalizeRoomCode(roomCode);
  const roomRef = doc(db, SALAS_COLLECTION, normalized);
  try {
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(roomRef);
      if (!snap.exists()) {
        throw new Error('La sala ya no existe en Firestore.');
      }
      const room = normalizeRoomDocument(
        snap.id,
        snap.data() as Record<string, unknown>
      );
      const patch = mutator(room);
      if (!patch) return;
      tx.update(
        roomRef,
        stripUndefined({
          ...patch,
          updatedAt: Date.now(),
        })
      );
    });
  } catch (err) {
    throw toFriendlyFirestoreError(err, 'write', `${SALAS_COLLECTION}/${normalized}`);
  }
}

export async function addDinerToRoom(
  roomCode: string,
  dinerData: Omit<Diner, 'id'>,
  explicitId?: string
): Promise<string> {
  const newId = explicitId ?? createId('diner');
  await mutateRoom(roomCode, (room) => {
    const hasHost = Boolean(room.hostDinerId);
    const assignedRole = hasHost ? 'invitado' : dinerData.role ?? 'anfitrion';
    const nextDiner: Diner = {
      ...dinerData,
      id: newId,
      role: assignedRole,
    };
    return {
      diners: [...room.diners, nextDiner],
      hostDinerId: room.hostDinerId || (assignedRole === 'anfitrion' ? newId : ''),
    };
  });
  return newId;
}

export async function updateDinerInRoom(
  roomCode: string,
  updated: Diner
): Promise<void> {
  await mutateRoom(roomCode, (room) => ({
    diners: room.diners.map((d) => {
      if (d.id !== updated.id) return d;
      const lockedRole =
        d.id === room.hostDinerId ? 'anfitrion' : 'invitado';
      return {
        ...updated,
        role: lockedRole,
      };
    }),
  }));
}

export async function removeDinerFromRoom(
  roomCode: string,
  dinerId: string
): Promise<void> {
  await mutateRoom(roomCode, (room) => {
    // Prevent removing the exclusive host while the room is active
    if (dinerId === room.hostDinerId) return null;
    return {
      diners: room.diners.filter((d) => d.id !== dinerId),
      draftLines: room.draftLines
        .map((l) => ({
          ...l,
          assignedDinerIds: l.assignedDinerIds.filter((id) => id !== dinerId),
        }))
        .filter((l) => l.assignedDinerIds.length > 0),
      sentLines: room.sentLines.map((l) => {
        const nextEaten = { ...l.eatenByDiner };
        delete nextEaten[dinerId];
        return {
          ...l,
          assignedDinerIds: l.assignedDinerIds.filter((id) => id !== dinerId),
          eatenByDiner: nextEaten,
        };
      }),
    };
  });
}

export async function addDraftLineToRoom(
  roomCode: string,
  params: {
    dishId: string;
    quantity: number;
    assignedDinerIds: string[];
    isShared: boolean;
    extraCharge?: number;
    note?: string;
  }
): Promise<void> {
  await mutateRoom(roomCode, (room) => {
    const newLine: OrderLine = {
      id: createId('line'),
      dishId: params.dishId,
      roundNumber: room.currentRound,
      quantity: params.quantity,
      assignedDinerIds: params.assignedDinerIds,
      isShared: params.isShared,
      eatenByDiner: {},
      extraCharge: params.extraCharge,
      note: params.note,
      createdAt: Date.now(),
    };
    return {
      draftLines: [...room.draftLines, newLine],
    };
  });
}

export async function updateDraftQuantityInRoom(
  roomCode: string,
  lineId: string,
  delta: number
): Promise<void> {
  await mutateRoom(roomCode, (room) => ({
    draftLines: room.draftLines
      .map((l) =>
        l.id === lineId ? { ...l, quantity: l.quantity + delta } : l
      )
      .filter((l) => l.quantity > 0),
  }));
}

export async function removeDraftLineFromRoom(
  roomCode: string,
  lineId: string
): Promise<void> {
  await mutateRoom(roomCode, (room) => ({
    draftLines: room.draftLines.filter((l) => l.id !== lineId),
  }));
}

export async function sendRoundToKitchenInRoom(
  roomCode: string,
  dinerId: string
): Promise<number | null> {
  let sentRound: number | null = null;
  await mutateRoom(roomCode, (room) => {
    if (dinerId !== room.hostDinerId) return null;
    if (room.draftLines.length === 0) return null;
    sentRound = room.currentRound;
    return {
      sentLines: [...room.sentLines, ...room.draftLines],
      draftLines: [],
      currentRound: room.currentRound + 1,
    };
  });
  return sentRound;
}

export async function adjustEatenInRoom(
  roomCode: string,
  lineId: string,
  dinerId: string,
  delta: number
): Promise<void> {
  await mutateRoom(roomCode, (room) => ({
    sentLines: room.sentLines.map((line) => {
      if (line.id !== lineId) return line;
      const maxUnits = getLineTotalUnits(line);
      if (maxUnits <= 0) return line;

      const currentTotalEaten = round2(
        Object.values(line.eatenByDiner).reduce(
          (sum, n) => sum + (n || 0),
          0
        )
      );
      const currentDinerEaten = line.eatenByDiner[dinerId] ?? 0;

      if (delta > 0) {
        const remaining = round2(maxUnits - currentTotalEaten);
        const actualDelta = Math.min(delta, remaining);
        if (actualDelta <= 0.001) return line;
        return {
          ...line,
          eatenByDiner: {
            ...line.eatenByDiner,
            [dinerId]: round2(currentDinerEaten + actualDelta),
          },
        };
      }

      if (delta < 0) {
        if (currentDinerEaten <= 0.001) return line;
        return {
          ...line,
          eatenByDiner: {
            ...line.eatenByDiner,
            [dinerId]: Math.max(0, round2(currentDinerEaten + delta)),
          },
        };
      }

      return line;
    }),
  }));
}

export async function splitPlateEvenlyInRoom(
  roomCode: string,
  lineId: string,
  dinerIds: string[]
): Promise<void> {
  if (dinerIds.length === 0) return;
  await mutateRoom(roomCode, (room) => ({
    sentLines: room.sentLines.map((line) => {
      if (line.id !== lineId) return line;
      const maxUnits = getLineTotalUnits(line);
      if (maxUnits <= 0) return line;

      const targetSet = new Set(dinerIds);
      const eatenByOthers = round2(
        Object.entries(line.eatenByDiner).reduce(
          (sum, [id, val]) => (targetSet.has(id) ? sum : sum + (val || 0)),
          0
        )
      );
      const availableToSplit = Math.max(0, round2(maxUnits - eatenByOthers));
      if (availableToSplit <= 0.001) return line;

      const baseShare =
        Math.floor((availableToSplit / dinerIds.length) * 100) / 100;
      const remainder = round2(
        availableToSplit - baseShare * dinerIds.length
      );

      const nextEaten = { ...line.eatenByDiner };
      dinerIds.forEach((id, index) => {
        nextEaten[id] = round2(baseShare + (index === 0 ? remainder : 0));
      });

      return {
        ...line,
        eatenByDiner: nextEaten,
      };
    }),
  }));
}

export async function removeSentLineFromRoom(
  roomCode: string,
  lineId: string
): Promise<void> {
  await mutateRoom(roomCode, (room) => ({
    sentLines: room.sentLines.filter((l) => l.id !== lineId),
  }));
}

export async function resetOrdersInRoom(roomCode: string): Promise<void> {
  await mutateRoom(roomCode, () => ({
    currentRound: 1,
    draftLines: [],
    sentLines: [],
  }));
}
