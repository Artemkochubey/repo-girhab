/** XP, нужный для достижения уровня n (уровень 1 = 0 XP). */
export const xpNeed = (n: number): number => 25 * (n - 1) * n;

/** Максимальный n, для которого xpNeed(n) <= xp. */
export function levelFromXp(xp: number): number {
  if (xp <= 0) return 1;
  let n = Math.floor((1 + Math.sqrt(1 + (4 * xp) / 25)) / 2);
  while (xpNeed(n + 1) <= xp) n++;
  while (n > 1 && xpNeed(n) > xp) n--;
  return n;
}

/** Прогресс внутри уровня: 0..1. */
export function levelProgress(xp: number): { level: number; into: number; span: number; ratio: number } {
  const level = levelFromXp(xp);
  const into = xp - xpNeed(level);
  const span = xpNeed(level + 1) - xpNeed(level);
  return { level, into, span, ratio: span ? into / span : 0 };
}

/** 1 очко таланта за каждый уровень (со 2-го). */
export const talentPointsTotal = (level: number): number => level - 1;

/** Сундуки: (уровень-1) + дни со всеми квестами + сундуки за боссов. */
export const chestsEarned = (level: number, questDays: number, bossChests: number): number =>
  Math.max(0, level - 1) + questDays + bossChests;
