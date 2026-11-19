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
    shopItems: db.select().from(s.shopItem).all(),
    purchases: db.select().from(s.shopPurchase).all(),
  };
}

export function loadFamily(db: Db, now = new Date()) {
  const raw = loadRaw(db);
  return { raw, family: buildFamily(raw, todayIn(raw.timezone, now)) };
}
