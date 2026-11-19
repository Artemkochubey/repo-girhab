import { describe, it, expect } from 'vitest';
import { BRAIN_REGIONS, brainIntensity, brainLoads, brainOverall, type MindDay } from './brain';

const day = (date: string, study: Record<string, number> = {}, habits = 0, books = 0): MindDay => ({ date, study, habits, books });

describe('мозг', () => {
  it('каждая сфера учёбы связана ровно с одной областью', () => {
    const kinds = BRAIN_REGIONS.map((r) => r.kind).filter(Boolean);
    expect(new Set(kinds).size).toBe(6);
    expect(new Set(BRAIN_REGIONS.map((r) => r.id)).size).toBe(BRAIN_REGIONS.length);
  });
  it('нагрузка по периоду: минуты, книги и привычки', () => {
    const log = [day('2026-11-19', { Мышление: 20, Книги: 10 }, 3, 1), day('2026-11-10', { Мышление: 100 })];
    const l = brainLoads(log, '2026-11-13', '2026-11-19');
    expect(l.frontal).toBe(20);
    expect(l.occipital).toBe(10 + 30);           // чтение + законченная книга
    expect(l.stem).toBe(15);                      // 3 привычки × 5
    expect(l.cerebellum).toBe(0);
  });
  it('яркость растёт с нагрузкой; одна короткая запись не делает всё ярким', () => {
    const small = brainIntensity(brainLoads([day('d', { Учёба: 5 })], 'd', 'd'), 7);
    expect(small.parietal).toBeLessThan(0.2);
    const big = brainIntensity(brainLoads([day('d', { Учёба: 100, Языки: 30 })], 'd', 'd'), 7);
    expect(big.parietal).toBe(1);
    expect(big.temporal).toBeGreaterThan(0.2);
    expect(big.temporal).toBeLessThan(big.parietal);
    expect(big.frontal).toBe(0);
  });
  it('общая яркость: 45 минут в день — максимум', () => {
    expect(brainOverall(brainLoads([day('d', { Учёба: 45 })], 'd', 'd'), 1)).toBe(1);
    expect(brainOverall(brainLoads([day('d', { Учёба: 9 })], 'd', 'd'), 1)).toBeCloseTo(0.2);
  });
});
