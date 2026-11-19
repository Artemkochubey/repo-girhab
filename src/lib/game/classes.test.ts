import { describe, it, expect } from 'vitest';
import { subBonus, canChangeClass, recommendSub, HOUR } from './classes';

describe('классы', () => {
  it('бонус подкласса', () => {
    expect([1, 4, 5, 9, 10, 19, 20, 50].map(subBonus)).toEqual([0, 0, 0.1, 0.1, 0.15, 0.15, 0.2, 0.2]);
  });
  it('смена класса: 24 ч бесплатно, затем пауза 7 дней', () => {
    expect(canChangeClass(0, 23 * HOUR).ok).toBe(true);
    expect(canChangeClass(0, 25 * HOUR).ok).toBe(false);
    expect(canChangeClass(0, 6 * 24 * HOUR).ok).toBe(false);
    expect(canChangeClass(0, 7 * 24 * HOUR).ok).toBe(true);
  });
  it('рекомендация подкласса', () => {
    expect(recommendSub({ w: 100, m: 30, b: 50, p: 0 }, 'w')).toBe('b');
    expect(recommendSub({ w: 100, m: 0, b: 0, p: 0 }, 'w')).toBeNull();
  });
});
