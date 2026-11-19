import { describe, it, expect } from 'vitest';
import { RANKS, rankFor } from './ranks';
import { xpNeed } from './level';
import { CLASS_NAMES, SUBCLASS_NAMES } from './classes';
import { TALENTS } from './talents';

describe('звания «Восхождение»', () => {
  it('12 званий по возрастанию уровня, начиная с 1', () => {
    expect(RANKS).toHaveLength(12);
    expect(RANKS[0].level).toBe(1);
    for (let i = 1; i < RANKS.length; i++) expect(RANKS[i].level).toBeGreaterThan(RANKS[i - 1].level);
  });
  it('не совпадают с классами, подклассами и талантами', () => {
    const taken = new Set([
      ...Object.values(CLASS_NAMES).map((n) => n.replace(/^\S+\s/, '')),
      ...Object.values(SUBCLASS_NAMES).flatMap((x) => Object.values(x)).filter(Boolean),
      ...TALENTS.map((t) => t.name),
    ].map((s) => s.toLowerCase()));
    for (const r of RANKS) expect(taken.has(r.name.toLowerCase())).toBe(false);
  });
  it('границы званий и прогресс к следующему', () => {
    expect(rankFor(1).rank.name).toBe('Подножие');
    expect(rankFor(2).rank.name).toBe('Подножие');
    expect(rankFor(3).rank.name).toBe('Тропа');
    expect(rankFor(29).rank.name).toBe('Пик');
    expect(rankFor(30).rank.name).toBe('Вершина');
    expect(rankFor(100).rank.name).toBe('Покоритель неба');
    expect(rankFor(100)).toMatchObject({ next: null, progress: 1 });
    const mid = rankFor(3, (xpNeed(3) + xpNeed(5)) / 2);
    expect(mid.next?.name).toBe('Перевал');
    expect(mid.progress).toBeCloseTo(0.5);
    expect(mid.xpToNext).toBe(xpNeed(5) - (xpNeed(3) + xpNeed(5)) / 2);
  });
});
