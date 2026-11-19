import { CLASS_SPHERES, MAIN_BONUS, subBonus } from './classes';
import { talentById } from './talents';
import type { DayStats, HeroBuild, Sphere, StudyKind } from './types';

export const POINTS = { warmup: 10, habit: 5, habitCap: 6, book: 50 } as const;

const STUDY_KINDS: StudyKind[] = ['Книги', 'Языки', 'Учёба', 'Навыки', 'Творчество', 'Мышление'];

/** Множитель сферы: 1 + класс + подкласс + таланты. */
export function sphereMultiplier(sphere: Sphere, hero: HeroBuild, useSub = true): number {
  let m = 1;
  if (hero.cls && CLASS_SPHERES[hero.cls].includes(sphere)) m += MAIN_BONUS;
  if (useSub && hero.cls && hero.sub && hero.sub !== hero.cls && CLASS_SPHERES[hero.sub].includes(sphere)) m += subBonus(hero.level);
  for (const id of hero.talents) {
    const e = talentById(id)?.effect;
    if (e?.type === 'mult' && e.spheres.includes(sphere)) m += e.pct;
  }
  return m;
}

export interface DayBreakdown { bySphere: Partial<Record<Sphere, number>>; flat: number; quests: number; total: number }

/** Очки дня. streak — длина серии (для «Серийника»). */
export function dayPoints(d: DayStats, hero: HeroBuild, streak = 0, useSub = true): DayBreakdown {
  const bySphere: Partial<Record<Sphere, number>> = {};
  const add = (s: Sphere, base: number) => {
    if (base > 0) bySphere[s] = (bySphere[s] ?? 0) + base * sphereMultiplier(s, hero, useSub);
  };
  add('workout', d.workoutMinutes);
  add('warmup', Math.min(d.warmups, 1) * POINTS.warmup);
  for (const k of STUDY_KINDS) add(k, d.study[k] ?? 0);
  add('habits', Math.min(d.habits, POINTS.habitCap) * POINTS.habit);
  add('book', d.books * POINTS.book);

  let flat = 0;
  for (const id of hero.talents) {
    const e = talentById(id)?.effect;
    if (e?.type === 'flat' && e.when(d)) flat += e.bonus;
    if (e?.type === 'streak' && streak > 0) flat += Math.min(e.max, streak * e.perDay);
  }
  const sphereTotal = Object.values(bySphere).reduce((a, b) => a + (b ?? 0), 0);
  const total = Math.round(sphereTotal + flat + d.questXp);
  return { bySphere, flat, quests: d.questXp, total };
}

/** Серия: подряд идущие дни с очками >= minPoints (по базовым очкам). Щит прощает один пропуск за неделю. */
export function streakLength(
  dates: string[], active: (date: string) => boolean, shield: boolean,
): number {
  // dates — от сегодняшнего дня назад
  let streak = 0;
  let shieldUsedWeek: string | null = null;
  for (const date of dates) {
    if (active(date)) { streak++; continue; }
    if (streak === 0 && date === dates[0]) continue; // сегодня ещё может быть заполнен
    const week = isoWeekKey(date);
    if (shield && shieldUsedWeek !== week) { shieldUsedWeek = week; continue; }
    break;
  }
  return streak;
}

function isoWeekKey(date: string): string {
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

/** Очки без классов и талантов — основа для серий. */
export const basePoints = (d: DayStats): number =>
  d.workoutMinutes + Math.min(d.warmups, 1) * POINTS.warmup + Math.min(d.habits, POINTS.habitCap) * POINTS.habit +
  d.books * POINTS.book + Object.values(d.study).reduce((a, b) => a + (b ?? 0), 0);

/**
 * Длина серии на конец каждого дня (dates по возрастанию).
 * Пустой сегодняшний день серию не обрывает. Щит прощает один пропуск в неделю.
 */
export function streakForward(
  dates: string[], active: (date: string) => boolean, shield: boolean, today: string,
): Map<string, number> {
  const out = new Map<string, number>();
  let streak = 0;
  const shieldUsed = new Set<string>();
  for (const date of dates) {
    if (active(date)) streak++;
    else if (date === today) { /* день ещё идёт */ }
    else {
      const wk = isoWeekKey(date);
      if (shield && streak > 0 && !shieldUsed.has(wk)) shieldUsed.add(wk);
      else streak = 0;
    }
    out.set(date, streak);
  }
  return out;
}
