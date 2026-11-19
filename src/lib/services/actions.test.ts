import { describe, it, expect, beforeEach } from 'vitest';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { openDb, type Db } from '../db/client';
import * as s from '../db/schema';
import { HttpError, runAction, type Ctx } from './actions';
import { loadFamily } from './load';

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
    expect(err(() => runAction(db, kid, 'buyTalent', { id: 'w1a' }))?.status).toBe(400);
    runAction(db, kid, 'addWorkout', { minutes: 200 });
    runAction(db, kid, 'buyTalent', { id: 'w1a' });
    expect(db.select().from(s.hero).all()[1].talents).toEqual(['w1a']);
  });
  it('сундук: только доступные, сохраняется', () => {
    expect(err(() => runAction(db, kid, 'openChest', {}))?.status).toBe(400);
    runAction(db, kid, 'addWorkout', { minutes: 200 });
    const r = runAction(db, { ...kid, rand: () => 0.9 }, 'openChest', {}) as { rarity: string; reward: string };
    expect(r).toEqual({ rarity: 'common', reward: 'a' });
    expect(db.select().from(s.chestOpened).all()).toHaveLength(1);
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
    expect(err(() => runAction(db, kid, 'buyTalent', { id: 'w1a' }))?.status).toBe(400);
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
    expect(st().days.get('2026-11-19')!.stats.workoutMinutes).toBeCloseTo(22.5, 1);                                 // потолок упражнения за день
  });
});
