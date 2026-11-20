import { describe, it, expect, beforeEach } from 'vitest';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { openDb, type Db } from '../db/client';
import { eq } from 'drizzle-orm';
import * as s from '../db/schema';
import { HttpError, runAction, type Ctx } from './actions';
import { loadFamily } from './load';
import { tvRecord } from './tvRecord';
import { adminView, memberDetail, ratingView, ratingWeekView, tvState } from './view';

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
    expect(r).toEqual({ rarity: 'common', reward: 'a', artifact: null, gear: null, talisman: false, boss: false, why: null });
    const { raw, family } = loadFamily(db, NOW);
    expect(memberDetail(raw, family, family.members.get(2)!).chestLog).toEqual([{ n: 1, date: '2026-11-19', rarity: 'common', reward: 'a', artifact: null, gear: null, status: 'bag', deliveredOn: null }]);   // история «что выпало»
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
  it('сумка: приз копится, ребёнок просит выдать, родитель выдаёт', () => {
    runAction(db, kid, 'addWorkout', { minutes: 300 });
    for (let i = 0; i < 3; i++) runAction(db, { ...kid, rand: () => 0.9 }, 'openChest', {});
    const log = () => { const { raw, family } = loadFamily(db, NOW); return memberDetail(raw, family, family.members.get(2)!).chestLog; };
    expect(log().map((c) => c.status)).toEqual(['bag', 'bag', 'bag']);
    expect(err(() => runAction(db, kid, 'deliverChestPrize', { n: 1 }))?.status).toBe(403);          // выдаёт только родитель
    runAction(db, kid, 'useChestPrize', { n: 1 });
    expect(log().find((c) => c.n === 1)!.status).toBe('requested');
    expect(err(() => runAction(db, kid, 'useChestPrize', { n: 1 }))?.status).toBe(409);               // уже просили
    expect(err(() => runAction(db, kid, 'useChestPrize', { n: 99 }))?.status).toBe(404);
    const adm = () => { const { raw, family } = loadFamily(db, NOW); return adminView(raw, family, { loot: [], lootRare: [], lootLegend: [], questSets: [] }).prizesRequested; };
    expect(adm()).toMatchObject([{ memberId: 2, n: 1 }]);
    runAction(db, kid, 'useChestPrize', { n: 1, undo: true });                                         // передумал
    expect(log().find((c) => c.n === 1)!.status).toBe('bag');
    runAction(db, dad, 'deliverChestPrize', { memberId: 2, n: 1 });
    expect(log().find((c) => c.n === 1)).toMatchObject({ status: 'delivered', deliveredOn: '2026-11-19' });
    expect(err(() => runAction(db, kid, 'useChestPrize', { n: 1 }))?.status).toBe(409);               // уже выдан
    runAction(db, dad, 'deliverChestPrize', { memberId: 2, n: 1, undo: true });
    expect(log().find((c) => c.n === 1)!.status).toBe('bag');
    expect(runAction(db, dad, 'deliverAllChestPrizes', { memberId: 2 })).toEqual({ delivered: 3 });
    expect(log().every((c) => c.status === 'delivered')).toBe(true);
    runAction(db, dad, 'deliverChestPrize', { memberId: 2, n: 2, undo: true });
    expect(err(() => runAction(db, dad, 'useChestPrize', { memberId: 2, n: 2 }))).toBeNull();                // родитель тоже может запросить за ребёнка
  });
  const WED = new Date('2026-11-18T05:00:00Z');
  const detail = (id = 2, now = NOW) => { const { raw, family } = loadFamily(db, now); return memberDetail(raw, family, family.members.get(id)!); };
  const giveChest = (n: number, artifact: string | null) => db.insert(s.chestOpened).values({ memberId: 2, n, rarity: 'common', reward: 'a', date: '2026-11-10', artifact }).run();

  it('недельная цель: выбор в пн–ср, один раз, родитель может менять, свои цели и подтверждение', () => {
    expect(err(() => runAction(db, kid, 'chooseGoal', { kind: 'workout', tier: 'mid' }))?.status).toBe(403);       // четверг: поздно
    const wed = { ...kid, now: WED };
    expect(err(() => runAction(db, wed, 'chooseGoal', { kind: 'nope', tier: 'mid' }))?.status).toBe(400);
    expect(err(() => runAction(db, wed, 'chooseGoal', { kind: 'habits', tier: 'mid' }))?.status).toBe(400);        // нет привычек
    expect(runAction(db, wed, 'chooseGoal', { kind: 'workout', tier: 'mid' })).toMatchObject({ target: 200 });
    expect(detail(2, WED).goal.current).toMatchObject({ kind: 'workout', target: 200, weekStart: '2026-11-16' });
    expect(err(() => runAction(db, wed, 'chooseGoal', { kind: 'study', tier: 'easy' }))?.status).toBe(409);
    runAction(db, { ...dad, now: NOW }, 'chooseGoal', { memberId: 2, kind: 'study', tier: 'easy' });             // родитель в четверг и поверх выбранной
    expect(detail(2).goal.current).toMatchObject({ kind: 'study', target: 120 });
    // своя цель родителя и подтверждение
    expect(err(() => runAction(db, kid, 'setCustomGoal', { title: 'x', tier: 'easy' }))?.status).toBe(403);
    runAction(db, dad, 'setCustomGoal', { memberId: 2, title: 'Прочитать 2 главы', tier: 'hard' });
    expect(detail().goal.current).toMatchObject({ title: 'Прочитать 2 главы', manual: true, done: false, tier: 'hard' });
    expect(err(() => runAction(db, kid, 'confirmGoal', { weekStart: '2026-11-16' }))?.status).toBe(403);
    runAction(db, dad, 'confirmGoal', { memberId: 2, weekStart: '2026-11-16' });
    expect(detail().goal.current).toMatchObject({ done: true });
    runAction(db, dad, 'clearGoal', { memberId: 2 });
    expect(detail().goal.current).toBeNull();
  });
  it('артефакты: щит и удвоитель применяются к дню, ключ даёт сундук, талисман делает сундук редким', () => {
    giveChest(1, 'shield'); giveChest(2, 'doubler'); giveChest(3, 'key'); giveChest(4, 'luck');
    expect(detail().artifacts.map((x) => x.kind).sort()).toEqual(['doubler', 'key', 'luck', 'shield']);
    expect(err(() => runAction(db, kid, 'useArtifact', { key: 'chest:99' }))?.status).toBe(404);
    // щит: только пропущенный прошедший день
    expect(err(() => runAction(db, kid, 'useArtifact', { key: 'chest:1' }))?.status).toBe(400);                   // не выбран день
    expect(err(() => runAction(db, kid, 'useArtifact', { key: 'chest:1', date: '2026-11-19' }))?.status).toBe(400); // сегодня
    runAction(db, kid, 'addWorkout', { minutes: 40, date: '2026-11-17' });
    expect(err(() => runAction(db, kid, 'useArtifact', { key: 'chest:1', date: '2026-11-17' }))?.status).toBe(400); // в тот день была активность
    expect(detail().artifactDates.shield).not.toContain('2026-11-17');
    expect(detail().artifactDates.shield).toContain('2026-11-16');
    runAction(db, kid, 'useArtifact', { key: 'chest:1', date: '2026-11-16' });
    expect(detail().artifacts.find((x) => x.key === 'chest:1')).toMatchObject({ status: 'active', activeFor: '2026-11-16' });
    expect(err(() => runAction(db, kid, 'useArtifact', { key: 'chest:1', date: '2026-11-15' }))?.status).toBe(409);  // уже использован
    // удвоитель: очки сегодняшнего дня растут
    runAction(db, kid, 'addWorkout', { minutes: 40 });
    const before = detail().day.points;
    runAction(db, kid, 'useArtifact', { key: 'chest:2', date: '2026-11-19' });
    expect(detail().day.points).toBe(before + Math.min(before, 70));
    // ключ: +1 сундук
    const chests = detail().chests.earned;
    runAction(db, kid, 'useArtifact', { key: 'chest:3' });
    expect(detail().chests.earned).toBe(chests + 1);
    // талисман: следующий сундук не обычный (rand 0.9 дал бы обычный)
    runAction(db, kid, 'useArtifact', { key: 'chest:4' });
    expect(detail().artifacts.find((x) => x.key === 'chest:4')).toMatchObject({ status: 'active' });
    for (let i = 0; i < 5; i++) runAction(db, kid, 'addWorkout', { minutes: 600 });   // уровни дают сундуки
    const r = runAction(db, { ...kid, rand: () => 0.9 }, 'openChest', {}) as { rarity: string; talisman: boolean };
    expect(r).toMatchObject({ rarity: 'rare', talisman: true });
    expect(detail().artifacts.find((x) => x.key === 'chest:4')).toMatchObject({ status: 'used' });
    const r2 = runAction(db, { ...kid, rand: () => 0.9 }, 'openChest', {}) as { rarity: string; talisman: boolean };
    expect(r2).toMatchObject({ rarity: 'common', talisman: false });                                               // талисман потрачен
  });
  it('из сундука может выпасть артефакт и он попадает в сумку; чужой ребёнок не может использовать чужое', () => {
    runAction(db, kid, 'addWorkout', { minutes: 300 });
    const r = runAction(db, { ...kid, rand: () => 0 }, 'openChest', {}) as { artifact: string | null };
    expect(r.artifact).toBe('shield');
    expect(detail().artifacts).toHaveLength(1);
    expect(detail().chestLog[0]).toMatchObject({ artifact: 'shield' });
    expect(err(() => runAction(db, kid, 'useArtifact', { memberId: 1, key: 'chest:1' }))?.status).toBe(403);
    expect(runAction(db, { ...kid, rand: () => 0.9 }, 'openChest', {}) as { artifact: string | null }).toMatchObject({ artifact: null });
  });
  it('гарантия: 10-й сундук без редкого — редкий, 35-й без легендарного — легендарный', () => {
    // сундуков в запасе: «Ключи» дают по +1 сундуку
    for (let i = 0; i < 60; i++) db.insert(s.artifactUse).values({ memberId: 2, key: `chest:k${i}`, kind: 'key', status: 'used', usedOn: '2026-11-10' }).run();
    const open = () => runAction(db, { ...kid, rand: () => 0.99 }, 'openChest', {}) as { rarity: string; why: string | null };
    for (let n = 1; n <= 9; n++) db.insert(s.chestOpened).values({ memberId: 2, n, rarity: 'common', reward: 'a', date: '2026-11-10' }).run();
    expect(detail().pity).toMatchObject({ untilRare: 0 });                          // следующий сундук гарантированно редкий
    expect(open()).toMatchObject({ rarity: 'rare', why: 'pityRare' });
    expect(detail().pity.untilRare).toBe(9);                                         // счётчик сбросился
    expect(open()).toMatchObject({ rarity: 'common', why: null });
    // легендарный: до 35-го сундука без легендарного
    for (let n = 12; n <= 34; n++) db.insert(s.chestOpened).values({ memberId: 2, n, rarity: n % 5 === 0 ? 'rare' : 'common', reward: 'a', date: '2026-11-10' }).run();
    expect(detail().pity.untilLegend).toBe(0);
    expect(open()).toMatchObject({ rarity: 'legend', why: 'pityLegend' });
    expect(detail().pity.untilLegend).toBe(34);
  });
  it('сундуки за победу над боссом открываются первыми и не ниже редкого', () => {
    for (const d of ['2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13']) runAction(db, dad, 'addWorkout', { memberId: 2, date: d, minutes: 200 });
    const f = loadFamily(db, NOW).family.members.get(2)!;
    expect(f.bossChestsEarned).toBeGreaterThanOrEqual(1);
    expect(detail().pity.bossWaiting).toBeGreaterThanOrEqual(1);
    const r = runAction(db, { ...kid, rand: () => 0.99 }, 'openChest', {}) as { rarity: string; boss: boolean; why: string };
    expect(r).toMatchObject({ boss: true, why: 'boss', rarity: 'rare' });            // rand 0.99 — не легендарный, но и не обычный
    expect(db.select().from(s.chestOpened).all()[0].source).toBe('boss');
    const after = detail().pity.bossWaiting;
    expect(after).toBe(Math.max(0, f.bossChestsEarned - 1));
  });
  it('бой: итоги закончившихся дней сохраняются в базе один раз, добыча попадает в инвентарь', () => {
    detail();                                                          // первый запуск запоминает дату старта боёв
    const later = new Date('2026-11-21T05:00:00Z');
    loadFamily(db, later);
    const rows = db.select().from(s.battleDay).all();
    expect(rows.map((r) => [r.memberId, r.date]).sort()).toEqual([[1, '2026-11-19'], [1, '2026-11-20'], [2, '2026-11-19'], [2, '2026-11-20']]);
    loadFamily(db, later);                                              // повторный расчёт ничего не дублирует
    expect(db.select().from(s.battleDay).all()).toHaveLength(4);
    expect(detail(2, later).battle.recent).toHaveLength(2);
  });
  it('снаряжение: надеть, заменить в слоте, снять; чужое и несуществующее нельзя', () => {
    const give = (n: number, gear: string) => db.insert(s.chestOpened).values({ memberId: 2, n, rarity: 'common', reward: 'a', date: '2026-11-10', gear }).run();
    give(1, 'sword-common'); give(2, 'sword-epic'); give(3, 'armor-rare');
    expect(detail().gear.items.map((g) => g.itemId).sort()).toEqual(['armor-rare', 'sword-common', 'sword-epic']);
    expect(err(() => runAction(db, kid, 'equipGear', { key: 'chest:99' }))?.status).toBe(404);
    expect(err(() => runAction(db, kid, 'equipGear', { memberId: 1, key: 'chest:1' }))?.status).toBe(403);
    runAction(db, kid, 'equipGear', { key: 'chest:1' });
    expect(detail().gear.slots.weapon).toBe('chest:1');
    runAction(db, kid, 'equipGear', { key: 'chest:2' });                // заменяет предыдущий меч
    expect(detail().gear.slots.weapon).toBe('chest:2');
    expect(detail().gear.bonus.dmg).toBeCloseTo(0.12);
    const { raw: r0, family: f0 } = loadFamily(db, NOW);
    expect(tvState(r0, f0).members.find((m) => m.id === 2)!.look).toEqual({ weapon: 'sword-epic' });   // для фигур героев в бою с боссом
    runAction(db, kid, 'equipGear', { key: 'chest:3' });
    expect(detail().gear.slots.armor).toBe('chest:3');
    expect(detail().gear.bonus.guard).toBeCloseTo(0.35);
    runAction(db, kid, 'unequipGear', { slot: 'weapon' });
    expect(detail().gear.slots.weapon).toBeNull();
    expect(detail().gear.bonus.dmg).toBe(0);
    expect(err(() => runAction(db, kid, 'unequipGear', { slot: 'nope' }))?.status).toBe(400);
  });
  it('из сундука может выпасть снаряжение', () => {
    runAction(db, kid, 'addWorkout', { minutes: 300 });
    const r = runAction(db, { ...kid, rand: () => 0 }, 'openChest', {}) as { gear: string | null };
    expect(r.gear).toBeTruthy();
    expect(detail().gear.items).toHaveLength(1);
    expect(detail().chestLog[0]!.gear).toBe(r.gear);
  });
  it('способности класса: раз в день, энергия 2, перезарядка, только свои, родитель может за ребёнка', () => {
    const d = (n: number) => ({ ...kid, now: new Date(Date.UTC(2026, 10, 19 + n, 5)) });
    expect(err(() => runAction(db, kid, 'useAbility', { id: 'нет' }))?.status).toBe(404);
    expect(err(() => runAction(db, kid, 'useAbility', { id: 'm-pyro' }))?.status).toBe(400);        // способность мага у воина
    runAction(db, kid, 'useAbility', { id: 'w-whirl' });
    expect(detail().battle.abilities).toMatchObject({ focusLeft: 1, activeToday: ['w-whirl'] });
    expect(err(() => runAction(db, kid, 'useAbility', { id: 'w-whirl' }))?.message).toMatch(/уже применена/);
    expect(err(() => runAction(db, kid, 'useAbility', { id: 'w-reckless' }))?.message).toMatch(/энергии/);   // мощная стоит 2
    runAction(db, kid, 'useAbility', { id: 'w-charge' });
    expect(detail().battle.abilities.focusLeft).toBe(0);
    expect(err(() => runAction(db, kid, 'useAbility', { id: 'w-reckless' }))).not.toBeNull();
    // на следующий день энергия снова 2, обычные способности готовы
    runAction(db, d(1), 'useAbility', { id: 'w-reckless' });                                         // мощная: 2 энергии, перезарядка 3 дня
    expect(detail(2, d(1).now).battle.abilities.focusLeft).toBe(0);
    expect(err(() => runAction(db, d(2), 'useAbility', { id: 'w-reckless' }))?.message).toMatch(/ещё 2 дн/);
    runAction(db, d(2), 'useAbility', { id: 'w-whirl' });
    runAction(db, d(4), 'useAbility', { id: 'w-reckless' });                                         // через 3 дня готова
    expect(err(() => runAction(db, { ...kid, memberId: 1 }, 'useAbility', { memberId: 2, id: 'w-charge' }))?.status).toBe(403);
    runAction(db, { ...dad, now: d(5).now }, 'useAbility', { memberId: 2, id: 'w-charge' });          // родитель может за ребёнка
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
  it('лицо героя хранится отдельно от аватара профиля, лишнее отклоняется', () => {
    const face = { skin: 2, hair: 'braids', hairColor: 7, eyes: 'happy', eyeColor: 1, mouth: 'grin', extras: ['glasses', 'freckles'] };
    const row = () => db.select().from(s.member).all()[1]!;
    const emoji0 = row().emoji;
    runAction(db, kid, 'setFace', { gender: 'f', face });
    expect(row()).toMatchObject({ gender: 'f', emoji: emoji0 });                  // смайлик профиля не тронут
    expect(JSON.parse(row().face!)).toEqual(face);
    expect(err(() => runAction(db, kid, 'setFace', { gender: 'm', face }))?.status).toBe(400);   // косы только у девочек
    expect(err(() => runAction(db, kid, 'setFace', { gender: 'f', face: { ...face, extras: ['beard'] } }))?.status).toBe(400);
    expect(err(() => runAction(db, kid, 'setFace', { gender: 'x' }))?.status).toBe(400);
    expect(err(() => runAction(db, kid, 'setFace', { memberId: 1, gender: 'm', face: { ...face, hair: 'short', extras: [] } }))?.status).toBe(403);
    runAction(db, kid, 'setFace', { gender: 'm', face: { ...face, hair: 'spiky', extras: ['beard'] } });   // смена пола с подходящими чертами
    expect(row().gender).toBe('m');
    runAction(db, kid, 'setAvatar', { emoji: '🐉' });                             // смена смайлика не трогает лицо
    expect(row()).toMatchObject({ emoji: '🐉', gender: 'm' });
    expect(row().face).not.toBeNull();
    const { raw, family } = loadFamily(db, NOW);
    expect(tvState(raw, family).members.find((m) => m.id === 2)!.face).toMatchObject({ hair: 'spiky', gender: 'm' });   // лицо доходит до ТВ
  });
  it('рейтинг дня: места от личной нормы и разбивка очков по источникам', () => {
    runAction(db, kid, 'addWorkout', { minutes: 20 });
    runAction(db, kid, 'addWorkout', { exercise: 'stroll', minutes: 40 });          // 20 очков прогулки
    runAction(db, kid, 'addDeed', { kind: 'hug' });
    runAction(db, dad, 'addWorkout', { minutes: 30 });
    const { raw, family } = loadFamily(db, NOW);
    const r = ratingView(raw, family, family.today);
    const kidRow = r.rows.find((x) => x.id === 2)!, dadRow = r.rows.find((x) => x.id === 1)!;
    const parts = Object.fromEntries(kidRow.parts.map((p) => [p.id, p.points]));
    expect(parts.walk).toBeGreaterThanOrEqual(20);        // прогулка отделена от тренировки (с бонусом класса может быть больше)
    expect(parts.deeds).toBe(8);
    expect(parts.workout).toBeGreaterThanOrEqual(20);
    expect(kidRow.points).toBeGreaterThan(dadRow.points);
    expect(r.rows[0]!.id).toBe(2);                        // у ребёнка норма ниже, он выше в рейтинге
    expect(r.rows[0]!.place).toBe(1);
    expect(r.rows.map((x) => x.name).sort()).toEqual(raw.members.map((m) => m.name).sort());
    expect(ratingView(raw, family, '2000-01-01').rows.every((x) => x.points === 0 && x.parts.length === 0)).toBe(true);
  });
  it('рейтинг недели: сумма очков, дни, источники и место от средней доли нормы', () => {
    runAction(db, kid, 'addWorkout', { minutes: 40 });
    runAction(db, kid, 'addDeed', { kind: 'dishes' });
    runAction(db, dad, 'addWorkout', { minutes: 30 });
    const { raw, family } = loadFamily(db, NOW);
    const w = ratingWeekView(raw, family, family.today);
    expect(w.dates).toHaveLength(7);
    expect(w.isCurrent).toBe(true);
    expect(w.rows.map((r) => r.name).sort()).toEqual(raw.members.map((m) => m.name).sort());
    const kidW = w.rows.find((r) => r.id === 2)!;
    const dayRow = ratingView(raw, family, family.today).rows.find((r) => r.id === 2)!;
    expect(kidW.daily.find((d) => d.date === family.today)!.points).toBe(dayRow.points);     // день недели совпадает с рейтингом дня
    expect(kidW.points).toBeGreaterThanOrEqual(dayRow.points);
    expect(kidW.parts.map((p) => p.id)).toEqual(expect.arrayContaining(['workout', 'deeds']));
    expect(kidW.daily.filter((d) => d.counted).length).toBe(kidW.days);
    expect(w.rows[0]!.place).toBe(1);
    expect(w.rows.every((r) => r.daily.filter((d) => d.date > family.today).every((d) => !d.counted))).toBe(true);   // будущие дни не считаются
    expect(ratingWeekView(raw, family, '2000-01-03').rows.every((r) => r.points === 0)).toBe(true);
  });
  it('прогулка: минуты считаются по половинной цене с потолком в день', () => {
    const today = () => loadFamily(db, NOW).family.members.get(2)!.days.get(loadFamily(db, NOW).family.today)!;
    runAction(db, kid, 'addWorkout', { exercise: 'stroll', minutes: 40 });
    expect(today().stats.workoutMinutes).toBe(20);
    runAction(db, kid, 'addWorkout', { exercise: 'stroll', minutes: 120 });     // 90 - 40 = 50 минут ещё засчитываются
    expect(today().stats.workoutMinutes).toBe(45);
    runAction(db, kid, 'addWorkout', { minutes: 10 });                            // обычная тренировка не ограничена прогулкой
    expect(today().stats.workoutMinutes).toBe(55);
  });
  it('добрые дела: очки, лимиты, своё дело, права и журнал', () => {
    const fam = () => loadFamily(db, NOW).family.members.get(2)!;
    const today = () => fam().days.get(loadFamily(db, NOW).family.today)!;
    const r1 = runAction(db, kid, 'addDeed', { kind: 'dishes' }) as { counted: boolean; points: number };
    expect(r1).toMatchObject({ counted: true, points: 8 });
    expect(today()!.stats.deedPoints).toBe(8);
    expect(today()!.total).toBe(8);                                        // очки дела идут в очки дня
    const r2 = runAction(db, kid, 'addDeed', { kind: 'dishes' }) as { counted: boolean; points: number };
    expect(r2).toMatchObject({ counted: false, points: 0 });               // то же дело дважды за день не считается
    expect(today()!.stats.deedPoints).toBe(8);
    expect(err(() => runAction(db, kid, 'addDeed', { kind: 'custom' }))?.status).toBe(400);               // своё дело без описания
    expect(err(() => runAction(db, kid, 'addDeed', { kind: 'hack' }))?.status).toBe(400);
    expect(err(() => runAction(db, kid, 'addDeed', { memberId: 1, kind: 'trash' }))?.status).toBe(403);   // чужой профиль
    expect(runAction(db, kid, 'addDeed', { kind: 'custom', note: 'Помог соседке донести сумки' })).toMatchObject({ counted: true, points: 8 });
    expect(today()!.stats.deeds).toBe(2);
    const id = db.select().from(s.deedEntry).all()[0]!.id;
    expect(err(() => runAction(db, kid, 'deleteEntry', { type: 'deed', id }))?.status).toBe(403);        // удаляет только родитель
    runAction(db, dad, 'deleteEntry', { type: 'deed', id });
    expect(today()!.stats.deeds).toBe(2);                                  // после удаления повтор «Помыл посуду» становится засчитанным
    const detail = (() => { const { raw, family } = loadFamily(db, NOW); return memberDetail(raw, family, family.members.get(2)!); })();
    expect(detail.deeds.summary.total).toBe(2);
    expect(detail.deeds.day[0]).toMatchObject({ kind: 'custom', counted: true });
  });
  it('добрые дела с ТВ: только готовые, без своего', () => {
    expect(tvRecord(db, { memberId: 2, kind: 'deed', deedKind: 'hug' }, NOW)).toMatchObject({ counted: true });
    expect(() => tvRecord(db, { memberId: 2, kind: 'deed', deedKind: 'custom' }, NOW)).toThrow();
    expect(() => tvRecord(db, { memberId: 2, kind: 'deed', deedKind: 'nope' }, NOW)).toThrow();
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
