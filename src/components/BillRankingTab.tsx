import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Copy,
  Receipt,
  Trophy,
  Users,
} from 'lucide-react';
import { MENU_TYPES } from '../data/menu';
import { OrderLine } from '../types';
import {
  buildWhatsAppSummary,
  DinerSummary,
  formatCount,
  formatEuros,
  getTableUnconsumedStats,
} from '../utils/calculations';

interface BillRankingTabProps {
  summaries: DinerSummary[];
  sentLines: OrderLine[];
  onGoToDiners: () => void;
}

export const BillRankingTab: React.FC<BillRankingTabProps> = ({
  summaries,
  sentLines,
  onGoToDiners,
}) => {
  const [copied, setCopied] = useState(false);

  const ranked = useMemo(
    () => [...summaries].sort((a, b) => b.piecesEaten - a.piecesEaten),
    [summaries]
  );

  const tableTotals = useMemo(() => {
    const pieces = summaries.reduce((s, d) => s + d.piecesEaten, 0);
    const wholePlates = Math.round(
      summaries.reduce((s, d) => s + d.wholePlatesEaten, 0) * 10
    ) / 10;
    const bill = Math.round(
      summaries.reduce((s, d) => s + d.totalBill, 0) * 100
    ) / 100;
    return { pieces, wholePlates, bill };
  }, [summaries]);

  const unconsumed = useMemo(
    () => getTableUnconsumedStats(sentLines),
    [sentLines]
  );

  const handleCopyWhatsApp = async () => {
    const text = buildWhatsAppSummary(summaries, sentLines);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback textarea copy for restricted iFrame environments
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
          Sin comensales todavía
        </h2>
        <p className="text-sm text-stone-600 mt-1">
          Añade a tus amigos en la pestaña Mesa para ver el ranking en vivo y el desglose de la cuenta.
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

  const maxPieces = Math.max(1, ranked[0]?.piecesEaten ?? 1);

  return (
    <div className="space-y-6">
      {/* Header + WhatsApp Copy CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#141414]">
            Ranking y Cuenta
          </h2>
          <p className="text-sm text-stone-600 mt-0.5">
            Estadísticas en vivo de piezas comidas y reparto exacto por comensal.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopyWhatsApp}
          className={`min-h-[48px] px-5 py-2.5 rounded-xl text-sm font-bold inline-flex items-center justify-center gap-2 transition-all active:scale-[0.98] whitespace-nowrap shrink-0 cursor-pointer ${
            copied
              ? 'bg-emerald-600 text-white'
              : 'bg-[#141414] text-white hover:bg-stone-800'
          }`}
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              ¡Resumen copiado!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copiar resumen para WhatsApp
            </>
          )}
        </button>
      </div>

      {/* Top KPI Summary Strip */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl bg-white border border-stone-200 p-4">
          <div className="text-xs font-medium text-stone-500">
            Piezas sushi
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#141414] mt-1">
            {tableTotals.pieces}
          </div>
        </div>
        <div className="rounded-2xl bg-white border border-stone-200 p-4">
          <div className="text-xs font-medium text-stone-500">
            Platos enteros
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums text-[#141414] mt-1">
            {formatCount(tableTotals.wholePlates)}
          </div>
        </div>
        <div className="rounded-2xl bg-[#141414] text-white p-4">
          <div className="text-xs font-medium text-stone-300">
            Total mesa
          </div>
          <div className="text-2xl sm:text-3xl font-bold font-mono tabular-nums mt-1">
            {formatEuros(tableTotals.bill)}
          </div>
        </div>
      </div>

      {/* Unconsumed Warning if any */}
      {unconsumed.incompleteFoodDishes > 0 && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm text-amber-950">
            <span className="font-bold">
              Atención antes de pedir la cuenta:
            </span>{' '}
            quedan sin marcar como comidas{' '}
            <span className="font-mono tabular-nums font-bold">
              {unconsumed.unconsumedSushiPieces} pzs
            </span>
            {unconsumed.unconsumedWholePlates > 0 && (
              <>
                {' '}y{' '}
                <span className="font-mono tabular-nums font-bold">
                  {formatCount(unconsumed.unconsumedWholePlates)} platos
                </span>
              </>
            )}{' '}
            ({unconsumed.incompleteFoodDishes} raciones · posible penalización de{' '}
            <span className="font-mono tabular-nums font-bold">
              {formatEuros(unconsumed.potentialPenaltyEuros)}
            </span>{' '}
            si no se consumen).
          </div>
        </div>
      )}

      {/* 2-Column Split on Desktop: Live Ranking (6 cols) + Individual Bills (6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Live Ranking */}
        <section className="lg:col-span-6 rounded-2xl bg-white border border-stone-200 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[#E24C3B]" />
            <h3 className="text-base font-bold text-[#141414]">
              Ranking de la mesa
            </h3>
          </div>

          <div className="space-y-3.5">
            {ranked.map((s, idx) => {
              const barPct =
                s.piecesEaten > 0
                  ? Math.max(6, Math.round((s.piecesEaten / maxPieces) * 100))
                  : 0;
              const topCats = Object.entries(s.categoryUnits)
                .sort((a, b) => (b[1] ?? 0) - (a[1] ?? 0))
                .slice(0, 3);

              return (
                <div
                  key={s.diner.id}
                  className="rounded-xl bg-[#F7F6F3] border border-stone-200/70 p-3.5 space-y-2.5"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className={`w-7 h-7 rounded-lg font-mono tabular-nums text-xs font-bold flex items-center justify-center shrink-0 ${
                          idx === 0 && s.piecesEaten > 0
                            ? 'bg-[#E24C3B] text-white'
                            : 'bg-white border border-stone-200 text-stone-700'
                        }`}
                      >
                        {idx + 1}º
                      </span>
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: s.diner.color }}
                      />
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-[#141414] truncate">
                          {s.diner.name}
                        </div>
                        <div className="text-xs text-stone-600">
                          {s.topCategory
                            ? `Top: ${s.topCategory}`
                            : 'Sin consumos aún'}
                          <span aria-hidden="true"> · </span>
                          <span className="font-mono tabular-nums">
                            {formatCount(s.wholePlatesEaten)} platos ent.
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-mono tabular-nums text-lg font-extrabold text-[#141414]">
                        {s.piecesEaten}
                      </div>
                      <div className="text-[11px] text-stone-500">piezas</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="h-2 w-full rounded-full bg-stone-200/80 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${barPct}%`,
                        backgroundColor: s.diner.color,
                      }}
                    />
                  </div>

                  {topCats.length > 0 && (
                    <div className="text-[11px] text-stone-600 flex flex-wrap gap-x-2 gap-y-0.5">
                      {topCats.map(([cat, count], i) => (
                        <span key={cat} className="font-mono tabular-nums">
                          {i > 0 && <span className="mr-2 text-stone-400">·</span>}
                          {cat}: <strong className="text-[#141414]">{count}</strong>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Bill Split */}
        <section className="lg:col-span-6 rounded-2xl bg-white border border-stone-200 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#E24C3B]" />
            <h3 className="text-base font-bold text-[#141414]">
              División de cuenta por persona
            </h3>
          </div>

          <div className="space-y-3">
            {summaries.map((s) => {
              const menuInfo = MENU_TYPES[s.diner.menuType];
              return (
                <div
                  key={s.diner.id}
                  className="rounded-xl border border-stone-200 p-4 space-y-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className="w-3.5 h-3.5 rounded-full shrink-0"
                        style={{ backgroundColor: s.diner.color }}
                      />
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-[#141414] truncate">
                          {s.diner.name}
                        </h4>
                        <p className="text-xs text-stone-500">
                          {menuInfo.shortLabel}
                        </p>
                      </div>
                    </div>

                    <div className="text-right font-mono tabular-nums text-lg font-extrabold text-[#141414]">
                      {formatEuros(s.totalBill)}
                    </div>
                  </div>

                  {/* Line-item breakdown */}
                  <div className="border-t border-stone-100 pt-2.5 space-y-1.5 text-xs">
                    <div className="flex justify-between text-stone-600">
                      <span>Base ({menuInfo.shortLabel})</span>
                      <span className="font-mono tabular-nums font-medium text-[#141414]">
                        {formatEuros(s.baseMenuPrice)}
                      </span>
                    </div>

                    {s.supplementsTotal > 0 && (
                      <div className="flex justify-between text-stone-600">
                        <span>Suplementos (+1€ / +2€)</span>
                        <span className="font-mono tabular-nums font-medium text-[#141414]">
                          {formatEuros(s.supplementsTotal)}
                        </span>
                      </div>
                    )}

                    {(s.drinksTotal > 0 || s.drinksCount > 0) && (
                      <div className="flex justify-between text-stone-600">
                        <span>
                          Bebidas ({formatCount(s.drinksCount)})
                          {s.includedSavings > 0 ? ' · incl. menú aplicada' : ''}
                        </span>
                        <span className="font-mono tabular-nums font-medium text-[#141414]">
                          {formatEuros(s.drinksTotal)}
                        </span>
                      </div>
                    )}

                    {s.dessertsTotal > 0 && (
                      <div className="flex justify-between text-stone-600">
                        <span>Postres ({formatCount(s.dessertsCount)})</span>
                        <span className="font-mono tabular-nums font-medium text-[#141414]">
                          {formatEuros(s.dessertsTotal)}
                        </span>
                      </div>
                    )}

                    {s.missingMandatoryDrink && (
                      <p className="text-[11px] font-medium text-amber-700 pt-1">
                        Recuerda: en Menú Infinity es obligatorio pedir mínimo 1 bebida por persona.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
};
