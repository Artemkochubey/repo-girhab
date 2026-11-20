import { describe, it, expect } from 'vitest';
import { DEEDS, DEED_CATEGORIES, DEED_DAY_CAP, deedById, deedStatus, scoreDeeds } from './deeds';

describe('добрые дела', () => {
  it('каталог: уникальные id, у всех есть категория и очки', () => {
    expect(new Set(DEEDS.map((d) => d.id)).size).toBe(DEEDS.length);
    for (const d of DEEDS) { expect(DEED_CATEGORIES.some((c) => c.id === d.cat)).toBe(true); expect(d.points).toBeGreaterThan(0); expect(d.name.length).toBeGreaterThan(0); }
    expect(deedById('dishes')!.points).toBe(8);
    expect(deedById('нет')).toBeUndefined();
  });
  it('очки суммируются, одно и то же дело в день считается один раз', () => {
    const r = scoreDeeds([{ kind: 'dishes' }, { kind: 'dishes' }, { kind: 'trash' }]);
    expect(r.counted).toBe(2);
    expect(r.points).toBe(8 + 6);
    expect(r.items.map((x) => x.counted)).toEqual([true, false, true]);
  });
  it('своё дело можно записать дважды, третье не засчитывается', () => {
    const r = scoreDeeds([{ kind: 'custom' }, { kind: 'custom' }, { kind: 'custom' }]);
    expect(r.counted).toBe(2);
  });
  it('в день засчитывается не больше пяти дел', () => {
    const rows = ['dishes', 'trash', 'tidy', 'cook', 'laundry', 'table', 'hug'].map((kind) => ({ kind }));
    const r = scoreDeeds(rows);
    expect(r.counted).toBe(DEED_DAY_CAP);
    expect(r.items.slice(DEED_DAY_CAP).every((x) => !x.counted && x.points === 0)).toBe(true);
    expect(r.points).toBe(8 + 6 + 8 + 10 + 8);
  });
  it('неизвестный вид дела очков не даёт', () => {
    expect(scoreDeeds([{ kind: 'hack' }]).points).toBe(0);
  });
  it('статус кнопки: можно, уже сделано сегодня, дневной лимит', () => {
    expect(deedStatus([], 'dishes')).toBe('ok');
    expect(deedStatus([{ kind: 'dishes' }], 'dishes')).toBe('kind');
    expect(deedStatus([{ kind: 'custom' }], 'custom')).toBe('ok');
    expect(deedStatus(['dishes', 'trash', 'tidy', 'cook', 'laundry'].map((kind) => ({ kind })), 'hug')).toBe('cap');
  });
});

import { deedJournal, deedSummary } from './deeds';
describe('журнал и сводка доброты', () => {
  const rows = [
    { id: 1, date: '2026-11-18', kind: 'dishes' }, { id: 2, date: '2026-11-19', kind: 'dishes' }, { id: 3, date: '2026-11-19', kind: 'dishes' },
    { id: 4, date: '2026-11-20', kind: 'hug' }, { id: 5, date: '2026-11-20', kind: 'pet' }, { id: 6, date: '2026-11-10', kind: 'thanks' },
  ];
  it('журнал: новые дни сверху, повтор того же дела отмечен как незасчитанный', () => {
    const j = deedJournal(rows);
    expect(j.map((x) => x.id)).toEqual([5, 4, 3, 2, 1, 6]);
    expect(j.find((x) => x.id === 3)!.counted).toBe(false);
    expect(j.find((x) => x.id === 2)!.counted).toBe(true);
  });
  it('сводка: всего, неделя, серия дней подряд, по категориям', () => {
    const s = deedSummary(rows, '2026-11-20');
    expect(s.total).toBe(5);
    expect(s.week).toBe(4);               // 18, 19, 20 (10 ноября вне недели)
    expect(s.today).toBe(2);
    expect(s.streak).toBe(3);
    expect(s.bestStreak).toBe(3);
    expect(s.days).toBe(4);
    expect(s.byCat.home).toBe(2); expect(s.byCat.family).toBe(1); expect(s.byCat.nature).toBe(1); expect(s.byCat.words).toBe(1);
  });
  it('серия не обрывается из-за пустого сегодня', () => {
    expect(deedSummary(rows.filter((r) => r.date !== '2026-11-20'), '2026-11-20').streak).toBe(2);
    expect(deedSummary(rows.filter((r) => r.date === '2026-11-10'), '2026-11-20').streak).toBe(0);
  });
});

import { kindRank } from './deeds';
describe('звания доброты', () => {
  it('звание растёт с числом дел, прогресс до следующего', () => {
    expect(kindRank(0).rank.name).toBe('Росток добра');
    expect(kindRank(4).next!.name).toBe('Помощник');
    expect(kindRank(4).left).toBe(1);
    expect(kindRank(5).rank.name).toBe('Помощник');
    expect(kindRank(5).progress).toBe(0);
    expect(kindRank(10).progress).toBeCloseTo(0.5);
    expect(kindRank(999).rank.name).toBe('Сердце семьи');
    expect(kindRank(999).next).toBeNull();
  });
});
