import React from 'react';
import { Salad, Flame } from 'lucide-react';
import { DishItem } from '../types';
import { formatEuros } from '../utils/calculations';

interface GreenAlertModalProps {
  open: boolean;
  dish: DishItem | null;
  targetNames: string;
  messageIndex: number;
  onConfirmGreen: () => void;
  onPickSushiInstead: () => void;
}

const SARCASM_TEMPLATES = [
  (name: string) =>
    `🚨 ALERTA CONEJO: ¿De verdad vienes a un bufet libre de 17,90€ a pedir lechuga y hierbajos, ${name}?`,
  (name: string) =>
    `💸 Estás tirando el dinero, ${name}: con lo que cuesta ese plato verde te caben 4 nigiris de salmón flameado.`,
  (name: string) =>
    `🥗 ¿Seguro que quieres gastar un hueco de ronda en algo verde, ${name}? Tus amigos te están juzgando.`,
  (name: string) =>
    `🐇 Alarma en la mesa: ${name} está intentando pedir fibra en vez de salmón. ¡Intervención urgente!`,
  (name: string) =>
    `📉 Tu rentabilidad del bufet acaba de desplomarse solo de mirar ese plato verde, ${name}.`,
];

export const GreenAlertModal: React.FC<GreenAlertModalProps> = ({
  open,
  dish,
  targetNames,
  messageIndex,
  onConfirmGreen,
  onPickSushiInstead,
}) => {
  if (!open || !dish) return null;

  const displayTarget = targetNames || 'la mesa';
  const msg =
    SARCASM_TEMPLATES[messageIndex % SARCASM_TEMPLATES.length](displayTarget);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-xs p-0 sm:p-4"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="green-alert-title"
    >
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl border-2 border-emerald-600 p-6 space-y-5 shadow-2xl">
        <div className="flex items-start gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
            <Salad className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-extrabold tracking-wide text-emerald-700">
              COMIDA VERDE DETECTADA
            </div>
            <h3
              id="green-alert-title"
              className="text-lg font-extrabold text-[#141414] mt-0.5 leading-snug"
            >
              {dish.number !== null ? `#${dish.number} ` : ''}
              {dish.name}
            </h3>
            <p className="text-xs text-stone-500 mt-0.5 font-mono tabular-nums">
              Valor estimado en carta: {formatEuros(dish.valorCartaEstimado)}
            </p>
          </div>
        </div>

        <div className="rounded-2xl bg-amber-50 border border-amber-300 p-4 text-sm font-semibold text-amber-950 leading-relaxed">
          {msg}
        </div>

        <p className="text-xs text-stone-600">
          Si lo pides, quedará registrado en el perfil de{' '}
          <strong className="text-[#141414]">{displayTarget}</strong> con la
          etiqueta <strong className="text-emerald-800">“🥗 Penalizado por comer verde”</strong>.
        </p>

        <div className="flex flex-col gap-2.5 pt-1">
          <button
            type="button"
            onClick={onPickSushiInstead}
            className="w-full min-h-[48px] px-4 rounded-xl bg-[#E24C3B] hover:bg-[#cf4030] text-white text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Flame className="w-4 h-4" />
            <span>Tienes razón, pido sushi</span>
          </button>

          <button
            type="button"
            onClick={onConfirmGreen}
            className="w-full min-h-[44px] px-4 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-700 text-sm font-semibold transition-colors cursor-pointer"
          >
            Me la juego (pedir igual)
          </button>
        </div>
      </div>
    </div>
  );
};
