/**
 * Кривая уровней: переход 1→2 стоит 50 XP, каждый следующий уровень в 1,5 раза дольше предыдущего.
 * Всего до уровня n нужно 100·(1,5^(n−1) − 1) XP.
 */
export const LEVEL_FIRST = 50;
export const LEVEL_GROWTH = 1.5;

/** XP, нужный для достижения уровня n (уровень 1 = 0 XP). */
export const xpNeed = (n: number): number =>
  n <= 1 ? 0 : Math.round((2 * LEVEL_FIRST) * (LEVEL_GROWTH ** (n - 1) - 1));

/** Максимальный n, для которого xpNeed(n) <= xp. */
export function levelFromXp(xp: number): number {
  if (!(xp > 0)) return 1;
  let n = Math.floor(Math.log(xp / (2 * LEVEL_FIRST) + 1) / Math.log(LEVEL_GROWTH)) + 1;
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
