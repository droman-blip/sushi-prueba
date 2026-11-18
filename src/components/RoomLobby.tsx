import React, { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowRight,
  Check,
  Crown,
  Loader2,
  PlusCircle,
  Users,
} from 'lucide-react';
import { ALLERGENS_MAP, MENU_TYPES } from '../data/menu';
import { MenuType, RoomSession } from '../types';
import {
  createRoom,
  joinRoom,
  normalizeRoomCode,
} from '../services/roomService';
import { PWAInstallButton } from './PWAInstallButton';

interface RoomLobbyProps {
  initialJoinCode: string;
  savedSession: RoomSession | null;
  externalError?: string | null;
  onEnterRoom: (session: RoomSession) => void;
  onResumeSaved: () => void;
}

const MENU_TYPE_ORDER: MenuType[] = [
  'infinity_adulto',
  'infinity_infantil',
  'menu_del_dia',
  'carta',
];

const ALLERGEN_IDS = Object.keys(ALLERGENS_MAP).map(Number);

export const RoomLobby: React.FC<RoomLobbyProps> = ({
  initialJoinCode,
  savedSession,
  externalError,
  onEnterRoom,
  onResumeSaved,
}) => {
  const [mode, setMode] = useState<'create' | 'join'>(
    initialJoinCode ? 'join' : 'create'
  );
  const [roomCode, setRoomCode] = useState(initialJoinCode);
  const [name, setName] = useState('');
  const [menuType, setMenuType] = useState<MenuType>('infinity_adulto');
  const [allergies, setAllergies] = useState<number[]>([]);
  const [showAllergies, setShowAllergies] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(externalError ?? null);

  useEffect(() => {
    if (externalError) {
      setErrorMsg(externalError);
    }
  }, [externalError]);

  const toggleAllergy = (id: number) => {
    setAllergies((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMsg('Escribe tu nombre para sentarte en la mesa.');
      return;
    }

    if (mode === 'join') {
      const normalized = normalizeRoomCode(roomCode);
      if (normalized.length !== 4) {
        setErrorMsg('Introduce el código de 4 caracteres de la mesa (ej. SM42).');
        return;
      }
    }

    setErrorMsg(null);
    setSubmitting(true);

    try {
      const session =
        mode === 'create'
          ? await createRoom({
              name: trimmedName,
              menuType,
              allergies,
            })
          : await joinRoom({
              code: roomCode,
              name: trimmedName,
              menuType,
              allergies,
            });
      onEnterRoom(session);
    } catch (err) {
      const msg =
        err instanceof Error
          ? err.message
          : 'No se pudo conectar con Firestore. Revisa tu conexión.';
      setErrorMsg(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-[#F7F6F3] text-[#141414]">
      {/* Top Bar */}
      <header className="h-14 bg-white/95 backdrop-blur-md border-b border-stone-200 px-4 sm:px-6 flex items-center justify-between">
        <div className="text-base sm:text-lg font-extrabold tracking-tight text-[#141414] flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full bg-[#E24C3B] shrink-0"
            aria-hidden="true"
          />
          <span>Sushisom Tracker</span>
        </div>
        <PWAInstallButton compact />
      </header>

      <main className="flex-1 w-full max-w-lg mx-auto px-4 py-6 sm:py-10 space-y-5">
        {/* Hero Intro */}
        <div className="space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-[#141414]">
            Mesa en directo con tus amigos
          </h1>
          <p className="text-sm text-stone-600 leading-relaxed">
            Crea una sala compartida en tiempo real o únete con el código de 4 letras para pedir rondas y contar piezas desde cada móvil.
          </p>
        </div>

        {/* Resume previous room shortcut if URL brought a different code */}
        {savedSession && (
          <div className="rounded-2xl bg-white border border-stone-200 p-3.5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-stone-500">
                Tienes una mesa guardada
              </p>
              <p className="text-sm font-bold text-[#141414]">
                Sala{' '}
                <span className="font-mono text-[#E24C3B]">
                  {savedSession.roomCode}
                </span>
              </p>
            </div>
            <button
              type="button"
              onClick={onResumeSaved}
              className="min-h-[40px] px-3.5 rounded-xl bg-[#141414] text-white text-xs font-bold inline-flex items-center gap-1.5 shrink-0 hover:bg-stone-800 cursor-pointer"
            >
              <span>Reconectar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Mode Switcher */}
        <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-stone-200/75 border border-stone-200">
          <button
            type="button"
            onClick={() => {
              setMode('create');
              setErrorMsg(null);
            }}
            className={`min-h-[46px] px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === 'create'
                ? 'bg-white text-[#141414] shadow-xs'
                : 'text-stone-600 hover:text-[#141414]'
            }`}
          >
            <PlusCircle className="w-4 h-4 text-[#E24C3B]" />
            <span>Crear nueva mesa</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('join');
              setErrorMsg(null);
            }}
            className={`min-h-[46px] px-3 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === 'join'
                ? 'bg-white text-[#141414] shadow-xs'
                : 'text-stone-600 hover:text-[#141414]'
            }`}
          >
            <Users className="w-4 h-4 text-[#E24C3B]" />
            <span>Unirse a una mesa</span>
          </button>
        </div>

        {/* Form Card */}
        <form
          onSubmit={handleSubmit}
          className="rounded-3xl bg-white border border-stone-200 p-5 sm:p-6 space-y-5 shadow-xs"
        >
          {/* Role Info Banner */}
          {mode === 'create' ? (
            <div className="rounded-2xl bg-[#F7F6F3] border border-stone-200 px-3.5 py-2.5 flex items-center gap-2.5 text-xs text-stone-700">
              <Crown className="w-4 h-4 text-[#E24C3B] shrink-0" />
              <span>
                Serás el <strong>Anfitrión</strong> exclusivo: generarás un código de 4 letras y controlarás el envío de rondas a cocina.
              </span>
            </div>
          ) : (
            <div>
              <label
                htmlFor="lobby-room-code"
                className="block text-xs font-bold text-stone-700 mb-1.5"
              >
                Código de la sala (4 caracteres)
              </label>
              <input
                id="lobby-room-code"
                type="text"
                inputMode="text"
                autoCapitalize="characters"
                maxLength={6}
                value={roomCode}
                onChange={(e) => {
                  setRoomCode(normalizeRoomCode(e.target.value).slice(0, 4));
                  if (errorMsg) setErrorMsg(null);
                }}
                placeholder="Ej: SM42"
                className="w-full min-h-[52px] px-4 rounded-xl border border-stone-300 bg-[#F7F6F3] font-mono text-xl font-extrabold tracking-[0.25em] text-center uppercase text-[#141414] placeholder:tracking-normal placeholder:font-sans placeholder:text-sm placeholder:font-medium placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#E24C3B] focus:bg-white transition-all"
              />
            </div>
          )}

          {/* Name */}
          <div>
            <label
              htmlFor="lobby-name"
              className="block text-xs font-bold text-stone-700 mb-1.5"
            >
              Tu nombre
            </label>
            <input
              id="lobby-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errorMsg) setErrorMsg(null);
              }}
              placeholder="Ej: Laura, Carlos, Dani..."
              autoFocus={Boolean(initialJoinCode)}
              className="w-full min-h-[48px] px-3.5 rounded-xl border border-stone-300 bg-[#F7F6F3] text-sm font-medium text-[#141414] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#E24C3B] focus:bg-white transition-all"
            />
          </div>

          {/* Menu Choice */}
          <div>
            <span className="block text-xs font-bold text-stone-700 mb-2">
              Tu tipo de menú
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MENU_TYPE_ORDER.map((type) => {
                const info = MENU_TYPES[type];
                const selected = menuType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setMenuType(type)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      selected
                        ? 'border-[#E24C3B] bg-[#E24C3B]/6 ring-1 ring-[#E24C3B]'
                        : 'border-stone-200 bg-[#F7F6F3] hover:bg-stone-100'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[#141414]">
                        {info.shortLabel}
                      </span>
                      <span className="font-mono tabular-nums text-xs font-bold text-[#E24C3B]">
                        {info.basePrice > 0
                          ? `${info.basePrice.toFixed(2).replace('.', ',')}€`
                          : 'Carta'}
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-600 mt-0.5 line-clamp-1">
                      {info.summary}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Allergies collapsible */}
          <div>
            <button
              type="button"
              onClick={() => setShowAllergies((v) => !v)}
              className="w-full min-h-[42px] px-3.5 rounded-xl border border-stone-200 bg-[#F7F6F3] hover:bg-stone-100 flex items-center justify-between text-xs font-bold text-[#141414] cursor-pointer"
            >
              <span>
                Alergias alimentarias{' '}
                {allergies.length > 0 ? `(${allergies.length} seleccionadas)` : '(opcional)'}
              </span>
              <span className="text-[#E24C3B]">
                {showAllergies ? 'Ocultar' : 'Configurar'}
              </span>
            </button>

            {showAllergies && (
              <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {ALLERGEN_IDS.map((id) => {
                  const selected = allergies.includes(id);
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => toggleAllergy(id)}
                      className={`min-h-[36px] px-2.5 py-1.5 rounded-lg border text-left text-[11px] font-medium flex items-center justify-between gap-1 transition-colors cursor-pointer ${
                        selected
                          ? 'border-red-500 bg-red-50 text-red-900 font-semibold'
                          : 'border-stone-200 bg-[#F7F6F3] text-stone-700 hover:bg-stone-100'
                      }`}
                    >
                      <span className="truncate">{ALLERGENS_MAP[id]}</span>
                      {selected && (
                        <Check className="w-3 h-3 text-red-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div
              role="alert"
              className="rounded-xl border border-red-300 bg-red-50 p-3 flex items-start gap-2.5 text-xs text-red-900 font-medium"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full min-h-[50px] px-5 rounded-xl bg-[#E24C3B] hover:bg-[#cf4030] disabled:bg-stone-300 text-white text-sm font-extrabold flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>
                  {mode === 'create' ? 'Creando sala...' : 'Uniéndose a la mesa...'}
                </span>
              </>
            ) : (
              <>
                <span>
                  {mode === 'create'
                    ? 'Crear mesa y obtener código'
                    : 'Entrar a la mesa en directo'}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </main>
    </div>
  );
};
