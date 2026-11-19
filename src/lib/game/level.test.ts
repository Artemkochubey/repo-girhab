import { describe, it, expect } from 'vitest';
import { xpNeed, levelFromXp, chestsEarned } from './level';

describe('уровни', () => {
  it('xpNeed: 50 на первый уровень, каждый следующий в 1,5 раза дольше', () => {
    expect([1, 2, 3, 4, 5, 10].map(xpNeed)).toEqual([0, 50, 125, 238, 406, 3744]);
    for (let n = 2; n < 15; n++) expect((xpNeed(n + 2) - xpNeed(n + 1)) / (xpNeed(n + 1) - xpNeed(n))).toBeGreaterThan(1.45);
    for (let n = 2; n < 15; n++) expect((xpNeed(n + 2) - xpNeed(n + 1)) / (xpNeed(n + 1) - xpNeed(n))).toBeLessThan(1.55);
  });
  it('уровень на границах', () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(49)).toBe(1);
    expect(levelFromXp(50)).toBe(2);
    expect(levelFromXp(124)).toBe(2);
    expect(levelFromXp(125)).toBe(3);
    expect(levelFromXp(3744)).toBe(10);
    expect(levelFromXp(3743)).toBe(9);
  });
  it('обратимость для 1..60', () => {
    for (let n = 1; n <= 60; n++) {
      expect(levelFromXp(xpNeed(n))).toBe(n);
      expect(levelFromXp(xpNeed(n + 1) - 1)).toBe(n);
    }
  });
  it('сундуки', () => expect(chestsEarned(5, 3, 2)).toBe(9));
});
