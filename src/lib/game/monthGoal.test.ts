import { describe, expect, it } from 'vitest';
import { cumulativeProgress, daysInMonth, monthEnd, monthOf, resolveMonthGoal, suggestTarget, validMonth, type GoalDay } from './monthGoal';

const day = (date: string, members: [number, number, number][]): GoalDay => ({ date, members: members.map(([total, goal, deeds]) => ({ total, goal, deeds })) });

describe('цель семьи на месяц', () => {
  it('границы месяца', () => {
    expect(monthOf('2026-11-20')).toBe('2026-11');
    expect(monthEnd('2026-11')).toBe('2026-11-30');
    expect(monthEnd('2026-12')).toBe('2026-12-31');
    expect(daysInMonth('2028-02')).toBe(29);
    expect(validMonth('2026-13')).toBe(false); expect(validMonth('2026-1')).toBe(false); expect(validMonth('2026-11')).toBe(true);
  });
  const days = [day('2026-11-01', [[60, 60, 1], [40, 40, 0]]), day('2026-11-02', [[30, 60, 2], [40, 40, 1]]), day('2026-11-03', [[70, 60, 0], [50, 40, 0]])];
  it('очки семьи, добрые дела и дни, когда норму выполнили все, накапливаются по дням', () => {
    expect(cumulativeProgress('points', days).map((x) => x.value)).toEqual([100, 170, 290]);
    expect(cumulativeProgress('deeds', days).map((x) => x.value)).toEqual([1, 4, 4]);
    expect(cumulativeProgress('normDays', days).map((x) => x.value)).toEqual([1, 1, 2]);   // 2-го у первого меньше нормы
  });
  it('выполнение и дата, когда цель достигнута; будущие дни не считаются', () => {
    const r = resolveMonthGoal('points', 150, '2026-11', days, '2026-11-03');
    expect(r).toMatchObject({ progress: 290, done: true, doneDate: '2026-11-02', percent: 100 });
    const early = resolveMonthGoal('points', 150, '2026-11', days, '2026-11-01');
    expect(early).toMatchObject({ progress: 100, done: false, doneDate: null, percent: 67 });
  });
  it('темп: ожидаемое к сегодняшнему дню, «по плану» и сколько нужно в день', () => {
    const r = resolveMonthGoal('points', 3000, '2026-11', days, '2026-11-03');
    expect(r.expected).toBe(300);                 // 3000 × 3/30
    expect(r.onTrack).toBe(false);                // 290 < 300
    expect(r.daysLeft).toBe(27);
    expect(r.need).toBe(Math.ceil((3000 - 290) / 27));
    expect(resolveMonthGoal('points', 200, '2026-11', days, '2026-11-03').onTrack).toBe(true);
  });
  it('после конца месяца дней не осталось', () => {
    const r = resolveMonthGoal('deeds', 10, '2026-11', days, '2026-12-05');
    expect(r.daysLeft).toBe(0); expect(r.need).toBe(0);
  });
  it('подсказка цели от норм семьи', () => {
    expect(suggestTarget('points', [60, 60, 60, 40], '2026-11')).toBe(Math.round((220 * 30 * 0.6) / 100) * 100);
    expect(suggestTarget('deeds', [60, 60, 60, 40], '2026-11')).toBe(60);
    expect(suggestTarget('normDays', [60], '2026-11')).toBe(18);
  });
});
