import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ChefHat,
  Crown,
  Lock,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
  X,
  ZoomIn,
} from 'lucide-react';
import { MENU_BY_ID, MENU_CATEGORIES, MENU_ITEMS } from '../data/menu';
import { Diner, DishItem, MenuCategory, OrderLine } from '../types';
import {
  formatCount,
  formatEuros,
  getDinerDishParticipationCount,
  getDinerRoundFoodLoad,
} from '../utils/calculations';
import { AssignDishSheet } from './AssignDishSheet';
import { DishImage } from './DishImage';
import { DishPreviewModal } from './DishPreviewModal';

interface OrderTabProps {
  diners: Diner[];
  currentRound: number;
  draftLines: OrderLine[];
  sentLines: OrderLine[];
  isHost?: boolean;
  hostName?: string;
  onAddDraftLine: (params: {
    dishId: string;
    quantity: number;
    assignedDinerIds: string[];
    isShared: boolean;
    extraCharge?: number;
    note?: string;
  }) => void;
  onUpdateDraftQuantity: (lineId: string, delta: number) => void;
  onRemoveDraftLine: (lineId: string) => void;
  onSendRoundToKitchen: () => void;
  onQuickAddDiner: (diner: Omit<Diner, 'id'>) => string;
}

const BEVERAGE_SUBCATEGORIES = [
  'Todas',
  'Refrescos y Cervezas',
  'Vinos Blancos',
  'Vinos Tintos',
  'Vinos Rosados',
  'Cavas',
  'Cócteles',
  'Sangría y Sake',
  'Café e Infusiones',
];

export const OrderTab: React.FC<OrderTabProps> = ({
  diners,
  currentRound,
  draftLines,
  sentLines,
  isHost = true,
  hostName,
  onAddDraftLine,
  onUpdateDraftQuantity,
  onRemoveDraftLine,
  onSendRoundToKitchen,
  onQuickAddDiner,
}) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'Todos' | MenuCategory>('Todos');
  const [drinkSubCategory, setDrinkSubCategory] = useState<string>('Todas');
  const [activeDish, setActiveDish] = useState<DishItem | null>(null);
  const [previewDish, setPreviewDish] = useState<DishItem | null>(null);
  const [mobileTrayOpen, setMobileTrayOpen] = useState(false);

  const allLines = useMemo(
    () => [...sentLines, ...draftLines],
    [sentLines, draftLines]
  );

  const dinerMap = useMemo(
    () => Object.fromEntries(diners.map((d) => [d.id, d])),
    [diners]
  );

  // Filter & rank items: exact dish number match comes first!
  const filteredItems = useMemo(() => {
    const raw = query.trim().toLowerCase();
    const numQuery = raw.replace(/^#/, '');
    const isNumericSearch = /^\d+$/.test(numQuery);

    let items = MENU_ITEMS.filter((item) => {
      if (selectedCategory !== 'Todos' && item.category !== selectedCategory) {
        return false;
      }
      if (
        selectedCategory === 'Bebidas' &&
        drinkSubCategory !== 'Todas' &&
        item.subCategory !== drinkSubCategory
      ) {
        return false;
      }
      if (!raw) return true;

      const numStr = item.number !== null ? String(item.number) : '';
      if (isNumericSearch) {
        return numStr.includes(numQuery);
      }

      return (
        numStr.includes(raw) ||
        item.name.toLowerCase().includes(raw) ||
        item.description.toLowerCase().includes(raw) ||
        item.category.toLowerCase().includes(raw) ||
        (item.subCategory?.toLowerCase().includes(raw) ?? false)
      );
    });

    if (isNumericSearch) {
      items = [...items].sort((a, b) => {
        const aStr = a.number !== null ? String(a.number) : '';
        const bStr = b.number !== null ? String(b.number) : '';
        const aExact = aStr === numQuery ? 0 : aStr.startsWith(numQuery) ? 1 : 2;
        const bExact = bStr === numQuery ? 0 : bStr.startsWith(numQuery) ? 1 : 2;
        if (aExact !== bExact) return aExact - bExact;
        return (a.number ?? 9999) - (b.number ?? 9999);
      });
    }

    return items;
  }, [query, selectedCategory, drinkSubCategory]);

  // Round-level warnings across diners
  const roundWarnings = useMemo(() => {
    const msgs: string[] = [];
    for (const d of diners) {
      if (
        d.menuType === 'infinity_adulto' ||
        d.menuType === 'infinity_infantil'
      ) {
        const load = getDinerRoundFoodLoad(d.id, draftLines);
        if (load > 5) {
          msgs.push(
            `${d.name} lleva ${formatCount(load)} platos en esta ronda (máximo 5 en Menú Infinity).`
          );
        }
      }
    }
    // Check 1-per-person dishes
    for (const d of diners) {
      for (const dish of MENU_ITEMS.filter((m) => m.limitOnePerPerson)) {
        const count = getDinerDishParticipationCount(d.id, dish.id, allLines);
        if (count > 1) {
          msgs.push(
            `${d.name} supera 1 ración de #${dish.number} ${dish.name} (${formatCount(count)} raciones).`
          );
        }
      }
    }
    return msgs;
  }, [diners, draftLines, allLines]);

  const draftTotalPortions = draftLines.reduce((sum, l) => sum + l.quantity, 0);
  const draftTotalPieces = draftLines.reduce((sum, l) => {
    const dish = MENU_BY_ID[l.dishId];
    return sum + (dish ? dish.pieces * l.quantity : 0);
  }, 0);

  const renderRoundTray = () => (
    <div className="rounded-2xl bg-white border border-stone-200 p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-[#141414]">
            Ronda {currentRound} · En preparación
          </h3>
          <p className="text-xs text-stone-600 font-mono tabular-nums mt-0.5">
            {draftTotalPortions} {draftTotalPortions === 1 ? 'ración' : 'raciones'} ·{' '}
            {draftTotalPieces} {draftTotalPieces === 1 ? 'pieza/ud.' : 'piezas/uds.'}
          </p>
        </div>
        {mobileTrayOpen && (
          <button
            type="button"
            onClick={() => setMobileTrayOpen(false)}
            aria-label="Cerrar bandeja"
            className="lg:hidden min-h-[44px] min-w-[44px] rounded-xl text-stone-500 hover:bg-stone-100 flex items-center justify-center cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Per-diner Infinity round counter */}
      {diners.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {diners.map((d) => {
            const isInfinity =
              d.menuType === 'infinity_adulto' ||
              d.menuType === 'infinity_infantil';
            const load = getDinerRoundFoodLoad(d.id, draftLines);
            const overLimit = isInfinity && load > 5;
            return (
              <div
                key={d.id}
                className={`px-3 py-2 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                  overLimit
                    ? 'border-red-300 bg-red-50 text-red-900'
                    : 'border-stone-200 bg-[#F7F6F3] text-[#141414]'
                }`}
              >
                <span className="flex items-center gap-1.5 font-semibold truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: d.color }}
                  />
                  <span className="truncate">{d.name}</span>
                </span>
                <span className="font-mono tabular-nums font-bold shrink-0">
                  {isInfinity ? `${formatCount(load)}/5` : formatCount(load)}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Warnings */}
      {roundWarnings.length > 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Revisa los límites</span>
          </div>
          {roundWarnings.map((msg, idx) => (
            <p key={idx} className="text-xs text-amber-900">
              {msg}
            </p>
          ))}
        </div>
      )}

      {/* Draft items */}
      {draftLines.length === 0 ? (
        <div className="py-6 text-center text-xs text-stone-500 border border-dashed border-stone-200 rounded-xl">
          Toca cualquier plato o bebida de la carta para añadirlo a la Ronda {currentRound}.
        </div>
      ) : (
        <div className="space-y-2 max-h-[45vh] overflow-y-auto pr-1">
          {draftLines.map((line) => {
            const dish = MENU_BY_ID[line.dishId];
            if (!dish) return null;
            const assignedNames = line.assignedDinerIds
              .map((id) => dinerMap[id]?.name)
              .filter(Boolean);
            const whoLabel = line.isShared
              ? `Compartido (${assignedNames.join(', ')})`
              : assignedNames.join(', ');

            return (
              <div
                key={line.id}
                className="p-3 rounded-xl bg-[#F7F6F3] border border-stone-200/80 flex items-center justify-between gap-2"
              >
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold text-[#141414] truncate">
                    {dish.number !== null && (
                      <span className="font-mono text-[#E24C3B] mr-1.5">
                        #{dish.number}
                      </span>
                    )}
                    {dish.name}
                  </div>
                  <div className="text-[11px] text-stone-600 truncate mt-0.5">
                    {whoLabel}
                    {line.note ? ` · ${line.note}` : ''}
                    {dish.supplement > 0 ? ` · +${dish.supplement}€` : ''}
                    {dish.price !== null
                      ? ` · ${formatEuros(dish.price + (line.extraCharge ?? 0))}`
                      : ''}
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => onUpdateDraftQuantity(line.id, -1)}
                    aria-label="Restar ración"
                    className="w-9 h-9 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-[#141414] hover:bg-stone-100 cursor-pointer"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="w-6 text-center font-mono tabular-nums text-xs font-bold">
                    {line.quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => onUpdateDraftQuantity(line.id, 1)}
                    aria-label="Sumar ración"
                    className="w-9 h-9 rounded-lg bg-white border border-stone-200 flex items-center justify-center text-[#141414] hover:bg-stone-100 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onRemoveDraftLine(line.id)}
                    aria-label="Eliminar plato"
                    className="w-9 h-9 rounded-lg text-stone-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isHost && (
        <div className="rounded-xl border border-stone-200 bg-[#F7F6F3] px-3.5 py-2.5 flex items-center gap-2 text-xs text-stone-700">
          <Crown className="w-4 h-4 text-[#E24C3B] shrink-0" />
          <span>
            Puedes añadir platos a la ronda compartida, pero solo{' '}
            <strong className="text-[#141414]">
              {hostName ? `${hostName} (Anfitrión)` : 'el Anfitrión'}
            </strong>{' '}
            puede mandar la ronda a cocina.
          </span>
        </div>
      )}

      <button
        type="button"
        disabled={!isHost || draftLines.length === 0}
        onClick={() => {
          if (!isHost) return;
          onSendRoundToKitchen();
          setMobileTrayOpen(false);
        }}
        className="w-full min-h-[48px] px-4 rounded-xl bg-[#E24C3B] disabled:bg-stone-200 disabled:text-stone-500 text-white font-bold text-sm flex items-center justify-center gap-2 hover:bg-[#cf4030] active:scale-[0.98] transition-all cursor-pointer disabled:cursor-not-allowed"
      >
        {isHost ? (
          <>
            <ChefHat className="w-4 h-4" />
            <span>Mandar ronda {currentRound} a cocina</span>
          </>
        ) : (
          <>
            <Lock className="w-4 h-4" />
            <span>Solo el anfitrión manda a cocina</span>
          </>
        )}
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header + Quick Search */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-[#141414]">
            Carta · Ronda {currentRound}
          </h2>
          <p className="text-sm text-stone-600 mt-0.5">
            Busca por número de plato (ej. 150) o navega por categoría.
          </p>
        </div>

        {/* Mobile inline button to view current round tray */}
        {draftLines.length > 0 && (
          <button
            type="button"
            onClick={() => setMobileTrayOpen(true)}
            className="lg:hidden min-h-[44px] px-4 py-2.5 rounded-xl bg-[#141414] text-white text-sm font-semibold flex items-center justify-between gap-3 cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#E24C3B]" />
              <span>Ver Ronda {currentRound}</span>
            </span>
            <span className="font-mono tabular-nums text-xs bg-white/15 px-2 py-0.5 rounded-md">
              {draftTotalPortions} {draftTotalPortions === 1 ? 'plato' : 'platos'} ·{' '}
              {isHost ? 'Mandar' : 'Ver ronda'}
            </span>
          </button>
        )}
      </div>

      {/* Main Desktop Split: Catalog (7 cols) + Round Tray (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-7 space-y-4">
          {/* Search Bar */}
          <div className="relative">
            <Search className="w-5 h-5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="search"
              inputMode="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar nº (ej: 150, 221, 90) o nombre (salmón, gyoza, mochi...)"
              className="w-full min-h-[48px] pl-11 pr-11 rounded-2xl border border-stone-300 bg-white text-sm font-medium text-[#141414] placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-[#E24C3B] transition-all"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label="Limpiar búsqueda"
                className="min-h-[44px] min-w-[44px] absolute right-1 top-1/2 -translate-y-1/2 rounded-xl text-stone-400 hover:text-[#141414] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Horizontal Category Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            <button
              type="button"
              onClick={() => setSelectedCategory('Todos')}
              className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                selectedCategory === 'Todos'
                  ? 'bg-[#141414] text-white'
                  : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
              }`}
            >
              Todos ({MENU_ITEMS.length})
            </button>
            {MENU_CATEGORIES.map((cat) => {
              const active = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => {
                    setSelectedCategory(cat);
                    if (cat !== 'Bebidas') setDrinkSubCategory('Todas');
                  }}
                  className={`min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    active
                      ? 'bg-[#141414] text-white'
                      : 'bg-white border border-stone-200 text-stone-700 hover:bg-stone-50'
                  }`}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Drink Sub-categories if Bebidas is active */}
          {selectedCategory === 'Bebidas' && (
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
              {BEVERAGE_SUBCATEGORIES.map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setDrinkSubCategory(sub)}
                  className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    drinkSubCategory === sub
                      ? 'bg-[#E24C3B] text-white'
                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                  }`}
                >
                  {sub}
                </button>
              ))}
            </div>
          )}

          {/* Dishes List */}
          {filteredItems.length === 0 ? (
            <div className="rounded-2xl bg-white border border-stone-200 p-8 text-center">
              <p className="text-sm font-semibold text-[#141414]">
                No hay platos que coincidan con “{query}”
              </p>
              <p className="text-xs text-stone-500 mt-1">
                Prueba buscando otro número o cambia de categoría.
              </p>
              <button
                type="button"
                onClick={() => {
                  setQuery('');
                  setSelectedCategory('Todos');
                }}
                className="mt-4 min-h-[40px] px-4 rounded-xl bg-stone-100 text-xs font-semibold text-[#141414] hover:bg-stone-200 cursor-pointer"
              >
                Ver toda la carta
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {filteredItems.map((item) => {
                // Count how many times this item is already in draftLines
                const inDraftQty = draftLines
                  .filter((l) => l.dishId === item.id)
                  .reduce((s, l) => s + l.quantity, 0);

                return (
                  <div
                    key={item.id}
                    className="rounded-2xl bg-white border border-stone-200 p-3 sm:p-3.5 flex items-center justify-between gap-3 hover:border-stone-300 transition-colors"
                  >
                    <button
                      type="button"
                      onClick={() => setPreviewDish(item)}
                      aria-label={`Ampliar foto de ${item.name}`}
                      className="group relative w-20 h-20 sm:w-22 sm:h-22 rounded-xl overflow-hidden shrink-0 bg-stone-100 border border-stone-200/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E24C3B] cursor-pointer"
                    >
                      <DishImage
                        key={item.id}
                        dish={item}
                        className="w-full h-full transition-transform duration-200 group-hover:scale-105"
                      />
                      <span
                        aria-hidden="true"
                        className="absolute bottom-1 right-1 w-6 h-6 rounded-lg bg-black/50 text-white flex items-center justify-center opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity"
                      >
                        <ZoomIn className="w-3.5 h-3.5" />
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveDish(item)}
                      className="flex-1 text-left min-w-0 py-0.5 cursor-pointer"
                    >
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-stone-500">
                        {item.number !== null && (
                          <span className="font-mono tabular-nums font-bold text-[#E24C3B]">
                            #{item.number}
                          </span>
                        )}
                        <span className="font-medium text-stone-700">
                          {item.subCategory ?? item.category}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {item.isPortionUnit
                            ? '1 ración'
                            : `${item.pieces} ${item.pieces === 1 ? 'pieza' : 'piezas'}`}
                        </span>
                        {item.supplement > 0 && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-bold text-[#141414]">
                              +{item.supplement}€ suplemento
                            </span>
                          </>
                        )}
                        {item.limitOnePerPerson && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-bold text-red-700">
                              1 ración/persona
                            </span>
                          </>
                        )}
                        {item.price !== null && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums font-bold text-[#141414]">
                              {formatEuros(item.price)}
                            </span>
                          </>
                        )}
                        {item.isGlutenFree && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-semibold text-emerald-700">
                              Sin gluten
                            </span>
                          </>
                        )}
                      </div>

                      <h3 className="text-sm sm:text-base font-bold text-[#141414] mt-0.5 leading-snug">
                        {item.name}
                      </h3>
                      {item.description && item.description !== item.subCategory && (
                        <p className="text-xs text-stone-600 mt-0.5 line-clamp-2">
                          {item.description}
                        </p>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveDish(item)}
                      aria-label={`Añadir ${item.name}`}
                      className={`min-h-[44px] min-w-[44px] px-3 rounded-xl font-mono tabular-nums text-sm font-bold flex items-center justify-center gap-1 shrink-0 transition-all active:scale-95 cursor-pointer ${
                        inDraftQty > 0
                          ? 'bg-[#E24C3B] text-white'
                          : 'bg-[#F7F6F3] text-[#141414] border border-stone-200 hover:bg-[#141414] hover:text-white'
                      }`}
                    >
                      <Plus className="w-4 h-4" />
                      {inDraftQty > 0 && <span>{inDraftQty}</span>}
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Desktop Sticky Round Tray */}
        <div className="hidden lg:block lg:col-span-5 lg:sticky lg:top-20">
          {renderRoundTray()}
        </div>
      </div>

      {/* Mobile Bottom Sheet for Round Tray */}
      {mobileTrayOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 flex items-end bg-black/50 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="absolute inset-0"
            onClick={() => setMobileTrayOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-full max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-white">
            <div className="pt-2.5 flex justify-center">
              <div className="w-10 h-1.5 rounded-full bg-stone-300" />
            </div>
            {renderRoundTray()}
          </div>
        </div>
      )}

      {/* Dish Photo Preview Modal */}
      {previewDish && (
        <DishPreviewModal
          key={previewDish.id}
          dish={previewDish}
          currentRound={currentRound}
          onClose={() => setPreviewDish(null)}
          onSelectForOrder={(selected) => setActiveDish(selected)}
        />
      )}

      {/* Dish Assignment Sheet */}
      {activeDish && (
        <AssignDishSheet
          key={activeDish.id}
          dish={activeDish}
          diners={diners}
          currentRound={currentRound}
          draftLines={draftLines}
          sentLines={sentLines}
          onClose={() => setActiveDish(null)}
          onConfirmAdd={onAddDraftLine}
          onQuickAddDiner={onQuickAddDiner}
        />
      )}
    </div>
  );
};
