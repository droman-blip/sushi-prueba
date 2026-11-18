import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Minus,
  Plus,
  Split,
  Trash2,
  UtensilsCrossed,
} from 'lucide-react';
import { MENU_BY_ID } from '../data/menu';
import { Diner, OrderLine } from '../types';
import {
  formatCount,
  formatEuros,
  getLineEatenUnits,
  getLineRemainingUnits,
  getLineTotalUnits,
  getLineUnitConsumedValue,
  getTableUnconsumedStats,
} from '../utils/calculations';

interface TableTabProps {
  diners: Diner[];
  sentLines: OrderLine[];
  onAdjustEaten: (lineId: string, dinerId: string, delta: number) => void;
  onSplitPlateEvenly: (lineId: string, dinerIds: string[]) => void;
  onRemoveSentLine: (lineId: string) => void;
  onGoToOrder: () => void;
}

export const TableTab: React.FC<TableTabProps> = ({
  diners,
  sentLines,
  onAdjustEaten,
  onSplitPlateEvenly,
  onRemoveSentLine,
  onGoToOrder,
}) => {
  const [filterMode, setFilterMode] = useState<'pending' | 'all' | number>('all');
  const [expandedOthers, setExpandedOthers] = useState<Record<string, boolean>>({});

  const dinerMap = useMemo(
    () => Object.fromEntries(diners.map((d) => [d.id, d])),
    [diners]
  );

  const rounds = useMemo(() => {
    const set = new Set<number>();
    sentLines.forEach((l) => set.add(l.roundNumber));
    return Array.from(set).sort((a, b) => a - b);
  }, [sentLines]);

  const unconsumedStats = useMemo(
    () => getTableUnconsumedStats(sentLines),
    [sentLines]
  );

  const visibleLines = useMemo(() => {
    const ordered = [...sentLines].reverse();
    return ordered.filter((line) => {
      if (filterMode === 'pending') {
        return getLineRemainingUnits(line) > 0.01;
      }
      if (typeof filterMode === 'number') {
        return line.roundNumber === filterMode;
      }
      return true;
    });
  }, [sentLines, filterMode]);

  const pieceLines = useMemo(
    () =>
      visibleLines.filter(
        (l) => MENU_BY_ID[l.dishId]?.tipoContador === 'piezas'
      ),
    [visibleLines]
  );

  const plateLines = useMemo(
    () =>
      visibleLines.filter(
        (l) => MENU_BY_ID[l.dishId]?.tipoContador === 'platos'
      ),
    [visibleLines]
  );

  const drinkLines = useMemo(
    () =>
      visibleLines.filter(
        (l) => MENU_BY_ID[l.dishId]?.tipoContador === 'bebidas'
      ),
    [visibleLines]
  );

  if (sentLines.length === 0) {
    return (
      <div className="rounded-2xl bg-white border border-stone-200 p-8 sm:p-10 text-center max-w-xl mx-auto">
        <div className="w-12 h-12 rounded-2xl bg-stone-100 text-stone-700 flex items-center justify-center mx-auto mb-3">
          <UtensilsCrossed className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-[#141414]">
          Aún no hay rondas en la mesa
        </h2>
        <p className="text-sm text-stone-600 mt-1">
          Ve a la Carta, añade los platos de la Ronda 1 y pulsa “Enviar Ronda a Cocina” para empezar a contar piezas y platos.
        </p>
        <button
          type="button"
          onClick={onGoToOrder}
          className="mt-5 min-h-[44px] px-5 py-2.5 rounded-xl bg-[#E24C3B] text-white text-sm font-semibold hover:bg-[#cf4030] transition-colors cursor-pointer"
        >
          Ir a pedir a la Carta
        </button>
      </div>
    );
  }

  const renderLineCard = (line: OrderLine, mode: 'piezas' | 'platos') => {
    const dish = MENU_BY_ID[line.dishId];
    if (!dish) return null;

    const totalUnits = getLineTotalUnits(line);
    const eatenUnits = getLineEatenUnits(line);
    const remainingUnits = getLineRemainingUnits(line);
    const progressPct =
      totalUnits > 0
        ? Math.min(100, Math.round((eatenUnits / totalUnits) * 100))
        : 0;

    const primaryDiners = line.assignedDinerIds
      .map((id) => dinerMap[id])
      .filter(Boolean);
    const otherDiners = diners.filter(
      (d) => !line.assignedDinerIds.includes(d.id)
    );
    const extraEaters = otherDiners.filter(
      (d) => (line.eatenByDiner[d.id] ?? 0) > 0
    );
    const hiddenOthers = otherDiners.filter(
      (d) => (line.eatenByDiner[d.id] ?? 0) === 0
    );

    const visibleDiners = [...primaryDiners, ...extraEaters];
    const showOthers = !!expandedOthers[line.id];
    const step = mode === 'piezas' ? 1 : 0.5;

    return (
      <div
        key={line.id}
        className={`rounded-2xl bg-white border p-4 sm:p-5 space-y-4 transition-colors ${
          remainingUnits > 0.01 && dish.kind === 'food'
            ? 'border-amber-300'
            : 'border-stone-200'
        }`}
      >
        {/* Top Info */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-stone-500">
              <span className="font-semibold text-stone-700">
                Ronda {line.roundNumber}
              </span>
              <span aria-hidden="true">·</span>
              {dish.number !== null && (
                <>
                  <span className="font-mono tabular-nums font-bold text-[#E24C3B]">
                    #{dish.number}
                  </span>
                  <span aria-hidden="true">·</span>
                </>
              )}
              <span className="font-mono tabular-nums">
                {mode === 'piezas'
                  ? `${totalUnits} ${totalUnits === 1 ? 'pieza' : 'piezas'}`
                  : `${formatCount(totalUnits)} ${totalUnits === 1 ? 'plato' : 'platos'}`}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-stone-700 font-medium">
                Valor carta: {formatEuros(dish.valorCartaEstimado * line.quantity)}
              </span>
              {line.isShared && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-medium text-stone-700">
                    Para compartir
                  </span>
                </>
              )}
            </div>
            <h4 className="text-base font-bold text-[#141414] mt-0.5">
              {dish.name}
            </h4>
          </div>

          <button
            type="button"
            onClick={() => onRemoveSentLine(line.id)}
            aria-label={`Quitar ${dish.name} de la mesa`}
            className="min-h-[40px] min-w-[40px] -mt-1 -mr-1 rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center shrink-0 cursor-pointer"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-mono tabular-nums text-stone-600">
              {mode === 'piezas' ? 'Piezas comidas:' : 'Platos consumidos:'}{' '}
              <strong className="text-[#141414]">{formatCount(eatenUnits)}</strong> /{' '}
              {formatCount(totalUnits)}
            </span>
            {remainingUnits > 0.01 ? (
              <span className="font-semibold text-amber-800 font-mono tabular-nums">
                {mode === 'piezas'
                  ? `Quedan ${formatCount(remainingUnits)} sin comer`
                  : `Falta ${formatCount(remainingUnits)} plato`}
              </span>
            ) : (
              <span className="font-semibold text-emerald-700 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Completado
              </span>
            )}
          </div>
          <div className="h-2 w-full rounded-full bg-stone-100 overflow-hidden">
            <div
              className={`h-full transition-all duration-200 ${
                remainingUnits <= 0.01 ? 'bg-emerald-600' : 'bg-[#E24C3B]'
              }`}
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Quick Split Button for whole plates when shared among >= 2 diners */}
        {mode === 'platos' && visibleDiners.length > 1 && remainingUnits > 0.01 && (
          <button
            type="button"
            onClick={() =>
              onSplitPlateEvenly(
                line.id,
                visibleDiners.map((d) => d.id)
              )
            }
            className="w-full min-h-[38px] px-3 rounded-xl bg-stone-100 hover:bg-stone-200 text-[#141414] text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Split className="w-3.5 h-3.5 text-[#E24C3B]" />
            <span>
              Repartir a partes iguales ({formatCount(totalUnits / visibleDiners.length)} plato/persona)
            </span>
          </button>
        )}

        {/* Per-Diner Controls */}
        <div className="space-y-2 pt-1">
          {visibleDiners.map((diner) => {
            const eaten = line.eatenByDiner[diner.id] ?? 0;
            const consumedValue = getLineUnitConsumedValue(dish, eaten);
            const canAddHalf = remainingUnits >= 0.01;
            const canAddFull = remainingUnits >= 1 - 0.01;
            const canSub = eaten > 0;

            return (
              <div
                key={diner.id}
                className="flex items-center justify-between gap-2 rounded-xl bg-[#F7F6F3] px-3 py-2"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: diner.color }}
                    />
                    <span className="text-sm font-semibold text-[#141414] truncate">
                      {diner.name}
                    </span>
                  </div>
                  {eaten > 0 && (
                    <div className="text-[11px] font-mono tabular-nums text-stone-500 pl-5">
                      Valor consumido: {formatEuros(consumedValue)}
                    </div>
                  )}
                </div>

                {mode === 'piezas' ? (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      disabled={!canSub}
                      onClick={() => onAdjustEaten(line.id, diner.id, -1)}
                      aria-label={`Restar 1 pieza a ${diner.name}`}
                      className="min-h-[44px] min-w-[44px] rounded-xl bg-white border border-stone-200 text-[#141414] disabled:opacity-35 flex items-center justify-center hover:bg-stone-100 active:scale-95 transition-all cursor-pointer disabled:cursor-not-allowed"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-10 text-center font-mono tabular-nums text-sm font-bold text-[#141414]">
                      {eaten}
                    </span>
                    <button
                      type="button"
                      disabled={!canAddHalf}
                      onClick={() => onAdjustEaten(line.id, diner.id, 1)}
                      aria-label={`Sumar 1 pieza a ${diner.name}`}
                      className="min-h-[44px] px-3 rounded-xl bg-[#141414] disabled:bg-stone-200 disabled:text-stone-400 text-white text-xs font-bold flex items-center justify-center gap-1 hover:bg-stone-800 active:scale-95 transition-all cursor-pointer disabled:cursor-not-allowed"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>1 pz</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      disabled={!canSub}
                      onClick={() => onAdjustEaten(line.id, diner.id, -step)}
                      aria-label={`Restar 0,5 plato a ${diner.name}`}
                      className="min-h-[44px] px-2.5 rounded-xl bg-white border border-stone-200 text-[#141414] disabled:opacity-35 text-xs font-mono font-bold flex items-center justify-center hover:bg-stone-100 active:scale-95 transition-all cursor-pointer disabled:cursor-not-allowed"
                    >
                      -0,5
                    </button>
                    <span className="w-11 text-center font-mono tabular-nums text-sm font-bold text-[#141414]">
                      {formatCount(eaten)}
                    </span>
                    <button
                      type="button"
                      disabled={!canAddHalf}
                      onClick={() => onAdjustEaten(line.id, diner.id, step)}
                      aria-label={`Sumar 0,5 plato a ${diner.name}`}
                      className="min-h-[44px] px-2.5 rounded-xl bg-white border border-stone-300 text-[#141414] disabled:opacity-35 text-xs font-mono font-bold flex items-center justify-center hover:bg-stone-100 active:scale-95 transition-all cursor-pointer disabled:cursor-not-allowed"
                    >
                      +0,5
                    </button>
                    {canAddFull && (
                      <button
                        type="button"
                        onClick={() => onAdjustEaten(line.id, diner.id, 1)}
                        aria-label={`Marcar 1 plato entero para ${diner.name}`}
                        className="min-h-[44px] px-2.5 rounded-xl bg-[#141414] text-white text-xs font-bold flex items-center justify-center hover:bg-stone-800 active:scale-95 transition-all cursor-pointer"
                      >
                        +1
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Expandable row to let other friends eat from this dish */}
          {hiddenOthers.length > 0 && (
            <div>
              <button
                type="button"
                onClick={() =>
                  setExpandedOthers((prev) => ({
                    ...prev,
                    [line.id]: !prev[line.id],
                  }))
                }
                className="w-full min-h-[36px] text-xs font-semibold text-stone-500 hover:text-[#141414] flex items-center justify-center gap-1 cursor-pointer"
              >
                <span>
                  {showOthers
                    ? 'Ocultar otros comensales'
                    : '¿Otro amigo picó de este plato?'}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${
                    showOthers ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {showOthers && (
                <div className="space-y-2 mt-2">
                  {hiddenOthers.map((diner) => (
                    <div
                      key={diner.id}
                      className="flex items-center justify-between gap-2 rounded-xl bg-stone-50 border border-stone-200/70 px-3 py-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: diner.color }}
                        />
                        <span className="text-sm font-medium text-stone-700 truncate">
                          {diner.name}
                        </span>
                      </div>
                      <button
                        type="button"
                        disabled={remainingUnits <= 0.01}
                        onClick={() =>
                          onAdjustEaten(line.id, diner.id, step)
                        }
                        className="min-h-[44px] px-3 rounded-xl bg-white border border-stone-300 text-[#141414] disabled:opacity-35 text-xs font-bold flex items-center gap-1 hover:bg-stone-100 cursor-pointer disabled:cursor-not-allowed"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{mode === 'piezas' ? '1 pz' : '0,5 plato'}</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#141414]">
          Platos en mesa
        </h2>
        <p className="text-sm text-stone-600 mt-0.5">
          Contadores separados: marca piezas individuales de sushi o platos/boles enteros consumidos.
        </p>
      </div>

      {/* Alert Banner: Unconsumed Pieces / Penalty Risk */}
      {unconsumedStats.incompleteFoodDishes > 0 ? (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-amber-950">
                Sin comer en mesa:{' '}
                <span className="font-mono tabular-nums">
                  {unconsumedStats.unconsumedSushiPieces} pzs sushi
                  {unconsumedStats.unconsumedWholePlates > 0
                    ? ` · ${formatCount(unconsumedStats.unconsumedWholePlates)} platos enteros`
                    : ''}
                </span>
              </p>
              <p className="text-xs text-amber-800 mt-0.5">
                Hay{' '}
                <span className="font-mono tabular-nums font-semibold">
                  {unconsumedStats.incompleteFoodDishes}
                </span>{' '}
                {unconsumedStats.incompleteFoodDishes === 1
                  ? 'plato sin terminar'
                  : 'platos sin terminar'}
                . Penalización Sushisom si sobran: 2€/plato (
                <span className="font-mono tabular-nums font-semibold">
                  {formatEuros(unconsumedStats.potentialPenaltyEuros)}
                </span>
                ).
              </p>
            </div>
          </div>
          {filterMode !== 'pending' && (
            <button
              type="button"
              onClick={() => setFilterMode('pending')}
              className="min-h-[40px] px-3.5 rounded-xl bg-amber-900 text-white text-xs font-semibold shrink-0 hover:bg-amber-950 transition-colors cursor-pointer"
            >
              Ver solo pendientes
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-700 shrink-0" />
          <p className="text-sm font-semibold text-emerald-950">
            Mesa limpia: todas las piezas y platos servidos han sido consumidos (0€ de penalización).
          </p>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
        <button
          type="button"
          onClick={() => setFilterMode('all')}
          className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
            filterMode === 'all'
              ? 'bg-[#141414] text-white'
              : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
          }`}
        >
          Todos ({sentLines.length})
        </button>
        <button
          type="button"
          onClick={() => setFilterMode('pending')}
          className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
            filterMode === 'pending'
              ? 'bg-[#E24C3B] text-white'
              : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
          }`}
        >
          Pendientes ({unconsumedStats.unconsumedItemsCount})
        </button>
        {rounds.map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => setFilterMode(r)}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
              filterMode === r
                ? 'bg-[#141414] text-white'
                : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
            }`}
          >
            Ronda {r}
          </button>
        ))}
      </div>

      {visibleLines.length === 0 ? (
        <div className="rounded-2xl bg-white border border-stone-200 p-8 text-center">
          <p className="text-sm font-semibold text-[#141414]">
            No hay platos pendientes en este filtro.
          </p>
          <button
            type="button"
            onClick={() => setFilterMode('all')}
            className="mt-3 min-h-[40px] px-4 rounded-xl bg-stone-100 text-xs font-semibold text-[#141414] cursor-pointer"
          >
            Ver todos los platos
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* SECTION 1: Sushi & Bites by Pieces */}
          {pieceLines.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <h3 className="text-base font-bold text-[#141414]">
                  🍣 Sushi y bocados por piezas ({pieceLines.length})
                </h3>
                <span className="text-xs text-stone-500">
                  Pulsa +1 / -1 pieza por amigo
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pieceLines.map((line) => renderLineCard(line, 'piezas'))}
              </div>
            </section>
          )}

          {/* SECTION 2: Whole Plates, Bowls & Desserts */}
          {plateLines.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <h3 className="text-base font-bold text-[#141414]">
                  🍜 Platos enteros, boles y postres ({plateLines.length})
                </h3>
                <span className="text-xs text-stone-500">
                  Enteros o repartidos (0,5 / 1 plato)
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {plateLines.map((line) => renderLineCard(line, 'platos'))}
              </div>
            </section>
          )}

          {/* SECTION 3: Drinks served (for completeness & deletion if needed) */}
          {drinkLines.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center justify-between border-b border-stone-200 pb-2">
                <h3 className="text-base font-bold text-[#141414]">
                  🥤 Bebidas en mesa ({drinkLines.length})
                </h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {drinkLines.map((line) => {
                  const dish = MENU_BY_ID[line.dishId];
                  if (!dish) return null;
                  const who = line.assignedDinerIds
                    .map((id) => dinerMap[id]?.name)
                    .filter(Boolean)
                    .join(', ');
                  return (
                    <div
                      key={line.id}
                      className="rounded-2xl bg-white border border-stone-200 p-4 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <div className="text-xs text-stone-500">
                          Ronda {line.roundNumber} · {line.quantity} ud. ·{' '}
                          <span className="font-mono tabular-nums font-semibold text-[#141414]">
                            {formatEuros(((dish.price ?? 0) + (line.extraCharge ?? 0)) * line.quantity)}
                          </span>
                        </div>
                        <div className="text-sm font-bold text-[#141414] truncate mt-0.5">
                          {dish.name}
                        </div>
                        <div className="text-xs text-stone-600 truncate">
                          Para: {who}
                          {line.note ? ` · ${line.note}` : ''}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveSentLine(line.id)}
                        aria-label={`Quitar ${dish.name}`}
                        className="min-h-[40px] min-w-[40px] rounded-xl text-stone-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center shrink-0 cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
