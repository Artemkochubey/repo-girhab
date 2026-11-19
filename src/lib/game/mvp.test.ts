import { describe, it, expect } from 'vitest';
import { pickDayMvp } from './mvp';

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
});
