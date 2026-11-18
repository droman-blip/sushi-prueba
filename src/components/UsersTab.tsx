import React, { useMemo, useState } from 'react';
import {
  Award,
  Check,
  Copy,
  Flag,
  Salad,
  TrendingUp,
  Users,
} from 'lucide-react';
import { ALLERGENS_MAP, MENU_TYPES } from '../data/menu';
import { OrderLine } from '../types';
import {
  buildWhatsAppSummary,
  DinerSummary,
  formatCount,
  formatEuros,
} from '../utils/calculations';

interface UsersTabProps {
  summaries: DinerSummary[];
  sentLines: OrderLine[];
  onGoToDiners: () => void;
}

export const UsersTab: React.FC<UsersTabProps> = ({
  summaries,
  sentLines,
  onGoToDiners,
}) => {
  const [finalSummaryOpen, setFinalSummaryOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const podium = useMemo(() => {
    if (summaries.length === 0) return null;
    const bestProfit = [...summaries]
      .filter((s) => s.buffetCost > 0)
      .sort((a, b) => b.profitabilityDelta - a.profitabilityDelta)[0] ?? null;

    const bestPieces = [...summaries].sort(
      (a, b) => b.piecesEaten - a.piecesEaten
    )[0] ?? null;

    const bestPlates = [...summaries].sort(
      (a, b) => b.wholePlatesEaten - a.wholePlatesEaten
    )[0] ?? null;

    return { bestProfit, bestPieces, bestPlates };
  }, [summaries]);

  const handleCopyWhatsApp = async () => {
    const text = buildWhatsAppSummary(summaries, sentLines);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2500);
      } finally {
        document.body.removeChild(textarea);
      }
    }
  };

  if (summaries.length === 0) {
    return (
      <div className="rounded-2xl bg-white border border-stone-200 p-8 text-center max-w-xl mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-700 flex items-center justify-center mx-auto mb-3">
          <Users className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-[#141414]">
          No hay usuarios en la sala
        </h2>
        <p className="text-sm text-stone-600 mt-1">
          Añade a tus amigos en Mesa para ver sus contadores separados, alergias y la rentabilidad del bufet en tiempo real.
        </p>
        <button
          type="button"
          onClick={onGoToDiners}
          className="mt-5 min-h-[44px] px-5 py-2.5 rounded-xl bg-[#E24C3B] text-white text-sm font-semibold hover:bg-[#cf4030] transition-colors cursor-pointer"
        >
          Configurar Mesa
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header + Final Summary Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#141414]">
            Usuarios y Rentabilidad
          </h2>
          <p className="text-sm text-stone-600 mt-0.5">
            Contadores separados por amigo y medidor en vivo de amortización del bufet.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setFinalSummaryOpen((v) => !v)}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold inline-flex items-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
              finalSummaryOpen
                ? 'bg-[#141414] text-white'
                : 'bg-[#E24C3B] text-white hover:bg-[#cf4030]'
            }`}
          >
            <Flag className="w-4 h-4" />
            <span>
              {finalSummaryOpen ? 'Ocultar resumen final' : 'Resumen final / Cerrar comida'}
            </span>
          </button>
        </div>
      </div>

      {/* Final Podium & WhatsApp Section (also accessible anytime via toggle or bottom) */}
      {finalSummaryOpen && podium && (
        <section className="rounded-2xl bg-[#141414] text-white p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="text-xs font-bold text-[#E24C3B] tracking-wide">
                RESUMEN FINAL DE LA COMIDA
              </div>
              <h3 className="text-xl font-bold mt-0.5">
                Podio de la mesa Sushisom
              </h3>
            </div>

            <button
              type="button"
              onClick={handleCopyWhatsApp}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-sm font-bold inline-flex items-center justify-center gap-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white text-[#141414] hover:bg-stone-100'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  ¡Copiado para WhatsApp!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copiar resumen por WhatsApp
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
            {/* 1. Mayor rentabilidad */}
            <div className="rounded-xl bg-white/10 border border-white/10 p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
                <TrendingUp className="w-4 h-4" />
                <span>Mayor rentabilidad (€)</span>
              </div>
              {podium.bestProfit ? (
                <>
                  <div className="text-lg font-extrabold truncate">
                    {podium.bestProfit.diner.name}
                  </div>
                  <div className="text-xs font-mono tabular-nums text-stone-300">
                    {podium.bestProfit.profitabilityDelta >= 0 ? '+' : ''}
                    {formatEuros(podium.bestProfit.profitabilityDelta)} vs menú (
                    {podium.bestProfit.profitabilityPct}%)
                  </div>
                </>
              ) : (
                <div className="text-xs text-stone-400">Sin menú fijo</div>
              )}
            </div>

            {/* 2. Récord piezas sushi */}
            <div className="rounded-xl bg-white/10 border border-white/10 p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-300">
                <Award className="w-4 h-4" />
                <span>Récord piezas de sushi</span>
              </div>
              {podium.bestPieces && podium.bestPieces.piecesEaten > 0 ? (
                <>
                  <div className="text-lg font-extrabold truncate">
                    {podium.bestPieces.diner.name}
                  </div>
                  <div className="text-xs font-mono tabular-nums text-stone-300">
                    🍣 {podium.bestPieces.piecesEaten} piezas comidas
                  </div>
                </>
              ) : (
                <div className="text-xs text-stone-400">
                  Aún sin piezas registradas
                </div>
              )}
            </div>

            {/* 3. Récord platos enteros */}
            <div className="rounded-xl bg-white/10 border border-white/10 p-4 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-orange-300">
                <Award className="w-4 h-4" />
                <span>Ganador en platos enteros</span>
              </div>
              {podium.bestPlates && podium.bestPlates.wholePlatesEaten > 0 ? (
                <>
                  <div className="text-lg font-extrabold truncate">
                    {podium.bestPlates.diner.name}
                  </div>
                  <div className="text-xs font-mono tabular-nums text-stone-300">
                    🍜 {formatCount(podium.bestPlates.wholePlatesEaten)}{' '}
                    {podium.bestPlates.wholePlatesEaten === 1 ? 'plato' : 'platos'}
                  </div>
                </>
              ) : (
                <div className="text-xs text-stone-400">
                  Aún sin platos enteros
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* User Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {summaries.map((s) => {
          const { diner } = s;
          const menuInfo = MENU_TYPES[diner.menuType];
          const initial = diner.name.trim().slice(0, 2).toUpperCase();
          const roleLabel =
            diner.role === 'anfitrion' ? 'Anfitrión' : 'Invitado';
          const dinerAllergies = diner.allergies ?? [];
          const isProfitable = s.profitabilityDelta >= 0;
          const barWidth = Math.min(100, Math.max(0, s.profitabilityPct));

          return (
            <article
              key={diner.id}
              className="rounded-2xl bg-white border border-stone-200 p-5 space-y-4"
            >
              {/* User Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3.5 min-w-0">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-xs"
                    style={{ backgroundColor: diner.color }}
                    aria-hidden="true"
                  >
                    {initial}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <h3 className="text-lg font-bold text-[#141414] truncate">
                        {diner.name}
                      </h3>
                      <span className="text-xs font-semibold text-stone-500">
                        · {roleLabel}
                      </span>
                    </div>
                    <div className="text-xs text-stone-600 mt-0.5">
                      <span className="font-semibold text-[#141414]">
                        {menuInfo.label}
                      </span>
                      <span aria-hidden="true"> · </span>
                      <span className="font-mono tabular-nums">
                        {menuInfo.basePrice > 0
                          ? formatEuros(menuInfo.basePrice)
                          : 'Carta'}
                      </span>
                    </div>
                  </div>
                </div>

                {s.hasGreenPenalty && (
                  <div className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 border border-emerald-200 px-2.5 py-1.5 text-xs font-bold text-emerald-800 shrink-0">
                    <Salad className="w-3.5 h-3.5 shrink-0" />
                    <span>Penalizado por comer verde</span>
                  </div>
                )}
              </div>

              {/* Allergies info */}
              <div className="text-xs text-stone-600">
                <span className="font-semibold text-stone-800">Alergias: </span>
                {dinerAllergies.length > 0 ? (
                  <span className="text-red-700 font-medium">
                    {dinerAllergies
                      .map((id) => ALLERGENS_MAP[id])
                      .filter(Boolean)
                      .join(', ')}
                  </span>
                ) : (
                  <span className="text-stone-500">Ninguna declarada</span>
                )}
              </div>

              {/* TWO COMPLETELY SEPARATED COUNTERS */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-[#F7F6F3] border border-stone-200/80 p-3.5">
                  <div className="text-xs font-semibold text-stone-600">
                    🍣 Piezas de sushi comidas
                  </div>
                  <div className="text-2xl font-extrabold font-mono tabular-nums text-[#141414] mt-1">
                    {s.piecesEaten}{' '}
                    <span className="text-sm font-semibold text-stone-600">
                      {s.piecesEaten === 1 ? 'pieza' : 'piezas'}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono tabular-nums text-stone-500 mt-0.5">
                    Valor carta: {formatEuros(s.piecesValueConsumed)}
                  </div>
                </div>

                <div className="rounded-xl bg-[#F7F6F3] border border-stone-200/80 p-3.5">
                  <div className="text-xs font-semibold text-stone-600">
                    🍜 Platos enteros comidos
                  </div>
                  <div className="text-2xl font-extrabold font-mono tabular-nums text-[#141414] mt-1">
                    {formatCount(s.wholePlatesEaten)}{' '}
                    <span className="text-sm font-semibold text-stone-600">
                      {s.wholePlatesEaten === 1 ? 'plato' : 'platos'}
                    </span>
                  </div>
                  <div className="text-[11px] font-mono tabular-nums text-stone-500 mt-0.5">
                    Valor carta: {formatEuros(s.platesValueConsumed)}
                  </div>
                </div>
              </div>

              {/* BUFFET PROFITABILITY METER */}
              <div className="rounded-xl border border-stone-200 p-4 space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#141414]">
                    Medidor de rentabilidad del bufet
                  </span>
                  {s.buffetCost > 0 && (
                    <span
                      className={`font-mono tabular-nums text-sm font-extrabold ${
                        isProfitable ? 'text-emerald-700' : 'text-amber-700'
                      }`}
                    >
                      {s.profitabilityPct}%
                    </span>
                  )}
                </div>

                {s.buffetCost > 0 ? (
                  <>
                    <div className="h-3 w-full rounded-full bg-stone-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isProfitable ? 'bg-emerald-600' : 'bg-amber-500'
                        }`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-xs">
                      <span
                        className={`font-bold ${
                          isProfitable ? 'text-emerald-700' : 'text-amber-700'
                        }`}
                      >
                        {isProfitable
                          ? `¡Bufet rentabilizado! +${formatEuros(s.profitabilityDelta)} gratis`
                          : `Faltan ${formatEuros(Math.abs(s.profitabilityDelta))} para empatar con la casa`}
                      </span>

                      <span className="font-mono tabular-nums text-stone-500">
                        {formatEuros(s.buffetValueConsumed)} /{' '}
                        {formatEuros(s.buffetCost)}
                      </span>
                    </div>

                    <div className="border-t border-stone-100 pt-2 flex items-center justify-between text-[11px] text-stone-500">
                      <span>Coste medio real por bocado/pieza:</span>
                      <span className="font-mono tabular-nums font-bold text-[#141414]">
                        {s.avgCostPerBite > 0
                          ? `${formatEuros(s.avgCostPerBite)} / bocado`
                          : 'Sin consumos aún'}
                      </span>
                    </div>
                  </>
                ) : (
                  <p className="text-xs text-stone-600">
                    Modo Carta (sin cuota fija). Valor consumido en comida:{' '}
                    <strong className="font-mono tabular-nums text-[#141414]">
                      {formatEuros(s.buffetValueConsumed)}
                    </strong>
                    .
                  </p>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
