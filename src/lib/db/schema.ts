import type { QuestItem } from '../game/quests';
import type { CustomQuestSet } from '../game/questSets';
import { sqliteTable, text, integer, real, unique, index } from 'drizzle-orm/sqlite-core';

// Все даты — строки 'YYYY-MM-DD' в часовом поясе семьи (config.timezone).
const createdAt = () => text('created_at').notNull().$defaultFn(() => new Date().toISOString());

export const member = sqliteTable('member', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  emoji: text('emoji').notNull().default('🙂'),
  // пол героя ('m' | 'f') и лицо (JSON FaceConfig); пока лицо не выбрано, везде показывается emoji
  gender: text('gender'),
  face: text('face'),
  // режим «Малыш»: крупные кнопки и картинки, чтение вслух (включает родитель)
  simple: integer('simple', { mode: 'boolean' }).notNull().default(false),
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
  // с какого дня за победы (босс, сезон, MVP дня) выдаются артефакты; задним числом ничего не начисляется
  artifactsSince: text('artifacts_since'),
  // с какого дня идут личные сражения с ордой (первый запуск этой версии); боссовое снаряжение тоже только после этой даты
  battleSince: text('battle_since'),
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

export const deedEntry = sqliteTable('deed_entry', {
  ...entryBase,
  // id дела из каталога (game/deeds.ts)
  kind: text('kind').notNull(),
  // пояснение (для «своего» дела обязательно)
  note: text('note'),
}, (t) => [index('deed_member_date').on(t.memberId, t.date)]);

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
  // специализация класса ('a' | 'b'), доступна с 8 уровня
  spec: text('spec', { enum: ['a', 'b'] }),
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
  // «Моя сумка»: bag — лежит в сумке, requested — ребёнок попросил выдать, delivered — родитель выдал
  status: text('status', { enum: ['bag', 'requested', 'delivered'] }).notNull().default('bag'),
  deliveredOn: text('delivered_on'),
  // артефакт, найденный в этом сундуке (вид), или null
  artifact: text('artifact'),
  // normal — обычный сундук, boss — сундук за победу над боссом (открывается первым, не ниже редкого)
  source: text('source', { enum: ['normal', 'boss'] }).notNull().default('normal'),
  // снаряжение (id предмета), найденное в этом сундуке, или null
  gear: text('gear'),
  // у кого приз лежит сейчас (подарок брату или сестре); null — у того, кто его открыл
  holder: integer('holder'),
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

// Использование артефактов: сами артефакты выводятся из истории по ключу (см. game/artifacts.ts)
export const artifactUse = sqliteTable('artifact_use', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  memberId: integer('member_id').notNull().references(() => member.id, { onDelete: 'cascade' }),
  key: text('key').notNull(),
  kind: text('kind').notNull(),
  status: text('status', { enum: ['active', 'used'] }).notNull(),
  activeFor: text('active_for'),   // день, к которому применён «Щит дня» или «Удвоитель»
  usedOn: text('used_on'),
  createdAt: createdAt(),
}, (t) => [unique('artifact_use_unique').on(t.memberId, t.key)]);

// Недельная цель героя (одна на неделю). Выполнение выводится из записей, для ручной цели его отмечает родитель.
export const weeklyGoal = sqliteTable('weekly_goal', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  memberId: integer('member_id').notNull().references(() => member.id, { onDelete: 'cascade' }),
  weekStart: text('week_start').notNull(),
  kind: text('kind').notNull(),
  tier: text('tier', { enum: ['easy', 'mid', 'hard'] }).notNull(),
  target: integer('target').notNull(),
  title: text('title'),
  manual: integer('manual', { mode: 'boolean' }).notNull().default(false),
  confirmed: integer('confirmed', { mode: 'boolean' }).notNull().default(false),
  createdBy: integer('created_by'),
  createdAt: createdAt(),
}, (t) => [unique('weekly_goal_unique').on(t.memberId, t.weekStart)]);

// Итог личного боя за закончившийся день (фиксируется один раз, чтобы смена снаряжения не меняла прошлое)
export const battleDay = sqliteTable('battle_day', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  memberId: integer('member_id').notNull().references(() => member.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  hordeId: text('horde_id').notNull(),
  totalHp: integer('total_hp').notNull(),
  cleared: integer('cleared').notNull(),
  win: integer('win', { mode: 'boolean' }).notNull(),
  regen: integer('regen').notNull(),
  hpDelta: integer('hp_delta').notNull(),
  xp: integer('xp').notNull(),
  drop: text('drop'),
  createdAt: createdAt(),
}, (t) => [unique('battle_day_unique').on(t.memberId, t.date)]);

// Надетое снаряжение: по одному предмету на слот; key — ключ предмета в инвентаре (battle:дата, boss:дата, chest:N)
export const gearEquipped = sqliteTable('gear_equipped', {
  memberId: integer('member_id').notNull().references(() => member.id, { onDelete: 'cascade' }),
  slot: text('slot').notNull(),
  key: text('key').notNull(),
}, (t) => [unique('gear_equipped_slot').on(t.memberId, t.slot), unique('gear_equipped_key').on(t.memberId, t.key)]);

// Слияние снаряжения: три одинаковых предмета превращаются в один следующей редкости. Сами предметы выводятся из истории,
// поэтому «съеденные» ключи хранятся здесь и убираются из инвентаря.
export const gearMerge = sqliteTable('gear_merge', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  memberId: integer('member_id').notNull().references(() => member.id, { onDelete: 'cascade' }),
  consumed: text('consumed', { mode: 'json' }).$type<string[]>().notNull(),
  itemId: text('item_id').notNull(),
  date: text('date').notNull(),
  createdAt: createdAt(),
});

// Применённые способности класса: одна запись на способность в день (перезарядка считается по датам)
export const abilityUse = sqliteTable('ability_use', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  memberId: integer('member_id').notNull().references(() => member.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  ability: text('ability').notNull(),
  createdAt: createdAt(),
}, (t) => [unique('ability_use_unique').on(t.memberId, t.date, t.ability)]);

/** «Я видел»: один герой отметил 👍 день другого. Одна отметка на пару героев и день. */
export const daySeen = sqliteTable('day_seen', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  targetId: integer('target_id').notNull().references(() => member.id, { onDelete: 'cascade' }),
  byId: integer('by_id').notNull().references(() => member.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  createdAt: createdAt(),
}, (t) => [unique('day_seen_unique').on(t.targetId, t.byId, t.date)]);

/** Общая цель семьи на месяц (поход, кино...). Прогресс считается из истории, хранится только цель и отметка «награда получена». */
export const monthGoal = sqliteTable('month_goal', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  month: text('month').notNull(),                       // 'ГГГГ-ММ'
  title: text('title').notNull(),
  emoji: text('emoji').notNull().default('🏕'),
  kind: text('kind', { enum: ['points', 'deeds', 'normDays'] }).notNull(),
  target: integer('target').notNull(),
  reward: text('reward').notNull().default(''),
  given: integer('given', { mode: 'boolean' }).notNull().default(false),
  createdAt: createdAt(),
}, (t) => [unique('month_goal_unique').on(t.month)]);
