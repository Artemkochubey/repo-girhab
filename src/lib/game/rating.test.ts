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
