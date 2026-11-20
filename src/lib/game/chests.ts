export type Rarity = 'common' | 'rare' | 'legend';

/** Базовые шансы сундука: 2% легендарный, 18% редкий, остальные 80% обычные. Таланты удачи прибавляют к шансам. */
export const BASE_CHANCE = { legend: 0.02, rare: 0.18 } as const;

/** r — число [0,1). Удача талантов увеличивает шансы. */
export function rollRarity(r: number, luck: { legend?: number; rare?: number } = {}): Rarity {
  const legend = BASE_CHANCE.legend + (luck.legend ?? 0);
  const rare = BASE_CHANCE.rare + (luck.rare ?? 0);
  if (r < legend) return 'legend';
  if (r < legend + rare) return 'rare';
  return 'common';
}

/** Гарантии: редкий или лучше не реже чем раз в 10 сундуков, легендарный не реже чем раз в 35. */
export const PITY = { rare: 10, legend: 35 } as const;
/** Сундук за победу над боссом: не ниже редкого, легендарный с шансом 10%. */
export const BOSS_CHEST_LEGEND = 0.1;

/** Сколько сундуков подряд (с конца истории, старые первыми) выпало без редкого и без легендарного. */
export function pityCounters(history: Rarity[]): { sinceRare: number; sinceLegend: number } {
  let sinceRare = 0, sinceLegend = 0;
  for (const r of history) {
    sinceRare = r === 'common' ? sinceRare + 1 : 0;
    sinceLegend = r === 'legend' ? 0 : sinceLegend + 1;
  }
  return { sinceRare, sinceLegend };
}

export interface RollInput { sinceRare: number; sinceLegend: number; boss: boolean; luck?: { legend?: number; rare?: number } }
export interface RollResult { rarity: Rarity; why: 'boss' | 'pityLegend' | 'pityRare' | null }

/**
 * Редкость сундука с гарантиями. Порядок: гарантия легендарного, сундук за босса (не ниже редкого), гарантия редкого, обычный розыгрыш.
 * Сколько сундуков осталось до гарантий: PITY − 1 − счётчик.
 */
export function rollChest(r: number, i: RollInput): RollResult {
  if (i.sinceLegend >= PITY.legend - 1) return { rarity: 'legend', why: 'pityLegend' };
  if (i.boss) return { rarity: r < BOSS_CHEST_LEGEND + (i.luck?.legend ?? 0) ? 'legend' : 'rare', why: 'boss' };
  const rarity = rollRarity(r, i.luck);
  if (rarity === 'common' && i.sinceRare >= PITY.rare - 1) return { rarity: 'rare', why: 'pityRare' };
  return { rarity, why: null };
}

export function pickReward(
  rarity: Rarity,
  loot: { common: string[]; rare: string[]; legend: string[] },
  r: number,
): string {
  const list = loot[rarity].length ? loot[rarity] : loot.common;
  if (!list.length) return '—';
  return list[Math.min(list.length - 1, Math.floor(r * list.length))];
}
