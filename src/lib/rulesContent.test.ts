import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import { buildRules, rulesMarkdown } from './rulesContent';

describe('правила игры', () => {
  const sections = buildRules();
  it('разделы не пустые, id уникальны, в тексте нет «undefined», NaN и [object]', () => {
    expect(new Set(sections.map((s) => s.id)).size).toBe(sections.length);
    expect(sections.length).toBeGreaterThanOrEqual(18);
    const md = rulesMarkdown(sections);
    expect(md).not.toMatch(/undefined|NaN|\[object/);
    for (const s of sections) { expect(s.blocks.length).toBeGreaterThan(0); expect(s.summary.length).toBeGreaterThan(10); }
  });
  it('в правилах стоят актуальные числа игры', () => {
    const md = rulesMarkdown(sections);
    expect(md).toContain('обычный 80%, редкий 18%, легендарный 2%');
    expect(md).toContain('10-й будет не ниже редкого');
    expect(md).toContain('35-й будет легендарным');
    expect(md).toContain('босс падает, если семья в среднем набирает 70% нормы');
    expect(md).toContain('| 10 | 3744 |');                       // кривая уровней: 100·(1,5^9 − 1)
    expect(md).toContain('5 слотов');
  });
  it('таблицы прямоугольные', () => {
    for (const s of sections) for (const b of s.blocks) if (typeof b !== 'string' && 'table' in b) for (const r of b.table.rows) expect(r).toHaveLength(b.table.head.length);
  });
  it('RULES.md в репозитории актуален (после изменения чисел выполните npm run docs:rules)', () => {
    expect(fs.readFileSync('RULES.md', 'utf8')).toBe(rulesMarkdown(sections));
  });
});
