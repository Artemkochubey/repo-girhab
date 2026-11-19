import { describe, it, expect } from 'vitest';
import { dayPoints, streakLength } from './points';
import { canBuyTalent, TALENTS, bossBonuses, luckBonuses, spentPoints, directionPoints, hasShield } from './talents';
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
    expect(dayPoints(day({ workoutMinutes: 100 }), hero({ talents: ['wa1', 'wa1', 'wa1'] })).total).toBe(132);
  });
  it('плоские бонусы по порогам', () => {
    const h = hero({ talents: ['wa2'] });
    expect(dayPoints(day({ workoutMinutes: 19 }), h).flat).toBe(0);
    expect(dayPoints(day({ workoutMinutes: 20 }), h).flat).toBe(2);
  });
  it('серийник ограничен +3 на ранг', () => {
    expect(dayPoints(day(), hero({ cls: 'p', talents: ['pb1'] }), 25).flat).toBe(3);
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
  it('48 талантов: 4 класса × 3 направления × 4 яруса, уникальные id', () => {
    expect(TALENTS).toHaveLength(48);
    expect(new Set(TALENTS.map((t) => t.id)).size).toBe(48);
    for (const c of ['w', 'm', 'b', 'p']) for (const d of [0, 1, 2]) expect(TALENTS.filter((t) => t.cls === c && t.dir === d).map((t) => t.tier)).toEqual([1, 2, 3, 4]);
  });
  it('каждый уровень со 2-го по 13-й открывает новый талант класса', () => {
    for (const c of ['w', 'm', 'b', 'p']) expect(TALENTS.filter((t) => t.cls === c).map((t) => t.unlock).sort((x, y) => x - y)).toEqual([2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]);
  });
  it('бонус ранга маленький и умножается на ранг', () => {
    const base = dayPoints(day({ workoutMinutes: 100 }), hero({ talents: [] })).total;
    expect(base).toBe(120);
    expect(dayPoints(day({ workoutMinutes: 100 }), hero({ talents: ['wa1'] })).total).toBe(124);
    expect(dayPoints(day({ workoutMinutes: 100 }), hero({ talents: ['wa1', 'wa1', 'wa1'] })).total).toBe(132);
  });
  it('плоские бонусы и «все очки» по рангам', () => {
    expect(dayPoints(day({ workoutMinutes: 45 }), hero({ talents: ['wa2', 'wa2', 'wa3'] })).flat).toBe(4 + 3);
    expect(dayPoints(day({ workoutMinutes: 100 }), hero({ talents: ['wa4', 'wa4'] })).total).toBe(Math.round(100 * 1.24));
  });
  it('чужой класс не действует', () => {
    expect(dayPoints(day({ workoutMinutes: 100 }), hero({ cls: 'm', talents: ['wa1', 'wa1', 'wa1'] })).total).toBe(100);
    expect(spentPoints(['wa1', 'ma1'], 'w')).toBe(1);
    expect(hasShield(['pb3'], 'w')).toBe(false);
    expect(hasShield(['pb3'], 'p')).toBe(true);
  });
  it('старые id талантов игнорируются', () => {
    expect(spentPoints(['w1a', 'u2b'], 'w')).toBe(0);
  });
  it('бонусы босса и удачи считаются по рангам', () => {
    expect(bossBonuses(['wc1', 'wc1', 'wc2'], 'w')).toEqual({ boss: 0.04, weak: 0.04 });
    expect(luckBonuses(['mc1', 'mc3', 'mc3'], 'm')).toEqual({ legend: 0.02, rare: 0.02 });
  });
  it('серия: ранги умножают бонус', () => {
    expect(dayPoints(day(), hero({ cls: 'p', talents: ['pb1', 'pb1'] }), 20).flat).toBe(6);
  });
  it('покупка: уровень, очки, ранги, очки в направлении', () => {
    expect(canBuyTalent('wa1', [], 'w', 1).ok).toBe(false); // нет очков
    expect(canBuyTalent('wa1', [], 'w', 2).ok).toBe(true);
    expect(canBuyTalent('wa1', [], null, 5).ok).toBe(false);
    expect(canBuyTalent('ma1', [], 'w', 5).ok).toBe(false); // чужой класс
    expect(canBuyTalent('wa2', ['wa1', 'wa1'], 'w', 4).ok).toBe(false); // ещё закрыт уровнем 5
    expect(canBuyTalent('wa2', ['wa1', 'wa1'], 'w', 5).ok).toBe(true);
    expect(canBuyTalent('wa2', ['wa1'], 'w', 5).ok).toBe(false); // нужно 2 оч. в направлении
    expect(canBuyTalent('wa1', ['wa1', 'wa1', 'wa1'], 'w', 10).ok).toBe(false); // макс. ранг
    expect(canBuyTalent('wa1', ['wa1'], 'w', 2).ok).toBe(false); // очки закончились
    expect(canBuyTalent('pb3', [], 'p', 12).ok).toBe(false);
    expect(directionPoints(['wa1', 'wa2', 'wb1'], 'w', 0)).toBe(2);
  });
  it('щит серии качается только на 1 ранг', () => {
    expect(canBuyTalent('pb3', ['pb1', 'pb1', 'pb1', 'pb2', 'pb2', 'pb3'], 'p', 20).ok).toBe(false);
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

import { AVATARS } from './avatars';
describe('аватары', () => {
  it('уникальны и достаточно короткие для хранения', () => {
    expect(new Set(AVATARS).size).toBe(AVATARS.length);
    expect(AVATARS.every((e) => e.length <= 8)).toBe(true);
    expect(AVATARS.length).toBeGreaterThan(50);
  });
});

import { EXERCISES, MUSCLE_IDS, entryWeights, muscleIntensity, muscleLoads, intensityFloor } from './muscles';
import { ANATOMY } from '../anatomy-data';
describe('мышцы', () => {
  it('каталог: уникальные id, веса 0..1 и только известные мышцы', () => {
    expect(new Set(EXERCISES.map((e) => e.id)).size).toBe(EXERCISES.length);
    for (const e of EXERCISES) for (const [m, w] of Object.entries(e.w)) {
      expect(MUSCLE_IDS).toContain(m);
      expect(w).toBeGreaterThan(0); expect(w).toBeLessThanOrEqual(1);
    }
  });
  it('на силуэте есть все группы мышц', () => {
    const used = new Set([...ANATOMY.front, ...ANATOMY.back].map((s) => s.m).filter(Boolean));
    for (const m of MUSCLE_IDS) expect(used.has(m)).toBe(true);
  });
  it('нагрузка: период, веса, своя тренировка', () => {
    const entries = [
      { date: '2026-11-19', minutes: 30, exercise: 'pushups' },
      { date: '2026-11-10', minutes: 100, exercise: 'pushups' },
      { date: '2026-11-19', minutes: 20, exercise: 'custom', muscles: ['abs', 'glutes'] },
      { date: '2026-11-19', minutes: 50 },
    ];
    const l = muscleLoads(entries, '2026-11-13', '2026-11-19');
    expect(l.chest).toBe(30);
    expect(l.triceps).toBe(24);
    expect(l.abs).toBe(30 * 0.3 + 20);
    expect(l.glutes).toBe(20);
    expect(l.quads).toBe(0);
    expect(entryWeights({ exercise: 'custom', muscles: ['nope', 'abs'] })).toEqual({ abs: 1 });
  });
  it('интенсивность: чем больше нагрузка, тем краснее, и планка защищает от «всё красное»', () => {
    const l = muscleLoads([{ date: 'd', minutes: 10, exercise: 'pushups' }], 'd', 'd');
    const small = muscleIntensity(l, intensityFloor(1));
    expect(small.chest).toBe(1);                   // 10 мин при планке 10
    const week = muscleIntensity(l, intensityFloor(7));
    expect(week.chest).toBeLessThan(0.2);          // одна тренировка за неделю — бледно
    expect(small.triceps).toBeLessThan(small.chest);
    expect(small.quads).toBe(0);
  });
});
