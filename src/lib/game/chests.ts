export type Rarity = 'common' | 'rare' | 'legend';

/** r — число [0,1): 5% легендарный, 25% редкий, иначе обычный. */
export function rollRarity(r: number): Rarity {
  if (r < 0.05) return 'legend';
  if (r < 0.3) return 'rare';
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
