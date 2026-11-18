import { DishItem } from '../types';

export const DISH_FALLBACK_PHOTOS = {
  nigiriSalmon: '/src/assets/images/dish_nigiri_salmon_1794994190215.jpg',
  nigiriTuna: '/src/assets/images/dish_nigiri_tuna_1794994191125.jpg',
  uramaki: '/src/assets/images/dish_uramaki_1794994191928.jpg',
  maki: '/src/assets/images/dish_maki_1794994191929.jpg',
  gunkan: '/src/assets/images/dish_gunkan_1794994192864.jpg',
  temaki: '/src/assets/images/dish_temaki_1794994193107.jpg',
  pokeDonburi: '/src/assets/images/dish_poke_donburi_1794994193326.jpg',
  entrantes: '/src/assets/images/dish_entrantes_1794994193284.jpg',
  gyozaBao: '/src/assets/images/dish_gyoza_bao_1794994193932.jpg',
  tempuraTeppan: '/src/assets/images/dish_tempura_teppan_1794994194314.jpg',
  yakisobaWok: '/src/assets/images/dish_yakisoba_wok_1794994194724.jpg',
  postresMochi: '/src/assets/images/dish_postres_mochi_1794994195642.jpg',
  bebidas: '/src/assets/images/dish_bebidas_1794994196596.jpg',
} as const;

export function getFallbackDishPhoto(dish: DishItem): string {
  const name = dish.name.toLowerCase();
  const desc = dish.description.toLowerCase();

  switch (dish.category) {
    case 'Bebidas':
      return DISH_FALLBACK_PHOTOS.bebidas;
    case 'Postres':
      return DISH_FALLBACK_PHOTOS.postresMochi;
    case 'Entrantes':
      if (name.includes('takoyaki')) {
        return DISH_FALLBACK_PHOTOS.gyozaBao;
      }
      return DISH_FALLBACK_PHOTOS.entrantes;
    case 'Poke':
    case 'Donburi':
      return DISH_FALLBACK_PHOTOS.pokeDonburi;
    case 'Gunkan':
      return DISH_FALLBACK_PHOTOS.gunkan;
    case 'Temaki':
      return DISH_FALLBACK_PHOTOS.temaki;
    case 'Uramaki':
      return DISH_FALLBACK_PHOTOS.uramaki;
    case 'Futomaki':
    case 'Hosomaki':
    case 'Onigiri':
      return DISH_FALLBACK_PHOTOS.maki;
    case 'Nigiri':
      if (name.includes('atún') || name.includes('lubina') || name.includes('anguila')) {
        return DISH_FALLBACK_PHOTOS.nigiriTuna;
      }
      return DISH_FALLBACK_PHOTOS.nigiriSalmon;
    case 'Sashimi':
      if (name.includes('salmón') && !name.includes('mixto')) {
        return DISH_FALLBACK_PHOTOS.nigiriSalmon;
      }
      return DISH_FALLBACK_PHOTOS.nigiriTuna;
    case 'Sushi Mixto':
      if (name.includes('maguro')) {
        return DISH_FALLBACK_PHOTOS.nigiriTuna;
      }
      return DISH_FALLBACK_PHOTOS.uramaki;
    case 'Especiales':
      if (name.includes('carpaccio') || name.includes('doble') || desc.includes('atún')) {
        return DISH_FALLBACK_PHOTOS.nigiriTuna;
      }
      if (name.includes('rollo')) {
        return DISH_FALLBACK_PHOTOS.uramaki;
      }
      return DISH_FALLBACK_PHOTOS.nigiriSalmon;
    case 'Vapores':
    case 'Bao':
      return DISH_FALLBACK_PHOTOS.gyozaBao;
    case 'Fritos':
    case 'Teppanyaki':
      return DISH_FALLBACK_PHOTOS.tempuraTeppan;
    case 'Arroz':
    case 'Fideos':
    case 'Sopas':
    case 'Variado':
      return DISH_FALLBACK_PHOTOS.yakisobaWok;
    default:
      return DISH_FALLBACK_PHOTOS.uramaki;
  }
}
