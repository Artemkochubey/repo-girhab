import type { QuestItem } from '../game/quests';
import type { CustomQuestSet } from '../game/questSets';
import { sqliteTable, text, integer, real, unique, index } from 'drizzle-orm/sqlite-core';

// Все даты — строки 'YYYY-MM-DD' в часовом поясе семьи (config.timezone).
const createdAt = () => text('created_at').notNull().$defaultFn(() => new Date().toISOString());

export const member = sqliteTable('member', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  emoji: text('emoji').notNull().default('🙂'),
  color: text('color').notNull().default('#8b5cf6'),
  isParent: integer('is_parent', { mode: 'boolean' }).notNull().default(false),
  goal: integer('goal').notNull().default(60),
  superGoal: integer('super_goal').notNull().default(100),
  createdAt: createdAt(),
});

export const config = sqliteTable('config', {
  id: integer('id').primaryKey(), // всегда 1
  timezone: text('timezone').notNull().default('Asia/Novosibirsk'),
  pinHash: text('pin_hash'),
  // с какого дня считается MVP дня (ставится при первом запуске версии с этой функцией, чтобы не начислять сундуки задним числом)
  mvpSince: text('mvp_since'),
  // с какого дня идут сезоны с призами (ставится при первом запуске; призы только за сезоны, начавшиеся не раньше этого месяца)
  seasonSince: text('season_since'),
  minutes: integer('minutes').notNull().default(30),
  superMinutes: integer('super_minutes').notNull().default(60),
  loot: text('loot', { mode: 'json' }).$type<string[]>().notNull(),
  lootRare: text('loot_rare', { mode: 'json' }).$type<string[]>().notNull(),
  lootLegend: text('loot_legend', { mode: 'json' }).$type<string[]>().notNull(),
  // свои наборы квестов (готовые наборы лежат в коде)
  questSets: text('quest_sets', { mode: 'json' }).$type<CustomQuestSet[]>().notNull().default([]),
  // с какого часа вечером напоминать о норме (-1 — не напоминать)
  reminderHour: integer('reminder_hour').notNull().default(19),
});

const entryBase = {
  id: integer('id').primaryKey({ autoIncrement: true }),
  memberId: integer('member_id').notNull().references(() => member.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  createdBy: integer('created_by'),
  createdAt: createdAt(),
};

export const workoutEntry = sqliteTable('workout_entry', {
  ...entryBase,
  minutes: integer('minutes').notNull(),
  // id тренировки из каталога, 'custom' (свой набор мышц) или null (общая тренировка)
  exercise: text('exercise'),
  muscles: text('muscles', { mode: 'json' }).$type<string[]>(),
  // число повторов (для упражнений со счётом); тогда minutes = 0, а очки считаются по ставке упражнения
  reps: integer('reps'),
}, (t) => [index('workout_member_date').on(t.memberId, t.date)]);

export const warmupEntry = sqliteTable('warmup_entry', {
  ...entryBase,
}, (t) => [unique('warmup_member_date').on(t.memberId, t.date)]);

export const STUDY_KINDS = ['Книги', 'Языки', 'Учёба', 'Навыки', 'Творчество', 'Мышление'] as const;
export type StudyKind = (typeof STUDY_KINDS)[number];

export const studyEntry = sqliteTable('study_entry', {
  ...entryBase,
  kind: text('kind', { enum: STUDY_KINDS }).notNull(),
  minutes: integer('minutes').notNull(),
}, (t) => [index('study_member_date').on(t.memberId, t.date)]);

export const habit = sqliteTable('habit', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  memberId: integer('member_id').notNull().references(() => member.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  archived: integer('archived', { mode: 'boolean' }).notNull().default(false),
  createdAt: createdAt(),
});

export const habitCheck = sqliteTable('habit_check', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  habitId: integer('habit_id').notNull().references(() => habit.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  createdAt: createdAt(),
}, (t) => [unique('habit_check_unique').on(t.habitId, t.date)]);

export const book = sqliteTable('book', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  memberId: integer('member_id').notNull().references(() => member.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  finishedAt: text('finished_at').notNull(),
}, (t) => [unique('book_unique').on(t.memberId, t.title)]);

export const hero = sqliteTable('hero', {
  memberId: integer('member_id').primaryKey().references(() => member.id, { onDelete: 'cascade' }),
  cls: text('cls', { enum: ['w', 'm', 'b', 'p'] }).notNull().default('w'),
  // false, пока игрок не выбрал класс сам: до этого класс-бонусов нет
  clsChosen: integer('cls_chosen', { mode: 'boolean' }).notNull().default(false),
  clsChangedAt: text('cls_changed_at').notNull().$defaultFn(() => new Date().toISOString()),
  sub: text('sub', { enum: ['w', 'm', 'b', 'p'] }),
  talents: text('talents', { mode: 'json' }).$type<string[]>().notNull().$defaultFn(() => []),
});

export type { QuestItem };

// date = 'default' — шаблон «на каждый день»
export const questOverride = sqliteTable('quest_override', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  memberId: integer('member_id').notNull().references(() => member.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  items: text('items', { mode: 'json' }).$type<QuestItem[]>().notNull(),
}, (t) => [unique('quest_override_unique').on(t.memberId, t.date)]);

export const chestOpened = sqliteTable('chest_opened', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  memberId: integer('member_id').notNull().references(() => member.id, { onDelete: 'cascade' }),
  n: integer('n').notNull(),
  rarity: text('rarity', { enum: ['common', 'rare', 'legend'] }).notNull(),
  reward: text('reward').notNull(),
  date: text('date').notNull(),
}, (t) => [unique('chest_unique').on(t.memberId, t.n)]);

export const bossWeek = sqliteTable('boss_week', {
  weekStart: text('week_start').primaryKey(),
  bossId: integer('boss_id').notNull(),
  hp: integer('hp').notNull(),
  damageTotal: real('damage_total').notNull().default(0),
  defeated: integer('defeated', { mode: 'boolean' }).notNull().default(false),
  mvpMemberId: integer('mvp_member_id'),
  finalizedAt: text('finalized_at'),
});

export const CURRENCIES = ['points', 'chests'] as const;
export type Currency = (typeof CURRENCIES)[number];

export const shopItem = sqliteTable('shop_item', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  emoji: text('emoji').notNull().default('🎁'),
  description: text('description').notNull().default(''),
  price: integer('price').notNull(),
  currency: text('currency', { enum: CURRENCIES }).notNull().default('points'),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  createdAt: createdAt(),
});

// Название и цена копируются в покупку, чтобы история не менялась при правке товара.
export const shopPurchase = sqliteTable('shop_purchase', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  memberId: integer('member_id').notNull().references(() => member.id, { onDelete: 'cascade' }),
  itemId: integer('item_id'),
  name: text('name').notNull(),
  emoji: text('emoji').notNull(),
  price: integer('price').notNull(),
  currency: text('currency', { enum: CURRENCIES }).notNull(),
  status: text('status', { enum: ['pending', 'done', 'cancelled'] }).notNull().default('pending'),
  date: text('date').notNull(),
  createdAt: createdAt(),
}, (t) => [index('purchase_member').on(t.memberId)]);

// Семейный квест: общая цель на день или неделю, опыт получают все участники.
export const familyQuest = sqliteTable('family_quest', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  description: text('description').notNull().default(''),
  xp: integer('xp').notNull(),
  // manual — родитель подтверждает; points — автоматически, когда семья набрала target очков активности
  kind: text('kind', { enum: ['manual', 'points'] }).notNull().default('manual'),
  target: integer('target').notNull().default(0),
  period: text('period', { enum: ['day', 'week'] }).notNull().default('day'),
  date: text('date').notNull(),            // день квеста или понедельник его недели
  status: text('status', { enum: ['open', 'pending', 'done'] }).notNull().default('open'),
  doneDate: text('done_date'),
  createdAt: createdAt(),
});

// MVP дня фиксируется, когда день закончился, чтобы поздние правки записей не отнимали сундук.
export const dayMvp = sqliteTable('day_mvp', {
  date: text('date').primaryKey(),
  memberId: integer('member_id').notNull(),
  points: real('points').notNull(),
  ratio: real('ratio').notNull(),
  createdAt: createdAt(),
});

// Родитель посмотрел день с меткой «проверить»; points — очки дня на момент просмотра
export const reviewOk = sqliteTable('review_ok', {
  memberId: integer('member_id').notNull().references(() => member.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  points: real('points').notNull(),
  createdAt: createdAt(),
}, (t) => [unique('review_ok_unique').on(t.memberId, t.date)]);
