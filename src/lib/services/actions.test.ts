import { describe, it, expect, beforeEach } from 'vitest';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { openDb, type Db } from '../db/client';
import { eq } from 'drizzle-orm';
import * as s from '../db/schema';
import { HttpError, runAction, type Ctx } from './actions';
import { loadFamily } from './load';
import { adminView } from './view';

const NOW = new Date('2026-11-19T05:00:00Z'); // 12:00 в Новосибирске
let db: Db;
const kid: Ctx = { memberId: 2, parent: false, now: NOW };
const dad: Ctx = { memberId: 1, parent: true, now: NOW };
const err = (fn: () => unknown) => { try { fn(); } catch (e) { return e as HttpError; } return null; };

beforeEach(() => {
  db = openDb(':memory:');
  migrate(db, { migrationsFolder: './drizzle' });
  db.insert(s.config).values({ id: 1, loot: ['a'], lootRare: ['b'], lootLegend: ['c'] }).run();
  for (const [i, parent] of [[1, true], [2, false]] as const) {
    db.insert(s.member).values({ name: 'm' + i, isParent: parent, createdAt: '2026-11-01T00:00:00Z' }).run();
    db.insert(s.hero).values({ memberId: i, clsChosen: true, clsChangedAt: '2026-11-01T00:00:00Z' }).run();
  }
  db.insert(s.questOverride).values([
    { memberId: 1, date: 'default', items: [{ t: 'дом', xp: 20, k: 'manual' }] },
    { memberId: 2, date: 'default', items: [{ t: 'дом', xp: 20, k: 'manual' }] },
  ]).run();
});

describe('действия', () => {
  it('ребёнок пишет себе, но не другому', () => {
    runAction(db, kid, 'addWorkout', { minutes: 30 });
    expect(err(() => runAction(db, kid, 'addWorkout', { memberId: 1, minutes: 30 }))?.status).toBe(403);
  });
  it('окно 7 дней и будущее', () => {
    expect(err(() => runAction(db, kid, 'addWorkout', { minutes: 5, date: '2026-11-10' }))?.status).toBe(403);
    expect(err(() => runAction(db, kid, 'addWorkout', { minutes: 5, date: '2026-11-20' }))?.status).toBe(403);
    expect(err(() => runAction(db, dad, 'addWorkout', { memberId: 2, minutes: 5, date: '2026-11-20' }))?.status).toBe(403);
    runAction(db, kid, 'addWorkout', { minutes: 5, date: '2026-11-12' });
  });
  it('валидация минут', () => {
    expect(err(() => runAction(db, kid, 'addWorkout', { minutes: 0 }))?.status).toBe(400);
    expect(err(() => runAction(db, kid, 'addStudy', { minutes: 5, kind: 'Танцы' }))?.status).toBe(400);
  });
  it('снять зарядку может только родитель', () => {
    runAction(db, kid, 'toggleWarmup', {});
    expect(err(() => runAction(db, kid, 'toggleWarmup', {}))?.status).toBe(403);
    runAction(db, dad, 'toggleWarmup', { memberId: 2 });
  });
  it('ручной квест: ждёт подтверждения, опыт после', () => {
    runAction(db, kid, 'markQuest', { index: 0 });
    const xp = () => loadFamily(db, NOW).family.members.get(2)!.xp;
    expect(xp()).toBe(0);
    runAction(db, dad, 'confirmQuest', { memberId: 2, index: 0 });
    expect(xp()).toBe(20);
    expect(err(() => runAction(db, kid, 'markQuest', { index: 0 }))?.status).toBe(403); // снять подтверждённый
  });
  it('ребёнок может отозвать неподтверждённую отметку', () => {
    runAction(db, kid, 'markQuest', { index: 0 });
    expect(runAction(db, kid, 'markQuest', { index: 0 })).toEqual({ done: false, pending: false });
  });
  it('смена класса: подтверждение и пауза', () => {
    expect(err(() => runAction(db, kid, 'setClass', { cls: 'm' }))?.status).toBe(400);
    runAction(db, { ...kid, now: new Date('2026-11-01T10:00:00Z') }, 'setClass', { cls: 'm', confirm: true });
    expect(err(() => runAction(db, { ...kid, now: new Date('2026-11-03T10:00:00Z') }, 'setClass', { cls: 'b', confirm: true }))?.status).toBe(403);
    runAction(db, { ...kid, now: new Date('2026-11-09T10:00:00Z') }, 'setClass', { cls: 'b', confirm: true });
  });
  it('таланты: нужны очки и уровень', () => {
    expect(err(() => runAction(db, kid, 'buyTalent', { id: 'wa1' }))?.status).toBe(400);
    runAction(db, kid, 'addWorkout', { minutes: 200 });
    runAction(db, kid, 'buyTalent', { id: 'wa1' });
    expect(db.select().from(s.hero).all()[1].talents).toEqual(['wa1']);
  });
  it('сундук: только доступные, сохраняется', () => {
    expect(err(() => runAction(db, kid, 'openChest', {}))?.status).toBe(400);
    runAction(db, kid, 'addWorkout', { minutes: 200 });
    const r = runAction(db, { ...kid, rand: () => 0.9 }, 'openChest', {}) as { rarity: string; reward: string };
    expect(r).toEqual({ rarity: 'common', reward: 'a' });
    expect(db.select().from(s.chestOpened).all()).toHaveLength(1);
  });
  it('«Щедрая добыча»: второй приз из сундука', () => {
    runAction(db, kid, 'addWorkout', { minutes: 200 });
    db.update(s.hero).set({ talents: ['fa3c'] }).where(eq(s.hero.memberId, 2)).run();
    const r = runAction(db, { ...kid, rand: () => 0.0 }, 'openChest', {}) as { reward: string };
    expect(r.reward).toContain(' + ');
    runAction(db, { ...kid, rand: () => 0.9 }, 'openChest', {});
    expect(db.select().from(s.chestOpened).all()[1].reward).toBe('a');
  });
  it('«Торговец»: скидка на награды за очки', () => {
    runAction(db, kid, 'addWorkout', { minutes: 200 });
    db.insert(s.shopItem).values({ name: 'Приз', emoji: '🎁', price: 100, currency: 'points', active: true }).run();
    db.update(s.hero).set({ talents: ['fa2b', 'fa2b'] }).where(eq(s.hero.memberId, 2)).run();
    runAction(db, kid, 'buyItem', { itemId: 1 });
    expect(db.select().from(s.shopPurchase).all()[0].price).toBe(94);
  });
  it('наборы квестов: применение, масштаб по норме, свои наборы', () => {
    expect(err(() => runAction(db, kid, 'applyQuestSet', { setId: 'sport', memberIds: [2] }))?.status).toBe(403);
    db.update(s.member).set({ goal: 30 }).where(eq(s.member.id, 2)).run();
    expect(runAction(db, dad, 'applyQuestSet', { setId: 'sport', memberIds: [2] })).toEqual({ applied: 1 });
    const q = db.select().from(s.questOverride).where(eq(s.questOverride.memberId, 2)).all().find((x) => x.date === '2026-11-19')!;
    expect(q.items.find((x) => x.k === 'workout')!.m).toBe(30);   // 60 мин × 30/60
    expect(err(() => runAction(db, dad, 'applyQuestSet', { setId: 'нет', memberIds: [2] }))?.status).toBe(404);
    expect(err(() => runAction(db, dad, 'applyQuestSet', { setId: 'sport', memberIds: [] }))?.status).toBe(400);
    const id = (runAction(db, dad, 'saveQuestSet', { name: 'Мой', emoji: '⭐', items: [{ t: 'x', xp: 5, k: 'workout', m: 50 }] }) as { id: string }).id;
    runAction(db, dad, 'applyQuestSet', { setId: id, memberIds: [2], date: 'default' });
    const d = db.select().from(s.questOverride).where(eq(s.questOverride.memberId, 2)).all().find((x) => x.date === 'default')!;
    expect(d.items[0].m).toBe(50);                                  // свой набор без масштаба
    runAction(db, dad, 'deleteQuestSet', { id });
    expect(db.select().from(s.config).get()!.questSets).toEqual([]);
  });
  it('час вечернего напоминания: только родитель, -1 выключает', () => {
    expect(err(() => runAction(db, kid, 'setConfig', { reminderHour: 20 }))?.status).toBe(403);
    runAction(db, dad, 'setConfig', { reminderHour: 20 });
    expect(db.select().from(s.config).get()!.reminderHour).toBe(20);
    runAction(db, dad, 'setConfig', { reminderHour: -1 });
    expect(db.select().from(s.config).get()!.reminderHour).toBe(-1);
    expect(err(() => runAction(db, dad, 'setConfig', { reminderHour: 30 }))?.status).toBe(400);
  });
  it('метка «проверить»: подсказывает родителю, не режет очки, «всё в порядке» скрывает', () => {
    for (let i = 0; i < 12; i++) runAction(db, kid, 'addWorkout', { exercise: 'pushups', reps: 95 });
    const before = loadFamily(db, NOW).family.members.get(2)!.days.get('2026-11-19')!.total;
    expect(before).toBeGreaterThan(0);                                       // очки засчитаны, метка ничего не блокирует
    const state = () => adminView(loadFamily(db, NOW).raw, loadFamily(db, NOW).family, { loot: [], lootRare: [], lootLegend: [], questSets: [] });
    const flags = state().review.filter((f) => f.memberId === 2);
    expect(flags).toHaveLength(1);
    expect(flags[0].reasons.some((r) => r.includes('Подход близок к максимуму'))).toBe(true);
    expect(flags[0].reasons.some((r) => r.startsWith('Много подходов'))).toBe(true);
    expect(err(() => runAction(db, kid, 'reviewOk', { memberId: 2, date: '2026-11-19' }))?.status).toBe(403);
    runAction(db, dad, 'reviewOk', { memberId: 2, date: '2026-11-19' });
    expect(state().review.filter((f) => f.memberId === 2)).toHaveLength(0);
    expect(loadFamily(db, NOW).family.members.get(2)!.days.get('2026-11-19')!.total).toBe(before);
  });
  it('квесты и настройки только за PIN', () => {
    const items = [{ t: 'x', xp: 10, k: 'manual' as const }];
    expect(err(() => runAction(db, kid, 'setQuests', { date: 'default', items }))?.status).toBe(403);
    expect(err(() => runAction(db, dad, 'setQuests', { date: 'default', items: [{ ...items[0], xp: 500 }] }))?.status).toBe(400);
    runAction(db, dad, 'setQuests', { memberId: 2, date: 'default', items });
    expect(err(() => runAction(db, kid, 'setConfig', { minutes: 1 }))?.status).toBe(403);
  });
  it('аватар: ребёнок меняет себе из списка, чужие и произвольные нельзя', () => {
    runAction(db, kid, 'setAvatar', { emoji: '🐉', color: '#ef4444' });
    expect(db.select().from(s.member).all()[1]).toMatchObject({ emoji: '🐉', color: '#ef4444' });
    expect(err(() => runAction(db, kid, 'setAvatar', { emoji: '💩' }))?.status).toBe(400);
    expect(err(() => runAction(db, kid, 'setAvatar', { memberId: 1, emoji: '🐉' }))?.status).toBe(403);
    expect(err(() => runAction(db, kid, 'setAvatar', { color: 'red' }))?.status).toBe(400);
    runAction(db, dad, 'setAvatar', { memberId: 2, emoji: '🦄' });
  });
  it('магазин: покупка, нехватка очков, выдача и отмена', () => {
    const itemId = (runAction(db, dad, 'saveShopItem', { name: 'Кино', emoji: '🎬', price: 100, currency: 'points' }) as { id: number }).id;
    expect(err(() => runAction(db, kid, 'saveShopItem', { name: 'x', price: 1 }))?.status).toBe(403);
    expect(err(() => runAction(db, kid, 'buyItem', { itemId }))?.status).toBe(400); // 0 очков
    runAction(db, kid, 'addWorkout', { minutes: 250 });
    const bal = () => loadFamily(db, NOW).family.members.get(2)!;
    const xp = bal().xp;
    const pid = (runAction(db, kid, 'buyItem', { itemId }) as { id: number }).id;
    expect(bal().balance).toBe(xp - 100);
    expect(bal().xp).toBe(xp);
    expect(err(() => runAction(db, kid, 'cancelPurchase', { id: pid }))?.status).toBe(403);
    runAction(db, dad, 'cancelPurchase', { id: pid });
    expect(bal().balance).toBe(xp);
    expect(err(() => runAction(db, dad, 'fulfillPurchase', { id: pid }))?.status).toBe(409);
  });
  it('магазин: цена в сундуках и скрытые награды', () => {
    const chestItem = (runAction(db, dad, 'saveShopItem', { name: 'Ужин', price: 1, currency: 'chests' }) as { id: number }).id;
    expect(err(() => runAction(db, kid, 'buyItem', { itemId: chestItem }))?.status).toBe(400);
    runAction(db, kid, 'addWorkout', { minutes: 300 }); // даёт уровни → сундуки
    const before = loadFamily(db, NOW).family.members.get(2)!.chestsAvailable;
    runAction(db, kid, 'buyItem', { itemId: chestItem });
    expect(loadFamily(db, NOW).family.members.get(2)!.chestsAvailable).toBe(before - 1);
    runAction(db, dad, 'archiveShopItem', { id: chestItem, active: false });
    expect(err(() => runAction(db, kid, 'buyItem', { itemId: chestItem }))?.status).toBe(404);
  });
  it('первый выбор класса: до него бонусов нет, талантов и подкласса нет', () => {
    db.update(s.hero).set({ clsChosen: false }).run();
    runAction(db, kid, 'addWorkout', { minutes: 250 });
    const st = () => loadFamily(db, NOW).family.members.get(2)!;
    expect(st().hero.cls).toBeNull();
    const base = st().xp;
    expect(err(() => runAction(db, kid, 'buyTalent', { id: 'wa1' }))?.status).toBe(400);
    expect(err(() => runAction(db, kid, 'setSub', { sub: 'm' }))?.status).toBe(400);
    expect(err(() => runAction(db, kid, 'setClass', { cls: 'w' }))?.status).toBe(400); // нужно confirm
    runAction(db, kid, 'setClass', { cls: 'w', confirm: true }); // выбор «воин» тоже засчитывается как выбор
    expect(st().hero.cls).toBe('w');
    expect(st().xp).toBeGreaterThan(base); // +20% к тренировке
  });
  it('тренировка с упражнением и своими мышцами', () => {
    runAction(db, kid, 'addWorkout', { minutes: 20, exercise: 'pushups' });
    runAction(db, kid, 'addWorkout', { minutes: 15, exercise: 'custom', muscles: ['abs', 'abs', 'glutes'] });
    runAction(db, kid, 'addWorkout', { minutes: 10 });
    const rows = db.select().from(s.workoutEntry).all();
    expect(rows.map((r) => r.exercise)).toEqual(['pushups', 'custom', null]);
    expect(rows[1].muscles).toEqual(['abs', 'glutes']);
    expect(err(() => runAction(db, kid, 'addWorkout', { minutes: 5, exercise: 'qwerty' }))?.status).toBe(400);
    expect(err(() => runAction(db, kid, 'addWorkout', { minutes: 5, exercise: 'custom', muscles: [] }))?.status).toBe(400);
    expect(err(() => runAction(db, kid, 'addWorkout', { minutes: 5, exercise: 'custom', muscles: ['wings'] }))?.status).toBe(400);
    const log = loadFamily(db, NOW).family.members.get(2)!;
    expect(log.xp).toBeGreaterThan(0); // очки считаются по минутам, как и раньше
  });
  it('повторы: ставка упражнения, лимиты и защита от накрутки', () => {
    const st = () => loadFamily(db, NOW).family.members.get(2)!;
    runAction(db, kid, 'addWorkout', { exercise: 'pushups', reps: 30 });       // 30 × 0.2 = 6 очков до бонусов
    const row = db.select().from(s.workoutEntry).all()[0];
    expect(row).toMatchObject({ exercise: 'pushups', reps: 30, minutes: 0 });
    const base = st().days.get('2026-11-19')!.stats.workoutMinutes;
    expect(base).toBeCloseTo(6, 1);
    expect(err(() => runAction(db, kid, 'addWorkout', { exercise: 'pushups', reps: 101 }))?.status).toBe(400);      // больше max за подход
    expect(err(() => runAction(db, kid, 'addWorkout', { exercise: 'running', reps: 20 }))?.status).toBe(400);       // нет ставки
    expect(err(() => runAction(db, kid, 'addWorkout', { exercise: 'custom', muscles: ['abs'], reps: 20 }))?.status).toBe(400);
    expect(err(() => runAction(db, kid, 'addWorkout', { exercise: 'pushups', reps: 0 }))?.status).toBe(400);
    expect(err(() => runAction(db, kid, 'addWorkout', { exercise: 'pushups' }))?.status).toBe(400);                 // ни минут, ни повторов
    for (let i = 0; i < 10; i++) runAction(db, kid, 'addWorkout', { exercise: 'pushups', reps: 100 });              // пытаемся накрутить
    // 1030 отжиманий: сырых 66,5 очка, после убывающей дневной кривой 53,25 (потолка нет, но дешевеет)
    expect(st().days.get('2026-11-19')!.stats.workoutMinutes).toBeCloseTo(53.25, 1);
  });
  it('семейные квесты: создаёт родитель, ребёнок отмечает «сделали», родитель подтверждает — опыт всем', () => {
    expect(err(() => runAction(db, kid, 'saveFamilyQuest', { title: 'Прогулка', xp: 30, kind: 'manual' }))?.status).toBe(403);
    expect(err(() => runAction(db, dad, 'saveFamilyQuest', { title: 'Прогулка', xp: 500, kind: 'manual' }))?.status).toBe(400);
    expect(err(() => runAction(db, dad, 'saveFamilyQuest', { title: 'x', xp: 10, kind: 'points', target: 3 }))?.status).toBe(400);
    const id = (runAction(db, dad, 'saveFamilyQuest', { title: 'Прогулка', description: 'час на воздухе', xp: 30, kind: 'manual', period: 'day' }) as { id: number }).id;
    db.update(s.questOverride).set({ items: [{ t: 'x', xp: 1, k: 'manual' }] }).run();
    const xp = (m: number) => loadFamily(db, NOW).family.members.get(m)!.xp;
    expect(xp(2)).toBe(0);
    expect(runAction(db, kid, 'markFamilyQuest', { id })).toEqual({ pending: true });
    expect(xp(2)).toBe(0);                                                   // ждёт подтверждения
    expect(runAction(db, kid, 'markFamilyQuest', { id })).toEqual({ pending: false });   // можно отозвать
    runAction(db, kid, 'markFamilyQuest', { id });
    expect(err(() => runAction(db, kid, 'completeFamilyQuest', { id }))?.status).toBe(403);
    runAction(db, dad, 'completeFamilyQuest', { id });
    expect(xp(1)).toBe(30); expect(xp(2)).toBe(30);                          // всем участникам
    expect(err(() => runAction(db, kid, 'markFamilyQuest', { id }))?.status).toBe(409);
    runAction(db, dad, 'completeFamilyQuest', { id, done: false });
    expect(xp(2)).toBe(0);
    runAction(db, dad, 'deleteFamilyQuest', { id });
    expect(db.select().from(s.familyQuest).all()).toHaveLength(0);
  });
  it('семейный квест по очкам нельзя отметить вручную', () => {
    const id = (runAction(db, dad, 'saveFamilyQuest', { title: 'Все вместе', xp: 40, kind: 'points', target: 100, period: 'week' }) as { id: number }).id;
    expect(err(() => runAction(db, kid, 'markFamilyQuest', { id }))?.status).toBe(400);
    expect(err(() => runAction(db, dad, 'completeFamilyQuest', { id }))?.status).toBe(400);
  });
  it('MVP дня сохраняется после конца дня и не меняется от поздних правок', () => {
    const rows = () => db.select().from(s.dayMvp).all().sort((a, b) => a.date.localeCompare(b.date));
    loadFamily(db, NOW);
    expect(db.select().from(s.config).get()!.mvpSince).toBe('2026-11-19');          // дата старта — первый запуск
    expect(rows()).toHaveLength(0);
    db.update(s.config).set({ mvpSince: '2026-11-15' }).run();
    runAction(db, dad, 'addWorkout', { memberId: 2, date: '2026-11-16', minutes: 120 });
    loadFamily(db, NOW);
    expect(rows().map((r) => [r.date, r.memberId])).toEqual([['2026-11-15', 0], ['2026-11-16', 2], ['2026-11-17', 0], ['2026-11-18', 0]]);
    runAction(db, dad, 'addWorkout', { memberId: 1, date: '2026-11-16', minutes: 600 });     // позднее «перебили» — итог дня не меняется
    loadFamily(db, NOW);
    expect(rows().find((r) => r.date === '2026-11-16')!.memberId).toBe(2);
    expect(loadFamily(db, NOW).family.mvp.wins).toEqual({ 2: 1 });
  });
  it('каталог наград: добавляет недостающие, не дублирует и не трогает свои', () => {
    db.update(s.config).set({ loot: ['Мой особый приз', '+10 минут экрана'] }).run();
    expect(err(() => runAction(db, kid, 'addLootFromCatalog', { tier: 'common' }))?.status).toBe(403);
    expect(err(() => runAction(db, dad, 'addLootFromCatalog', { tier: 'nope' }))?.status).toBe(400);
    const r1 = runAction(db, dad, 'addLootFromCatalog', { tier: 'common' }) as { added: number };
    const loot = db.select().from(s.config).get()!.loot;
    expect(loot[0]).toBe('Мой особый приз');
    expect(new Set(loot.map((x) => x.toLowerCase())).size).toBe(loot.length);
    expect(r1.added).toBeGreaterThan(60);
    expect((runAction(db, dad, 'addLootFromCatalog', { tier: 'common' }) as { added: number }).added).toBe(0);   // повтор ничего не добавляет
    runAction(db, dad, 'addLootFromCatalog', { tier: 'rare' });
    expect(db.select().from(s.config).get()!.lootRare.length).toBeGreaterThan(30);
  });
});
