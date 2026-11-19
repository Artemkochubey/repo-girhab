import { addDays, dateRange, todayIn } from '../date';
import { BOSSES, bossDamage, bossForDate, bossHp, bossRewards, weekStart } from '../game/boss';
import { CLASS_SPHERES, recommendSub, type Cls } from '../game/classes';
import { chestsEarned, levelFromXp, levelProgress, talentPointsTotal } from '../game/level';
import { basePoints, dayPoints, streakForward } from '../game/points';
import { allQuestsDone, defaultQuests, questDone, questXpEarned, type QuestItem } from '../game/quests';
import { hasShield, spentPoints } from '../game/talents';
import { emptyDay, type DayStats, type HeroBuild, type Sphere, type StudyKind } from '../game/types';

export interface Raw {
  timezone: string;
  members: { id: number; name: string; emoji: string; color: string; isParent: boolean; goal: number; superGoal: number; createdAt: string }[];
  heroes: { memberId: number; cls: Cls; sub: Cls | null; clsChangedAt: string; talents: string[] }[];
  workouts: { memberId: number; date: string; minutes: number }[];
  warmups: { memberId: number; date: string }[];
  study: { memberId: number; date: string; kind: StudyKind; minutes: number }[];
  habits: { id: number; memberId: number; name: string }[];
  habitChecks: { habitId: number; date: string }[];
  books: { memberId: number; finishedAt: string }[];
  quests: { memberId: number; date: string; items: QuestItem[] }[];
  chestsOpened: { memberId: number; n: number }[];
  shopItems: ShopItemRow[];
  purchases: PurchaseRow[];
}

export interface ShopItemRow { id: number; name: string; emoji: string; description: string; price: number; currency: 'points' | 'chests'; active: boolean }
export interface PurchaseRow { id: number; memberId: number; itemId: number | null; name: string; emoji: string; price: number; currency: 'points' | 'chests'; status: 'pending' | 'done' | 'cancelled'; date: string }

export interface DayCalc { stats: DayStats; total: number; bySphere: Partial<Record<Sphere, number>>; quests: QuestItem[]; questsDone: boolean[] }

export interface MemberState {
  id: number;
  hero: { cls: Cls; sub: Cls | null; clsChangedAt: string; talents: string[] };
  xp: number; level: number; into: number; span: number;
  streak: number;
  talentPointsFree: number;
  recommendedSub: Cls | null;
  days: Map<string, DayCalc>;
  questDays: number;
  chestsEarned: number; chestsOpened: number; chestsAvailable: number;
  spentPoints: number; spentChests: number; balance: number;
}

export interface BossWeek {
  weekStart: string; bossId: number; hp: number; damage: number; defeated: boolean; finished: boolean;
  byMember: Record<number, number>; mvp: number | null; participants: number[];
}

export interface Family { today: string; members: Map<number, MemberState>; boss: BossWeek; bossHistory: BossWeek[] }

const CLASS_OF: Partial<Record<Sphere, Cls>> = {};
for (const c of Object.keys(CLASS_SPHERES) as Cls[]) for (const s of CLASS_SPHERES[c]) CLASS_OF[s] ??= c;

export function buildFamily(raw: Raw, today: string): Family {
  const tz = raw.timezone;
  const members = new Map<number, MemberState>();
  const habitOwner = new Map(raw.habits.map((h) => [h.id, h.memberId]));

  for (const m of raw.members) {
    const hero = raw.heroes.find((h) => h.memberId === m.id) ?? { memberId: m.id, cls: 'w' as Cls, sub: null, clsChangedAt: m.createdAt, talents: [] };
    const stats = new Map<string, DayStats>();
    const get = (date: string) => { let s = stats.get(date); if (!s) stats.set(date, (s = emptyDay())); return s; };
    for (const w of raw.workouts) if (w.memberId === m.id) get(w.date).workoutMinutes += w.minutes;
    for (const w of raw.warmups) if (w.memberId === m.id) get(w.date).warmups = 1;
    for (const s of raw.study) if (s.memberId === m.id) { const d = get(s.date); d.study[s.kind] = (d.study[s.kind] ?? 0) + s.minutes; }
    for (const c of raw.habitChecks) if (habitOwner.get(c.habitId) === m.id) get(c.date).habits++;
    for (const b of raw.books) if (b.memberId === m.id) get(b.finishedAt).books++;

    const created = todayIn(tz, new Date(m.createdAt));
    const first = [...stats.keys()].reduce((a, b) => (b < a ? b : a), created);
    const dates = dateRange(first < created ? first : created, today);
    for (const d of dates) get(d);

    const overrides = raw.quests.filter((q) => q.memberId === m.id);
    const tpl = overrides.find((q) => q.date === 'default')?.items;
    const questsFor = (date: string) => overrides.find((q) => q.date === date)?.items ?? tpl ?? defaultQuests(m.id, date, m.goal);

    const active = (d: string) => basePoints(stats.get(d)!) >= m.goal * 0.5;
    const streaks = streakForward(dates, active, hasShield(hero.talents), today);

    const questXp = new Map<string, number>();
    let questDays = 0;
    for (const d of dates) {
      const qs = questsFor(d);
      const st = stats.get(d)!;
      questXp.set(d, questXpEarned(qs, st));
      if (allQuestsDone(qs, st)) questDays++;
    }

    const calc = (build: HeroBuild, useSub: boolean) => {
      const days = new Map<string, DayCalc>();
      let xp = 0;
      for (const d of dates) {
        const st = { ...stats.get(d)!, questXp: questXp.get(d)! };
        const r = dayPoints(st, build, streaks.get(d) ?? 0, useSub);
        const qs = questsFor(d);
        days.set(d, { stats: st, total: r.total, bySphere: r.bySphere, quests: qs, questsDone: qs.map((q) => questDone(q, st)) });
        xp += r.total;
      }
      return { days, xp };
    };
    const build: HeroBuild = { cls: hero.cls, sub: hero.sub, talents: hero.talents, level: 1 };
    // Два прохода: уровень для бонуса подкласса берём из очков без бонуса подкласса.
    const a = calc(build, false);
    const b = calc({ ...build, level: levelFromXp(a.xp) }, true);
    const level = levelFromXp(b.xp);
    const prog = levelProgress(b.xp);

    const clsPoints: Record<Cls, number> = { w: 0, m: 0, b: 0, p: 0 };
    for (const dc of b.days.values()) for (const [s, v] of Object.entries(dc.bySphere)) { const c = CLASS_OF[s as Sphere]; if (c) clsPoints[c] += v ?? 0; }

    members.set(m.id, {
      id: m.id, hero: { cls: hero.cls, sub: hero.sub, clsChangedAt: hero.clsChangedAt, talents: hero.talents },
      xp: b.xp, level, into: prog.into, span: prog.span,
      streak: streaks.get(today) ?? 0,
      talentPointsFree: talentPointsTotal(level) - spentPoints(hero.talents, hero.cls),
      recommendedSub: recommendSub(clsPoints, hero.cls),
      days: b.days, questDays,
      chestsEarned: 0, chestsOpened: raw.chestsOpened.filter((c) => c.memberId === m.id).length, chestsAvailable: 0,
      spentPoints: 0, spentChests: 0, balance: 0,
    });
  }

  // Боссы: каждая неделя от первой до текущей считается чисто из записей.
  const firstDate = raw.members.map((m) => todayIn(tz, new Date(m.createdAt))).sort()[0] ?? today;
  const bossHistory: BossWeek[] = [];
  const bossChests = new Map<number, number>();
  const curWeek = weekStart(today);
  for (let w = weekStart(firstDate); w <= curWeek; w = addDays(w, 7)) {
    let parts = raw.members.filter((m) => todayIn(tz, new Date(m.createdAt)) < w);
    if (!parts.length) parts = raw.members;
    const boss = bossForDate(w);
    const weak = new Set<string>(boss.weak);
    const byMember: Record<number, number> = {};
    let total = 0, weakPts = 0;
    for (const m of parts) {
      let sum = 0;
      for (const d of dateRange(w, addDays(w, 6))) {
        const dc = members.get(m.id)?.days.get(d);
        if (!dc) continue;
        sum += dc.total;
        for (const [s, v] of Object.entries(dc.bySphere)) if (weak.has(s)) weakPts += v ?? 0;
      }
      byMember[m.id] = sum; total += sum;
    }
    const hp = bossHp(parts.map((m) => m.goal));
    const damage = bossDamage(total, weakPts);
    const finished = w < curWeek;
    const defeated = damage >= hp;
    const res = defeated ? bossRewards(byMember) : { chests: {}, mvp: null };
    if (defeated && finished) for (const [id, n] of Object.entries(res.chests)) bossChests.set(+id, (bossChests.get(+id) ?? 0) + n);
    bossHistory.push({ weekStart: w, bossId: boss.id, hp, damage, defeated, finished, byMember, mvp: res.mvp, participants: parts.map((m) => m.id) });
  }

  for (const st of members.values()) {
    st.chestsEarned = chestsEarned(st.level, st.questDays, bossChests.get(st.id) ?? 0);
    // Отменённые покупки возвращают цену; опыт и уровень от трат не страдают.
    const mine = raw.purchases.filter((p) => p.memberId === st.id && p.status !== 'cancelled');
    st.spentPoints = mine.filter((p) => p.currency === 'points').reduce((a, p) => a + p.price, 0);
    st.spentChests = mine.filter((p) => p.currency === 'chests').reduce((a, p) => a + p.price, 0);
    st.balance = st.xp - st.spentPoints;
    st.chestsAvailable = Math.max(0, st.chestsEarned - st.chestsOpened - st.spentChests);
  }
  return { today, members, boss: bossHistory[bossHistory.length - 1], bossHistory };
}

export { BOSSES };
