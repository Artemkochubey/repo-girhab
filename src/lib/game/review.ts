import { exerciseById } from './muscles';

/**
 * Метка «🔎 проверить»: ничего не блокирует и не режет очки, только подсказывает родителю, какие дни стоит глянуть.
 * Правила намеренно грубые: лучше пропустить спорный день, чем обидеть честного ребёнка.
 */
export const REVIEW = { bigFactor: 1.5, growth: 1.5, nearMax: 0.9, manySets: 12, longDayMinutes: 240, longSingleMinutes: 180 } as const;

export interface ReviewEntry { id: number; minutes: number; reps: number | null; exercise: string | null }
export interface ReviewInput {
  points: number;            // очки дня с бонусами
  superGoal: number;
  prevPoints: number[];      // очки предыдущих дней (до 14)
  workouts: ReviewEntry[];   // записи тренировок этого дня
}

export function reviewDay(i: ReviewInput): string[] {
  const out: string[] = [];
  const prevMean = i.prevPoints.length ? i.prevPoints.reduce((a, b) => a + b, 0) / i.prevPoints.length : 0;
  if (i.points >= i.superGoal * REVIEW.bigFactor && (prevMean === 0 || i.points >= prevMean * REVIEW.growth))
    out.push(`День сильно выше обычного: ${Math.round(i.points)} оч. (супер-норма ${i.superGoal}${prevMean ? `, обычно около ${Math.round(prevMean)}` : ''})`);

  const near = i.workouts.filter((w) => {
    const spec = w.reps ? exerciseById(w.exercise)?.rep : undefined;
    return spec && (w.reps as number) >= spec.max * REVIEW.nearMax;
  });
  if (near.length) {
    const w = near[0];
    out.push(`Подход близок к максимуму: ${w.reps} раз («${exerciseById(w.exercise)!.name}»)${near.length > 1 ? `, таких подходов ${near.length}` : ''}`);
  }
  const sets = i.workouts.filter((w) => w.reps).length;
  if (sets >= REVIEW.manySets) out.push(`Много подходов за день: ${sets}`);
  const minutes = i.workouts.filter((w) => !w.reps).reduce((a, w) => a + w.minutes, 0);
  const single = Math.max(0, ...i.workouts.filter((w) => !w.reps).map((w) => w.minutes));
  if (minutes >= REVIEW.longDayMinutes || single >= REVIEW.longSingleMinutes) out.push(`Очень длинная тренировка: ${minutes} мин за день`);
  return out;
}

/** Скрыта ли метка: родитель уже посмотрел день, и очки с тех пор почти не выросли. */
export const reviewHidden = (points: number, ok: { points: number } | undefined): boolean => !!ok && points <= ok.points * 1.1 + 1;
