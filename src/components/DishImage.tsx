import React, { useState } from 'react';
import { CupSoda, IceCreamCone, Utensils } from 'lucide-react';
import { DishItem } from '../types';
import { getFallbackDishPhoto } from '../utils/dishImages';

interface DishImageProps {
  dish: DishItem;
  className?: string;
  priority?: boolean;
}

type ImageStage = 'local' | 'fallbackPhoto' | 'cssFallback';

export const DishImage: React.FC<DishImageProps> = ({
  dish,
  className = '',
  priority = false,
}) => {
  const initialStage: ImageStage =
    dish.number !== null ? 'local' : 'fallbackPhoto';
  const [stage, setStage] = useState<ImageStage>(initialStage);

  const fallbackPhoto = getFallbackDishPhoto(dish);
  const src =
    stage === 'local' && dish.number !== null
      ? `/platos/${dish.number}.jpg`
      : fallbackPhoto;

  const handleError = () => {
    if (stage === 'local') {
      setStage('fallbackPhoto');
    } else if (stage === 'fallbackPhoto') {
      setStage('cssFallback');
    }
  };

  if (stage === 'cssFallback') {
    const FallbackIcon =
      dish.kind === 'drink'
        ? CupSoda
        : dish.kind === 'dessert'
          ? IceCreamCone
          : Utensils;

    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-stone-100 via-stone-50 to-orange-50/70 text-stone-500 border border-stone-200/80 select-none ${className}`}
        aria-label={dish.name}
      >
        <FallbackIcon className="w-6 h-6 text-[#E24C3B]/80" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={dish.name}
      referrerPolicy="no-referrer"
      loading={priority ? 'eager' : 'lazy'}
      onError={handleError}
      className={`object-cover bg-stone-100 ${className}`}
    />
  );
};
