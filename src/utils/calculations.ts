import { MENU_BY_ID, MENU_TYPES } from '../data/menu';
import { Diner, DishItem, MenuCategory, OrderLine } from '../types';

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export function formatEuros(value: number): string {
  return (
    value.toLocaleString('es-ES', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }) + ' €'
  );
}

export function formatCount(value: number): string {
  const rounded = round2(value);
  if (Number.isInteger(rounded)) return String(rounded);
  return rounded.toLocaleString('es-ES', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function getLineTotalUnits(line: OrderLine): number {
  const dish = MENU_BY_ID[line.dishId];
  if (!dish) return 0;
  if (dish.tipoContador === 'piezas') {
    return dish.pieces * line.quantity;
  }
  return line.quantity;
}

export function getLineEatenUnits(line: OrderLine): number {
  const sum = Object.values(line.eatenByDiner).reduce(
    (acc, n) => acc + (n || 0),
    0
  );
  return round2(sum);
}

export function getLineRemainingUnits(line: OrderLine): number {
  return Math.max(0, round2(getLineTotalUnits(line) - getLineEatenUnits(line)));
}

/**
 * Counts food portions assigned to a diner in the current draft round.
 * Shared dishes divide equally among participating diners.
 */
export function getDinerRoundFoodLoad(
  dinerId: string,
  lines: OrderLine[]
): number {
  let total = 0;
  for (const line of lines) {
    const dish = MENU_BY_ID[line.dishId];
    if (!dish || dish.kind !== 'food') continue;
    if (line.assignedDinerIds.includes(dinerId)) {
      const share = line.assignedDinerIds.length || 1;
      total += line.quantity / share;
    }
  }
  return round2(total);
}

/**
 * Counts how many times a specific dish was ordered by/for a diner across all rounds.
 * Used to enforce "1 RACIÓN POR PERSONA" dishes (#32, #33).
 */
export function getDinerDishParticipationCount(
  dinerId: string,
  dishId: string,
  allLines: OrderLine[]
): number {
  let count = 0;
  for (const line of allLines) {
    if (line.dishId !== dishId) continue;
    if (line.assignedDinerIds.includes(dinerId)) {
      const share = line.assignedDinerIds.length || 1;
      count += line.quantity / share;
    }
  }
  return round2(count);
}

/**
 * Counts total food dishes across all rounds for Menú del Día (4 platos limit).
 */
export function getDinerTotalFoodLoad(
  dinerId: string,
  allLines: OrderLine[]
): number {
  let total = 0;
  for (const line of allLines) {
    const dish = MENU_BY_ID[line.dishId];
    if (!dish || dish.kind !== 'food') continue;
    if (line.assignedDinerIds.includes(dinerId)) {
      const share = line.assignedDinerIds.length || 1;
      total += line.quantity / share;
    }
  }
  return round2(total);
}

export function getDinerDrinkCount(
  dinerId: string,
  allLines: OrderLine[]
): number {
  let count = 0;
  for (const line of allLines) {
    const dish = MENU_BY_ID[line.dishId];
    if (!dish || dish.kind !== 'drink') continue;
    if (line.assignedDinerIds.includes(dinerId)) {
      count += line.quantity;
    }
  }
  return count;
}

export interface UnconsumedTableStats {
  unconsumedSushiPieces: number;
  unconsumedWholePlates: number;
  incompleteFoodDishes: number;
  potentialPenaltyEuros: number;
  unconsumedItemsCount: number;
}

export function getTableUnconsumedStats(
  sentLines: OrderLine[]
): UnconsumedTableStats {
  let unconsumedSushiPieces = 0;
  let unconsumedWholePlates = 0;
  let incompleteFoodDishes = 0;
  let unconsumedItemsCount = 0;

  for (const line of sentLines) {
    const dish = MENU_BY_ID[line.dishId];
    if (!dish) continue;
    const rem = getLineRemainingUnits(line);
    if (rem <= 0.01) continue;

    unconsumedItemsCount += 1;
    if (dish.kind === 'food') {
      if (dish.tipoContador === 'piezas') {
        unconsumedSushiPieces += Math.round(rem);
        incompleteFoodDishes += Math.ceil(rem / Math.max(1, dish.pieces));
      } else {
        unconsumedWholePlates = round2(unconsumedWholePlates + rem);
        incompleteFoodDishes += Math.ceil(rem);
      }
    }
  }

  return {
    unconsumedSushiPieces,
    unconsumedWholePlates,
    incompleteFoodDishes,
    potentialPenaltyEuros: incompleteFoodDishes * 2,
    unconsumedItemsCount,
  };
}

export interface DinerSummary {
  diner: Diner;
  /** Individual sushi/bite pieces eaten (tipoContador === 'piezas') */
  piecesEaten: number;
  /** Whole plates/bowls/desserts eaten (tipoContador === 'platos') */
  wholePlatesEaten: number;
  /** Combined units for legacy/overview */
  dishesOrdered: number;
  topCategory: MenuCategory | null;
  categoryUnits: Partial<Record<MenuCategory, number>>;
  drinksCount: number;
  dessertsCount: number;
  baseMenuPrice: number;
  supplementsTotal: number;
  drinksTotal: number;
  dessertsTotal: number;
  includedSavings: number;
  totalBill: number;
  missingMandatoryDrink: boolean;
  /** Estimated a la carte value of food eaten (pieces + whole food plates) */
  buffetValueConsumed: number;
  /** Estimated a la carte value of pieces eaten specifically */
  piecesValueConsumed: number;
  /** Estimated a la carte value of whole plates eaten specifically */
  platesValueConsumed: number;
  /** Cost of menu + supplements */
  buffetCost: number;
  /** buffetValueConsumed - buffetCost */
  profitabilityDelta: number;
  /** Percentage of buffet amortized (0..N%) */
  profitabilityPct: number;
  /** Average cost per consumed bite/piece */
  avgCostPerBite: number;
  /** True if diner ordered or ate any salad/edamame/green dish */
  hasGreenPenalty: boolean;
}

function isEligibleMenuDelDiaDrink(dish: DishItem): boolean {
  if (dish.kind !== 'drink') return false;
  if (dish.excludedFromMenuDelDia) return false;
  if (dish.includedCoffeeInMenuDelDia) return false;
  return (
    dish.subCategory === 'Refrescos y Cervezas' ||
    dish.name.startsWith('Copa vino') ||
    dish.name === 'Tinto de verano'
  );
}

export function getLineUnitConsumedValue(dish: DishItem, amount: number): number {
  if (amount <= 0) return 0;
  if (dish.tipoContador === 'piezas') {
    return (amount / Math.max(1, dish.pieces)) * dish.valorCartaEstimado;
  }
  return amount * dish.valorCartaEstimado;
}

export function calculateDinerSummaries(
  diners: Diner[],
  sentLines: OrderLine[],
  draftLines: OrderLine[] = []
): DinerSummary[] {
  const allOrderedLines = [...sentLines, ...draftLines];

  return diners.map((diner) => {
    const menuInfo = MENU_TYPES[diner.menuType];
    const baseMenuPrice = menuInfo.basePrice;

    let piecesEaten = 0;
    let wholePlatesEaten = 0;
    let dishesOrdered = 0;
    let drinksCount = 0;
    let dessertsCount = 0;
    let supplementsTotal = 0;
    let drinksTotal = 0;
    let dessertsTotal = 0;
    let includedSavings = 0;
    let piecesValueConsumed = 0;
    let platesValueConsumed = 0;
    let buffetValueConsumed = 0;
    let hasGreenPenalty = false;

    let menuDelDiaDrinkUsed = false;
    let menuDelDiaCoffeeUsed = false;

    const categoryUnits: Partial<Record<MenuCategory, number>> = {};

    // Check green dishes in draft or sent lines
    for (const line of allOrderedLines) {
      const dish = MENU_BY_ID[line.dishId];
      if (!dish || !dish.isGreenDish) continue;
      if (
        line.assignedDinerIds.includes(diner.id) ||
        (line.eatenByDiner[diner.id] ?? 0) > 0
      ) {
        hasGreenPenalty = true;
      }
    }

    // Consumption & Economic Value from sentLines
    for (const line of sentLines) {
      const dish = MENU_BY_ID[line.dishId];
      if (!dish) continue;
      const eaten = line.eatenByDiner[diner.id] ?? 0;
      if (eaten <= 0) continue;

      if (dish.tipoContador === 'piezas') {
        piecesEaten += eaten;
        const val = getLineUnitConsumedValue(dish, eaten);
        piecesValueConsumed += val;
        if (dish.kind === 'food') {
          buffetValueConsumed += val;
        }
        categoryUnits[dish.category] =
          (categoryUnits[dish.category] ?? 0) + eaten;
      } else if (dish.tipoContador === 'platos') {
        wholePlatesEaten += eaten;
        const val = getLineUnitConsumedValue(dish, eaten);
        platesValueConsumed += val;
        if (dish.kind === 'food') {
          buffetValueConsumed += val;
        }
        categoryUnits[dish.category] = round2(
          (categoryUnits[dish.category] ?? 0) + eaten
        );
      }
    }

    // Billing & ordered counts from sentLines
    for (const line of sentLines) {
      const dish = MENU_BY_ID[line.dishId];
      if (!dish) continue;
      if (!line.assignedDinerIds.includes(diner.id)) continue;

      const shareCount = Math.max(1, line.assignedDinerIds.length);
      const shareRatio = 1 / shareCount;

      if (dish.kind === 'food') {
        dishesOrdered += line.quantity * shareRatio;
        if (dish.supplement > 0) {
          supplementsTotal += dish.supplement * line.quantity * shareRatio;
        }
      } else if (dish.kind === 'dessert') {
        dessertsCount += line.quantity * shareRatio;
        const unitPrice = dish.price ?? 0;
        dessertsTotal += unitPrice * line.quantity * shareRatio;
      } else if (dish.kind === 'drink') {
        drinksCount += line.quantity * shareRatio;
        const unitPrice = (dish.price ?? 0) + (line.extraCharge ?? 0);

        if (diner.menuType === 'menu_del_dia' && shareCount === 1) {
          let lineCost = 0;
          for (let i = 0; i < line.quantity; i++) {
            if (!menuDelDiaDrinkUsed && isEligibleMenuDelDiaDrink(dish)) {
              menuDelDiaDrinkUsed = true;
              includedSavings += unitPrice;
            } else if (
              !menuDelDiaCoffeeUsed &&
              dish.includedCoffeeInMenuDelDia
            ) {
              menuDelDiaCoffeeUsed = true;
              includedSavings += unitPrice;
            } else {
              lineCost += unitPrice;
            }
          }
          drinksTotal += lineCost;
        } else {
          drinksTotal += unitPrice * line.quantity * shareRatio;
        }
      }
    }

    // Determine top category
    let topCategory: MenuCategory | null = null;
    let maxVal = 0;
    for (const [cat, count] of Object.entries(categoryUnits) as [
      MenuCategory,
      number,
    ][]) {
      if (count > maxVal) {
        maxVal = count;
        topCategory = cat;
      }
    }

    const totalDrinkParticipation = getDinerDrinkCount(diner.id, allOrderedLines);
    const isInfinity =
      diner.menuType === 'infinity_adulto' ||
      diner.menuType === 'infinity_infantil';

    const buffetCost = round2(baseMenuPrice + supplementsTotal);
    const roundedBuffetValue = round2(buffetValueConsumed);
    const profitabilityDelta = round2(roundedBuffetValue - buffetCost);
    const profitabilityPct =
      buffetCost > 0
        ? Math.round((roundedBuffetValue / buffetCost) * 100)
        : 0;

    const totalBites = piecesEaten + wholePlatesEaten;
    const avgCostPerBite =
      totalBites > 0 && buffetCost > 0 ? round2(buffetCost / totalBites) : 0;

    const totalBill = round2(
      baseMenuPrice + supplementsTotal + drinksTotal + dessertsTotal
    );

    return {
      diner,
      piecesEaten: Math.round(piecesEaten),
      wholePlatesEaten: round2(wholePlatesEaten),
      dishesOrdered: round2(dishesOrdered),
      topCategory,
      categoryUnits,
      drinksCount: round2(drinksCount),
      dessertsCount: round2(dessertsCount),
      baseMenuPrice: round2(baseMenuPrice),
      supplementsTotal: round2(supplementsTotal),
      drinksTotal: round2(drinksTotal),
      dessertsTotal: round2(dessertsTotal),
      includedSavings: round2(includedSavings),
      totalBill,
      missingMandatoryDrink: isInfinity && totalDrinkParticipation === 0,
      buffetValueConsumed: roundedBuffetValue,
      piecesValueConsumed: round2(piecesValueConsumed),
      platesValueConsumed: round2(platesValueConsumed),
      buffetCost,
      profitabilityDelta,
      profitabilityPct,
      avgCostPerBite,
      hasGreenPenalty,
    };
  });
}

export function buildWhatsAppSummary(
  summaries: DinerSummary[],
  sentLines: OrderLine[]
): string {
  const byProfit = [...summaries].sort(
    (a, b) => b.profitabilityDelta - a.profitabilityDelta
  );
  const byPieces = [...summaries].sort((a, b) => b.piecesEaten - a.piecesEaten);
  const byPlates = [...summaries].sort(
    (a, b) => b.wholePlatesEaten - a.wholePlatesEaten
  );

  const totalPieces = summaries.reduce((acc, s) => acc + s.piecesEaten, 0);
  const totalPlates = round2(
    summaries.reduce((acc, s) => acc + s.wholePlatesEaten, 0)
  );
  const totalBill = summaries.reduce((acc, s) => acc + s.totalBill, 0);
  const unconsumed = getTableUnconsumedStats(sentLines);

  const lines: string[] = [];
  lines.push('🍣 *SUSHISOM TRACKER · Resumen Final de la Mesa*');
  lines.push(
    `👥 ${summaries.length} comensales · 🍣 ${totalPieces} piezas · 🍜 ${formatCount(totalPlates)} platos · 💶 Total: *${formatEuros(totalBill)}*`
  );
  lines.push('');

  if (byProfit.length > 0) {
    lines.push('🏆 *Podio de la Mesa*');
    if (byProfit[0].buffetCost > 0) {
      const sign = byProfit[0].profitabilityDelta >= 0 ? '+' : '';
      lines.push(
        `💰 Mayor rentabilidad: *${byProfit[0].diner.name}* (${sign}${formatEuros(byProfit[0].profitabilityDelta)} · ${byProfit[0].profitabilityPct}%)`
      );
    }
    if (byPieces[0]) {
      lines.push(
        `🍣 Récord piezas sushi: *${byPieces[0].diner.name}* (${byPieces[0].piecesEaten} pzs)`
      );
    }
    if (byPlates[0] && byPlates[0].wholePlatesEaten > 0) {
      lines.push(
        `🍜 Récord platos enteros: *${byPlates[0].diner.name}* (${formatCount(byPlates[0].wholePlatesEaten)} platos)`
      );
    }
    lines.push('');
  }

  lines.push('📊 *Rentabilidad y Consumo por Amigo*');
  byPieces.forEach((s, idx) => {
    const medal =
      idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `${idx + 1}.`;
    const profitText =
      s.buffetCost > 0
        ? s.profitabilityDelta >= 0
          ? `+${formatEuros(s.profitabilityDelta)} gratis (${s.profitabilityPct}%)`
          : `Faltan ${formatEuros(Math.abs(s.profitabilityDelta))} (${s.profitabilityPct}%)`
        : `Valor carta ${formatEuros(s.buffetValueConsumed)}`;
    const green = s.hasGreenPenalty ? ' 🥗' : '';
    lines.push(
      `${medal} *${s.diner.name}*${green}: ${s.piecesEaten} pzs + ${formatCount(s.wholePlatesEaten)} platos · ${profitText}`
    );
  });

  lines.push('');
  lines.push('🧾 *Cuenta por Persona*');
  summaries.forEach((s) => {
    const parts: string[] = [];
    if (s.baseMenuPrice > 0) {
      parts.push(`Menú ${formatEuros(s.baseMenuPrice)}`);
    } else {
      parts.push('Carta');
    }
    if (s.supplementsTotal > 0) parts.push(`Supl. ${formatEuros(s.supplementsTotal)}`);
    if (s.drinksTotal > 0) parts.push(`Beb. ${formatEuros(s.drinksTotal)}`);
    if (s.dessertsTotal > 0) parts.push(`Postres ${formatEuros(s.dessertsTotal)}`);

    lines.push(
      `• *${s.diner.name}*: *${formatEuros(s.totalBill)}* (${parts.join(' + ')})`
    );
  });

  if (unconsumed.incompleteFoodDishes > 0) {
    lines.push('');
    lines.push(
      `⚠️ Quedan sin comer: ${unconsumed.unconsumedSushiPieces} pzs y ${formatCount(unconsumed.unconsumedWholePlates)} platos (${unconsumed.incompleteFoodDishes} raciones · posible penalización ${formatEuros(unconsumed.potentialPenaltyEuros)})`
    );
  }

  return lines.join('\n');
}
