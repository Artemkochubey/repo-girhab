import { describe, it, expect } from 'vitest';
import { buildSeason, buildSeasons, monthEnd, nextMonth, seasonName } from './seasons';

const M = (id: number, goal: number, createdOn = '2026-10-01') => ({ id, goal, createdOn });
const flat = (per: Record<number, number>) => (id: number, _d: string) => per[id] ?? 0;

describe('сезоны', () => {
  it('границы месяцев и названия', () => {
    expect(monthEnd('2026-02-10')).toBe('2026-02-28');
    expect(monthEnd('2028-02-01')).toBe('2028-02-29');
    expect(nextMonth('2026-12-15')).toBe('2027-01-01');
    expect(seasonName('2026-11')).toBe('Ноябрь 2026');
  });
  it('рейтинг по очкам относительно нормы: у младшего те же шансы', () => {
    const s = buildSeason('2026-10', '2026-11-05', '2026-10-01', [M(1, 60), M(2, 40)], flat({ 1: 60, 2: 50 }));
    expect(s.rows.map((r) => r.memberId)).toEqual([2, 1]);                 // 50/40 = 125% против 100%
    expect(s.winner).toBe(2);
    expect(s.second).toBe(1);
    expect(s.rows[0]).toMatchObject({ days: 31, normDays: 31, rank: 1, chests: 3 });
    expect(s.rows[1].chests).toBe(1);
  });
  it('идущий сезон: приза нет, дни считаются до сегодня, daysLeft', () => {
    const s = buildSeason('2026-11', '2026-11-10', '2026-10-01', [M(1, 60)], flat({ 1: 30 }));
    expect(s).toMatchObject({ finished: false, awardable: false, daysLeft: 21 });
    expect(s.rows[0]).toMatchObject({ days: 10, points: 300, chests: 0 });
    expect(s.rows[0].ratio).toBeCloseTo(0.5);
  });
  it('участник, пришедший в середине месяца, считается с дня создания', () => {
    const s = buildSeason('2026-10', '2026-11-05', '2026-10-01', [M(1, 60), M(2, 60, '2026-10-20')], flat({ 1: 30, 2: 60 }));
    expect(s.rows.find((r) => r.memberId === 2)).toMatchObject({ days: 12, eligible: true });
    expect(s.winner).toBe(2);
  });
  it('нужен минимум дней и половина нормы; призов нет, если никто не подходит', () => {
    const few = buildSeason('2026-10', '2026-11-05', '2026-10-01', [M(1, 60, '2026-10-28')], flat({ 1: 100 }));
    expect(few.winner).toBeNull();
    const lazy = buildSeason('2026-10', '2026-11-05', '2026-10-01', [M(1, 60)], flat({ 1: 20 }));
    expect(lazy.winner).toBeNull();
    expect(lazy.rows[0].chests).toBe(0);
  });
  it('вклад одного дня в рейтинг ограничен двумя нормами', () => {
    // у первого один гигантский день в остальные ноль, у второго ровно норма каждый день
    const s = buildSeason('2026-10', '2026-11-05', '2026-10-01', [M(1, 60), M(2, 60)], (id, d) => (id === 1 ? (d === '2026-10-05' ? 100000 : 40) : 60));
    expect(s.rows.find((r) => r.memberId === 1)!.ratio).toBeLessThan(1);
    expect(s.winner).toBe(2);
    expect(s.rows.find((r) => r.memberId === 1)!.points).toBeGreaterThan(100000);   // очки видны как есть
  });
  it('призы только за сезоны после старта функции', () => {
    const before = buildSeason('2026-09', '2026-11-05', '2026-10-15', [M(1, 60, '2026-09-01')], flat({ 1: 60 }));
    expect(before).toMatchObject({ finished: true, awardable: false });
    expect(before.rows[0].chests).toBe(0);
    const ok = buildSeason('2026-10', '2026-11-05', '2026-10-15', [M(1, 60, '2026-09-01')], flat({ 1: 60 }));
    expect(ok.awardable).toBe(true);
  });
  it('итоги по всем сезонам: победы, сундуки, даты', () => {
    const r = buildSeasons('2026-12-03', '2026-10-01', [M(1, 60, '2026-10-01'), M(2, 60, '2026-10-01')], (id, d) => (d < '2026-11-01' ? (id === 1 ? 80 : 60) : id === 2 ? 90 : 60));
    expect(r.current.id).toBe('2026-12');
    expect(r.history.map((s) => s.id)).toEqual(['2026-11', '2026-10']);
    expect(r.wins).toEqual({ 1: 1, 2: 1 });
    expect(r.chests).toEqual({ 1: 3 + 1, 2: 3 + 1 });
    expect(r.winDates).toEqual({ 1: ['2026-10-31'], 2: ['2026-11-30'] });
  });
});
