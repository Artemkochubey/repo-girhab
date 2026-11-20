import { describe, it, expect } from 'vitest';
import { SOURCES, buildRating, partsOf, type RatingInput } from './rating';

const inp = (o: Partial<RatingInput> & { id: number }): RatingInput => ({ goal: 60, superGoal: 100, total: 0, bySphere: {}, questXp: 0, walkShare: 0, ...o });

describe('рейтинг дня', () => {
  it('разбивка: сферы по источникам, прогулка отделяется от тренировки, остаток в бонусы', () => {
    const p = partsOf(inp({ id: 1, total: 100, bySphere: { workout: 40, warmup: 10, Учёба: 10, Мышление: 5, book: 50 }, walkShare: 0.5, questXp: 0 }));
    const m = Object.fromEntries(p.map((x) => [x.id, x.points]));
    expect(m).toMatchObject({ walk: 20, workout: 20, warmup: 10, mind: 15, books: 50 });
    expect(m.bonus).toBeUndefined();                 // 40+10+15+50 = 115 > 100: остатка нет
    const q = partsOf(inp({ id: 1, total: 60, bySphere: { workout: 30 }, questXp: 20 }));
    expect(Object.fromEntries(q.map((x) => [x.id, x.points]))).toEqual({ workout: 30, quests: 20, bonus: 10 });
  });
  it('части идут от большей к меньшей, нулей и неизвестных сфер нет', () => {
    const p = partsOf(inp({ id: 1, total: 30, bySphere: { Языки: 5, deeds: 25, неизвестно: 9, habits: 0 } }));
    expect(p.map((x) => x.id)).toEqual(['deeds', 'mind']);
  });
  it('место по выполнению своей нормы: у младшего с меньшей нормой те же шансы', () => {
    const r = buildRating([inp({ id: 1, goal: 60, total: 60 }), inp({ id: 2, goal: 40, total: 50 }), inp({ id: 3, goal: 60, total: 30 })]);
    expect(r.map((x) => x.id)).toEqual([2, 1, 3]);   // 125% > 100% > 50%
    expect(r.map((x) => x.place)).toEqual([1, 2, 3]);
    expect(r[0]).toMatchObject({ mvp: true, qualified: true, percent: 125 });
    expect(r[2]).toMatchObject({ mvp: false, qualified: false, percent: 50 });
  });
  it('потолок две нормы: накрутка не даёт обгона, при равенстве решают очки, потом номер', () => {
    const r = buildRating([inp({ id: 1, total: 300 }), inp({ id: 2, total: 120 })]);   // оба на потолке 200%
    expect(r.map((x) => x.id)).toEqual([1, 2]);
    expect(r[0]!.points).toBe(300);
    expect(r.map((x) => x.place)).toEqual([1, 2]);
  });
  it('одинаковый результат делит место, нормы никто не выполнил: MVP нет', () => {
    const r = buildRating([inp({ id: 1, total: 30 }), inp({ id: 2, total: 30 }), inp({ id: 3, total: 10 })]);
    expect(r.map((x) => x.place)).toEqual([1, 1, 3]);
    expect(r.every((x) => !x.mvp)).toBe(true);
  });
  it('главный источник — самая большая часть', () => {
    const r = buildRating([inp({ id: 1, total: 40, bySphere: { deeds: 30, workout: 10 } })]);
    expect(r[0]!.top).toBe('deeds');
    expect(buildRating([inp({ id: 2 })])[0]!.top).toBeNull();
  });
  it('у каждого источника уникальный id и цвет', () => {
    expect(new Set(SOURCES.map((s) => s.id)).size).toBe(SOURCES.length);
    expect(new Set(SOURCES.map((s) => s.color)).size).toBe(SOURCES.length);
  });
});

import { buildWeekRating } from './rating';
describe('рейтинг недели', () => {
  const day = (date: string, rows: RatingInput[]) => ({ date, rows: buildRating(rows) });
  const A = (total: number, extra: Partial<RatingInput> = {}) => inp({ id: 1, goal: 60, total, bySphere: { workout: total }, ...extra });
  const B = (total: number, extra: Partial<RatingInput> = {}) => inp({ id: 2, goal: 40, total, bySphere: { deeds: total }, ...extra });
  it('очки и источники суммируются по дням, место от средней доли нормы', () => {
    const w = buildWeekRating([day('d1', [A(60), B(20)]), day('d2', [A(30), B(40)]), day('d3', [A(0), B(0)])]);
    const a = w.find((x) => x.id === 1)!, b = w.find((x) => x.id === 2)!;
    expect(a.points).toBe(90); expect(b.points).toBe(60);
    expect(a.ratio).toBeCloseTo((1 + 0.5 + 0) / 3); expect(b.ratio).toBeCloseTo((0.5 + 1 + 0) / 3);
    expect(a.parts).toEqual([{ id: 'workout', points: 90 }]); expect(b.parts).toEqual([{ id: 'deeds', points: 60 }]);
    expect(a.normDays).toBe(1); expect(a.days).toBe(3);
    expect(a.best).toEqual({ date: 'd1', points: 60 });
  });
  it('равенство по доле нормы решают очки, одинаково — одно место', () => {
    const w = buildWeekRating([day('d1', [A(60), B(40)])]);   // оба 100%, у A больше очков
    expect(w.map((x) => x.id)).toEqual([1, 2]);
    expect(w.map((x) => x.place)).toEqual([1, 2]);
    const eq = buildWeekRating([day('d1', [A(30), inp({ id: 2, goal: 60, total: 30 })])]);
    expect(eq.map((x) => x.place)).toEqual([1, 1]);
  });
  it('дни до появления героя не считаются и не снижают среднее', () => {
    const w = buildWeekRating([day('d1', [A(60), B(0, { exists: false })]), day('d2', [A(60), B(40)])]);
    const b = w.find((x) => x.id === 2)!;
    expect(b.days).toBe(1); expect(b.ratio).toBeCloseTo(1);
    expect(b.daily[0]!.counted).toBe(false);
  });
  it('по дням видно место и MVP, считаются дни MVP', () => {
    const w = buildWeekRating([day('d1', [A(60), B(60)]), day('d2', [A(10), B(40)])]);   // d1: B 150%, A 100% → B MVP; d2: B 100% → MVP
    const b = w.find((x) => x.id === 2)!;
    expect(b.mvpDays).toBe(2);
    expect(b.daily.map((x) => x.place)).toEqual([1, 1]);
    expect(w.find((x) => x.id === 1)!.daily.map((x) => x.place)).toEqual([2, 2]);
  });
  it('день без очков у всех: у каждого 0%', () => {
    const w = buildWeekRating([day('d1', [A(0), B(0)])]);
    expect(w.every((x) => x.points === 0 && x.percent === 0 && x.top === null)).toBe(true);
  });
});
