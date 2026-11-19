import { describe, it, expect } from 'vitest';
import { DAY_RATIO_CAP, dayRatio, pickDayMvp } from './mvp';

describe('MVP дня', () => {
  it('побеждает лучший относительно своей нормы, а не по сырым очкам', () => {
    const r = pickDayMvp([{ id: 1, points: 90, goal: 60 }, { id: 2, points: 70, goal: 40 }]);   // 1,5 против 1,75
    expect(r).toMatchObject({ id: 2 });
  });
  it('без выполненной нормы MVP нет', () => {
    expect(pickDayMvp([{ id: 1, points: 50, goal: 60 }, { id: 2, points: 30, goal: 40 }])).toBeNull();
    expect(pickDayMvp([])).toBeNull();
  });
  it('ничья: больше очков, затем меньший id', () => {
    expect(pickDayMvp([{ id: 1, points: 60, goal: 60 }, { id: 2, points: 40, goal: 40 }])).toMatchObject({ id: 1 });
    expect(pickDayMvp([{ id: 3, points: 60, goal: 60 }, { id: 2, points: 60, goal: 60 }])).toMatchObject({ id: 2 });
  });
  it('вклад дня ограничен двумя нормами: накрутка победу не даёт', () => {
    expect(DAY_RATIO_CAP).toBe(2);
    expect(dayRatio(500, 60)).toBe(2);
    expect(dayRatio(90, 60)).toBe(1.5);
    // 600 очков при норме 60 и 120 очков при норме 60 — оба на потолке, решает id, а не накрученные очки
    expect(pickDayMvp([{ id: 1, points: 120, goal: 60 }, { id: 2, points: 600, goal: 60 }])).toMatchObject({ id: 1, ratio: 2 });
    // честный результат 1,9 нормы проигрывает потолку 2
    expect(pickDayMvp([{ id: 1, points: 114, goal: 60 }, { id: 2, points: 600, goal: 60 }])).toMatchObject({ id: 2 });
  });
});
