import { CounterType, DishItem, MenuCategory, MenuType } from '../types';

export const MENU_CATEGORIES: MenuCategory[] = [
  'Entrantes',
  'Poke',
  'Gunkan',
  'Especiales',
  'Onigiri',
  'Sushi Mixto',
  'Sashimi',
  'Nigiri',
  'Donburi',
  'Temaki',
  'Futomaki',
  'Hosomaki',
  'Uramaki',
  'Fritos',
  'Teppanyaki',
  'Sopas',
  'Vapores',
  'Bao',
  'Arroz',
  'Fideos',
  'Variado',
  'Postres',
  'Bebidas',
];

export const ALLERGENS_MAP: Record<number, string> = {
  1: 'Gluten',
  2: 'Crustáceos',
  3: 'Huevos',
  4: 'Pescado',
  5: 'Cacahuetes',
  6: 'Soja',
  7: 'Lácteos',
  8: 'Frutos de cáscara',
  9: 'Apio',
  10: 'Mostaza',
  11: 'Sésamo',
  12: 'Dióxido de azufre y sulfitos',
  13: 'Altramuces',
  14: 'Moluscos',
  15: 'Aguacate',
};

export interface MenuTypeInfo {
  id: MenuType;
  label: string;
  shortLabel: string;
  basePrice: number;
  summary: string;
  rules: string[];
}

export const MENU_TYPES: Record<MenuType, MenuTypeInfo> = {
  infinity_adulto: {
    id: 'infinity_adulto',
    label: 'Menú Infinity Adulto',
    shortLabel: 'Infinity Adulto',
    basePrice: 17.9,
    summary: '17,90€ · Máx. 5 platos/ronda · Bebida y postre aparte',
    rules: [
      'Máximo 5 platos por ronda, sin límite de rondas.',
      'No incluye bebida ni postre (mínimo 1 bebida obligatoria por persona).',
      'Penalización de 2€ por cada plato pedido y no consumido.',
    ],
  },
  infinity_infantil: {
    id: 'infinity_infantil',
    label: 'Menú Infinity Infantil',
    shortLabel: 'Infinity Infantil',
    basePrice: 12.9,
    summary: '12,90€ · Niños 1m–1,30m · Máx. 5 platos/ronda',
    rules: [
      'Entre 1m y 1,30m de estatura (menores de 3 años o <1m no pagan).',
      'Máximo 5 platos por ronda, bebida y postre aparte.',
      'Penalización de 2€ por cada plato pedido y no consumido.',
    ],
  },
  menu_del_dia: {
    id: 'menu_del_dia',
    label: 'Menú del Día',
    shortLabel: 'Menú del Día',
    basePrice: 15.9,
    summary: '15,90€ · 4 platos + bebida + café (L–J mediodía)',
    rules: [
      'Incluye 4 platos (excepto Sushi Mixto y Postres).',
      'Incluye 1 bebida (excepto Asahi, Sapporo o Sake).',
      'Incluye 1 café (solo, cortado o con leche).',
    ],
  },
  carta: {
    id: 'carta',
    label: 'Carta',
    shortLabel: 'Carta',
    basePrice: 0,
    summary: 'Sin tarifa plana · Bebidas, postres y extras por unidad',
    rules: [
      'Sin cuota fija de menú; se suman suplementos, bebidas y postres pedidos.',
      'Ideal para acompañantes que solo toman bebida/postre o platos sueltos.',
    ],
  },
};

export const DINER_COLORS = [
  { name: 'Salmón', hex: '#E24C3B' },
  { name: 'Índigo', hex: '#2B4C7E' },
  { name: 'Matcha', hex: '#4B7F52' },
  { name: 'Yuzu', hex: '#D9822B' },
  { name: 'Ciruela', hex: '#7B3E6B' },
  { name: 'Carbón', hex: '#2D3136' },
  { name: 'Turquesa', hex: '#1F7A8C' },
  { name: 'Terracota', hex: '#B5533C' },
];

const PIECE_CATEGORIES = new Set<MenuCategory>([
  'Nigiri',
  'Gunkan',
  'Hosomaki',
  'Futomaki',
  'Uramaki',
  'Sushi Mixto',
  'Sashimi',
  'Temaki',
  'Onigiri',
  'Bao',
]);

/**
 * Salads (#3-#10), Edamame (#1, #11), sautéed/tempura veggies (#47, #212, #245),
 * and strictly veggie/avocado sushi (#118, #129, #155, #156, #166, #222).
 */
const GREEN_DISH_NUMBERS = new Set<number>([
  1, 3, 4, 5, 6, 7, 8, 9, 10, 11,
  47, 118, 129, 155, 156, 166, 212, 222, 245,
]);

function getEstimatedMenuValue(category: MenuCategory): number {
  switch (category) {
    case 'Entrantes':
    case 'Sopas':
    case 'Vapores':
    case 'Fritos':
      return 4.9;
    case 'Nigiri':
    case 'Gunkan':
      return 3.9;
    case 'Hosomaki':
    case 'Futomaki':
      return 4.9;
    case 'Uramaki':
    case 'Onigiri':
      return 5.9;
    case 'Temaki':
    case 'Bao':
      return 4.5;
    case 'Especiales':
    case 'Sashimi':
    case 'Sushi Mixto':
    case 'Poke':
    case 'Donburi':
    case 'Teppanyaki':
    case 'Arroz':
    case 'Fideos':
    case 'Variado':
      return 7.5;
    default:
      return 4.9;
  }
}

type RawFoodInput = {
  number: number;
  name: string;
  description: string;
  category: MenuCategory;
  pieces?: number;
  isPortionUnit?: boolean;
  supplement?: number;
  limitOnePerPerson?: boolean;
  allergens: number[];
  excludedFromMenuDelDia?: boolean;
};

function food(item: RawFoodInput): DishItem {
  const pieces = item.pieces ?? 1;
  const isPieces =
    PIECE_CATEGORIES.has(item.category) || (item.pieces !== undefined && item.pieces > 1);
  const tipoContador: CounterType = isPieces ? 'piezas' : 'platos';

  return {
    id: `dish-${item.number}`,
    number: item.number,
    name: item.name,
    description: item.description,
    category: item.category,
    kind: 'food',
    tipoContador,
    valorCartaEstimado: getEstimatedMenuValue(item.category),
    isGreenDish: GREEN_DISH_NUMBERS.has(item.number),
    pieces,
    isPortionUnit: item.isPortionUnit ?? item.pieces === undefined,
    supplement: item.supplement ?? 0,
    price: null,
    limitOnePerPerson: item.limitOnePerPerson ?? false,
    allergens: item.allergens,
    excludedFromMenuDelDia: item.excludedFromMenuDelDia ?? false,
  };
}

function dessert(
  number: number,
  name: string,
  description: string,
  price: number,
  allergens: number[],
  isGlutenFree = false
): DishItem {
  return {
    id: `dish-${number}`,
    number,
    name,
    description,
    category: 'Postres',
    kind: 'dessert',
    tipoContador: 'platos',
    valorCartaEstimado: price,
    isGreenDish: false,
    pieces: 1,
    isPortionUnit: true,
    supplement: 0,
    price,
    limitOnePerPerson: false,
    allergens,
    excludedFromMenuDelDia: true,
    isGlutenFree,
  };
}

function drink(
  slug: string,
  name: string,
  subCategory: string,
  price: number,
  options?: {
    excludedFromMenuDelDia?: boolean;
    includedCoffeeInMenuDelDia?: boolean;
    description?: string;
  }
): DishItem {
  return {
    id: `drink-${slug}`,
    number: null,
    name,
    description: options?.description ?? subCategory,
    category: 'Bebidas',
    subCategory,
    kind: 'drink',
    tipoContador: 'bebidas',
    valorCartaEstimado: price,
    isGreenDish: false,
    pieces: 1,
    isPortionUnit: true,
    supplement: 0,
    price,
    limitOnePerPerson: false,
    allergens: [],
    excludedFromMenuDelDia: options?.excludedFromMenuDelDia ?? false,
    includedCoffeeInMenuDelDia: options?.includedCoffeeInMenuDelDia ?? false,
  };
}

export const MENU_ITEMS: DishItem[] = [
  // ======================== ENTRANTES (Pág. 6-8) ========================
  food({
    number: 1,
    name: 'Edamame',
    description: 'Vainas de soja.',
    category: 'Entrantes',
    allergens: [6],
  }),
  food({
    number: 2,
    name: 'Takoyaki',
    description: 'Albóndigas de pulpo con mayonesa, salsa teriyaki y tiras de bonito seco.',
    category: 'Entrantes',
    pieces: 2,
    allergens: [1, 3, 4, 6, 14],
  }),
  food({
    number: 3,
    name: 'Ensalada kaisen',
    description: 'Ensalada marina con pulpo, sepia, gambas y surimi.',
    category: 'Entrantes',
    allergens: [1, 2, 6, 14],
  }),
  food({
    number: 4,
    name: 'Ensalada wakame',
    description: 'Ensalada de algas wakame.',
    category: 'Entrantes',
    allergens: [11],
  }),
  food({
    number: 5,
    name: 'Ensalada japonesa',
    description: 'Ensalada japonesa de algas y sésamo.',
    category: 'Entrantes',
    allergens: [1, 6, 11],
  }),
  food({
    number: 6,
    name: 'Sunomono',
    description: 'Ensalada de algas con gambas, pulpo, surimi y sésamo.',
    category: 'Entrantes',
    allergens: [1, 2, 6, 11, 14],
  }),
  food({
    number: 7,
    name: 'Ensalada Yasai',
    description: 'Ensalada mixta de verduras y sésamo.',
    category: 'Entrantes',
    allergens: [1, 6, 11],
  }),
  food({
    number: 8,
    name: 'Ensalada deluxe César',
    description: 'Ensalada con pollo rebozado, salsa César y sésamo.',
    category: 'Entrantes',
    allergens: [1, 7, 11],
  }),
  food({
    number: 9,
    name: 'Ensalada de pulpo y rúcula',
    description: 'Ensalada de pulpo y rúcula.',
    category: 'Entrantes',
    allergens: [1, 6, 14],
  }),
  food({
    number: 10,
    name: 'Ensalada deluxe sésamo',
    description: 'Ensalada mixta de verduras con gambas en tempura, salsa sésamo y sésamo.',
    category: 'Entrantes',
    allergens: [1, 2, 3, 6, 11],
  }),
  food({
    number: 11,
    name: 'Spicy edamame',
    description: 'Edamame picante.',
    category: 'Entrantes',
    allergens: [1, 6, 11],
  }),

  // ======================== POKE (Pág. 8) ========================
  food({
    number: 240,
    name: 'Poke Som',
    description: 'Poke bowl con arroz, mango, salmón, aguacate, habas de soja, copos de almendras, ensalada japonesa y salsa teriyaki.',
    category: 'Poke',
    allergens: [1, 4, 6, 8, 15],
  }),
  food({
    number: 241,
    name: 'Poke de pollo',
    description: 'Poke bowl con arroz, mango, pollo, aguacate, habas de soja, cebolla frita y salsa teriyaki.',
    category: 'Poke',
    allergens: [1, 6, 15],
  }),

  // ======================== GUNKAN (Pág. 9-10) ========================
  food({
    number: 90,
    name: 'Gunkan de salmón y calabacín',
    description: 'Arroz envuelto en calabacines y salmón.',
    category: 'Gunkan',
    pieces: 2,
    allergens: [4],
  }),
  food({
    number: 91,
    name: 'Gunkan tobiko',
    description: 'Arroz envuelto en hojaldres de algas y huevas de pez volador.',
    category: 'Gunkan',
    pieces: 2,
    allergens: [4],
  }),
  food({
    number: 92,
    name: 'Gunkan de atún',
    description: 'Arroz envuelto en atún con tobiko, mayonesa picante y tabasco.',
    category: 'Gunkan',
    pieces: 2,
    allergens: [3, 4],
  }),
  food({
    number: 93,
    name: 'Gunkan de salmón',
    description: 'Arroz envuelto en salmón con tobiko, mayonesa picante y tabasco.',
    category: 'Gunkan',
    pieces: 2,
    allergens: [3, 4],
  }),
  food({
    number: 94,
    name: 'Gunkan de calabacín',
    description: 'Arroz envuelto en calabacín con gambas cocidas, cangrejo y mayonesa.',
    category: 'Gunkan',
    pieces: 2,
    allergens: [2, 3],
  }),
  food({
    number: 95,
    name: 'Gunkan de queso crema',
    description: 'Bolas de arroz con queso crema, copos de almendras y salsa teriyaki.',
    category: 'Gunkan',
    pieces: 2,
    allergens: [1, 6, 7, 8],
  }),
  food({
    number: 97,
    name: 'Gunkan de salmón y soja picante',
    description: 'Arroz envuelto en hojaldres de soja y sésamo, salmón, tabasco, copos de almendra y mayonesa picante.',
    category: 'Gunkan',
    pieces: 2,
    allergens: [1, 3, 4, 6, 8, 11],
  }),
  food({
    number: 98,
    name: 'Gunkan de atún picante',
    description: 'Arroz envuelto en hojaldres de soja y sésamo, atún, tabasco, pistachos y mayonesa picante.',
    category: 'Gunkan',
    pieces: 2,
    allergens: [1, 3, 4, 6, 8, 11],
  }),
  food({
    number: 101,
    name: 'Gunkan de fruta',
    description: 'Bolas de arroz venus con queso crema, frutas del bosque y salsa de fresas.',
    category: 'Gunkan',
    pieces: 3,
    allergens: [7],
  }),

  // ======================== ESPECIALES (Pág. 11-12) ========================
  food({
    number: 20,
    name: 'Tartar doble',
    description: 'Tartar de salmón y lubina crudos y gambas al vapor con aguacate, tobiko, sésamo y salsa ponzu.',
    category: 'Especiales',
    pieces: 2,
    supplement: 1,
    allergens: [1, 2, 4, 6, 11, 15],
  }),
  food({
    number: 22,
    name: 'Carpaccio mixto',
    description: 'Carpaccio de salmón, atún y lubina crudos y sésamo en salsa ponzu.',
    category: 'Especiales',
    supplement: 1,
    allergens: [1, 4, 6, 11],
  }),
  food({
    number: 29,
    name: 'Rollo de salmón',
    description: 'Queso crema envuelto de salmón y pasta kataifi con salsa teriyaki.',
    category: 'Especiales',
    pieces: 2,
    supplement: 1,
    allergens: [1, 4, 6, 7],
  }),
  food({
    number: 32,
    name: 'Rollo de espárragos de atún',
    description: 'Espárragos en tempura envuelta en rollo de atún con salsa teriyaki y queso crema.',
    category: 'Especiales',
    pieces: 2,
    supplement: 1,
    limitOnePerPerson: true,
    allergens: [1, 4, 6, 7],
  }),
  food({
    number: 33,
    name: 'Rollo de espárragos de salmón',
    description: 'Espárragos en tempura envuelta en rollo de salmón con salsa teriyaki y queso crema.',
    category: 'Especiales',
    pieces: 2,
    supplement: 1,
    limitOnePerPerson: true,
    allergens: [1, 4, 6, 7],
  }),
  food({
    number: 34,
    name: 'White tartar',
    description: 'Tartar de arroz y salmón, cubierto de aguacate con migas de pan japonés, sésamo y salsa teriyaki.',
    category: 'Especiales',
    allergens: [1, 4, 6, 11, 15],
  }),
  food({
    number: 35,
    name: 'Black tartar',
    description: 'Tartar de arroz venus, salmón, cubierto de aguacate con pasta kataifi, sésamo y salsa de mango.',
    category: 'Especiales',
    allergens: [1, 3, 4, 6, 11, 15],
  }),
  food({
    number: 36,
    name: 'Tartar de salmón',
    description: 'Tartar de salmón con pasta kataifi y salsa ponzu.',
    category: 'Especiales',
    supplement: 1,
    allergens: [1, 3, 4],
  }),

  // ======================== ONIGIRI (Pág. 13) ========================
  food({
    number: 230,
    name: 'Onigiri sake',
    description: 'Triángulo de arroz con salmón, queso crema y sésamo.',
    category: 'Onigiri',
    pieces: 1,
    isPortionUnit: false,
    allergens: [3, 4, 7, 11],
  }),
  food({
    number: 231,
    name: 'Onigiri miura',
    description: 'Triángulo de arroz con salmón cocido y queso crema, mayonesa picante y sésamo.',
    category: 'Onigiri',
    pieces: 1,
    isPortionUnit: false,
    allergens: [3, 4, 7, 11],
  }),
  food({
    number: 232,
    name: 'Onigiri de atún',
    description: 'Triángulo de arroz con atún, mayonesa picante y sésamo.',
    category: 'Onigiri',
    pieces: 1,
    isPortionUnit: false,
    allergens: [3, 4, 11],
  }),

  // ======================== SUSHI MIXTO (Pág. 14) ========================
  food({
    number: 192,
    name: 'Sushi medio',
    description: '8 nigiris, 4 hosomakis y 4 uramakis.',
    category: 'Sushi Mixto',
    pieces: 16,
    isPortionUnit: false,
    allergens: [2, 4, 11, 15],
    excludedFromMenuDelDia: true,
  }),
  food({
    number: 193,
    name: 'Sake maguro nigiri',
    description: '4 nigiris de salmón y 4 nigiris de atún.',
    category: 'Sushi Mixto',
    pieces: 8,
    isPortionUnit: false,
    allergens: [4],
    excludedFromMenuDelDia: true,
  }),
  food({
    number: 194,
    name: 'Barca',
    description: '5 nigiris, 5 sashimi, 4 hosomakis y 4 uramakis.',
    category: 'Sushi Mixto',
    pieces: 18,
    isPortionUnit: false,
    supplement: 1,
    allergens: [2, 4, 11, 15],
    excludedFromMenuDelDia: true,
  }),

  // ======================== SASHIMI (Pág. 15) ========================
  food({
    number: 197,
    name: 'Sashimi mixto',
    description: 'Pescado crudo mixto (12 cortes).',
    category: 'Sashimi',
    pieces: 12,
    isPortionUnit: false,
    supplement: 2,
    allergens: [4],
  }),
  food({
    number: 198,
    name: 'Sashimi de salmón',
    description: 'Salmón crudo (6 cortes).',
    category: 'Sashimi',
    pieces: 6,
    isPortionUnit: false,
    supplement: 1,
    allergens: [4],
  }),

  // ======================== NIGIRI (Pág. 16-17) ========================
  food({
    number: 110,
    name: 'Nigiri de salmón flameado',
    description: 'Nigiris de salmón flameado, salsa teriyaki y sésamo.',
    category: 'Nigiri',
    pieces: 2,
    allergens: [1, 4, 6, 11],
  }),
  food({
    number: 111,
    name: 'Nigiri de salmón',
    description: 'Nigiris de salmón.',
    category: 'Nigiri',
    pieces: 2,
    allergens: [4],
  }),
  food({
    number: 112,
    name: 'Nigiri de lubina',
    description: 'Nigiris de lubina.',
    category: 'Nigiri',
    pieces: 2,
    allergens: [4],
  }),
  food({
    number: 113,
    name: 'Nigiri de amaebi',
    description: 'Nigiris de gambas cocidas.',
    category: 'Nigiri',
    pieces: 2,
    allergens: [2],
  }),
  food({
    number: 115,
    name: 'Nigiri de atún',
    description: 'Nigiris de atún.',
    category: 'Nigiri',
    pieces: 2,
    allergens: [4],
  }),
  food({
    number: 116,
    name: 'Nigiri salmón style',
    description: 'Nigiris de salmón flameado con queso crema y pasta kataifi.',
    category: 'Nigiri',
    pieces: 2,
    allergens: [1, 4, 7],
  }),
  food({
    number: 117,
    name: 'Nigiri de anguila',
    description: 'Nigiris de anguila con salsa teriyaki y sésamo.',
    category: 'Nigiri',
    pieces: 2,
    allergens: [1, 4, 6, 11],
  }),
  food({
    number: 118,
    name: 'Nigiri de aguacate',
    description: 'Nigiris de aguacate.',
    category: 'Nigiri',
    pieces: 2,
    allergens: [15],
  }),
  food({
    number: 120,
    name: 'Nigiri cheese fire salmón',
    description: 'Nigiris de salmón flameado, queso flameado, mayonesa picante y cebollino.',
    category: 'Nigiri',
    pieces: 2,
    allergens: [3, 4, 7],
  }),

  // ======================== DONBURI (Pág. 18) ========================
  food({
    number: 70,
    name: 'Chirashi mixto',
    description: 'Tazón de arroz, aguacate, atún y salmón.',
    category: 'Donburi',
    allergens: [4, 15],
  }),
  food({
    number: 71,
    name: 'Chirashi salmón',
    description: 'Tazón de arroz, aguacate y salmón.',
    category: 'Donburi',
    allergens: [4, 15],
  }),
  food({
    number: 72,
    name: 'Chirashi tekka',
    description: 'Tazón de arroz, aguacate y atún.',
    category: 'Donburi',
    allergens: [4, 15],
  }),

  // ======================== TEMAKI (Pág. 19-21) ========================
  food({
    number: 129,
    name: 'Temaki vegetal',
    description: 'Queso crema, aguacate, fine frisse y sésamo.',
    category: 'Temaki',
    pieces: 1,
    isPortionUnit: false,
    allergens: [7, 11, 15],
  }),
  food({
    number: 130,
    name: 'Temaki Som',
    description: 'Queso crema, aguacate, salmón y copos de almendras.',
    category: 'Temaki',
    pieces: 1,
    isPortionUnit: false,
    allergens: [4, 7, 8, 15],
  }),
  food({
    number: 131,
    name: 'Temaki sake',
    description: 'Salmón, aguacate y sésamo.',
    category: 'Temaki',
    pieces: 1,
    isPortionUnit: false,
    allergens: [4, 11, 15],
  }),
  food({
    number: 132,
    name: 'Temaki California',
    description: 'Cangrejo, mayonesa, aguacate y sésamo.',
    category: 'Temaki',
    pieces: 1,
    isPortionUnit: false,
    allergens: [2, 3, 11, 15],
  }),
  food({
    number: 133,
    name: 'Temaki spicy salmón',
    description: 'Salmón, tobiko, mayonesa picante, tabasco y sésamo.',
    category: 'Temaki',
    pieces: 1,
    isPortionUnit: false,
    allergens: [3, 4, 11],
  }),
  food({
    number: 134,
    name: 'Temaki miura',
    description: 'Salmón cocido con queso crema.',
    category: 'Temaki',
    pieces: 1,
    isPortionUnit: false,
    allergens: [4, 7],
  }),
  food({
    number: 135,
    name: 'Temaki ebiten',
    description: 'Gambas en tempura con mayonesa.',
    category: 'Temaki',
    pieces: 1,
    isPortionUnit: false,
    allergens: [1, 2, 3],
  }),
  food({
    number: 136,
    name: 'Temaki black rice',
    description: 'Arroz venus, salmón, crema de rúcula y pistachos, envueltos en hojaldre de soja con sésamo.',
    category: 'Temaki',
    pieces: 1,
    isPortionUnit: false,
    allergens: [1, 3, 4, 6, 8, 11],
  }),
  food({
    number: 137,
    name: 'Temaki rosa ángel',
    description: 'Gambas en tempura, aguacate, queso crema y patata frita, envueltos en hojaldre de soja con sésamo.',
    category: 'Temaki',
    pieces: 1,
    isPortionUnit: false,
    allergens: [1, 2, 6, 7, 11, 15],
  }),
  food({
    number: 138,
    name: 'Temaki ebiten y salmón',
    description: 'Salmón, gambas en tempura, patata frita y salsa de azafrán, envueltos en hojaldre de soja con sésamo.',
    category: 'Temaki',
    pieces: 1,
    isPortionUnit: false,
    allergens: [1, 2, 3, 4, 6, 11],
  }),
  food({
    number: 139,
    name: 'Temaki spicy de atún',
    description: 'Atún, tobiko, mayonesa y tabasco.',
    category: 'Temaki',
    pieces: 1,
    isPortionUnit: false,
    allergens: [3, 4],
  }),

  // ======================== FUTOMAKI (Pág. 22) ========================
  food({
    number: 224,
    name: 'Futo frito',
    description: 'Rollo frito con salmón, queso crema, pasta kataifi y salsa teriyaki.',
    category: 'Futomaki',
    pieces: 4,
    allergens: [1, 4, 6, 7],
  }),
  food({
    number: 225,
    name: 'Futo ebiten',
    description: 'Gambas en tempura, mayonesa, pasta kataifi y salsa teriyaki.',
    category: 'Futomaki',
    pieces: 8,
    allergens: [1, 2, 3, 6],
  }),

  // ======================== HOSOMAKI (Pág. 23-24) ========================
  food({
    number: 221,
    name: 'Hoso sake',
    description: 'Maki de salmón.',
    category: 'Hosomaki',
    pieces: 8,
    allergens: [4],
  }),
  food({
    number: 222,
    name: 'Hoso aguacate',
    description: 'Maki de aguacate.',
    category: 'Hosomaki',
    pieces: 8,
    allergens: [15],
  }),
  food({
    number: 223,
    name: 'Hoso fruta',
    description: 'Rollo frito con salmón, queso crema, fresas, sésamo y salsa de fresa.',
    category: 'Hosomaki',
    pieces: 4,
    allergens: [1, 4, 7, 11],
  }),
  food({
    number: 226,
    name: 'Hoso tekka',
    description: 'Maki de atún.',
    category: 'Hosomaki',
    pieces: 8,
    allergens: [4],
  }),
  food({
    number: 227,
    name: 'Hoso gamba',
    description: 'Maki de gamba cocida.',
    category: 'Hosomaki',
    pieces: 8,
    allergens: [2],
  }),
  food({
    number: 228,
    name: 'Hoso mango',
    description: 'Rollo frito con salmón, queso crema, mango, sésamo y salsa de mango.',
    category: 'Hosomaki',
    pieces: 4,
    allergens: [1, 4, 7, 11],
  }),
  food({
    number: 229,
    name: 'Hoso surimi',
    description: 'Maki de surimi con mayonesa.',
    category: 'Hosomaki',
    pieces: 8,
    allergens: [2, 3],
  }),

  // ======================== URAMAKI (Pág. 25-29) ========================
  food({
    number: 149,
    name: 'Crispy chicken roll',
    description: 'Pollo rebozado con aguacate, cebolla crujiente, salsa cacahuetes y sésamo.',
    category: 'Uramaki',
    pieces: 4,
    allergens: [1, 5, 11, 15],
  }),
  food({
    number: 150,
    name: 'Salmón plus',
    description: 'Salmón cocido con queso crema, aguacate, salmón flameado, queso cheddar, mayonesa picante, salsa teriyaki y pistachos.',
    category: 'Uramaki',
    pieces: 4,
    allergens: [1, 3, 4, 6, 7, 8, 15],
  }),
  food({
    number: 152,
    name: 'Rúcula roll',
    description: 'Salmón cubierto de aguacate, pasta kataifi y salsa de rúcula.',
    category: 'Uramaki',
    pieces: 4,
    allergens: [1, 3, 4, 7, 15],
  }),
  food({
    number: 155,
    name: 'Crispy aguacate roll blanco',
    description: 'Aguacate con queso crema, cebolla frita, sésamo y salsa teriyaki.',
    category: 'Uramaki',
    pieces: 4,
    allergens: [1, 6, 7, 11, 15],
  }),
  food({
    number: 156,
    name: 'Crispy aguacate roll negro',
    description: 'Arroz Venus con aguacate, queso crema, cebolla frita, sésamo y salsa teriyaki.',
    category: 'Uramaki',
    pieces: 4,
    allergens: [1, 6, 7, 11, 15],
  }),
  food({
    number: 157,
    name: 'Rollo crujiente',
    description: 'Arroz venus con gambas en tempura, aguacate, copos de almendra y salsa teriyaki.',
    category: 'Uramaki',
    pieces: 4,
    allergens: [1, 2, 6, 8, 15],
  }),
  food({
    number: 158,
    name: 'Sake aguacate',
    description: 'Salmón con aguacate y sésamo.',
    category: 'Uramaki',
    pieces: 4,
    allergens: [4, 11, 15],
  }),
  food({
    number: 159,
    name: 'Salmón picante',
    description: 'Salmón con mayonesa picante, tabasco, mayonesa, tobiko y sésamo.',
    category: 'Uramaki',
    pieces: 4,
    allergens: [3, 4, 11],
  }),
  food({
    number: 160,
    name: 'Miura maki',
    description: 'Salmón cocido con queso crema y sésamo.',
    category: 'Uramaki',
    pieces: 4,
    allergens: [4, 7, 11],
  }),
  food({
    number: 161,
    name: 'Ebiten',
    description: 'Gambas en tempura, mayonesa, pasta kataifi, salsa teriyaki y sésamo.',
    category: 'Uramaki',
    pieces: 4,
    allergens: [1, 2, 3, 6, 11],
  }),
  food({
    number: 162,
    name: 'Rollo tigre',
    description: 'Gambas en tempura con mayonesa, cubiertas de salmón y salsa teriyaki.',
    category: 'Uramaki',
    pieces: 4,
    allergens: [1, 2, 3, 4, 6],
  }),
  food({
    number: 163,
    name: 'Rollo ángel',
    description: 'Gambas en tempura, queso crema, cubiertas de aguacate y salsa teriyaki.',
    category: 'Uramaki',
    pieces: 4,
    allergens: [1, 2, 6, 7, 15],
  }),
  food({
    number: 164,
    name: 'Arcoíris',
    description: 'Salmón con aguacate, cubierto de salmón, queso crema y aguacate.',
    category: 'Uramaki',
    pieces: 4,
    allergens: [4, 7, 15],
  }),
  food({
    number: 165,
    name: 'Rollo especial',
    description: 'Salmón con aguacate, cubierto de salmón y queso crema.',
    category: 'Uramaki',
    pieces: 4,
    allergens: [4, 7, 15],
  }),
  food({
    number: 166,
    name: 'Rollo vegetal',
    description: 'Espárrago con aguacate y queso crema, cubierto de aguacate.',
    category: 'Uramaki',
    pieces: 4,
    allergens: [7, 15],
  }),
  food({
    number: 168,
    name: 'Rollo estrella',
    description: 'Salmón con queso crema, patata fritas y salsa teriyaki.',
    category: 'Uramaki',
    pieces: 4,
    allergens: [1, 4, 6, 7],
  }),
  food({
    number: 169,
    name: 'Creación del chef',
    description: 'Gambas en tempura, tartar de salmón, salsa picante, nachos crujientes, salsa teriyaki y sésamo.',
    category: 'Uramaki',
    pieces: 4,
    allergens: [1, 2, 3, 4, 6, 11],
  }),
  food({
    number: 178,
    name: 'Rollo especial de mango',
    description: 'Salmón con queso crema, cubierto de mango fresco y sésamo.',
    category: 'Uramaki',
    pieces: 4,
    allergens: [4, 7, 11],
  }),
  food({
    number: 180,
    name: 'Rollo de salmón (hojaldre soja)',
    description: 'Rollo de hojaldres de soja y sésamo con salmón, aguacate y queso crema.',
    category: 'Uramaki',
    pieces: 4,
    allergens: [1, 4, 6, 7, 11, 15],
  }),
  food({
    number: 181,
    name: 'Rollo mando',
    description: 'Atún cocido con aguacate y queso crema, copos de almendras, sésamo y salsa teriyaki.',
    category: 'Uramaki',
    pieces: 4,
    allergens: [1, 4, 6, 7, 8, 11, 15],
  }),
  food({
    number: 182,
    name: 'Rollo de mango',
    description: 'Salmón con mango, queso crema y sésamo.',
    category: 'Uramaki',
    pieces: 4,
    allergens: [4, 7, 11],
  }),
  food({
    number: 183,
    name: 'Rollo de ghibli',
    description: 'Pollo rebozado con aguacate, tartar de salmón, salsa teriyaki y arroz frito.',
    category: 'Uramaki',
    pieces: 4,
    allergens: [1, 4, 6, 15],
  }),
  food({
    number: 184,
    name: 'Rollo de ghibli fresa',
    description: 'Pollo rebozado con aguacate, queso crema, fresa, arroz frito y salsa de fresas.',
    category: 'Uramaki',
    pieces: 4,
    allergens: [1, 7, 15],
  }),
  food({
    number: 185,
    name: 'Suspiro blanco',
    description: 'Arroz blanco con tartar de salmón, queso crema, aguacate, pasta kataifi y salsa teriyaki.',
    category: 'Uramaki',
    pieces: 4,
    allergens: [1, 4, 6, 7, 15],
  }),
  food({
    number: 188,
    name: 'Rollo negro plus',
    description: 'Arroz venus con gambas en tempura, cangrejo con mayonesa y salsa de guacamole.',
    category: 'Uramaki',
    pieces: 4,
    allergens: [1, 2, 3, 15],
  }),

  // ======================== FRITOS (Pág. 30-31) ========================
  food({
    number: 41,
    name: 'Pinzas de cangrejo frito',
    description: 'Pinzas de cangrejo rebozadas y fritas.',
    category: 'Fritos',
    pieces: 2,
    allergens: [1, 2, 3, 4, 6],
  }),
  food({
    number: 43,
    name: 'Harumaki de pollo',
    description: 'Rollitos fritos.',
    category: 'Fritos',
    pieces: 2,
    allergens: [1, 6, 11],
  }),
  food({
    number: 45,
    name: 'Tempura moriawase',
    description: 'Gambas y verduras en tempura.',
    category: 'Fritos',
    allergens: [1, 2],
  }),
  food({
    number: 46,
    name: 'Ebi tempura',
    description: 'Gambas en tempura.',
    category: 'Fritos',
    allergens: [1, 2],
  }),
  food({
    number: 47,
    name: 'Yasai tempura',
    description: 'Verduras en tempura.',
    category: 'Fritos',
    allergens: [1],
  }),
  food({
    number: 48,
    name: 'Sake su',
    description: 'Salmón frito.',
    category: 'Fritos',
    allergens: [1, 4],
  }),
  food({
    number: 49,
    name: 'Patatas fritas',
    description: 'Ración de patatas fritas.',
    category: 'Fritos',
    allergens: [1],
  }),
  food({
    number: 50,
    name: 'Tiras de pollo rebozadas',
    description: 'Tiras de pollo rebozadas con salsa agridulce.',
    category: 'Fritos',
    allergens: [1, 6],
  }),

  // ======================== TEPPANYAKI (Pág. 32-33) ========================
  food({
    number: 140,
    name: 'Tataki de ternera',
    description: 'Ternera a la plancha con salsa especial.',
    category: 'Teppanyaki',
    allergens: [1, 6, 7],
  }),
  food({
    number: 141,
    name: 'Ebi kushi',
    description: 'Pinchos de gambas.',
    category: 'Teppanyaki',
    pieces: 2,
    allergens: [1, 2, 6],
  }),
  food({
    number: 142,
    name: 'Oebi no shioaki',
    description: 'Langostinos a la plancha con salsa de ajo y perejil.',
    category: 'Teppanyaki',
    pieces: 2,
    supplement: 1,
    allergens: [1, 2, 6],
  }),
  food({
    number: 143,
    name: 'Sake teppanyaki',
    description: 'Salmón a la plancha con salsa teriyaki.',
    category: 'Teppanyaki',
    allergens: [1, 4, 6],
  }),
  food({
    number: 145,
    name: 'Yaki tori',
    description: 'Pinchos de pollo con salsa teriyaki.',
    category: 'Teppanyaki',
    pieces: 2,
    allergens: [1, 6],
  }),
  food({
    number: 146,
    name: 'Kaisen tori',
    description: 'Pinchos de pescado mixto con salsa teriyaki.',
    category: 'Teppanyaki',
    pieces: 2,
    allergens: [1, 4, 6],
  }),

  // ======================== SOPAS (Pág. 33) ========================
  food({
    number: 195,
    name: 'Miso',
    description: 'Sopa de miso con algas y tofu.',
    category: 'Sopas',
    allergens: [1, 6],
  }),
  food({
    number: 196,
    name: 'Osu mashi',
    description: 'Sopa de miso con algas, tofu y gambas.',
    category: 'Sopas',
    allergens: [1, 2, 6],
  }),

  // ======================== VAPORES (Pág. 34-35) ========================
  food({
    number: 55,
    name: 'Gyoza de verduras',
    description: 'Gyoza de verduras al vapor.',
    category: 'Vapores',
    pieces: 3,
    allergens: [1, 6, 11],
  }),
  food({
    number: 200,
    name: 'Pan al vapor',
    description: 'Panecillos chinos al vapor.',
    category: 'Vapores',
    pieces: 2,
    allergens: [1, 7],
  }),
  food({
    number: 201,
    name: 'Shumai gyoza',
    description: 'Raviolis de carne al vapor.',
    category: 'Vapores',
    pieces: 3,
    allergens: [1, 6, 11, 14],
  }),
  food({
    number: 202,
    name: 'Niku gyoza',
    description: 'Gyozas de carne y verduras a la plancha.',
    category: 'Vapores',
    pieces: 3,
    allergens: [1, 6, 11],
  }),
  food({
    number: 203,
    name: 'Pan frito',
    description: 'Panecillos chinos fritos.',
    category: 'Vapores',
    pieces: 2,
    allergens: [1, 7],
  }),
  food({
    number: 204,
    name: 'Ebi gyoza',
    description: 'Raviolis de gambas al vapor.',
    category: 'Vapores',
    pieces: 3,
    supplement: 1,
    allergens: [1, 2, 3, 6, 11, 12, 14],
  }),

  // ======================== BAO (Pág. 35) ========================
  food({
    number: 235,
    name: 'Yaki bao',
    description: 'Pan al vapor con lechuga, tomate, pollo rebozado, mayonesa picante y sésamo.',
    category: 'Bao',
    pieces: 1,
    isPortionUnit: false,
    allergens: [1, 3, 7, 11],
  }),
  food({
    number: 236,
    name: 'Sake bao',
    description: 'Pan al vapor con lechuga, tomate, salmón frito, salsa César y sésamo.',
    category: 'Bao',
    pieces: 1,
    isPortionUnit: false,
    allergens: [1, 3, 4, 7, 10, 11],
  }),

  // ======================== ARROZ (Pág. 36) ========================
  food({
    number: 80,
    name: 'Yakimeshi venus',
    description: 'Arroz venus salteado con verduras, gambas y huevos.',
    category: 'Arroz',
    allergens: [1, 2, 3, 6],
  }),
  food({
    number: 81,
    name: 'Yakimeshi',
    description: 'Arroz salteado con verduras y huevos.',
    category: 'Arroz',
    allergens: [1, 3, 6],
  }),
  food({
    number: 82,
    name: 'Yakimeshi con gambas',
    description: 'Arroz salteado con gambas, verduras y huevos.',
    category: 'Arroz',
    allergens: [1, 2, 3, 6],
  }),
  food({
    number: 83,
    name: 'Arroz blanco',
    description: 'Arroz blanco con sésamo.',
    category: 'Arroz',
    allergens: [11],
  }),

  // ======================== FIDEOS (Pág. 37) ========================
  food({
    number: 61,
    name: 'Fideos de arroz',
    description: 'Fideos de arroz salteados con gambas, verduras y huevos.',
    category: 'Fideos',
    allergens: [1, 2, 3, 6],
  }),
  food({
    number: 62,
    name: 'Espagueti de soja',
    description: 'Espagueti de soja con gambas, verduras y huevos.',
    category: 'Fideos',
    allergens: [1, 2, 3, 6],
  }),
  food({
    number: 63,
    name: 'Yakisoba',
    description: 'Fideos fritos con gambas, verduras y huevos.',
    category: 'Fideos',
    allergens: [1, 2, 3, 6],
  }),
  food({
    number: 64,
    name: 'Yakiudon',
    description: 'Fideos de arroz salteados con gambas y verduras.',
    category: 'Fideos',
    allergens: [1, 2, 6],
  }),

  // ======================== VARIADO (Pág. 38-40) ========================
  food({
    number: 205,
    name: 'Gambas con sal y pimienta',
    description: 'Gambas rebozadas y verduras.',
    category: 'Variado',
    allergens: [1, 2, 6],
  }),
  food({
    number: 206,
    name: 'Pollo al curry con leche de coco',
    description: 'Pollo al curry, leche de coco y verduras.',
    category: 'Variado',
    allergens: [1, 6, 7],
  }),
  food({
    number: 207,
    name: 'Pollo con limón',
    description: 'Pollo rebozado con salsa de limón.',
    category: 'Variado',
    allergens: [1],
  }),
  food({
    number: 208,
    name: 'Ebi picante',
    description: 'Gambas y verduras con salsa picante.',
    category: 'Variado',
    allergens: [1, 2, 6],
  }),
  food({
    number: 209,
    name: 'Gambas con setas',
    description: 'Gambas salteadas con bambú y setas.',
    category: 'Variado',
    allergens: [1, 2, 6],
  }),
  food({
    number: 210,
    name: 'Pollo con almendras',
    description: 'Pollo con almendras y verduras.',
    category: 'Variado',
    allergens: [1, 6, 8],
  }),
  food({
    number: 211,
    name: 'Pollo con bambú',
    description: 'Pollo salteado con bambú y setas.',
    category: 'Variado',
    allergens: [1, 6],
  }),
  food({
    number: 212,
    name: 'Pak choi',
    description: 'Verduras salteadas.',
    category: 'Variado',
    allergens: [1, 6],
  }),
  food({
    number: 213,
    name: 'Sartén de calamares y verduras mixtas',
    description: 'Ligeramente picante.',
    category: 'Variado',
    allergens: [1, 6, 14],
  }),
  food({
    number: 214,
    name: 'Sartén de gambas y verduras mixtas',
    description: 'Ligeramente picante.',
    category: 'Variado',
    allergens: [1, 2, 6],
  }),
  food({
    number: 215,
    name: 'Sartén de pollo y verduras mixtas',
    description: 'Ligeramente picante.',
    category: 'Variado',
    allergens: [1, 6],
  }),
  food({
    number: 216,
    name: 'Sartén de ternera y verduras mixtas',
    description: 'Ligeramente picante.',
    category: 'Variado',
    allergens: [1, 6],
  }),
  food({
    number: 217,
    name: 'Ternera Som',
    description: 'Ternera con salsa de ostras y verduras.',
    category: 'Variado',
    allergens: [1, 6],
  }),
  food({
    number: 218,
    name: 'Champiñones Som',
    description: 'Champiñones y cebollino.',
    category: 'Variado',
    allergens: [1, 6],
  }),
  food({
    number: 219,
    name: 'Gambas al curry',
    description: 'Gambas al curry, leche de coco y verduras.',
    category: 'Variado',
    allergens: [1, 2, 6, 7],
  }),
  food({
    number: 245,
    name: 'Sartén de coliflor y verduras mixtas',
    description: 'Ligeramente picante.',
    category: 'Variado',
    allergens: [1, 6],
  }),

  // ======================== POSTRES HELADOS (Pág. 42-46) ========================
  dessert(301, 'Dulzura oriental', 'Postre helado (trazas de cacahuete, sulfitos, apio, sésamo, mostaza y soja).', 5.95, [1, 3, 7]),
  dessert(302, 'Lingote cacahuete caramelo', 'Postre helado de cacahuete y caramelo.', 5.95, [5, 6, 7]),
  dessert(303, 'Rocher chocolate blanco', 'Postre helado rocher de chocolate blanco.', 5.95, [3, 7]),
  dessert(304, 'Limón', 'Postre helado de limón.', 5.95, [1, 3, 6, 7]),
  dessert(310, 'Tiramisú', 'Postre helado de tiramisú.', 5.95, [1, 3, 6, 7, 8]),
  dessert(311, 'Huevo de chocolate blanco y mango', 'Postre helado de chocolate blanco y mango.', 5.95, [3, 7]),
  dessert(312, 'Soufflé de vainilla frambuesa', 'Postre helado soufflé de vainilla y frambuesa.', 5.95, [1, 3, 7]),
  dessert(316, 'Coulant de chocolate', 'Sin gluten.', 5.95, [3, 6], true),
  dessert(319, 'Pirámide chocolate blanco', 'Postre helado pirámide de chocolate blanco.', 5.95, [1, 3, 4, 6, 7, 8]),
  dessert(322, 'Cheesecake spéculoos', 'Postre helado cheesecake spéculoos.', 5.95, [1, 3, 7]),
  dessert(323, 'Dorayakis de chocolate', '3,95€ / unidad.', 3.95, [1, 3, 5, 6, 7, 8, 11]),
  dessert(324, 'Gofre Som', 'Gofre con helado, frutas y salsa de chocolate.', 6.5, [1, 3, 6, 7, 8]),
  dessert(325, 'Gofre de banana', 'Gofre con helado, plátano, frutas y salsa de chocolate.', 6.5, [1, 3, 6, 7, 8]),
  dessert(327, 'Mochi de mango', 'Envoltura de arroz glutinoso rellena de mousse de mango con trocitos de mango (4,95€/ud).', 4.95, [7]),
  dessert(328, 'Mochi de oreo', 'Envoltura de arroz glutinoso rellena de mousse de galleta de oreo (4,95€/ud).', 4.95, [1, 7]),
  dessert(329, 'Mochi de cheesecake', 'Envoltura de arroz glutinoso rellena de mousse de queso con corazón de mermelada de frambuesa y arándanos (4,95€/ud).', 4.95, [7]),
  dessert(330, 'Mochi de tiramisú', 'Envoltura de arroz glutinoso rellena de mousse de queso mascarpone con corazón de melindro bañado en café (4,95€/ud).', 4.95, [1, 7]),
  dessert(332, 'Mochi de té matcha', 'Envoltura de arroz glutinoso rellena de mousse de té matcha, un sabor tradicional japonés (4,95€/ud).', 4.95, [7]),
  dessert(333, 'Sorbete de limón', 'Sorbete de limón.', 4.5, [7]),
  dessert(334, 'Sorbete de chocolate', 'Sorbete de chocolate.', 4.5, [3, 6, 7]),

  // ======================== BEBIDAS (Pág. 48-49) ========================
  // --- Refrescos y Cervezas ---
  drink('agua', 'Agua', 'Refrescos y Cervezas', 2.95),
  drink('agua-con-gas', 'Agua con gas', 'Refrescos y Cervezas', 3.5),
  drink('refrescos', 'Refrescos', 'Refrescos y Cervezas', 3.5),
  drink('zumo', 'Zumo naranja / piña / melocotón', 'Refrescos y Cervezas', 3.5),
  drink('cerveza-estrella-galicia', 'Cerveza (Estrella Galicia)', 'Refrescos y Cervezas', 3.5),
  drink('cerveza-sin-alcohol', 'Cerveza sin alcohol (Estrella Galicia)', 'Refrescos y Cervezas', 3.5),
  drink('cerveza-1906', 'Cerveza 1906', 'Refrescos y Cervezas', 3.95),
  drink('cerveza-sapporo', 'Cerveza Sapporo', 'Refrescos y Cervezas', 3.95, {
    excludedFromMenuDelDia: true,
    description: 'Refrescos y Cervezas · Excluida en Menú del Día',
  }),
  drink('cerveza-asahi', 'Cerveza Asahi', 'Refrescos y Cervezas', 3.95, {
    excludedFromMenuDelDia: true,
    description: 'Refrescos y Cervezas · Excluida en Menú del Día',
  }),

  // --- Café e Infusiones ---
  drink('cafe-solo', 'Café solo', 'Café e Infusiones', 1.7, {
    includedCoffeeInMenuDelDia: true,
  }),
  drink('cortado', 'Cortado', 'Café e Infusiones', 1.9, {
    includedCoffeeInMenuDelDia: true,
  }),
  drink('cafe-con-leche', 'Café con leche', 'Café e Infusiones', 2.0, {
    includedCoffeeInMenuDelDia: true,
  }),
  drink('cafe-americano', 'Café americano', 'Café e Infusiones', 2.0),
  drink('carajillo-conac', 'Carajillo de coñac', 'Café e Infusiones', 2.9),
  drink('carajillo-baileys', 'Carajillo de Baileys', 'Café e Infusiones', 3.0),
  drink('carajillo-whisky', 'Carajillo de whisky', 'Café e Infusiones', 3.0),
  drink('trifasico', 'Trifásico', 'Café e Infusiones', 3.0),
  drink('te-japones', 'Té japonés', 'Café e Infusiones', 3.5),
  drink('infusiones', 'Infusiones', 'Café e Infusiones', 2.8),

  // --- Cócteles ---
  drink('mojito-clasico', 'Mojito clásico', 'Cócteles', 7.95),
  drink('mojito-fresa', 'Mojito fresa', 'Cócteles', 7.95),
  drink('mojito-maracuya', 'Mojito maracuyá', 'Cócteles', 7.95),
  drink('tequila-sunrise', 'Tequila sunrise', 'Cócteles', 7.95),
  drink('daiquiri-clasico', 'Daiquiri clásico', 'Cócteles', 7.95),
  drink('daiquiri-fresa', 'Daiquiri fresa', 'Cócteles', 7.95),
  drink('aperol-spritz', 'Aperol spritz', 'Cócteles', 7.95),

  // --- Sangría y Sake ---
  drink('sangria-vino', 'Sangría de vino', 'Sangría y Sake', 15.95),
  drink('sangria-cava', 'Sangría de cava', 'Sangría y Sake', 17.95),
  drink('jarra-sake', 'Jarra de sake', 'Sangría y Sake', 3.95, {
    excludedFromMenuDelDia: true,
    description: 'Sangría y Sake · Excluida en Menú del Día',
  }),

  // --- Vinos Blancos ---
  drink('copa-vino-blanco-seco', 'Copa vino Blanco de la Casa - Seco', 'Vinos Blancos', 3.5),
  drink('copa-vino-blanco-semidulce', 'Copa vino Blanco de la Casa - Semidulce', 'Vinos Blancos', 3.5),
  drink('vino-blanco-seco', 'Vino Blanco de la Casa - Seco', 'Vinos Blancos', 10.95),
  drink('vino-blanco-semidulce', 'Vino Blanco de la Casa - Semidulce', 'Vinos Blancos', 10.95),
  drink('blanc-pescador', 'Blanc Pescador (Catalunya)', 'Vinos Blancos', 11.95),
  drink('albada-calatayud', 'Albada (Calatayud)', 'Vinos Blancos', 12.95),
  drink('vinas-del-vero-blanco', 'Viñas del Vero blanco (Somontano)', 'Vinos Blancos', 13.95),
  drink('valdubon-verdejo', 'Valdubón - Verdejo', 'Vinos Blancos', 13.95),
  drink('gilda-verdejo', 'Gilda - Verdejo (Rueda)', 'Vinos Blancos', 14.95),
  drink('apertas-godello', 'Apertas - Godello (Monterrei)', 'Vinos Blancos', 15.95),
  drink('bicos-albarino', 'Bicos - Albariño (Rías Baixas)', 'Vinos Blancos', 16.95),
  drink('sommos-gewurztraminer', 'Sommos - Gewürztraminer (Somontano)', 'Vinos Blancos', 17.95),
  drink('jose-pariente-verdejo', 'José Pariente - Verdejo (Rueda)', 'Vinos Blancos', 18.95),
  drink('el-perro-verde', 'El Perro Verde (Rueda)', 'Vinos Blancos', 19.95),

  // --- Vinos Tintos ---
  drink('copa-vino-tinto', 'Copa vino tinto de la casa', 'Vinos Tintos', 3.5),
  drink('tinto-de-verano', 'Tinto de verano', 'Vinos Tintos', 3.95),
  drink('vino-tinto-casa', 'Vino tinto de la casa', 'Vinos Tintos', 10.95),
  drink('care-roble', 'Care roble (Cariñena)', 'Vinos Tintos', 12.95),
  drink('3404-somontano', '3404 (Somontano)', 'Vinos Tintos', 13.95),
  drink('valdubon-roble', 'Valdubón - Roble', 'Vinos Tintos', 15.95),
  drink('finca-resalso', 'Finca Resalso (Ribera del Duero)', 'Vinos Tintos', 16.95),
  drink('marques-caceres-crianza', 'Marqués de Cáceres - Crianza (Rioja)', 'Vinos Tintos', 16.95),
  drink('ramon-bilbao-crianza', 'Ramón Bilbao - Crianza (Rioja)', 'Vinos Tintos', 16.95),
  drink('sierra-cantabria', 'Sierra Cantabria (Rioja)', 'Vinos Tintos', 16.95),
  drink('cruz-de-piedra', 'Cruz de Piedra (Calatayud)', 'Vinos Tintos', 17.95),

  // --- Vinos Rosados ---
  drink('copa-vino-rosado', 'Copa vino rosado de la casa', 'Vinos Rosados', 3.5),
  drink('vino-rosado-casa', 'Vino rosado de la casa', 'Vinos Rosados', 10.95),
  drink('lambrusco', 'Lambrusco', 'Vinos Rosados', 10.95),
  drink('cresta-rosa-aguja', 'Cresta Rosa Aguja', 'Vinos Rosados', 12.95),
  drink('mateus-rose', 'Mateus Rosé', 'Vinos Rosados', 12.95),
  drink('glarima-somontano', 'Glárima (Somontano)', 'Vinos Rosados', 12.95),
  drink('lazan-somontano', 'Lazán (Somontano)', 'Vinos Rosados', 12.95),

  // --- Cavas ---
  drink('visiega-brut-nature', 'Visiega brut nature', 'Cavas', 11.95),
  drink('reyes-aragon-brut', 'Reyes de Aragón brut', 'Cavas', 15.95),
  drink('anna-de-codorniu', 'Anna de Codorniu', 'Cavas', 17.95),
  drink('agusti-torello', 'Agustí Torelló selec. sumiller', 'Cavas', 17.95),
];

export const MENU_BY_ID: Record<string, DishItem> = Object.fromEntries(
  MENU_ITEMS.map((item) => [item.id, item])
);
