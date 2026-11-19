import { describe, it, expect } from 'vitest';
import { dayPoints, streakLength } from './points';
import { canBuyTalent, talentCost, TALENTS, talentById } from './talents';
import { defaultQuests, questDone, validQuestList, allQuestsDone } from './quests';
import { emptyDay, type HeroBuild } from './types';

const hero = (o: Partial<HeroBuild> = {}): HeroBuild => ({ cls: 'w', sub: null, talents: [], level: 1, ...o });
const day = (o = {}) => ({ ...emptyDay(), ...o });

describe('очки дня', () => {
  const d = day({ workoutMinutes: 30, warmups: 1, habits: 3, books: 1, study: { Языки: 20 } });
  it('маг: бонус только на книги', () => expect(dayPoints(d, hero({ cls: 'm' })).total).toBe(30 + 10 + 15 + 60 + 20));
  it('воин: +20% на тренировку и зарядку', () => expect(dayPoints(d, hero()).total).toBe(36 + 12 + 15 + 50 + 20));
  it('лимит 6 привычек', () => expect(dayPoints(day({ habits: 9 }), hero()).total).toBe(30));
  it('зарядка засчитывается один раз', () => expect(dayPoints(day({ warmups: 3 }), hero({ cls: 'm' })).total).toBe(10));
  it('подкласс: с 5 ур. +10% второй сферы', () => {
    const h = hero({ cls: 'm', sub: 'w', level: 5 });
    expect(dayPoints(day({ workoutMinutes: 100 }), h).total).toBe(110);
    expect(dayPoints(day({ workoutMinutes: 100 }), { ...h, level: 4 }).total).toBe(100);
  });
  it('таланты складываются аддитивно с классом', () => {
    expect(dayPoints(day({ workoutMinutes: 100 }), hero({ talents: ['w1b', 'w2a'] })).total).toBe(155);
  });
  it('плоские бонусы по порогам', () => {
    const h = hero({ talents: ['w3a'] });
    expect(dayPoints(day({ workoutMinutes: 19 }), h).flat).toBe(0);
    expect(dayPoints(day({ workoutMinutes: 20 }), h).flat).toBe(10);
  });
  it('серийник ограничен +10', () => {
    expect(dayPoints(day(), hero({ talents: ['p2b'] }), 25).flat).toBe(10);
  });
  it('опыт квестов входит в очки', () => expect(dayPoints(day({ questXp: 40 }), hero()).total).toBe(40));
});

describe('серия', () => {
  const dates = ['2026-11-19', '2026-11-18', '2026-11-17', '2026-11-16', '2026-11-15'];
  it('считает подряд идущие дни', () => {
    expect(streakLength(dates, (x) => x !== '2026-11-16' && x !== '2026-11-15', false)).toBe(3);
  });
  it('сегодняшний пустой день не обрывает', () => {
    expect(streakLength(dates, (x) => x !== '2026-11-19', false)).toBe(4);
  });
  it('щит прощает один пропуск в неделю', () => {
    expect(streakLength(dates, (x) => x !== '2026-11-17', true)).toBe(4);
    expect(streakLength(dates, (x) => x !== '2026-11-17' && x !== '2026-11-18', true)).toBe(1);
  });
});

describe('таланты', () => {
  it('24 таланта, уникальные id', () => {
    expect(TALENTS).toHaveLength(24);
    expect(new Set(TALENTS.map((t) => t.id)).size).toBe(24);
  });
  it('стоимость', () => {
    expect(talentCost(talentById('w1a')!, 'w')).toBe(1);
    expect(talentCost(talentById('w3a')!, 'w')).toBe(2);
    expect(talentCost(talentById('w3a')!, 'm')).toBe(3);
    expect(talentCost(talentById('m1a')!, 'w')).toBe(1);
  });
  it('требует предыдущий ярус и очки', () => {
    expect(canBuyTalent('w2a', [], 'w', 10).ok).toBe(false);
    expect(canBuyTalent('w1a', [], 'w', 1).ok).toBe(false); // 0 очков на 1 ур.
    expect(canBuyTalent('w1a', [], 'w', 2).ok).toBe(true);
    expect(canBuyTalent('w2a', ['w1a'], 'w', 3).ok).toBe(true);
  });
  it('варианты яруса взаимоисключающие', () => {
    expect(canBuyTalent('w1b', ['w1a'], 'w', 10).ok).toBe(false);
  });
});

describe('квесты', () => {
  it('генерация детерминирована и без повторов', () => {
    const a = defaultQuests(1, '2026-11-19', 60);
    expect(a).toEqual(defaultQuests(1, '2026-11-19', 60));
    expect(a).toHaveLength(3);
    expect(new Set(a.map((q) => q.t)).size).toBe(3);
  });
  it('масштаб по норме', () => {
    const big = defaultQuests(7, '2026-11-20', 60).find((q) => q.k === 'workout');
    const small = defaultQuests(7, '2026-11-20', 40).find((q) => q.k === 'workout');
    if (big && small) expect(small.m!).toBeLessThan(big.m!);
  });
  it('автозачёт', () => {
    expect(questDone({ t: 'x', xp: 5, k: 'workout', m: 20 }, day({ workoutMinutes: 20 }))).toBe(true);
    expect(questDone({ t: 'x', xp: 5, k: 'study', kind: 'Языки', m: 15 }, day({ study: { Учёба: 60 } }))).toBe(false);
    expect(questDone({ t: 'x', xp: 5, k: 'study', kind: 'any', m: 15 }, day({ study: { Учёба: 15 } }))).toBe(true);
  });
  it('ручной ждёт подтверждения', () => {
    const q = { t: 'x', xp: 5, k: 'manual' as const, done: true, pending: true };
    expect(questDone(q, day())).toBe(false);
    expect(questDone({ ...q, pending: false }, day())).toBe(true);
  });
  it('валидация: 1–5 квестов, название ≤60, опыт 1–100', () => {
    const q = { t: 'ok', xp: 10, k: 'manual' as const };
    expect(validQuestList([])).toBe(false);
    expect(validQuestList(Array(6).fill(q))).toBe(false);
    expect(validQuestList([{ ...q, xp: 101 }])).toBe(false);
    expect(validQuestList([{ ...q, t: 'я'.repeat(61) }])).toBe(false);
    expect(validQuestList([q])).toBe(true);
  });
  it('сундук за день: все квесты выполнены', () => {
    const qs = [{ t: 'z', xp: 5, k: 'warmup' as const }];
    expect(allQuestsDone(qs, day())).toBe(false);
    expect(allQuestsDone(qs, day({ warmups: 1 }))).toBe(true);
  });
});

import { questHint, questProgress } from './quests';
describe('подсказки квестов', () => {
  it('текст и прогресс', () => {
    const q = { t: 'x', xp: 5, k: 'workout' as const, m: 40 };
    expect(questHint(q)).toContain('40 мин');
    expect(questProgress(q, day({ workoutMinutes: 25 }))).toEqual({ have: 25, need: 40, unit: 'мин' });
    expect(questProgress({ t: 'x', xp: 5, k: 'manual' }, day())).toBeNull();
    expect(questHint({ t: 'x', xp: 5, k: 'study', kind: 'Языки', m: 15 })).toContain('«Языки»');
    expect(questProgress({ t: 'x', xp: 5, k: 'study', kind: 'any', m: 15 }, day({ study: { Языки: 5, Книги: 7 } }))?.have).toBe(12);
  });
});

describe('пояснения квестов', () => {
  it('у шаблонов есть пояснения, длина ограничена 120', () => {
    expect(defaultQuests(1, '2026-11-19', 60).every((q) => !!q.d)).toBe(true);
    const q = { t: 'ok', xp: 10, k: 'manual' as const };
    expect(validQuestList([{ ...q, d: 'я'.repeat(121) }])).toBe(false);
    expect(validQuestList([{ ...q, d: 'Убрать комнату' }])).toBe(true);
  });
});
