import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  BookOpen,
  Check,
  CheckCircle2,
  Copy,
  Crown,
  Loader2,
  LogOut,
  Receipt,
  TrendingUp,
  Users,
  UtensilsCrossed,
} from 'lucide-react';
import { MENU_BY_ID } from './data/menu';
import { Diner, RoomSession, RoomState, TabId } from './types';
import {
  calculateDinerSummaries,
  getTableUnconsumedStats,
} from './utils/calculations';
import {
  addDinerToRoom,
  addDraftLineToRoom,
  adjustEatenInRoom,
  buildInviteUrl,
  checkFirestoreConnection,
  clearRoomSession,
  createId,
  getRoomCodeFromUrl,
  loadRoomSession,
  removeDinerFromRoom,
  removeDraftLineFromRoom,
  removeSentLineFromRoom,
  resetOrdersInRoom,
  saveRoomSession,
  sendRoundToKitchenInRoom,
  splitPlateEvenlyInRoom,
  subscribeToRoom,
  syncUrlWithRoom,
  updateDinerInRoom,
  updateDraftQuantityInRoom,
} from './services/roomService';
import { RoomLobby } from './components/RoomLobby';
import { DinersTab } from './components/DinersTab';
import { OrderTab } from './components/OrderTab';
import { TableTab } from './components/TableTab';
import { UsersTab } from './components/UsersTab';
import { BillRankingTab } from './components/BillRankingTab';
import { ResetModal } from './components/ResetModal';
import { PWAInstallButton } from './components/PWAInstallButton';

export default function App() {
  const [initialUrlCode] = useState<string>(() => getRoomCodeFromUrl());
  const [savedSession, setSavedSession] = useState<RoomSession | null>(() =>
    loadRoomSession()
  );

  // Auto-reconnect on reload unless user opened an invite URL for a different room
  const [session, setSession] = useState<RoomSession | null>(() => {
    const urlCode = getRoomCodeFromUrl();
    const saved = loadRoomSession();
    if (saved && (!urlCode || urlCode === saved.roomCode)) {
      return saved;
    }
    return null;
  });

  const [room, setRoom] = useState<RoomState | null>(null);
  const [loadingRoom, setLoadingRoom] = useState<boolean>(() => Boolean(session));
  const [syncError, setSyncError] = useState<string | null>(null);
  const [lobbyError, setLobbyError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabId>('carta');
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [inviteCopied, setInviteCopied] = useState(false);

  useEffect(() => {
    void checkFirestoreConnection();
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => {
      setToastMsg((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  // Real-time Firestore onSnapshot subscription for the active room
  useEffect(() => {
    if (!session) {
      setRoom(null);
      setLoadingRoom(false);
      return;
    }

    setLoadingRoom(true);
    setSyncError(null);
    syncUrlWithRoom(session.roomCode);

    const unsubscribe = subscribeToRoom(
      session.roomCode,
      (nextRoom) => {
        const stillInRoom = nextRoom.diners.some(
          (d) => d.id === session.dinerId
        );
        if (!stillInRoom) {
          clearRoomSession();
          setSavedSession(null);
          setLobbyError(
            'Tu usuario ya no figura en esta mesa. Vuelve a unirte con tu nombre.'
          );
          setSession(null);
          setRoom(null);
          setLoadingRoom(false);
          return;
        }
        setRoom(nextRoom);
        setLoadingRoom(false);
        setSyncError(null);
      },
      () => {
        clearRoomSession();
        syncUrlWithRoom(null);
        setSavedSession(null);
        setLobbyError(
          `La sala "${session.roomCode}" no existe o ya ha sido cerrada.`
        );
        setSession(null);
        setRoom(null);
        setLoadingRoom(false);
      },
      (err) => {
        setSyncError(
          err.message || 'Error de conexión al sincronizar la sala con Firestore.'
        );
        setLoadingRoom(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [session]);

  const diners = room?.diners ?? [];
  const currentRound = room?.currentRound ?? 1;
  const draftLines = room?.draftLines ?? [];
  const sentLines = room?.sentLines ?? [];

  const isHost = Boolean(
    room && session && session.dinerId === room.hostDinerId
  );
  const hostDiner = useMemo(
    () => diners.find((d) => d.id === room?.hostDinerId),
    [diners, room?.hostDinerId]
  );

  const allLines = useMemo(
    () => [...sentLines, ...draftLines],
    [sentLines, draftLines]
  );

  const summaries = useMemo(
    () => calculateDinerSummaries(diners, sentLines, draftLines),
    [diners, sentLines, draftLines]
  );

  const unconsumedStats = useMemo(
    () => getTableUnconsumedStats(sentLines),
    [sentLines]
  );

  const draftPortionCount = useMemo(
    () => draftLines.reduce((s, l) => s + l.quantity, 0),
    [draftLines]
  );

  const inviteUrl = useMemo(
    () => (room ? buildInviteUrl(room.code) : ''),
    [room]
  );

  // --- Room Session Handlers ---
  const handleEnterRoom = (newSession: RoomSession) => {
    setLobbyError(null);
    setSavedSession(newSession);
    setSession(newSession);
    setActiveTab('carta');
    showToast(`Conectado a la sala ${newSession.roomCode}`);
  };

  const handleResumeSaved = () => {
    if (!savedSession) return;
    saveRoomSession(savedSession);
    syncUrlWithRoom(savedSession.roomCode);
    setLobbyError(null);
    setSession(savedSession);
    setActiveTab('carta');
  };

  const handleLeaveRoom = () => {
    clearRoomSession();
    syncUrlWithRoom(null);
    setSavedSession(null);
    setSession(null);
    setRoom(null);
    setResetModalOpen(false);
    setLobbyError(null);
    showToast('Has salido de la sala');
  };

  const handleCopyInvite = async () => {
    if (!room) return;
    const url = buildInviteUrl(room.code);
    const markCopied = () => {
      setInviteCopied(true);
      showToast(`Enlace de sala ${room.code} copiado`);
      setTimeout(() => setInviteCopied(false), 2500);
    };

    try {
      await navigator.clipboard.writeText(url);
      markCopied();
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = url;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        markCopied();
      } finally {
        document.body.removeChild(textarea);
      }
    }
  };

  // --- Firestore Synced Mutations ---
  const handleAddDiner = (dinerData: Omit<Diner, 'id'>): string => {
    if (!session) return '';
    const newId = createId('diner');
    void addDinerToRoom(session.roomCode, dinerData, newId).catch((err) => {
      showToast(err instanceof Error ? err.message : 'Error al añadir comensal');
    });
    return newId;
  };

  const handleUpdateDiner = (updated: Diner) => {
    if (!session) return;
    void updateDinerInRoom(session.roomCode, updated).catch((err) => {
      showToast(err instanceof Error ? err.message : 'Error al actualizar comensal');
    });
  };

  const handleRemoveDiner = (dinerId: string) => {
    if (!session) return;
    void removeDinerFromRoom(session.roomCode, dinerId).catch((err) => {
      showToast(err instanceof Error ? err.message : 'Error al eliminar comensal');
    });
  };

  const handleAddDraftLine = (params: {
    dishId: string;
    quantity: number;
    assignedDinerIds: string[];
    isShared: boolean;
    extraCharge?: number;
    note?: string;
  }) => {
    if (!session) return;
    const dish = MENU_BY_ID[params.dishId];
    void addDraftLineToRoom(session.roomCode, params)
      .then(() => {
        if (dish) {
          showToast(`Añadido a Ronda ${currentRound}: ${dish.name}`);
        }
      })
      .catch((err) => {
        showToast(err instanceof Error ? err.message : 'Error al añadir plato');
      });
  };

  const handleUpdateDraftQuantity = (lineId: string, delta: number) => {
    if (!session) return;
    void updateDraftQuantityInRoom(session.roomCode, lineId, delta).catch((err) => {
      showToast(err instanceof Error ? err.message : 'Error al actualizar cantidad');
    });
  };

  const handleRemoveDraftLine = (lineId: string) => {
    if (!session) return;
    void removeDraftLineFromRoom(session.roomCode, lineId).catch((err) => {
      showToast(err instanceof Error ? err.message : 'Error al eliminar plato');
    });
  };

  const handleSendRoundToKitchen = () => {
    if (!session || !isHost || draftLines.length === 0) return;
    void sendRoundToKitchenInRoom(session.roomCode, session.dinerId)
      .then((sentRound) => {
        if (sentRound !== null) {
          setActiveTab('en_mesa');
          showToast(`Ronda ${sentRound} mandada a cocina`);
        }
      })
      .catch((err) => {
        showToast(err instanceof Error ? err.message : 'Error al enviar la ronda');
      });
  };

  const handleAdjustEaten = (lineId: string, dinerId: string, delta: number) => {
    if (!session) return;
    void adjustEatenInRoom(session.roomCode, lineId, dinerId, delta).catch((err) => {
      showToast(err instanceof Error ? err.message : 'Error al actualizar piezas');
    });
  };

  const handleSplitPlateEvenly = (lineId: string, dinerIds: string[]) => {
    if (!session) return;
    void splitPlateEvenlyInRoom(session.roomCode, lineId, dinerIds).catch((err) => {
      showToast(err instanceof Error ? err.message : 'Error al repartir plato');
    });
  };

  const handleRemoveSentLine = (lineId: string) => {
    if (!session) return;
    void removeSentLineFromRoom(session.roomCode, lineId).catch((err) => {
      showToast(err instanceof Error ? err.message : 'Error al quitar plato');
    });
  };

  const handleResetOrdersOnly = () => {
    if (!session || !isHost) return;
    void resetOrdersInRoom(session.roomCode)
      .then(() => {
        setResetModalOpen(false);
        setActiveTab('carta');
        showToast('Rondas reiniciadas en toda la sala');
      })
      .catch((err) => {
        showToast(err instanceof Error ? err.message : 'Error al reiniciar rondas');
      });
  };

  // --- Initial Lobby View when not connected to a room ---
  if (!session) {
    return (
      <RoomLobby
        initialJoinCode={initialUrlCode}
        savedSession={savedSession}
        externalError={lobbyError}
        onEnterRoom={handleEnterRoom}
        onResumeSaved={handleResumeSaved}
      />
    );
  }

  // --- Connecting / Initial Snapshot Screen ---
  if (loadingRoom && !room) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center bg-[#F7F6F3] text-[#141414] px-4">
        <div className="rounded-3xl bg-white border border-stone-200 p-8 max-w-sm w-full text-center space-y-4 shadow-xs">
          <Loader2 className="w-8 h-8 text-[#E24C3B] animate-spin mx-auto" />
          <div className="space-y-1">
            <h1 className="text-lg font-extrabold">
              Conectando a la sala{' '}
              <span className="font-mono text-[#E24C3B]">
                {session.roomCode}
              </span>
            </h1>
            <p className="text-xs text-stone-600">
              Sincronizando comensales, rondas y piezas en vivo con Firestore...
            </p>
          </div>
          <button
            type="button"
            onClick={handleLeaveRoom}
            className="min-h-[40px] px-4 rounded-xl border border-stone-200 text-xs font-semibold text-stone-600 hover:bg-stone-50 cursor-pointer"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  const pendingBadge =
    unconsumedStats.unconsumedSushiPieces > 0
      ? unconsumedStats.unconsumedSushiPieces
      : unconsumedStats.incompleteFoodDishes > 0
      ? unconsumedStats.incompleteFoodDishes
      : undefined;

  const navItems: {
    id: TabId;
    label: string;
    icon: typeof Users;
    badge?: number;
  }[] = [
    {
      id: 'mesa',
      label: 'Mesa',
      icon: Users,
      badge: diners.length > 0 ? diners.length : undefined,
    },
    {
      id: 'carta',
      label: 'Carta',
      icon: BookOpen,
      badge: draftPortionCount > 0 ? draftPortionCount : undefined,
    },
    {
      id: 'en_mesa',
      label: 'En Mesa',
      icon: UtensilsCrossed,
      badge: pendingBadge,
    },
    {
      id: 'usuarios',
      label: 'Usuarios',
      icon: TrendingUp,
    },
    {
      id: 'cuenta',
      label: 'Cuenta',
      icon: Receipt,
    },
  ];

  return (
    <div className="min-h-dvh flex flex-col bg-[#F7F6F3] text-[#141414]">
      {/* Compact Sticky Top Bar (3-zone contract: Brand/Room — Desktop Nav — Invite/PWA/Options) */}
      <header className="sticky top-0 z-30 h-14 bg-white/95 backdrop-blur-md border-b border-stone-200 px-3 sm:px-6">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between gap-2 sm:gap-6">
          {/* Zone 1: Brand wordmark + Room code */}
          <div className="flex items-center gap-2 min-w-0 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('carta')}
              className="text-sm sm:text-lg font-extrabold tracking-tight text-[#141414] whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer"
            >
              <span
                className="w-2.5 h-2.5 rounded-full bg-[#E24C3B] shrink-0"
                aria-hidden="true"
              />
              <span className="hidden xs:inline sm:inline">Sushisom</span>
              <span className="hidden lg:inline">Tracker</span>
            </button>

            <span className="text-stone-300" aria-hidden="true">
              ·
            </span>

            <span className="font-mono text-xs sm:text-sm font-extrabold tracking-wider text-[#E24C3B] whitespace-nowrap inline-flex items-center gap-1">
              {isHost && (
                <Crown
                  className="w-3.5 h-3.5 text-[#E24C3B]"
                  aria-label="Anfitrión"
                />
              )}
              {room?.code ?? session.roomCode}
            </span>
          </div>

          {/* Zone 2: Desktop single-line nav links */}
          <nav
            aria-label="Navegación principal"
            className="hidden md:flex items-center gap-5"
          >
            {navItems.map((item) => {
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`min-h-[40px] px-1 text-sm font-semibold whitespace-nowrap shrink-0 border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
                    active
                      ? 'border-[#E24C3B] text-[#141414]'
                      : 'border-transparent text-stone-500 hover:text-[#141414]'
                  }`}
                >
                  <span>{item.label}</span>
                  {item.badge !== undefined && (
                    <span className="font-mono tabular-nums text-xs text-[#E24C3B] font-bold">
                      ({item.badge})
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Copy Invite + PWA Install + Room Options */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={handleCopyInvite}
              title="Copiar enlace de invitación (?sala=CODIGO)"
              className={`min-h-[38px] px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                inviteCopied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#141414] hover:bg-stone-800 text-white'
              }`}
            >
              {inviteCopied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-[#E24C3B]" />
                  <span>Invitar</span>
                </>
              )}
            </button>

            <div className="hidden sm:block">
              <PWAInstallButton compact />
            </div>

            <button
              type="button"
              onClick={() => setResetModalOpen(true)}
              aria-label="Opciones de sala y nueva comida"
              className="min-h-[38px] px-2.5 sm:px-3 py-1.5 rounded-xl border border-stone-200 bg-[#F7F6F3] hover:bg-stone-200/70 text-xs font-semibold text-[#141414] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sala</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 pt-5 pb-24 md:pb-10">
        {syncError && (
          <div
            role="alert"
            className="mb-4 rounded-2xl border border-red-300 bg-red-50 p-3.5 flex items-start gap-2.5 text-xs text-red-900 font-medium"
          >
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{syncError}</span>
          </div>
        )}

        {activeTab === 'mesa' && (
          <DinersTab
            diners={diners}
            summaries={summaries}
            allLines={allLines}
            roomCode={room?.code ?? session.roomCode}
            inviteUrl={inviteUrl}
            currentDinerId={session.dinerId}
            hostDinerId={room?.hostDinerId}
            inviteCopied={inviteCopied}
            onCopyInvite={handleCopyInvite}
            onAddDiner={handleAddDiner}
            onUpdateDiner={handleUpdateDiner}
            onRemoveDiner={handleRemoveDiner}
            onGoToMenu={() => setActiveTab('carta')}
          />
        )}

        {activeTab === 'carta' && (
          <OrderTab
            diners={diners}
            currentRound={currentRound}
            draftLines={draftLines}
            sentLines={sentLines}
            isHost={isHost}
            hostName={hostDiner?.name}
            onAddDraftLine={handleAddDraftLine}
            onUpdateDraftQuantity={handleUpdateDraftQuantity}
            onRemoveDraftLine={handleRemoveDraftLine}
            onSendRoundToKitchen={handleSendRoundToKitchen}
            onQuickAddDiner={handleAddDiner}
          />
        )}

        {activeTab === 'en_mesa' && (
          <TableTab
            diners={diners}
            sentLines={sentLines}
            onAdjustEaten={handleAdjustEaten}
            onSplitPlateEvenly={handleSplitPlateEvenly}
            onRemoveSentLine={handleRemoveSentLine}
            onGoToOrder={() => setActiveTab('carta')}
          />
        )}

        {activeTab === 'usuarios' && (
          <UsersTab
            summaries={summaries}
            sentLines={sentLines}
            onGoToDiners={() => setActiveTab('mesa')}
          />
        )}

        {activeTab === 'cuenta' && (
          <BillRankingTab
            summaries={summaries}
            sentLines={sentLines}
            onGoToDiners={() => setActiveTab('mesa')}
          />
        )}
      </main>

      {/* Mobile Fixed Bottom Tab Bar (Thumb Zone) */}
      <nav
        aria-label="Pestañas inferiores"
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 bg-white/95 backdrop-blur-md border-t border-stone-200 grid grid-cols-5 items-center px-1"
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`relative min-h-[48px] flex flex-col items-center justify-center gap-0.5 transition-colors cursor-pointer ${
                active ? 'text-[#E24C3B]' : 'text-stone-500 hover:text-[#141414]'
              }`}
            >
              <div className="relative">
                <Icon className="w-5 h-5" strokeWidth={active ? 2.4 : 1.9} />
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-3 font-mono tabular-nums text-[10px] font-bold bg-[#141414] text-white px-1 min-w-[16px] h-4 rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[11px] leading-none tracking-tight ${
                  active ? 'font-bold' : 'font-medium'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Non-blocking Toast */}
      {toastMsg && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-[#141414] text-white text-xs font-semibold shadow-lg flex items-center gap-2 whitespace-nowrap"
        >
          <CheckCircle2 className="w-4 h-4 text-[#E24C3B]" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Room Options / Leave / Reset Modal */}
      <ResetModal
        open={resetModalOpen}
        hasDiners={diners.length > 0}
        roomCode={room?.code ?? session.roomCode}
        isHost={isHost}
        onClose={() => setResetModalOpen(false)}
        onResetOrdersOnly={handleResetOrdersOnly}
        onResetAll={handleLeaveRoom}
      />
    </div>
  );
}
