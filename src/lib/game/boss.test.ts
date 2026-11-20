import { describe, it, expect } from 'vitest';
import { bossHp, bossDamage, bossRewards, isoWeekNumber, weekStart, bossForDate } from './boss';
import { rollRarity } from './chests';

describe('босс', () => {
  it('HP семьи 60+60+60+40', () => expect(bossHp([60, 60, 60, 40])).toBe(1080));
  it('урон со слабым местом', () => expect(bossDamage(1000, 200)).toBe(1050));
  it('награды: порог 10% и MVP', () => {
    const r = bossRewards({ 1: 500, 2: 450, 3: 40 });
    expect(r.chests).toEqual({ 1: 2, 2: 1 });
    expect(r.mvp).toBe(1);
  });
  it('недели', () => {
    expect(isoWeekNumber('2026-01-01')).toBe(1);
    expect(weekStart('2026-11-19')).toBe('2026-11-16');
    expect(weekStart('2026-11-22')).toBe('2026-11-16');
    expect(bossForDate('2026-11-16')).toBe(bossForDate('2026-11-22'));
  });
});

describe('сундуки', () => {
  it('редкость', () => {
    expect(rollRarity(0.01)).toBe('legend');      // базовые шансы 2% / 18% / 80%
    expect(rollRarity(0.02)).toBe('rare');
    expect(rollRarity(0.19)).toBe('rare');
    expect(rollRarity(0.2)).toBe('common');
    expect(rollRarity(0.04, { legend: 0.03 })).toBe('legend');
    expect(rollRarity(0.5, { rare: 0.35 })).toBe('rare');
    expect(rollRarity(0.55, { rare: 0.35 })).toBe('common');
  });
});
