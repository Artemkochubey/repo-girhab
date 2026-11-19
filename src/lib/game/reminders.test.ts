import { describe, it, expect } from 'vitest';
import { eveningReminder, type ReminderInput } from './reminders';
import { QUEST_SETS, scaleQuests, findSet } from './questSets';
import { validQuestList } from './quests';

const base: ReminderInput = { hour: 20, fromHour: 19, isToday: true, points: 20, goal: 60, superGoal: 100, warmupDone: false, habitsLeft: 3, quests: [] };

describe('вечерние напоминания', () => {
  it('до заданного часа и выключенные не показываются', () => {
    expect(eveningReminder({ ...base, hour: 18 })).toBeNull();
    expect(eveningReminder({ ...base, fromHour: -1 })).toBeNull();
    expect(eveningReminder({ ...base, isToday: false })).toBeNull();
  });
  it('считает, сколько не хватает до нормы и сколько часов осталось', () => {
    const r = eveningReminder(base)!;
    expect(r).toMatchObject({ kind: 'goal', left: 40, hoursLeft: 4, title: 'До нормы ещё 40 оч.' });
  });
  it('после нормы напоминает о супер-цели, при максимуме молчит', () => {
    expect(eveningReminder({ ...base, points: 70 })).toMatchObject({ kind: 'super', left: 30 });
    expect(eveningReminder({ ...base, points: 100 })).toBeNull();
  });
  it('идеи: сначала квесты с большим опытом, зарядка и привычки только если не сделаны', () => {
    const r = eveningReminder({ ...base, quests: [{ t: 'A', xp: 10, completed: false, pending: false }, { t: 'B', xp: 30, completed: false, pending: false }, { t: 'C', xp: 50, completed: true, pending: false }] })!;
    expect(r.ideas[0]).toBe('Квест «B»: +30');
    expect(r.ideas).toContain('Зарядка: +10');
    expect(r.ideas.length).toBeLessThanOrEqual(4);
    const done = eveningReminder({ ...base, warmupDone: true, habitsLeft: 0 })!;
    expect(done.ideas.some((x) => x.startsWith('Зарядка') || x.startsWith('Привычки'))).toBe(false);
  });
});

describe('наборы квестов', () => {
  it('все готовые наборы корректны (1–5 квестов) и id уникальны', () => {
    expect(new Set(QUEST_SETS.map((s) => s.id)).size).toBe(QUEST_SETS.length);
    for (const s of QUEST_SETS) expect(validQuestList(s.items)).toBe(true);
  });
  it('масштаб минут по норме, привычки не меняются, отметки сбрасываются', () => {
    const sport = QUEST_SETS.find((s) => s.id === 'sport')!;
    const kid = scaleQuests(sport.items, 40);
    expect(kid.find((x) => x.k === 'workout')!.m).toBe(40);
    expect(kid.find((x) => x.k === 'habits')!.m).toBe(2);
    expect(kid.every((x) => !x.done && !x.pending)).toBe(true);
    expect(scaleQuests(sport.items, 60).find((x) => x.k === 'workout')!.m).toBe(60);
  });
  it('поиск набора: готовый масштабируется, свой нет', () => {
    const custom = [{ id: 'c1', name: 'Мой', emoji: '⭐', items: [{ t: 'x', xp: 5, k: 'manual' as const }] }];
    expect(findSet('weekend', custom)).toMatchObject({ scaled: true });
    expect(findSet('c1', custom)).toMatchObject({ scaled: false });
    expect(findSet('zzz', custom)).toBeNull();
  });
});
