import { describe, it, expect } from 'vitest';
import { bossHp, bossDamage, bossRewards, isoWeekNumber, weekStart, bossForDate } from './boss';
import { PITY, pityCounters, rollChest, rollRarity } from './chests';

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

describe('гарантии и сундуки за боссов', () => {
  const base = { sinceRare: 0, sinceLegend: 0, boss: false };
  it('счётчики по истории: подряд обычных и подряд без легендарного', () => {
    expect(pityCounters([])).toEqual({ sinceRare: 0, sinceLegend: 0 });
    expect(pityCounters(['common', 'common', 'rare', 'common'])).toEqual({ sinceRare: 1, sinceLegend: 4 });
    expect(pityCounters(['legend', 'common', 'rare'])).toEqual({ sinceRare: 0, sinceLegend: 2 });
  });
  it('гарантия редкого: десятый сундук без редкого — не ниже редкого; раньше работает обычный розыгрыш', () => {
    expect(PITY).toEqual({ rare: 10, legend: 35 });
    expect(rollChest(0.9, { ...base, sinceRare: 8 })).toEqual({ rarity: 'common', why: null });
    expect(rollChest(0.9, { ...base, sinceRare: 9 })).toEqual({ rarity: 'rare', why: 'pityRare' });
    expect(rollChest(0.01, { ...base, sinceRare: 9 })).toEqual({ rarity: 'legend', why: null });   // удача лучше гарантии
  });
  it('гарантия легендарного: 35-й сундук без легендарного — легендарный, перекрывает остальное', () => {
    expect(rollChest(0.9, { ...base, sinceLegend: 33 })).toMatchObject({ rarity: 'common' });
    expect(rollChest(0.9, { ...base, sinceLegend: 34 })).toEqual({ rarity: 'legend', why: 'pityLegend' });
    expect(rollChest(0.9, { ...base, sinceLegend: 34, boss: true })).toMatchObject({ rarity: 'legend', why: 'pityLegend' });
  });
  it('сундук за босса: не ниже редкого, легендарный с шансом 10%', () => {
    expect(rollChest(0.99, { ...base, boss: true })).toEqual({ rarity: 'rare', why: 'boss' });
    expect(rollChest(0.09, { ...base, boss: true })).toEqual({ rarity: 'legend', why: 'boss' });
    expect(rollChest(0.1, { ...base, boss: true })).toEqual({ rarity: 'rare', why: 'boss' });
    expect(rollChest(0.12, { ...base, boss: true, luck: { legend: 0.03 } })).toMatchObject({ rarity: 'legend' });   // таланты удачи прибавляются
  });
  it('распределение обычных сундуков близко к 80/18/2 (без гарантий)', () => {
    let l = 0, r = 0;
    const n = 10000;
    for (let i = 0; i < n; i++) { const x = rollRarity((i + 0.5) / n); if (x === 'legend') l++; else if (x === 'rare') r++; }
    expect(l / n).toBeCloseTo(0.02, 2); expect(r / n).toBeCloseTo(0.18, 2);
  });
});
