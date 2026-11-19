import { describe, it, expect } from 'vitest';
import { reviewDay, reviewHidden } from './review';

const w = (id: number, o: Partial<{ minutes: number; reps: number | null; exercise: string | null }> = {}) => ({ id, minutes: 0, reps: null, exercise: null, ...o });
const base = { points: 70, superGoal: 100, prevPoints: [60, 70, 65], workouts: [] as ReturnType<typeof w>[] };

describe('метка «проверить»', () => {
  it('обычный день без меток', () => expect(reviewDay(base)).toEqual([]));
  it('день сильно выше супер-нормы и выше обычного', () => {
    expect(reviewDay({ ...base, points: 160 })).toHaveLength(1);
    expect(reviewDay({ ...base, points: 160, prevPoints: [150, 140, 160] })).toEqual([]);   // у него и так бывает много
    expect(reviewDay({ ...base, points: 160, prevPoints: [] })).toHaveLength(1);              // без истории достаточно первого условия
    expect(reviewDay({ ...base, points: 120 })).toEqual([]);                                  // ниже 1,5 супер-нормы
  });
  it('подход близок к максимуму', () => {
    const r = reviewDay({ ...base, workouts: [w(1, { exercise: 'pushups', reps: 95 })] });   // max 100
    expect(r[0]).toContain('Отжимания');
    expect(reviewDay({ ...base, workouts: [w(1, { exercise: 'pushups', reps: 50 })] })).toEqual([]);
  });
  it('много подходов и слишком длинная тренировка', () => {
    expect(reviewDay({ ...base, workouts: Array.from({ length: 12 }, (_, i) => w(i + 1, { exercise: 'pushups', reps: 10 })) }).some((x) => x.startsWith('Много подходов'))).toBe(true);
    expect(reviewDay({ ...base, workouts: [w(1, { minutes: 200 })] }).some((x) => x.startsWith('Очень длинная'))).toBe(true);
    expect(reviewDay({ ...base, workouts: [w(1, { minutes: 90 }), w(2, { minutes: 90 })] })).toEqual([]);
  });
  it('скрывается, если родитель уже посмотрел и очки почти не выросли', () => {
    expect(reviewHidden(160, { points: 160 })).toBe(true);
    expect(reviewHidden(170, { points: 160 })).toBe(true);
    expect(reviewHidden(220, { points: 160 })).toBe(false);
    expect(reviewHidden(160, undefined)).toBe(false);
  });
});
