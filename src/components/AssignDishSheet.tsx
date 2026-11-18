import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Check,
  Minus,
  Plus,
  Users,
  X,
  UserPlus,
} from 'lucide-react';
import { ALLERGENS_MAP, DINER_COLORS } from '../data/menu';
import { Diner, DishItem, OrderLine } from '../types';
import {
  formatCount,
  formatEuros,
  getDinerDishParticipationCount,
  getDinerRoundFoodLoad,
  getDinerTotalFoodLoad,
} from '../utils/calculations';
import { DishImage } from './DishImage';
import { GreenAlertModal } from './GreenAlertModal';

interface AssignDishSheetProps {
  dish: DishItem | null;
  diners: Diner[];
  currentRound: number;
  draftLines: OrderLine[];
  sentLines: OrderLine[];
  onClose: () => void;
  onConfirmAdd: (params: {
    dishId: string;
    quantity: number;
    assignedDinerIds: string[];
    isShared: boolean;
    extraCharge?: number;
    note?: string;
  }) => void;
  onQuickAddDiner: (diner: Omit<Diner, 'id'>) => string;
}

export const AssignDishSheet: React.FC<AssignDishSheetProps> = ({
  dish,
  diners,
  currentRound,
  draftLines,
  sentLines,
  onClose,
  onConfirmAdd,
  onQuickAddDiner,
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    diners.length === 1 ? [diners[0].id] : []
  );
  const [isShared, setIsShared] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [withIce, setWithIce] = useState(false);
  const [quickName, setQuickName] = useState('');
  const [greenPromptOpen, setGreenPromptOpen] = useState(false);
  const [greenMsgIndex, setGreenMsgIndex] = useState(0);

  // Reset local state when dish changes via key on parent, or safely sync if needed
  const allLines = useMemo(
    () => [...sentLines, ...draftLines],
    [sentLines, draftLines]
  );

  if (!dish) return null;

  const isCoffeeWithIceOption =
    dish.subCategory === 'Café e Infusiones' &&
    (dish.name.toLowerCase().includes('café') ||
      dish.name.toLowerCase().includes('cortado'));

  const toggleDiner = (id: string) => {
    setIsShared(false);
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleShareAll = () => {
    if (diners.length === 0) return;
    if (isShared && selectedIds.length === diners.length) {
      setIsShared(false);
      setSelectedIds([]);
    } else {
      setIsShared(true);
      setSelectedIds(diners.map((d) => d.id));
    }
  };

  const handleQuickCreateDiner = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = quickName.trim();
    if (!trimmed) return;
    const newId = onQuickAddDiner({
      name: trimmed,
      color: DINER_COLORS[diners.length % DINER_COLORS.length].hex,
      menuType: 'infinity_adulto',
      role: diners.length === 0 ? 'anfitrion' : 'invitado',
      allergies: [],
    });
    setQuickName('');
    setSelectedIds((prev) => [...prev, newId]);
  };

  const effectiveSelected =
    selectedIds.length > 0 ? selectedIds : isShared ? diners.map((d) => d.id) : [];

  const shareCount = Math.max(1, effectiveSelected.length);
  const effectiveIsShared = isShared || effectiveSelected.length > 1;

  // Compute live warnings (rules + allergies) for each selected diner
  const warnings: string[] = [];
  const allergenWarnings: string[] = [];

  if (effectiveSelected.length > 0) {
    const addedShare = quantity / shareCount;

    for (const dId of effectiveSelected) {
      const diner = diners.find((d) => d.id === dId);
      if (!diner) continue;

      // Allergen check
      const matchingAllergens = (diner.allergies ?? []).filter((a) =>
        dish.allergens.includes(a)
      );
      if (matchingAllergens.length > 0) {
        allergenWarnings.push(
          `¡Cuidado ${diner.name}! Este plato contiene: ${matchingAllergens
            .map((a) => ALLERGENS_MAP[a] ?? a)
            .join(', ')}.`
        );
      }

      if (dish.kind === 'food') {
        // 1) Infinity 5-dish limit per round
        if (
          diner.menuType === 'infinity_adulto' ||
          diner.menuType === 'infinity_infantil'
        ) {
          const currentLoad = getDinerRoundFoodLoad(dId, draftLines);
          const projected = Math.round((currentLoad + addedShare) * 100) / 100;
          if (projected > 5) {
            warnings.push(
              `${diner.name} superará el límite de 5 platos en la Ronda ${currentRound} (${formatCount(projected)}/5).`
            );
          }
        }

        // 2) "1 ración por persona" limit
        if (dish.limitOnePerPerson) {
          const prevCount = getDinerDishParticipationCount(
            dId,
            dish.id,
            allLines
          );
          const projectedDish = Math.round((prevCount + addedShare) * 100) / 100;
          if (projectedDish > 1) {
            warnings.push(
              `${diner.name} superaría el límite de "1 ración por persona" en #${dish.number} (${formatCount(projectedDish)} raciones).`
            );
          }
        }

        // 3) Menú del Día rules
        if (diner.menuType === 'menu_del_dia') {
          if (dish.excludedFromMenuDelDia) {
            warnings.push(
              `#${dish.number} ${dish.name} está excluido del Menú del Día de ${diner.name}.`
            );
          }
          const totalFood = getDinerTotalFoodLoad(dId, allLines) + addedShare;
          if (totalFood > 4) {
            warnings.push(
              `${diner.name} (Menú del Día) superará los 4 platos incluidos (${formatCount(totalFood)}/4).`
            );
          }
        }
      } else if (dish.kind === 'drink') {
        if (diner.menuType === 'menu_del_dia' && dish.excludedFromMenuDelDia) {
          warnings.push(
            `${dish.name} no entra en la bebida incluida del Menú del Día de ${diner.name} (se cobrará aparte).`
          );
        }
      }
    }
  }

  const unitExtraPrice =
    dish.price !== null
      ? dish.price + (withIce ? 0.2 : 0)
      : dish.supplement;

  const totalExtraCost = unitExtraPrice * quantity;

  const commitOrder = () => {
    onConfirmAdd({
      dishId: dish.id,
      quantity,
      assignedDinerIds: effectiveSelected,
      isShared: effectiveIsShared,
      extraCharge: withIce ? 0.2 : undefined,
      note: withIce ? 'Con hielo' : undefined,
    });
    setGreenPromptOpen(false);
    onClose();
  };

  const handleConfirm = () => {
    if (effectiveSelected.length === 0) return;
    if (dish.isGreenDish) {
      setGreenMsgIndex(sentLines.length + draftLines.length + Math.floor(Math.random() * 5));
      setGreenPromptOpen(true);
      return;
    }
    commitOrder();
  };

  const targetNamesLabel = effectiveSelected
    .map((id) => diners.find((d) => d.id === id)?.name)
    .filter(Boolean)
    .join(', ');

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="assign-sheet-title"
    >
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full sm:max-w-lg max-h-[90dvh] flex flex-col bg-white rounded-t-3xl sm:rounded-2xl border border-stone-200 shadow-2xl overflow-hidden">
        {/* Drag handle on mobile */}
        <div className="sm:hidden pt-2.5 pb-1 flex justify-center">
          <div className="w-10 h-1.5 rounded-full bg-stone-300" />
        </div>

        {/* Header */}
        <div className="px-5 pt-3 pb-4 border-b border-stone-100 flex items-start justify-between gap-3">
          <DishImage
            key={dish.id}
            dish={dish}
            priority
            className="w-14 h-14 rounded-xl shrink-0 border border-stone-200/70 mt-0.5"
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-stone-500">
              {dish.number !== null && (
                <span className="font-mono tabular-nums font-bold text-[#E24C3B]">
                  #{dish.number}
                </span>
              )}
              <span className="font-medium text-stone-700">{dish.category}</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {dish.isPortionUnit
                  ? '1 ración'
                  : `${dish.pieces} ${dish.pieces === 1 ? 'pieza' : 'piezas'}`}
              </span>
              {dish.supplement > 0 && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-semibold text-[#141414]">
                    +{dish.supplement}€ supl.
                  </span>
                </>
              )}
              {dish.price !== null && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono tabular-nums font-semibold text-[#141414]">
                    {formatEuros(dish.price)}
                  </span>
                </>
              )}
            </div>
            <h3
              id="assign-sheet-title"
              className="text-lg font-bold text-[#141414] mt-1 leading-snug"
            >
              {dish.name}
            </h3>
            {dish.description && (
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                {dish.description}
              </p>
            )}
            {dish.allergens.length > 0 && (
              <p className="text-[11px] text-stone-500 mt-1.5">
                Alérgenos:{' '}
                {dish.allergens
                  .map((a) => ALLERGENS_MAP[a] ?? a)
                  .join(', ')}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="min-h-[44px] min-w-[44px] -mr-2 -mt-1 rounded-xl text-stone-500 hover:text-[#141414] hover:bg-stone-100 flex items-center justify-center shrink-0 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Quantity + Coffee ice toggle */}
          <div className="flex items-center justify-between gap-4 bg-[#F7F6F3] rounded-2xl p-3.5">
            <div>
              <span className="text-sm font-bold text-[#141414]">Cantidad</span>
              <p className="text-xs text-stone-600 font-mono tabular-nums">
                {dish.isPortionUnit
                  ? `${quantity} ${quantity === 1 ? 'ración' : 'raciones'}`
                  : `${quantity * dish.pieces} piezas en total`}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="Disminuir cantidad"
                className="w-11 h-11 rounded-xl bg-white border border-stone-200 text-[#141414] flex items-center justify-center hover:bg-stone-50 active:scale-95 transition-all cursor-pointer"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-9 text-center font-mono tabular-nums text-base font-bold text-[#141414]">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                aria-label="Aumentar cantidad"
                className="w-11 h-11 rounded-xl bg-white border border-stone-200 text-[#141414] flex items-center justify-center hover:bg-stone-50 active:scale-95 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {isCoffeeWithIceOption && (
            <button
              type="button"
              onClick={() => setWithIce((v) => !v)}
              className={`w-full min-h-[44px] px-4 py-2.5 rounded-xl border text-sm font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                withIce
                  ? 'border-[#141414] bg-[#141414] text-white'
                  : 'border-stone-200 bg-white text-[#141414] hover:bg-stone-50'
              }`}
            >
              <span>Servir con hielo (+0,20 €)</span>
              <span className="w-5 h-5 rounded-md border border-current flex items-center justify-center">
                {withIce && <Check className="w-3.5 h-3.5" />}
              </span>
            </button>
          )}

          {/* Diner Assignment */}
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-bold text-[#141414]">
                ¿Para quién es?
              </span>
              {diners.length > 1 && (
                <button
                  type="button"
                  onClick={handleShareAll}
                  className={`min-h-[36px] px-3 py-1.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isShared && selectedIds.length === diners.length
                      ? 'bg-[#E24C3B] text-white'
                      : 'bg-stone-100 text-[#141414] hover:bg-stone-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  Para compartir (todos)
                </button>
              )}
            </div>

            {diners.length === 0 ? (
              <form
                onSubmit={handleQuickCreateDiner}
                className="rounded-2xl border border-stone-200 bg-[#F7F6F3] p-4 space-y-3"
              >
                <p className="text-xs font-semibold text-stone-700">
                  Aún no hay amigos en la mesa. Añade al primero aquí:
                </p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={quickName}
                    onChange={(e) => setQuickName(e.target.value)}
                    placeholder="Nombre del amigo..."
                    className="flex-1 min-h-[44px] px-3 rounded-xl border border-stone-300 bg-white text-sm text-[#141414] focus:outline-none focus:ring-2 focus:ring-[#E24C3B]"
                  />
                  <button
                    type="submit"
                    className="min-h-[44px] px-4 rounded-xl bg-[#141414] text-white text-sm font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    Añadir
                  </button>
                </div>
              </form>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {diners.map((diner) => {
                  const selected = effectiveSelected.includes(diner.id);
                  const currentLoad = getDinerRoundFoodLoad(diner.id, draftLines);
                  return (
                    <button
                      key={diner.id}
                      type="button"
                      onClick={() => toggleDiner(diner.id)}
                      className={`min-h-[52px] p-3 rounded-xl border text-left flex items-center justify-between gap-2 transition-all cursor-pointer ${
                        selected
                          ? 'border-[#141414] bg-[#141414] text-white'
                          : 'border-stone-200 bg-white text-[#141414] hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className="w-3.5 h-3.5 rounded-full shrink-0 border border-white/40"
                          style={{ backgroundColor: diner.color }}
                        />
                        <div className="min-w-0">
                          <div className="text-sm font-bold truncate">
                            {diner.name}
                          </div>
                          {dish.kind === 'food' &&
                            (diner.menuType === 'infinity_adulto' ||
                              diner.menuType === 'infinity_infantil') && (
                              <div
                                className={`text-[11px] font-mono tabular-nums ${
                                  selected ? 'text-stone-300' : 'text-stone-500'
                                }`}
                              >
                                R{currentRound}: {formatCount(currentLoad)}/5
                              </div>
                            )}
                        </div>
                      </div>
                      {selected && <Check className="w-4 h-4 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            )}

            {effectiveSelected.length > 1 && (
              <p className="text-xs text-stone-600">
                Se marcará como <strong className="text-[#141414]">Para compartir</strong> entre{' '}
                {effectiveSelected.length} personas (coste extra y límite divididos a partes iguales).
              </p>
            )}
          </div>

          {/* Allergen Conflict Warnings */}
          {allergenWarnings.length > 0 && (
            <div className="rounded-2xl border border-red-300 bg-red-50 p-3.5 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-red-900">
                <AlertTriangle className="w-4 h-4 text-red-700 shrink-0" />
                <span>Alerta de alergias del comensal</span>
              </div>
              <ul className="space-y-1 text-xs text-red-900 pl-6 list-disc">
                {allergenWarnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Real-time Warnings */}
          {warnings.length > 0 && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-3.5 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                <span>Aviso de normas de la carta</span>
              </div>
              <ul className="space-y-1 text-xs text-amber-900 pl-6 list-disc">
                {warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Sticky Footer CTA */}
        <div className="p-4 border-t border-stone-100 bg-white">
          <button
            type="button"
            disabled={effectiveSelected.length === 0}
            onClick={handleConfirm}
            className="w-full min-h-[48px] px-5 rounded-xl bg-[#E24C3B] disabled:bg-stone-200 disabled:text-stone-400 text-white font-semibold text-sm flex items-center justify-between transition-all active:scale-[0.98] cursor-pointer disabled:cursor-not-allowed"
          >
            <span>
              {effectiveSelected.length === 0
                ? 'Selecciona al menos 1 comensal'
                : `Añadir a Ronda ${currentRound}`}
            </span>
            {effectiveSelected.length > 0 && totalExtraCost > 0 && (
              <span className="font-mono tabular-nums font-bold">
                +{formatEuros(totalExtraCost)}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Sarcastic Green Dish Warning Modal */}
      <GreenAlertModal
        open={greenPromptOpen}
        dish={dish}
        targetNames={targetNamesLabel}
        messageIndex={greenMsgIndex}
        onConfirmGreen={commitOrder}
        onPickSushiInstead={() => {
          setGreenPromptOpen(false);
          onClose();
        }}
      />
    </div>
  );
};
