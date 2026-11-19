import { exerciseById, type RepSpec } from './muscles';

/** Потолок очков за повторы в сутки (всё вместе), чтобы счёт повторов нельзя было накрутить. */
export const DAY_REP_CAP = 40;

/**
 * Очки за n повторов за день по одному упражнению:
 * до soft повторов — полная цена, от soft до hard — половина, дальше ничего.
 */
export function repPoints(spec: RepSpec, n: number): number {
  const full = Math.min(n, spec.soft);
  const half = Math.max(0, Math.min(n, spec.hard) - spec.soft);
  return spec.pts * (full + 0.5 * half);
}

/** Сколько очков можно получить по упражнению за день, если выполнить максимум. */
export const maxRepPoints = (spec: RepSpec) => repPoints(spec, spec.hard);

export interface AllocInput { id: number; date: string; minutes: number; exercise?: string | null; reps?: number | null }
export type Allocated<T> = T & { eq: number };

const round2 = (x: number) => Math.round(x * 100) / 100;

/**
 * «Эквивалент минут» (он же очки до бонусов) для каждой записи.
 * Минутные записи считаются как есть. Повторы — по ставке упражнения, с потолками за упражнение и за день;
 * порядок записей внутри дня — по id, поэтому позже добавленное упирается в потолок первым.
 */
export function allocateWorkouts<T extends AllocInput>(entries: T[]): Allocated<T>[] {
  const sorted = [...entries].sort((a, b) => (a.date === b.date ? a.id - b.id : a.date < b.date ? -1 : 1));
  const out = new Map<T, number>();
  let day = '';
  let dayTotal = 0;
  let perEx = new Map<string, number>();
  for (const e of sorted) {
    if (e.date !== day) { day = e.date; dayTotal = 0; perEx = new Map(); }
    const spec = e.reps ? exerciseById(e.exercise)?.rep : undefined;
    if (!e.reps || !spec) { out.set(e, e.minutes); continue; }
    const cum = perEx.get(e.exercise!) ?? 0;
    const gain = repPoints(spec, cum + e.reps) - repPoints(spec, cum);
    const got = Math.max(0, Math.min(gain, DAY_REP_CAP - dayTotal));
    perEx.set(e.exercise!, cum + e.reps);
    dayTotal += got;
    out.set(e, round2(got));
  }
  return entries.map((e) => ({ ...e, eq: out.get(e) ?? e.minutes }));
}
