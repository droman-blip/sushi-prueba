import React from 'react';
import { LogOut, RotateCcw, Trash2, X } from 'lucide-react';

interface ResetModalProps {
  open: boolean;
  hasDiners: boolean;
  roomCode?: string;
  isHost?: boolean;
  onClose: () => void;
  onResetOrdersOnly: () => void;
  onResetAll: () => void;
}

export const ResetModal: React.FC<ResetModalProps> = ({
  open,
  hasDiners,
  roomCode,
  isHost = true,
  onClose,
  onResetOrdersOnly,
  onResetAll,
}) => {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="reset-modal-title"
    >
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl border border-stone-200 p-6 space-y-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3
              id="reset-modal-title"
              className="text-lg font-bold text-[#141414]"
            >
              {roomCode ? `Sala ${roomCode} · Opciones` : 'Nueva comida / Reiniciar mesa'}
            </h3>
            <p className="text-sm text-stone-600 mt-1">
              {roomCode
                ? 'Limpia las rondas de la sala compartida o desconéctate para crear/unirte a otra mesa.'
                : 'Elige si quieres empezar de cero o mantener los mismos comensales para otra comida.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar diálogo"
            className="min-h-[44px] min-w-[44px] -mt-2 -mr-2 rounded-xl text-stone-500 hover:text-[#141414] hover:bg-stone-100 flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {hasDiners && (!roomCode || isHost) && (
            <button
              type="button"
              onClick={onResetOrdersOnly}
              className="w-full min-h-[48px] px-4 py-3 rounded-xl border border-stone-200 bg-[#F7F6F3] hover:bg-stone-100 text-left flex items-center gap-3 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-5 h-5 text-[#141414] shrink-0" />
              <div>
                <div className="text-sm font-bold text-[#141414]">
                  Mantener comensales y limpiar rondas
                </div>
                <div className="text-xs text-stone-600">
                  Borra platos pedidos y piezas en la mesa, conservando los amigos de la sala.
                </div>
              </div>
            </button>
          )}

          <button
            type="button"
            onClick={onResetAll}
            className="w-full min-h-[48px] px-4 py-3 rounded-xl bg-[#E24C3B] hover:bg-[#cf4030] text-white text-left flex items-center gap-3 transition-colors cursor-pointer"
          >
            {roomCode ? (
              <LogOut className="w-5 h-5 text-white shrink-0" />
            ) : (
              <Trash2 className="w-5 h-5 text-white shrink-0" />
            )}
            <div>
              <div className="text-sm font-bold">
                {roomCode
                  ? 'Salir de esta mesa / Cambiar de sala'
                  : 'Reiniciar toda la mesa desde cero'}
              </div>
              <div className="text-xs text-white/85">
                {roomCode
                  ? 'Desconecta este móvil para crear una mesa nueva o unirte con otro código.'
                  : 'Borra comensales, rondas, piezas comidas y cuenta actual.'}
              </div>
            </div>
          </button>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-full min-h-[44px] rounded-xl border border-stone-200 text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
};
