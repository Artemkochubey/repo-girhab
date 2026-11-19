import { describe, it, expect } from 'vitest';
import { xpNeed, levelFromXp, chestsEarned } from './level';

describe('уровни', () => {
  it('xpNeed по формуле', () => {
    expect([1, 2, 3, 10].map(xpNeed)).toEqual([0, 50, 150, 2250]);
  });
  it('уровень на границах', () => {
    expect(levelFromXp(0)).toBe(1);
    expect(levelFromXp(49)).toBe(1);
    expect(levelFromXp(50)).toBe(2);
    expect(levelFromXp(149)).toBe(2);
    expect(levelFromXp(150)).toBe(3);
    expect(levelFromXp(2250)).toBe(10);
    expect(levelFromXp(2249)).toBe(9);
  });
  it('обратимость для 1..200', () => {
    for (let n = 1; n <= 200; n++) {
      expect(levelFromXp(xpNeed(n))).toBe(n);
      expect(levelFromXp(xpNeed(n + 1) - 1)).toBe(n);
    }
  });
  it('сундуки', () => expect(chestsEarned(5, 3, 2)).toBe(9));
});
