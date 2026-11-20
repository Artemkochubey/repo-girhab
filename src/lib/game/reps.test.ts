import { describe, it, expect } from 'vitest';
import { EXERCISES, exerciseById } from './muscles';
import { allocateWorkouts, dayCurve, nextRepPrice, repPoints } from './reps';

const push = exerciseById('pushups')!.rep!;
const e = (id: number, exercise: string, reps: number, date = 'd1') => ({ id, date, minutes: 0, exercise, reps });

describe('повторы', () => {
  it('цена за повтор: полная до soft, половина до hard, дальше четверть (нулей нет)', () => {
    expect(repPoints(push, 30)).toBeCloseTo(6);          // 30 × 0.2
    expect(repPoints(push, 75)).toBeCloseTo(15);
    expect(repPoints(push, 150)).toBeCloseTo(22.5);       // 15 + 75 × 0.1
    expect(repPoints(push, 250)).toBeCloseTo(22.5 + 100 * 0.05);
    expect(repPoints(push, 1000)).toBeGreaterThan(repPoints(push, 999));   // всегда растёт
  });
  it('дневная кривая: до 40 полная цена, до 80 половина, дальше четверть, без разрывов', () => {
    expect(dayCurve(30)).toBe(30);
    expect(dayCurve(40)).toBe(40);
    expect(dayCurve(80)).toBe(60);
    expect(dayCurve(120)).toBe(70);
    for (let x = 1; x < 300; x++) expect(dayCurve(x + 1)).toBeGreaterThan(dayCurve(x));
  });
  it('каталог: у каждого упражнения с повторами разумные лимиты', () => {
    const withReps = EXERCISES.filter((x) => x.rep);
    expect(withReps.length).toBeGreaterThanOrEqual(10);
    for (const x of withReps) {
      expect(x.rep!.hard).toBeGreaterThan(x.rep!.soft);
      expect(x.rep!.max).toBeLessThanOrEqual(x.rep!.hard);
      expect(x.rep!.pts * x.rep!.soft).toBeLessThanOrEqual(15.01);     // «полная ставка» ≈ до 15 очков
    }
  });
  it('дробление на подходы не даёт больше, чем один подход', () => {
    const whole = allocateWorkouts([e(1, 'pushups', 150)]).reduce((a, x) => a + x.eq, 0);
    const split = allocateWorkouts(Array.from({ length: 15 }, (_, i) => e(i + 1, 'pushups', 10))).reduce((a, x) => a + x.eq, 0);
    expect(split).toBeCloseTo(whole, 1);
  });
  it('накрутка невыгодна, но потолка нет: больше повторов всегда чуть больше очков, но всё дешевле', () => {
    const total = (n: number) => allocateWorkouts(Array.from({ length: n / 10 }, (_, i) => e(i + 1, 'pushups', 10))).reduce((a, x) => a + x.eq, 0);
    expect(total(150)).toBeCloseTo(22.5, 1);
    expect(total(400)).toBeGreaterThan(total(150));
    expect(total(1000) - total(900)).toBeLessThan(total(150) - total(50));
  });
  it('день: много упражнений не даёт нулей, но дорожает', () => {
    const list = ['pushups', 'squats', 'lunges', 'pullups', 'dips', 'burpees'].map((x, i) => e(i + 1, x, exerciseById(x)!.rep!.hard));
    const r = allocateWorkouts(list);
    for (const x of r) expect(x.eq).toBeGreaterThan(0);
    const raw = list.reduce((a, x) => a + repPoints(exerciseById(x.exercise)!.rep!, x.reps), 0);
    expect(r.reduce((a, x) => a + x.eq, 0)).toBeCloseTo(dayCurve(raw), 1);
    expect(r.reduce((a, x) => a + x.eq, 0)).toBeLessThan(raw);
  });
  it('новый день — всё обнуляется; минутные записи не затрагиваются', () => {
    const r = allocateWorkouts([e(1, 'pushups', 150, 'd1'), e(2, 'pushups', 150, 'd2'), { id: 3, date: 'd2', minutes: 30, exercise: 'running' }]);
    expect(r[0].eq).toBeCloseTo(22.5); expect(r[1].eq).toBeCloseTo(22.5); expect(r[2].eq).toBe(30);
  });
  it('подсказка: цена следующего повтора падает по мере накрутки', () => {
    const fresh = nextRepPrice([], 'pushups')!;
    expect(fresh).toMatchObject({ perRep: 0.2, percent: 100, dayPoints: 0 });
    const tired = nextRepPrice([{ id: 1, exercise: 'pushups', reps: 100 }], 'pushups')!;   // за soft (75) — уже половина
    expect(tired.percent).toBe(50);
    expect(nextRepPrice([], 'running')).toBeNull();
  });
});

describe('прогулка', () => {
  const walk = (id: number, minutes: number, date = 'd1') => ({ id, date, minutes, exercise: 'stroll' });
  it('очко за две минуты', () => {
    expect(allocateWorkouts([walk(1, 60)])[0]!.eq).toBe(30);
    expect(allocateWorkouts([walk(1, 15)])[0]!.eq).toBe(7.5);
  });
  it('в день засчитывается не больше 90 минут, дальше без очков', () => {
    expect(allocateWorkouts([walk(1, 200)])[0]!.eq).toBe(45);
    const r = allocateWorkouts([walk(1, 60), walk(2, 60), walk(3, 30)]);
    expect(r.map((x) => x.eq)).toEqual([30, 15, 0]);
  });
  it('на следующий день лимит обновляется, обычная тренировка идёт по полной цене', () => {
    const r = allocateWorkouts([walk(1, 90), walk(2, 90, 'd2'), { id: 3, date: 'd2', minutes: 30, exercise: 'running' }, { id: 4, date: 'd2', minutes: 20, exercise: null }]);
    expect(r.map((x) => x.eq)).toEqual([45, 45, 30, 20]);
  });
  it('прогулка есть в каталоге, нагружает ноги, а не руки', () => {
    const s = exerciseById('stroll')!;
    expect(s.cat).toBe('Кардио');
    expect(s.minute).toEqual({ rate: 0.5, dayCap: 90 });
    expect(s.w.calves).toBeGreaterThan(0);
    expect(s.w.biceps).toBeUndefined();
  });
});
