import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { balanceMarkdown, bossTable, chestStats, dropTable, hordeTable, levelTable, realStats } from './balance';

describe('разбор баланса', () => {
  it('уровни: 10-й за 1–3 месяца при 60 очках в день, кривая растёт, дни убывают с ростом очков', () => {
    const t = levelTable([5, 10, 15], [40, 60, 90]);
    const l10 = t.find((r) => r.level === 10)!;
    expect(l10.xp).toBe(3744);
    expect(l10.days[1]).toBeGreaterThanOrEqual(40); expect(l10.days[1]).toBeLessThanOrEqual(90);
    expect(t[2]!.days[1]!).toBeGreaterThan(l10.days[1]! * 4);       // выше десятого уровня идёт гораздо медленнее
    for (const r of t) expect(r.days[0]!).toBeGreaterThan(r.days[2]!);
  });
  it('сундуки: гарантии держатся, редкий в среднем чаще раза в 5, легендарный чаще раза в 35', () => {
    const c = chestStats(20000, 'test');
    expect(c.maxGapRare).toBeLessThanOrEqual(10);
    expect(c.maxGapLegend).toBeLessThanOrEqual(35);
    expect(c.avgBetweenRare).toBeLessThan(6);
    expect(c.avgBetweenLegend).toBeLessThan(35); expect(c.avgBetweenLegend).toBeGreaterThan(15);
    expect(chestStats(20000, 'test')).toEqual(c);                    // зерно даёт одинаковый результат
  });
  it('босс: при 70% нормы без усиления ровно неделя, с усилением быстрее, при 50% без усиления не успеть', () => {
    const t = bossTable([0.5, 0.7, 1], [1, 1.4]);
    const f = (p: number, m: number) => t.find((r) => r.participation === p && r.mult === m)!;
    expect(f(0.7, 1).days).toBe(7); expect(f(0.7, 1).weekEnough).toBe(true);
    expect(f(0.5, 1).weekEnough).toBe(false);
    expect(f(0.5, 1.4).weekEnough).toBe(true);
    expect(f(1, 1.4).days).toBeLessThan(f(1, 1).days);
  });
  it('бой с ордой: в будни победа при 100% нормы, при 60% поражение, элитной нужно больше очков', () => {
    const t = hordeTable(60, [0.6, 1, 1.5]);
    const g = (kind: string, ratio: number) => t.find((r) => r.kind === kind && r.ratio === ratio)!;
    expect(g('weekday', 1).outcome).toBe('победа');
    expect(g('weekday', 0.6).outcome).toBe('поражение');
    expect(g('elite', 1.5).cleared).toBeGreaterThanOrEqual(g('elite', 1).cleared);
    expect(g('elite', 1).cleared).toBeLessThanOrEqual(g('weekday', 1).cleared);
  });
  it('добыча: у элитной орды нет обычных предметов и легендарный выпадает чаще', () => {
    const d = dropTable();
    expect(d.elite.shares.find((s) => s.rarity === 'common')!.pct).toBe(0);
    expect(d.elite.winsPerLegend).toBeLessThan(d.normal.winsPerLegend);
    expect(d.normal.shares.reduce((a, s) => a + s.pct, 0)).toBeCloseTo(100, 0);
  });
  it('реальная статистика: средние очки, дни до уровня и победы', () => {
    const days = new Map([['2026-11-20', { total: 60 }], ['2026-11-19', { total: 30 }]]);
    const [r] = realStats([{ name: 'Лев', level: 2, xp: 60, days, battleRows: [{ win: true }, { win: false }] }], '2026-11-20');
    expect(r).toMatchObject({ name: 'Лев', avg14: 45, battleWins: 1, battles: 2 });
    expect(r!.daysToNext).toBe(Math.ceil((125 - 60) / 45));         // xpNeed(3) = 125
    expect(realStats([{ name: 'Н', level: 1, xp: 0, days: new Map(), battleRows: [] }], '2026-11-20')[0]!.daysToNext).toBeNull();
  });
  it('BALANCE.md в репозитории актуален (после изменения чисел выполните npm run balance)', () => {
    expect(fs.readFileSync('BALANCE.md', 'utf8')).toBe(balanceMarkdown());
  });
});
