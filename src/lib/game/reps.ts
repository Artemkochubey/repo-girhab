import { exerciseById, type RepSpec } from './muscles';

/**
 * Повторы нельзя накрутить, но жёсткого потолка нет: цена каждого следующего очка падает.
 * По упражнению: до soft повторов полная цена, до hard половина, дальше четверть.
 * За весь день (все упражнения вместе): первые DAY_FULL очков по полной цене, до DAY_HALF половина, дальше четверть.
 */
export const REP_TAIL = 0.25;
export const DAY_FULL = 40;
export const DAY_HALF = 80;

export function repPoints(spec: RepSpec, n: number): number {
  const full = Math.min(n, spec.soft);
  const half = Math.max(0, Math.min(n, spec.hard) - spec.soft);
  const tail = Math.max(0, n - spec.hard);
  return spec.pts * (full + 0.5 * half + REP_TAIL * tail);
}

/** Очки за день с учётом убывающей отдачи: x — сумма очков по упражнениям до дневной кривой. */
export const dayCurve = (x: number): number =>
  x <= DAY_FULL ? x : x <= DAY_HALF ? DAY_FULL + (x - DAY_FULL) * 0.5 : DAY_FULL + (DAY_HALF - DAY_FULL) * 0.5 + (x - DAY_HALF) * REP_TAIL;

export interface AllocInput { id: number; date: string; minutes: number; exercise?: string | null; reps?: number | null }
export type Allocated<T> = T & { eq: number };

const round2 = (x: number) => Math.round(x * 100) / 100;

/**
 * «Эквивалент минут» (он же очки до бонусов) для каждой записи.
 * Минутные записи считаются как есть. Повторы — по ставке упражнения с убывающей ценой по упражнению и по дню;
 * порядок записей внутри дня — по id, поэтому позже добавленное дешевле.
 */
export function allocateWorkouts<T extends AllocInput>(entries: T[]): Allocated<T>[] {
  const sorted = [...entries].sort((a, b) => (a.date === b.date ? a.id - b.id : a.date < b.date ? -1 : 1));
  const out = new Map<T, number>();
  let day = '';
  let dayRaw = 0;
  let perEx = new Map<string, number>();
  let perMin = new Map<string, number>();
  for (const e of sorted) {
    if (e.date !== day) { day = e.date; dayRaw = 0; perEx = new Map(); perMin = new Map(); }
    // минутные тренировки с особой ценой (прогулка): очки за минуту и потолок минут в день
    const ms = !e.reps ? exerciseById(e.exercise)?.minute : undefined;
    if (ms) {
      const used = perMin.get(e.exercise!) ?? 0;
      const counted = Math.max(0, Math.min(e.minutes, ms.dayCap - used));
      perMin.set(e.exercise!, used + e.minutes);
      out.set(e, round2(counted * ms.rate));
      continue;
    }
    const spec = e.reps ? exerciseById(e.exercise)?.rep : undefined;
    if (!e.reps || !spec) { out.set(e, e.minutes); continue; }
    const cum = perEx.get(e.exercise!) ?? 0;
    const gain = repPoints(spec, cum + e.reps) - repPoints(spec, cum);
    const before = dayCurve(dayRaw);
    dayRaw += gain;
    perEx.set(e.exercise!, cum + e.reps);
    out.set(e, round2(dayCurve(dayRaw) - before));
  }
  return entries.map((e) => ({ ...e, eq: out.get(e) ?? e.minutes }));
}

/**
 * Сколько стоит следующий повтор сейчас (в очках и в % от полной цены) по записям одного дня.
 * Нужно для подсказки на экране «Тело и здоровье».
 */
export function nextRepPrice(todays: { id: number; exercise?: string | null; reps?: number | null }[], exercise: string): { perRep: number; percent: number; dayPoints: number } | null {
  const spec = exerciseById(exercise)?.rep;
  if (!spec) return null;
  const res = allocateWorkouts(todays.filter((t) => t.reps).map((t) => ({ ...t, date: 'd', minutes: 0 })));
  const dayPoints = res.reduce((a, x) => a + x.eq, 0);
  // полная цена повтора с учётом сделанного: повторы упражнения и сумма по дню до кривой
  const cum = res.filter((x) => x.exercise === exercise).reduce((a, x) => a + (x.reps ?? 0), 0);
  let dayRaw = 0; const seen = new Map<string, number>();
  for (const x of res) { const sp = exerciseById(x.exercise)?.rep; if (!sp) continue; const c = seen.get(x.exercise!) ?? 0; dayRaw += repPoints(sp, c + (x.reps ?? 0)) - repPoints(sp, c); seen.set(x.exercise!, c + (x.reps ?? 0)); }
  const gain = repPoints(spec, cum + 1) - repPoints(spec, cum);
  const perRep = dayCurve(dayRaw + gain) - dayCurve(dayRaw);
  return { perRep, percent: Math.round((perRep / spec.pts) * 100), dayPoints };
}
