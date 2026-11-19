export type Rarity = 'common' | 'rare' | 'legend';

/** r — число [0,1): 5% легендарный, 25% редкий, иначе обычный. Удача талантов увеличивает шансы. */
export function rollRarity(r: number, luck: { legend?: number; rare?: number } = {}): Rarity {
  const legend = 0.05 + (luck.legend ?? 0);
  const rare = 0.25 + (luck.rare ?? 0);
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
