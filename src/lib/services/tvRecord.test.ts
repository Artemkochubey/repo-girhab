import { describe, it, expect, beforeEach } from 'vitest';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { openDb, type Db } from '../db/client';
import * as s from '../db/schema';
import { HttpError } from './actions';
import { tvRecord } from './tvRecord';
import { loadFamily } from './load';

const NOW = new Date('2026-11-19T05:00:00Z');
let db: Db;
const err = (fn: () => unknown) => { try { fn(); } catch (e) { return e as HttpError; } return null; };

beforeEach(() => {
  db = openDb(':memory:');
  migrate(db, { migrationsFolder: './drizzle' });
  db.insert(s.config).values({ id: 1, loot: ['a'], lootRare: ['b'], lootLegend: ['c'] }).run();
  for (const i of [1, 2]) {
    db.insert(s.member).values({ name: 'm' + i, createdAt: '2026-11-01T00:00:00Z' }).run();
    db.insert(s.hero).values({ memberId: i, clsChosen: true, clsChangedAt: '2026-11-01T00:00:00Z' }).run();
    db.insert(s.questOverride).values({ memberId: i, date: 'default', items: [{ t: 'x', xp: 1, k: 'manual' }] }).run();
  }
  db.insert(s.habit).values([{ memberId: 1, name: 'вода' }, { memberId: 2, name: 'чужая' }]).run();
});

describe('запись с ТВ', () => {
  it('зарядка и привычка: повтор не снимает отметку и не удваивает очки', () => {
    expect(tvRecord(db, { memberId: 1, kind: 'warmup' }, NOW)).toMatchObject({ added: true });
    expect(tvRecord(db, { memberId: 1, kind: 'warmup' }, NOW)).toMatchObject({ added: false });
    expect(tvRecord(db, { memberId: 1, kind: 'habit', habitId: 1 }, NOW)).toMatchObject({ added: true });
    expect(tvRecord(db, { memberId: 1, kind: 'habit', habitId: 1 }, NOW)).toMatchObject({ added: false });
    expect(db.select().from(s.warmupEntry).all()).toHaveLength(1);
    expect(db.select().from(s.habitCheck).all()).toHaveLength(1);
    expect(loadFamily(db, NOW).family.members.get(1)!.xp).toBeGreaterThan(0);
  });
  it('нельзя отметить чужую привычку', () => {
    expect(err(() => tvRecord(db, { memberId: 1, kind: 'habit', habitId: 2 }, NOW))?.status).toBe(403);
  });
  it('тренировка и учёба — только готовые значения минут и известные виды', () => {
    tvRecord(db, { memberId: 1, kind: 'workout', minutes: 30 }, NOW);
    tvRecord(db, { memberId: 1, kind: 'study', studyKind: 'Языки', minutes: 15 }, NOW);
    expect(db.select().from(s.workoutEntry).all()[0]).toMatchObject({ minutes: 30, memberId: 1, createdBy: 1 });
    expect(err(() => tvRecord(db, { memberId: 1, kind: 'workout', minutes: 600 }, NOW))?.status).toBe(400);
    expect(err(() => tvRecord(db, { memberId: 1, kind: 'workout' }, NOW))?.status).toBe(400);
    expect(err(() => tvRecord(db, { memberId: 1, kind: 'study', studyKind: 'Танцы', minutes: 15 }, NOW))?.status).toBe(400);
    expect(err(() => tvRecord(db, { memberId: 99, kind: 'warmup' }, NOW))?.status).toBe(404);
    expect(err(() => tvRecord(db, { memberId: 1, kind: 'deleteEverything' }, NOW))?.status).toBe(400);
  });
  it('книги получают уникальные названия', () => {
    tvRecord(db, { memberId: 1, kind: 'book' }, NOW);
    tvRecord(db, { memberId: 1, kind: 'book' }, NOW);
    tvRecord(db, { memberId: 2, kind: 'book' }, NOW);
    const titles = db.select().from(s.book).all().map((b) => `${b.memberId}:${b.title}`);
    expect(titles).toEqual(['1:Прочитанная книга №1', '1:Прочитанная книга №2', '2:Прочитанная книга №1']);
  });
});
