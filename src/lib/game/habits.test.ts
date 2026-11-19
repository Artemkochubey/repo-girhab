import { describe, it, expect } from 'vitest';
import { HABIT_CATALOG, HABIT_GROUPS } from './habits';

describe('каталог привычек', () => {
  it('достаточно большой, без повторов и в пределах длины названия', () => {
    expect(HABIT_CATALOG.length).toBeGreaterThanOrEqual(80);
    expect(new Set(HABIT_CATALOG).size).toBe(HABIT_CATALOG.length);
    for (const h of HABIT_CATALOG) { expect(h.trim()).toBe(h); expect(h.length).toBeLessThanOrEqual(60); }
  });
  it('группы непустые и с уникальными названиями', () => {
    expect(new Set(HABIT_GROUPS.map((g) => g.title)).size).toBe(HABIT_GROUPS.length);
    expect(HABIT_GROUPS.every((g) => g.items.length >= 5)).toBe(true);
  });
});
