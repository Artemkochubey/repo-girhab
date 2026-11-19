import { describe, it, expect } from 'vitest';
import { LOOT_COMMON, LOOT_LEGEND, LOOT_RARE } from './loot';

describe('каталог наград сундуков', () => {
  it('достаточно вариантов: много обычных, поменьше редких и легендарных', () => {
    expect(LOOT_COMMON.length).toBeGreaterThanOrEqual(70);
    expect(LOOT_RARE.length).toBeGreaterThanOrEqual(30);
    expect(LOOT_LEGEND.length).toBeGreaterThanOrEqual(20);
  });
  it('без повторов внутри списков и между ними, длина до 80 символов', () => {
    const all = [...LOOT_COMMON, ...LOOT_RARE, ...LOOT_LEGEND];
    expect(new Set(all.map((x) => x.toLowerCase())).size).toBe(all.length);
    for (const x of all) { expect(x.trim()).toBe(x); expect(x.length).toBeGreaterThan(2); expect(x.length).toBeLessThanOrEqual(80); }
  });
});
