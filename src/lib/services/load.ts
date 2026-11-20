import { eq } from 'drizzle-orm';
import type { Db } from '../db/client';
import * as s from '../db/schema';
import { todayIn } from '../date';
import { buildFamily, type Raw } from './engine';

export function getConfig(db: Db) {
  const c = db.select().from(s.config).get();
  if (!c) throw new Error('Нет config: выполните npm run db:seed');
  return c;
}

export function loadRaw(db: Db): Raw {
  return {
    timezone: getConfig(db).timezone,
    members: db.select().from(s.member).all(),
    heroes: db.select().from(s.hero).all(),
    workouts: db.select().from(s.workoutEntry).all(),
    warmups: db.select().from(s.warmupEntry).all(),
    study: db.select().from(s.studyEntry).all(),
    habits: db.select().from(s.habit).all().filter((h) => !h.archived),
    habitChecks: db.select().from(s.habitCheck).all(),
    books: db.select().from(s.book).all(),
    quests: db.select().from(s.questOverride).all(),
    chestsOpened: db.select().from(s.chestOpened).all(),
    familyQuests: db.select().from(s.familyQuest).all(),
    dayMvps: db.select().from(s.dayMvp).all(),
    mvpSince: getConfig(db).mvpSince,
    reminderHour: getConfig(db).reminderHour,
    seasonSince: getConfig(db).seasonSince,
    reviewOk: db.select().from(s.reviewOk).all(),
    artifactsSince: getConfig(db).artifactsSince,
    battleSince: getConfig(db).battleSince,
    battleDays: db.select().from(s.battleDay).all().map((r) => ({ memberId: r.memberId, date: r.date, hordeId: r.hordeId, totalHp: r.totalHp, cleared: r.cleared, win: r.win, regen: r.regen, hpDelta: r.hpDelta, xp: r.xp, drop: r.drop })),
    gearEquipped: db.select().from(s.gearEquipped).all(),
    abilityUses: db.select().from(s.abilityUse).all().map((u) => ({ memberId: u.memberId, date: u.date, ability: u.ability })),
    artifactUse: db.select().from(s.artifactUse).all() as Raw['artifactUse'],
    weeklyGoals: db.select().from(s.weeklyGoal).all().map((g) => ({ memberId: g.memberId, weekStart: g.weekStart, kind: g.kind, tier: g.tier, target: g.target, title: g.title, manual: g.manual, confirmed: g.confirmed })),
    shopItems: db.select().from(s.shopItem).all(),
    purchases: db.select().from(s.shopPurchase).all(),
  };
}

export function loadFamily(db: Db, now = new Date()) {
  const raw = loadRaw(db);
  const today = todayIn(raw.timezone, now);
  const family = buildFamily(raw, today);
  // MVP дня: первый запуск запоминает дату старта (сундуки задним числом не начисляются);
  // итоги закончившихся дней сохраняются, чтобы поздние правки записей их не меняли.
  if (!raw.mvpSince) db.update(s.config).set({ mvpSince: today }).where(eq(s.config.id, 1)).run();
  if (!raw.seasonSince) db.update(s.config).set({ seasonSince: today }).where(eq(s.config.id, 1)).run();
  if (!raw.artifactsSince) db.update(s.config).set({ artifactsSince: today }).where(eq(s.config.id, 1)).run();
  if (!raw.battleSince) db.update(s.config).set({ battleSince: today }).where(eq(s.config.id, 1)).run();
  // итоги закончившихся дней личного боя сохраняются один раз, чтобы смена снаряжения не меняла прошлое
  for (const r of family.pendingBattles) db.insert(s.battleDay).values({ memberId: r.memberId, date: r.date, hordeId: r.hordeId, totalHp: r.totalHp, cleared: r.cleared, win: r.win, regen: r.regen, hpDelta: r.hpDelta, xp: r.xp, drop: r.drop }).onConflictDoNothing().run();
  for (const p of family.mvp.pending) db.insert(s.dayMvp).values({ date: p.date, memberId: p.memberId, points: p.points, ratio: p.ratio }).onConflictDoNothing().run();
  return { raw, family };
}
