import { describe, it, expect } from 'vitest';
import { EXERCISES, exerciseById } from './muscles';
import { DAY_REP_CAP, allocateWorkouts, maxRepPoints, repPoints } from './reps';

const push = exerciseById('pushups')!.rep!;
const e = (id: number, exercise: string, reps: number, date = 'd1') => ({ id, date, minutes: 0, exercise, reps });

describe('повторы', () => {
  it('цена за повтор: полная до soft, половина до hard, дальше ноль', () => {
    expect(repPoints(push, 30)).toBeCloseTo(6);          // 30 × 0.2
    expect(repPoints(push, 75)).toBeCloseTo(15);
    expect(repPoints(push, 150)).toBeCloseTo(22.5);       // 15 + 75 × 0.1
    expect(repPoints(push, 1000)).toBeCloseTo(22.5);      // потолок упражнения
    expect(maxRepPoints(push)).toBeCloseTo(22.5);
  });
  it('каталог: у каждого упражнения с повторами разумные лимиты', () => {
    const withReps = EXERCISES.filter((x) => x.rep);
    expect(withReps.length).toBeGreaterThanOrEqual(10);
    for (const x of withReps) {
      expect(x.rep!.hard).toBeGreaterThan(x.rep!.soft);
      expect(x.rep!.max).toBeLessThanOrEqual(x.rep!.hard);
      expect(maxRepPoints(x.rep!)).toBeLessThanOrEqual(DAY_REP_CAP);   // одно упражнение не съедает весь день
      expect(x.rep!.pts * x.rep!.soft).toBeLessThanOrEqual(15.01);     // «полная ставка» ≈ до 15 очков
    }
  });
  it('повторы нельзя накрутить дроблением на подходы', () => {
    const whole = allocateWorkouts([e(1, 'pushups', 150)]).reduce((a, x) => a + x.eq, 0);
    const split = allocateWorkouts(Array.from({ length: 15 }, (_, i) => e(i + 1, 'pushups', 10))).reduce((a, x) => a + x.eq, 0);
    expect(split).toBeCloseTo(whole, 1);
    const more = allocateWorkouts(Array.from({ length: 40 }, (_, i) => e(i + 1, 'pushups', 10))).reduce((a, x) => a + x.eq, 0);
    expect(more).toBeCloseTo(whole, 1);                                // 400 отжиманий = столько же, сколько 150
  });
  it('общий потолок дня по повторам', () => {
    const list = ['pushups', 'squats', 'lunges', 'pullups', 'dips', 'burpees'].map((x, i) => e(i + 1, x, exerciseById(x)!.rep!.hard));
    const total = allocateWorkouts(list).reduce((a, x) => a + x.eq, 0);
    expect(total).toBeCloseTo(DAY_REP_CAP, 1);
  });
  it('новый день — потолки обнуляются; минутные записи не затрагиваются', () => {
    const r = allocateWorkouts([e(1, 'pushups', 150, 'd1'), e(2, 'pushups', 150, 'd2'), { id: 3, date: 'd2', minutes: 30, exercise: 'running' }]);
    expect(r[0].eq).toBeCloseTo(22.5); expect(r[1].eq).toBeCloseTo(22.5); expect(r[2].eq).toBe(30);
  });
});
