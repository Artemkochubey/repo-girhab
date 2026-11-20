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

export function pickReward(
  rarity: Rarity,
  loot: { common: string[]; rare: string[]; legend: string[] },
  r: number,
): string {
  const list = loot[rarity].length ? loot[rarity] : loot.common;
  if (!list.length) return '—';
  return list[Math.min(list.length - 1, Math.floor(r * list.length))];
}
