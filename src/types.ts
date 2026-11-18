export type MenuCategory =
  | 'Entrantes'
  | 'Poke'
  | 'Gunkan'
  | 'Especiales'
  | 'Onigiri'
  | 'Sushi Mixto'
  | 'Sashimi'
  | 'Nigiri'
  | 'Donburi'
  | 'Temaki'
  | 'Futomaki'
  | 'Hosomaki'
  | 'Uramaki'
  | 'Fritos'
  | 'Teppanyaki'
  | 'Sopas'
  | 'Vapores'
  | 'Bao'
  | 'Arroz'
  | 'Fideos'
  | 'Variado'
  | 'Postres'
  | 'Bebidas';

export type ItemKind = 'food' | 'dessert' | 'drink';

export type CounterType = 'piezas' | 'platos' | 'bebidas';

export type DinerRole = 'anfitrion' | 'invitado';

export interface DishItem {
  id: string;
  /** Official PDF dish number (e.g., 1, 150, 301), or null for unnumbered beverages */
  number: number | null;
  name: string;
  description: string;
  category: MenuCategory;
  subCategory?: string;
  kind: ItemKind;
  /** Separated tracker mode: individual sushi/bite pieces vs whole plates/bowls */
  tipoContador: CounterType;
  /** Estimated a la carte price in euros */
  valorCartaEstimado: number;
  /** True for salads, edamame, sautéed greens, or strictly vegetarian/avocado sushi */
  isGreenDish?: boolean;
  /** Number of pieces per serving (1 if single bowl/plate/ración) */
  pieces: number;
  /** True when PDF lists a bowl/plate rather than discrete counted pieces */
  isPortionUnit: boolean;
  /** Supplement in euros (+1 or +2) for Infinity / Menú del Día */
  supplement: number;
  /** Individual menu price in euros (for Postres & Bebidas) */
  price: number | null;
  /** True if marked "1 RACIÓN POR PERSONA" in the official PDF */
  limitOnePerPerson: boolean;
  /** Allergen numbers 1..15 from page 4 */
  allergens: number[];
  /** Special PDF flags for Menú del Día */
  excludedFromMenuDelDia?: boolean;
  includedCoffeeInMenuDelDia?: boolean;
  isGlutenFree?: boolean;
}

export type MenuType =
  | 'infinity_adulto'
  | 'infinity_infantil'
  | 'menu_del_dia'
  | 'carta';

export interface Diner {
  id: string;
  name: string;
  color: string;
  menuType: MenuType;
  role: DinerRole;
  allergies: number[];
}

export interface OrderLine {
  id: string;
  dishId: string;
  roundNumber: number;
  /** Quantity of servings/portions ordered on this line */
  quantity: number;
  /** Diner IDs who ordered/share this line */
  assignedDinerIds: string[];
  /** True if marked as "Para compartir" across selected/all diners */
  isShared: boolean;
  /** Amount eaten per dinerId: integer pieces for 'piezas', plate fraction (e.g. 0.5, 1) for 'platos' */
  eatenByDiner: Record<string, number>;
  /** Optional unit price override (e.g. iced coffee +0.20€) */
  extraCharge?: number;
  note?: string;
  createdAt: number;
}

export interface AppState {
  diners: Diner[];
  /** Current round being prepared (draft) */
  currentRound: number;
  /** Lines in the current draft round (not yet sent to kitchen) */
  draftLines: OrderLine[];
  /** Lines already sent to kitchen / on the table */
  sentLines: OrderLine[];
}

export interface RoomState extends AppState {
  code: string;
  hostDinerId: string;
  createdAt: number;
  updatedAt: number;
}

export interface RoomSession {
  roomCode: string;
  dinerId: string;
}

export type TabId = 'mesa' | 'carta' | 'en_mesa' | 'usuarios' | 'cuenta';
