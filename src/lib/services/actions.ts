import { and, eq } from 'drizzle-orm';
import { hashPin, validPin } from '../auth';
import type { Db } from '../db/client';
import * as s from '../db/schema';
import { dateAllowed, isDate, todayIn } from '../date';
import { AVATARS } from '../game/avatars';
import { CUSTOM_EXERCISE, MUSCLE_IDS, exerciseById, isMuscleId } from '../game/muscles';
import { canChangeClass, type Cls } from '../game/classes';
import { pickReward, rollRarity } from '../game/chests';
import { canBuyTalent, luckBonuses } from '../game/talents';
import { validQuestList, type QuestItem } from '../game/quests';
import { loadFamily, getConfig } from './load';

export class HttpError extends Error { constructor(public status: number, msg: string) { super(msg); } }
const fail = (status: number, msg: string): never => { throw new HttpError(status, msg); };

export interface Ctx { memberId: number | null; parent: boolean; now?: Date; rand?: () => number }
type Args = Record<string, unknown>;

const CLASSES = ['w', 'm', 'b', 'p'];
const int = (v: unknown, min: number, max: number, what: string): number => {
  if (typeof v !== 'number' || !Number.isInteger(v) || v < min || v > max) fail(400, `${what}: нужно целое ${min}–${max}`);
  return v as number;
};
const str = (v: unknown, max: number, what: string): string => {
  if (typeof v !== 'string' || !v.trim() || v.length > max) fail(400, `${what}: 1–${max} символов`);
  return (v as string).trim();
};

export function runAction(db: Db, ctx: Ctx, action: string, a: Args): unknown {
  const now = ctx.now ?? new Date();
  const cfg = getConfig(db);
  const today = todayIn(cfg.timezone, now);
  const needParent = () => { if (!ctx.parent) fail(403, 'Нужен PIN родителя'); };
  const target = (): number => {
    const id = (a.memberId ?? ctx.memberId) as number | null;
    if (typeof id !== 'number') return fail(400, 'Не выбран участник');
    if (id !== ctx.memberId && !ctx.parent) fail(403, 'Можно менять только свой профиль');
    if (!db.select().from(s.member).where(eq(s.member.id, id)).get()) fail(404, 'Нет такого участника');
    return id;
  };
  const dateArg = (): string => {
    const d = a.date ?? today;
    if (!isDate(d)) return fail(400, 'Неверная дата');
    if (!dateAllowed(d, today, ctx.parent)) fail(403, 'Дата вне разрешённого окна (7 дней)');
    return d;
  };

  switch (action) {
    case 'addWorkout': {
      const memberId = target(), date = dateArg();
      const minutes = int(a.minutes, 1, 600, 'Минуты');
      let exercise: string | null = null;
      let muscles: string[] | null = null;
      if (a.exercise !== undefined && a.exercise !== null) {
        if (a.exercise === CUSTOM_EXERCISE) {
          const ms = a.muscles;
          if (!Array.isArray(ms) || ms.length < 1 || ms.length > MUSCLE_IDS.length || !ms.every(isMuscleId)) fail(400, 'Выберите от 1 до 16 групп мышц');
          exercise = CUSTOM_EXERCISE;
          muscles = [...new Set(ms as string[])];
        } else if (exerciseById(String(a.exercise))) exercise = String(a.exercise);
        else fail(400, 'Неизвестная тренировка');
      }
      db.insert(s.workoutEntry).values({ memberId, date, minutes, exercise, muscles, createdBy: ctx.memberId }).run();
      return { ok: true };
    }
    case 'addStudy': {
      const memberId = target(), date = dateArg();
      if (!s.STUDY_KINDS.includes(a.kind as never)) fail(400, 'Неизвестный вид учёбы');
      db.insert(s.studyEntry).values({ memberId, date, kind: a.kind as s.StudyKind, minutes: int(a.minutes, 1, 600, 'Минуты'), createdBy: ctx.memberId }).run();
      return { ok: true };
    }
    case 'toggleWarmup': {
      const memberId = target(), date = dateArg();
      const ex = db.select().from(s.warmupEntry).where(and(eq(s.warmupEntry.memberId, memberId), eq(s.warmupEntry.date, date))).get();
      if (ex) { needParent(); db.delete(s.warmupEntry).where(eq(s.warmupEntry.id, ex.id)).run(); return { on: false }; }
      db.insert(s.warmupEntry).values({ memberId, date, createdBy: ctx.memberId }).run();
      return { on: true };
    }
    case 'addHabit': {
      const memberId = target();
      const row = db.insert(s.habit).values({ memberId, name: str(a.name, 60, 'Название') }).returning().get();
      return { id: row.id };
    }
    case 'toggleHabit': {
      const date = dateArg();
      const h = db.select().from(s.habit).where(eq(s.habit.id, int(a.habitId, 1, 1e9, 'Привычка'))).get();
      if (!h) return fail(404, 'Нет привычки');
      if (h.memberId !== ctx.memberId && !ctx.parent) fail(403, 'Чужая привычка');
      const ex = db.select().from(s.habitCheck).where(and(eq(s.habitCheck.habitId, h.id), eq(s.habitCheck.date, date))).get();
      if (ex) { needParent(); db.delete(s.habitCheck).where(eq(s.habitCheck.id, ex.id)).run(); return { on: false }; }
      db.insert(s.habitCheck).values({ habitId: h.id, date }).run();
      return { on: true };
    }
    case 'archiveHabit': {
      const h = db.select().from(s.habit).where(eq(s.habit.id, int(a.habitId, 1, 1e9, 'Привычка'))).get();
      if (!h) return fail(404, 'Нет привычки');
      if (h.memberId !== ctx.memberId) needParent();
      db.update(s.habit).set({ archived: true }).where(eq(s.habit.id, h.id)).run();
      return { ok: true };
    }
    case 'addBook': {
      const memberId = target(), date = dateArg();
      try { db.insert(s.book).values({ memberId, title: str(a.title, 120, 'Название'), finishedAt: date }).run(); }
      catch { fail(409, 'Такая книга уже есть'); }
      return { ok: true };
    }
    case 'deleteEntry': {
      needParent();
      const id = int(a.id, 1, 1e9, 'id');
      const t = { workout: s.workoutEntry, study: s.studyEntry, warmup: s.warmupEntry } as const;
      if (a.type === 'book') db.delete(s.book).where(eq(s.book.id, id)).run();
      else if (a.type === 'workout' || a.type === 'study' || a.type === 'warmup') db.delete(t[a.type]).where(eq(t[a.type].id, id)).run();
      else fail(400, 'Неизвестный тип записи');
      return { ok: true };
    }
    case 'listEntries': {
      const memberId = target();
      return {
        workouts: db.select().from(s.workoutEntry).where(eq(s.workoutEntry.memberId, memberId)).all(),
        study: db.select().from(s.studyEntry).where(eq(s.studyEntry.memberId, memberId)).all(),
        warmups: db.select().from(s.warmupEntry).where(eq(s.warmupEntry.memberId, memberId)).all(),
        books: db.select().from(s.book).where(eq(s.book.memberId, memberId)).all(),
      };
    }

    case 'setClass': {
      const memberId = target();
      if (!CLASSES.includes(a.cls as string)) fail(400, 'Неизвестный класс');
      if (a.confirm !== true) fail(400, 'Нужно подтверждение выбора класса');
      const h = db.select().from(s.hero).where(eq(s.hero.memberId, memberId)).get()!;
      if (h.clsChosen && h.cls === a.cls) return { ok: true };
      // Первый выбор свободен всегда; дальше — 24 часа бесплатно, затем пауза 7 дней.
      if (h.clsChosen) {
        const c = canChangeClass(Date.parse(h.clsChangedAt), now.getTime());
        if (!c.ok && !ctx.parent) fail(403, `Смена класса доступна с ${new Date(c.availableAtMs!).toISOString().slice(0, 10)}`);
      }
      db.update(s.hero).set({ cls: a.cls as Cls, clsChosen: true, clsChangedAt: now.toISOString(), sub: h.sub === a.cls ? null : h.sub }).where(eq(s.hero.memberId, memberId)).run();
      return { ok: true };
    }
    case 'setSub': {
      const memberId = target();
      const h = db.select().from(s.hero).where(eq(s.hero.memberId, memberId)).get()!;
      const st = loadFamily(db, now).family.members.get(memberId)!;
      if (a.sub !== null && !CLASSES.includes(a.sub as string)) fail(400, 'Неизвестный класс');
      if (!h.clsChosen) fail(400, 'Сначала выберите класс');
      if (a.sub === h.cls) fail(400, 'Подкласс должен отличаться от класса');
      if (a.sub !== null && st.level < 5) fail(403, 'Подкласс открывается с 5 уровня');
      db.update(s.hero).set({ sub: a.sub as Cls | null }).where(eq(s.hero.memberId, memberId)).run();
      return { ok: true };
    }
    case 'buyTalent': {
      const memberId = target();
      const h = db.select().from(s.hero).where(eq(s.hero.memberId, memberId)).get()!;
      const st = loadFamily(db, now).family.members.get(memberId)!;
      const r = canBuyTalent(String(a.id), h.talents, h.clsChosen ? h.cls : null, st.level);
      if (!r.ok) fail(400, r.reason!);
      db.update(s.hero).set({ talents: [...h.talents, String(a.id)] }).where(eq(s.hero.memberId, memberId)).run();
      return { ok: true };
    }
    case 'resetTalents': {
      needParent();
      db.update(s.hero).set({ talents: [] }).where(eq(s.hero.memberId, target())).run();
      return { ok: true };
    }

    case 'markQuest': {
      const memberId = target(), date = dateArg();
      const idx = int(a.index, 0, 4, 'Номер квеста');
      const { family } = loadFamily(db, now);
      const items: QuestItem[] = structuredClone(family.members.get(memberId)!.days.get(date)!.quests);
      const q = items[idx];
      if (!q || q.k !== 'manual') return fail(400, 'Этот квест засчитывается автоматически');
      const confirmed = !!q.done && !q.pending;
      if (confirmed) { needParent(); q.done = false; q.pending = false; }
      else if (q.done && q.pending) { q.done = false; q.pending = false; }
      else { q.done = true; q.pending = !ctx.parent; }
      saveQuests(db, memberId, date, items);
      return { done: !!q.done, pending: !!q.pending };
    }
    case 'confirmQuest': {
      needParent();
      const memberId = target(), date = dateArg();
      const idx = int(a.index, 0, 4, 'Номер квеста');
      const items: QuestItem[] = structuredClone(loadFamily(db, now).family.members.get(memberId)!.days.get(date)!.quests);
      const q = items[idx];
      if (!q?.pending) return fail(400, 'Нечего подтверждать');
      q.pending = false; q.done = a.approve !== false;
      saveQuests(db, memberId, date, items);
      return { ok: true };
    }
    case 'setQuests': {
      needParent();
      const memberId = target();
      const date = a.date === 'default' ? 'default' : isDate(a.date) ? a.date : fail(400, 'Неверная дата');
      const items = a.items as QuestItem[];
      if (!Array.isArray(items) || !validQuestList(items)) fail(400, 'Квесты: 1–5 штук, название до 60 символов, опыт 1–100');
      saveQuests(db, memberId, date, items.map((q) => ({ t: q.t.trim(), d: q.d?.trim() || undefined, xp: q.xp, k: q.k, m: q.m, kind: q.kind, done: false, pending: false })));
      return { ok: true };
    }
    case 'resetQuests': {
      needParent();
      db.delete(s.questOverride).where(and(eq(s.questOverride.memberId, target()), eq(s.questOverride.date, String(a.date ?? 'default')))).run();
      return { ok: true };
    }

    case 'openChest': {
      const memberId = target();
      const st = loadFamily(db, now).family.members.get(memberId)!;
      if (st.chestsAvailable < 1) fail(400, 'Нет доступных сундуков');
      const rand = ctx.rand ?? Math.random;
      const rarity = rollRarity(rand(), luckBonuses(st.hero.talents));
      const reward = pickReward(rarity, { common: cfg.loot, rare: cfg.lootRare, legend: cfg.lootLegend }, rand());
      db.insert(s.chestOpened).values({ memberId, n: st.chestsOpened + 1, rarity, reward, date: today }).run();
      return { rarity, reward };
    }

    case 'saveShopItem': {
      needParent();
      const price = a.currency === 'chests' ? int(a.price, 1, 100, 'Цена в сундуках') : int(a.price, 1, 100000, 'Цена в очках');
      const v = {
        name: str(a.name, 60, 'Название'),
        emoji: typeof a.emoji === 'string' && a.emoji.trim() ? a.emoji.trim().slice(0, 8) : '🎁',
        description: typeof a.description === 'string' ? a.description.trim().slice(0, 120) : '',
        price, currency: (a.currency === 'chests' ? 'chests' : 'points') as s.Currency,
      };
      if (a.id === undefined) return { id: db.insert(s.shopItem).values(v).returning().get().id };
      const id = int(a.id, 1, 1e9, 'id');
      if (!db.select().from(s.shopItem).where(eq(s.shopItem.id, id)).get()) fail(404, 'Нет такой награды');
      db.update(s.shopItem).set(v).where(eq(s.shopItem.id, id)).run();
      return { id };
    }
    case 'archiveShopItem': {
      needParent();
      db.update(s.shopItem).set({ active: a.active === true }).where(eq(s.shopItem.id, int(a.id, 1, 1e9, 'id'))).run();
      return { ok: true };
    }
    case 'seedShopExamples': {
      needParent();
      if (db.select().from(s.shopItem).all().length) fail(409, 'В магазине уже есть награды');
      db.insert(s.shopItem).values([
        { name: 'Выбрать фильм вечера', emoji: '🎬', description: 'Вся семья смотрит то, что выбрал ты', price: 300, currency: 'points' },
        { name: '+1 час игр', emoji: '🎮', description: 'Дополнительный час игр в выходной', price: 500, currency: 'points' },
        { name: 'Выбрать ужин', emoji: '🍕', description: 'Любимое блюдо на ужин', price: 1, currency: 'chests' },
        { name: 'Поход или поездка', emoji: '🏕', description: 'Семейный поход в выбранное место', price: 1500, currency: 'points' },
        { name: 'Поход в кафе', emoji: '🍰', description: 'Сладкое в кафе всей семьёй', price: 3, currency: 'chests' },
      ]).run();
      return { ok: true };
    }
    case 'buyItem': {
      const memberId = target();
      const item = db.select().from(s.shopItem).where(eq(s.shopItem.id, int(a.itemId, 1, 1e9, 'Награда'))).get();
      if (!item || !item.active) return fail(404, 'Награда недоступна');
      const st = loadFamily(db, now).family.members.get(memberId)!;
      if (item.currency === 'points' && st.balance < item.price) fail(400, `Не хватает ${item.price - st.balance} очков`);
      if (item.currency === 'chests' && st.chestsAvailable < item.price) fail(400, `Не хватает сундуков: нужно ${item.price}, есть ${st.chestsAvailable}`);
      const row = db.insert(s.shopPurchase).values({ memberId, itemId: item.id, name: item.name, emoji: item.emoji, price: item.price, currency: item.currency, date: today }).returning().get();
      return { id: row.id };
    }
    case 'fulfillPurchase':
    case 'cancelPurchase': {
      needParent();
      const id = int(a.id, 1, 1e9, 'id');
      const p = db.select().from(s.shopPurchase).where(eq(s.shopPurchase.id, id)).get();
      if (!p) return fail(404, 'Нет такой покупки');
      if (p.status !== 'pending') fail(409, 'Покупка уже обработана');
      db.update(s.shopPurchase).set({ status: action === 'fulfillPurchase' ? 'done' : 'cancelled' }).where(eq(s.shopPurchase.id, id)).run();
      return { ok: true };
    }
    case 'createMember': {
      needParent();
      const row = db.insert(s.member).values({
        name: str(a.name, 40, 'Имя'), emoji: typeof a.emoji === 'string' ? a.emoji.slice(0, 8) : '🙂',
        isParent: a.isParent === true, goal: int(a.goal ?? 60, 10, 500, 'Норма'), superGoal: int(a.superGoal ?? 100, 10, 1000, 'Супер-норма'),
        createdAt: now.toISOString(),
      }).returning().get();
      db.insert(s.hero).values({ memberId: row.id, clsChangedAt: now.toISOString() }).run();
      return { id: row.id };
    }
    case 'setAvatar': {
      const memberId = target();
      const patch: Partial<typeof s.member.$inferInsert> = {};
      if (a.emoji !== undefined) {
        if (!AVATARS.includes(a.emoji as string)) fail(400, 'Такого аватара нет в списке');
        patch.emoji = a.emoji as string;
      }
      if (a.color !== undefined) {
        if (!/^#[0-9a-f]{6}$/i.test(String(a.color))) fail(400, 'Неверный цвет');
        patch.color = String(a.color);
      }
      if (!Object.keys(patch).length) fail(400, 'Нечего менять');
      db.update(s.member).set(patch).where(eq(s.member.id, memberId)).run();
      return { ok: true };
    }
    case 'updateMember': {
      needParent();
      const patch: Partial<typeof s.member.$inferInsert> = {};
      if (a.name !== undefined) patch.name = str(a.name, 40, 'Имя');
      if (a.emoji !== undefined) patch.emoji = String(a.emoji).slice(0, 8);
      if (a.color !== undefined && /^#[0-9a-f]{6}$/i.test(String(a.color))) patch.color = String(a.color);
      if (a.goal !== undefined) patch.goal = int(a.goal, 10, 500, 'Норма');
      if (a.superGoal !== undefined) patch.superGoal = int(a.superGoal, 10, 1000, 'Супер-норма');
      db.update(s.member).set(patch).where(eq(s.member.id, target())).run();
      return { ok: true };
    }
    case 'setConfig': {
      needParent();
      const patch: Partial<typeof s.config.$inferInsert> = {};
      if (a.minutes !== undefined) patch.minutes = int(a.minutes, 0, 600, 'Минуты');
      if (a.superMinutes !== undefined) patch.superMinutes = int(a.superMinutes, 0, 600, 'Минуты');
      for (const k of ['loot', 'lootRare', 'lootLegend'] as const)
        if (a[k] !== undefined) {
          const v = a[k];
          if (!Array.isArray(v) || v.length > 50 || v.some((x) => typeof x !== 'string' || !x.trim() || x.length > 80)) fail(400, 'Список наград некорректен');
          patch[k] = (v as string[]).map((x) => x.trim());
        }
      if (a.timezone !== undefined) {
        try { new Intl.DateTimeFormat('en', { timeZone: String(a.timezone) }); } catch { fail(400, 'Неизвестный часовой пояс'); }
        patch.timezone = String(a.timezone);
      }
      if (Object.keys(patch).length) db.update(s.config).set(patch).where(eq(s.config.id, 1)).run();
      return { ok: true };
    }
    case 'changePin': {
      needParent();
      if (!validPin(a.pin)) fail(400, 'PIN: 4–8 цифр');
      db.update(s.config).set({ pinHash: hashPin(a.pin as string) }).where(eq(s.config.id, 1)).run();
      return { ok: true };
    }
    default:
      return fail(400, `Неизвестное действие: ${action}`);
  }
}

function saveQuests(db: Db, memberId: number, date: string, items: QuestItem[]) {
  db.insert(s.questOverride).values({ memberId, date, items })
    .onConflictDoUpdate({ target: [s.questOverride.memberId, s.questOverride.date], set: { items } }).run();
}
