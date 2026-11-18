import React from 'react';
import { Plus, X } from 'lucide-react';
import { ALLERGENS_MAP } from '../data/menu';
import { DishItem } from '../types';
import { formatEuros } from '../utils/calculations';
import { DishImage } from './DishImage';

interface DishPreviewModalProps {
  dish: DishItem | null;
  currentRound: number;
  onClose: () => void;
  onSelectForOrder: (dish: DishItem) => void;
}

export const DishPreviewModal: React.FC<DishPreviewModalProps> = ({
  dish,
  currentRound,
  onClose,
  onSelectForOrder,
}) => {
  if (!dish) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="preview-modal-title"
    >
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full sm:max-w-md max-h-[92dvh] flex flex-col bg-white rounded-t-3xl sm:rounded-2xl border border-stone-200 shadow-2xl overflow-hidden">
        {/* Photo Header */}
        <div className="relative w-full aspect-square max-h-[42dvh] sm:max-h-[340px] bg-stone-100 overflow-hidden shrink-0">
          <DishImage
            key={dish.id}
            dish={dish}
            priority
            className="w-full h-full"
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar vista previa"
            className="absolute top-3 right-3 min-h-[44px] min-w-[44px] rounded-full bg-black/55 hover:bg-black/75 text-white backdrop-blur-xs flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-3.5 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-500">
            {dish.number !== null && (
              <span className="font-mono tabular-nums font-bold text-[#E24C3B]">
                #{dish.number}
              </span>
            )}
            <span className="font-semibold text-stone-700">
              {dish.subCategory ?? dish.category}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums font-semibold text-[#141414]">
              {dish.isPortionUnit
                ? '1 ración'
                : `${dish.pieces} ${dish.pieces === 1 ? 'pieza' : 'piezas'}`}
            </span>
            {dish.supplement > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-bold text-[#141414]">
                  +{dish.supplement}€ suplemento
                </span>
              </>
            )}
            {dish.price !== null && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-mono tabular-nums font-bold text-[#141414]">
                  {formatEuros(dish.price)}
                </span>
              </>
            )}
            {dish.limitOnePerPerson && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-bold text-red-700">
                  1 ración por persona
                </span>
              </>
            )}
            {dish.isGlutenFree && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-bold text-emerald-700">Sin gluten</span>
              </>
            )}
          </div>

          <div>
            <h3
              id="preview-modal-title"
              className="text-xl font-bold text-[#141414] leading-snug"
            >
              {dish.name}
            </h3>
            {dish.description && (
              <p className="text-sm text-stone-600 mt-1.5 leading-relaxed">
                {dish.description}
              </p>
            )}
          </div>

          <div className="border-t border-stone-100 pt-3">
            <div className="text-xs font-bold text-[#141414] mb-1">
              Alérgenos
            </div>
            {dish.allergens.length > 0 ? (
              <p className="text-xs text-stone-600 leading-relaxed">
                {dish.allergens
                  .map((id) => `${id}. ${ALLERGENS_MAP[id] ?? ''}`)
                  .join(' · ')}
              </p>
            ) : (
              <p className="text-xs text-stone-500">
                Sin alérgenos declarados en ficha (consulta trazas en carta).
              </p>
            )}
          </div>
        </div>

        {/* Action CTA */}
        <div className="p-4 border-t border-stone-100 bg-white flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[48px] px-4 rounded-xl border border-stone-200 text-sm font-semibold text-stone-700 hover:bg-stone-50 transition-colors cursor-pointer"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={() => {
              const target = dish;
              onClose();
              onSelectForOrder(target);
            }}
            className="flex-1 min-h-[48px] px-5 rounded-xl bg-[#E24C3B] hover:bg-[#cf4030] text-white text-sm font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Añadir a Ronda {currentRound}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
