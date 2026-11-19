import { addDays, dateRange, todayIn } from '../date';
import { allocateWorkouts } from '../game/reps';
import { DAY_RATIO_CAP, MVP_CHEST_PER_DAY, dayRatio, pickDayMvp } from '../game/mvp';
import { computeAchievements, type AchievementState } from '../game/achievements';
import { resolveFamilyQuest, type FamilyQuestInput, type FamilyQuestResult } from '../game/familyQuests';
import { BOSSES, WEAK_BONUS, bossForDate, bossHp, bossRewards, weekStart } from '../game/boss';
import { CLASS_SPHERES, recommendSub, type Cls } from '../game/classes';
import { chestsEarned, levelFromXp, levelProgress, talentPointsTotal } from '../game/level';
import { basePoints, dayPoints, streakForward } from '../game/points';
import { allQuestsDone, defaultQuests, questDone, questXpEarned, type QuestItem } from '../game/quests';
import { buildSeasons, type SeasonsResult } from '../game/seasons';
import { AURA_CAP, auraOf, bossBonuses, hasShield, spentPoints } from '../game/talents';
import { emptyDay, type DayStats, type HeroBuild, type Sphere, type StudyKind } from '../game/types';

export interface Raw {
  timezone: string;
  members: { id: number; name: string; emoji: string; color: string; isParent: boolean; goal: number; superGoal: number; createdAt: string }[];
  heroes: { memberId: number; cls: Cls; clsChosen: boolean; sub: Cls | null; clsChangedAt: string; talents: string[] }[];
  workouts: { id?: number; memberId: number; date: string; minutes: number; exercise?: string | null; muscles?: string[] | null; reps?: number | null }[];
  warmups: { memberId: number; date: string }[];
  study: { memberId: number; date: string; kind: StudyKind; minutes: number }[];
  habits: { id: number; memberId: number; name: string }[];
  habitChecks: { habitId: number; date: string }[];
  books: { memberId: number; finishedAt: string }[];
  quests: { memberId: number; date: string; items: QuestItem[] }[];
  chestsOpened: { memberId: number; n: number; date?: string; rarity?: string; reward?: string; status?: string; deliveredOn?: string | null }[];
  familyQuests: FamilyQuestInput[];
  dayMvps: { date: string; memberId: number }[];   // memberId 0 — в тот день MVP не было
  mvpSince: string | null;
  reminderHour: number;
  seasonSince: string | null;
  reviewOk: { memberId: number; date: string; points: number }[];
  shopItems: ShopItemRow[];
  purchases: PurchaseRow[];
}

export interface ShopItemRow { id: number; name: string; emoji: string; description: string; price: number; currency: 'points' | 'chests'; active: boolean }
export interface PurchaseRow { id: number; memberId: number; itemId: number | null; name: string; emoji: string; price: number; currency: 'points' | 'chests'; status: 'pending' | 'done' | 'cancelled'; date: string }

export interface DayCalc { stats: DayStats; total: number; bySphere: Partial<Record<Sphere, number>>; quests: QuestItem[]; questsDone: boolean[] }

export interface MemberState {
  id: number;
  hero: { cls: Cls | null; sub: Cls | null; clsChangedAt: string; talents: string[] };
  xp: number; level: number; into: number; span: number;
  streak: number;
  talentPointsFree: number;
  recommendedSub: Cls | null;
  days: Map<string, DayCalc>;
  questDays: number;
  chestsEarned: number; chestsOpened: number; chestsAvailable: number;
  spentPoints: number; spentChests: number; balance: number;
  achievements: AchievementState[];
}

export interface BossWeek {
  weekStart: string; bossId: number; hp: number; damage: number; defeated: boolean; finished: boolean;
  byMember: Record<number, number>; mvp: number | null; participants: number[];
}

export interface ResolvedFamilyQuest extends FamilyQuestInput, FamilyQuestResult { participants: number[] }
export interface MvpInfo {
  pending: { date: string; memberId: number; points: number; ratio: number }[];   // итоги дней, которые ещё надо сохранить
  yesterday: { date: string; memberId: number; points: number } | null;
  leader: { memberId: number; points: number; ratio: number; qualified: boolean } | null;
  wins: Record<number, number>;
  byDate: Record<string, number>;   // дата → победитель (0 — не было)
}
export interface Family { today: string; members: Map<number, MemberState>; boss: BossWeek; bossHistory: BossWeek[]; familyQuests: ResolvedFamilyQuest[]; mvp: MvpInfo; seasons: SeasonsResult }

const CLASS_OF: Partial<Record<Sphere, Cls>> = {};
for (const c of Object.keys(CLASS_SPHERES) as Cls[]) for (const s of CLASS_SPHERES[c]) CLASS_OF[s] ??= c;

export function buildFamily(raw: Raw, today: string): Family {
  const tz = raw.timezone;
  const members = new Map<number, MemberState>();
  const habitOwner = new Map(raw.habits.map((h) => [h.id, h.memberId]));

  const prep = new Map<number, { hero: (typeof raw.heroes)[number]; cls: Cls | null; stats: Map<string, DayStats>; dates: string[] }>();
  for (const m of raw.members) {
    const hero = raw.heroes.find((h) => h.memberId === m.id) ?? { memberId: m.id, cls: 'w' as Cls, clsChosen: false, sub: null, clsChangedAt: m.createdAt, talents: [] };
    const cls: Cls | null = hero.clsChosen ? hero.cls : null;
    const stats = new Map<string, DayStats>();
    const get = (date: string) => { let s = stats.get(date); if (!s) stats.set(date, (s = emptyDay())); return s; };
    // минуты считаются как есть, повторы — по ставке упражнения с потолками (см. game/reps.ts)
    for (const w of allocateWorkouts(raw.workouts.filter((x) => x.memberId === m.id).map((x, i) => ({ ...x, id: x.id ?? i })))) get(w.date).workoutMinutes += w.eq;
    for (const w of raw.warmups) if (w.memberId === m.id) get(w.date).warmups = 1;
    for (const s of raw.study) if (s.memberId === m.id) { const d = get(s.date); d.study[s.kind] = (d.study[s.kind] ?? 0) + s.minutes; }
    for (const c of raw.habitChecks) if (habitOwner.get(c.habitId) === m.id) get(c.date).habits++;
    for (const b of raw.books) if (b.memberId === m.id) get(b.finishedAt).books++;

    const created = todayIn(tz, new Date(m.createdAt));
    const first = [...stats.keys()].reduce((a, b) => (b < a ? b : a), created);
    const dates = dateRange(first < created ? first : created, today);
    for (const d of dates) get(d);

    prep.set(m.id, { hero, cls, stats, dates });
  }

  // Семейная аура: «Знамя семьи» каждого героя даёт всем +% очков (не больше AURA_CAP)
  const aura = Math.min(AURA_CAP, [...prep.values()].reduce((a, p) => a + auraOf(p.hero.talents, p.cls), 0));

  // Семейные квесты: очки активности семьи по дням (без бонусов и квестов, чтобы не было циклов)
  const familyPoints = new Map<string, number>();
  for (const p of prep.values()) for (const [d, st] of p.stats) familyPoints.set(d, (familyPoints.get(d) ?? 0) + basePoints(st));
  const createdOf = new Map(raw.members.map((m) => [m.id, todayIn(tz, new Date(m.createdAt))]));
  const famXp = new Map<number, Map<string, number>>();
  const familyQuests: ResolvedFamilyQuest[] = raw.familyQuests.map((q) => {
    const r = resolveFamilyQuest(q, familyPoints, today);
    const participants = raw.members.filter((m) => (r.doneDate ?? q.date) >= createdOf.get(m.id)!).map((m) => m.id);
    if (r.done && r.doneDate) for (const id of participants) { const mm = famXp.get(id) ?? new Map<string, number>(); mm.set(r.doneDate, (mm.get(r.doneDate) ?? 0) + q.xp); famXp.set(id, mm); }
    return { ...q, ...r, participants };
  });
  const achIn = new Map<number, { dates: string[]; stats: DayStats[]; points: number[]; streak: number[]; questsAllDone: boolean[]; superGoal: number }>();

  for (const m of raw.members) {
    const { hero, cls, stats, dates } = prep.get(m.id)!;
    const overrides = raw.quests.filter((q) => q.memberId === m.id);
    const tpl = overrides.find((q) => q.date === 'default')?.items;
    const questsFor = (date: string) => overrides.find((q) => q.date === date)?.items ?? tpl ?? defaultQuests(m.id, date, m.goal);

    const active = (d: string) => basePoints(stats.get(d)!) >= m.goal * 0.5;
    const streaks = streakForward(dates, active, hasShield(hero.talents, cls), today);

    const questXp = new Map<string, number>();
    let questDays = 0;
    const questsAllDone: boolean[] = [];
    for (const d of dates) {
      const qs = questsFor(d);
      const st = stats.get(d)!;
      questXp.set(d, questXpEarned(qs, st) + (famXp.get(m.id)?.get(d) ?? 0));
      const all = allQuestsDone(qs, st);
      questsAllDone.push(all);
      if (all) questDays++;
    }

    const calc = (build: HeroBuild, useSub: boolean) => {
      const days = new Map<string, DayCalc>();
      let xp = 0;
      for (const d of dates) {
        const st = { ...stats.get(d)!, questXp: questXp.get(d)! };
        const r = dayPoints(st, build, streaks.get(d) ?? 0, useSub, { date: d, superGoal: m.superGoal });
        const qs = questsFor(d);
        days.set(d, { stats: st, total: r.total, bySphere: r.bySphere, quests: qs, questsDone: qs.map((q) => questDone(q, st)) });
        xp += r.total;
      }
      return { days, xp };
    };
    const build: HeroBuild = { cls, sub: hero.sub, talents: hero.talents, level: 1, aura };
    // Два прохода: уровень для бонуса подкласса берём из очков без бонуса подкласса.
    const a = calc(build, false);
    const b = calc({ ...build, level: levelFromXp(a.xp) }, true);
    const level = levelFromXp(b.xp);
    const prog = levelProgress(b.xp);

    const clsPoints: Record<Cls, number> = { w: 0, m: 0, b: 0, p: 0 };
    for (const dc of b.days.values()) for (const [s, v] of Object.entries(dc.bySphere)) { const c = CLASS_OF[s as Sphere]; if (c) clsPoints[c] += v ?? 0; }

    members.set(m.id, {
      id: m.id, hero: { cls, sub: hero.sub, clsChangedAt: hero.clsChangedAt, talents: hero.talents },
      xp: b.xp, level, into: prog.into, span: prog.span,
      streak: streaks.get(today) ?? 0,
      talentPointsFree: talentPointsTotal(level) - spentPoints(hero.talents, cls),
      recommendedSub: recommendSub(clsPoints, cls),
      days: b.days, questDays,
      chestsEarned: 0, chestsOpened: raw.chestsOpened.filter((c) => c.memberId === m.id).length, chestsAvailable: 0,
      spentPoints: 0, spentChests: 0, balance: 0, achievements: [],
    });
    achIn.set(m.id, { dates, stats: dates.map((d) => stats.get(d)!), points: dates.map((d) => b.days.get(d)!.total), streak: dates.map((d) => streaks.get(d) ?? 0), questsAllDone, superGoal: m.superGoal });
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
    let total = 0, weakExtra = 0;
    for (const m of parts) {
      let sum = 0, weakPts = 0;
      for (const d of dateRange(w, addDays(w, 6))) {
        const dc = members.get(m.id)?.days.get(d);
        if (!dc) continue;
        sum += dc.total;
        for (const [s, v] of Object.entries(dc.bySphere)) if (weak.has(s)) weakPts += v ?? 0;
      }
      const bb = bossBonuses(members.get(m.id)?.hero.talents ?? [], members.get(m.id)?.hero.cls ?? null);
      byMember[m.id] = Math.round(sum * (1 + bb.boss)); total += byMember[m.id];
      weakExtra += weakPts * (WEAK_BONUS + bb.weak);
    }
    const hp = bossHp(parts.map((m) => m.goal));
    const damage = Math.round(total + weakExtra);
    const finished = w < curWeek;
    const defeated = damage >= hp;
    const res = defeated ? bossRewards(byMember) : { chests: {}, mvp: null };
    if (defeated && finished) for (const [id, n] of Object.entries(res.chests)) bossChests.set(+id, (bossChests.get(+id) ?? 0) + n);
    bossHistory.push({ weekStart: w, bossId: boss.id, hp, damage, defeated, finished, byMember, mvp: res.mvp, participants: parts.map((m) => m.id) });
  }

  // MVP дня: итоги прошедших дней фиксируются (pending → сохраняются сервисом), сегодняшний лидер — живой
  const mvpByDate = new Map<string, number>();
  const pendingMvps: MvpInfo['pending'] = [];
  for (const r of raw.dayMvps) mvpByDate.set(r.date, r.memberId);
  if (raw.mvpSince) {
    for (let d = raw.mvpSince; d < today; d = addDays(d, 1)) {
      if (mvpByDate.has(d)) continue;
      const cands = raw.members.filter((m) => createdOf.get(m.id)! <= d).map((m) => ({ id: m.id, points: members.get(m.id)!.days.get(d)?.total ?? 0, goal: m.goal }));
      const w = pickDayMvp(cands);
      mvpByDate.set(d, w?.id ?? 0);
      pendingMvps.push({ date: d, memberId: w?.id ?? 0, points: w?.points ?? 0, ratio: w?.ratio ?? 0 });
    }
  }
  const mvpWins: Record<number, number> = {};
  const mvpDatesOf = new Map<number, string[]>();
  for (const [d, id] of mvpByDate) if (id > 0 && d < today) { mvpWins[id] = (mvpWins[id] ?? 0) + 1; mvpDatesOf.set(id, [...(mvpDatesOf.get(id) ?? []), d]); }
  const yId = mvpByDate.get(addDays(today, -1));
  const yesterday = yId ? { date: addDays(today, -1), memberId: yId, points: members.get(yId)?.days.get(addDays(today, -1))?.total ?? 0 } : null;
  let leader: MvpInfo['leader'] = null;
  for (const m of raw.members.filter((x) => createdOf.get(x.id)! <= today)) {
    const pts = members.get(m.id)!.days.get(today)?.total ?? 0;
    const ratio = dayRatio(pts, m.goal);
    if (pts > 0 && (!leader || ratio > leader.ratio)) leader = { memberId: m.id, points: pts, ratio, qualified: ratio >= 1 };
  }

  // Сезоны (месяцы): рейтинг по очкам относительно нормы, призы победителям
  const seasons = buildSeasons(today, raw.seasonSince, raw.members.map((m) => ({ id: m.id, goal: m.goal, createdOn: createdOf.get(m.id)! })), (id, d) => members.get(id)?.days.get(d)?.total ?? 0);

  for (const st of members.values()) {
    st.chestsEarned = chestsEarned(st.level, st.questDays, (bossChests.get(st.id) ?? 0) + (mvpWins[st.id] ?? 0) * MVP_CHEST_PER_DAY + (seasons.chests[st.id] ?? 0));
    // Отменённые покупки возвращают цену; опыт и уровень от трат не страдают.
    const mine = raw.purchases.filter((p) => p.memberId === st.id && p.status !== 'cancelled');
    st.spentPoints = mine.filter((p) => p.currency === 'points').reduce((a, p) => a + p.price, 0);
    st.spentChests = mine.filter((p) => p.currency === 'chests').reduce((a, p) => a + p.price, 0);
    st.balance = st.xp - st.spentPoints;
    st.chestsAvailable = Math.max(0, st.chestsEarned - st.chestsOpened - st.spentChests);
  }
  // Достижения: выводятся из истории, поэтому считаются после боссов
  for (const st of members.values()) {
    const a = achIn.get(st.id)!;
    const wins = bossHistory.filter((w) => w.finished && w.defeated && (w.byMember[st.id] ?? 0) > 0 && (w.byMember[st.id] ?? 0) / Math.max(1, Object.values(w.byMember).reduce((x, y) => x + y, 0)) >= 0.1);
    st.achievements = computeAchievements({
      dates: a.dates, streak: a.streak, points: a.points, questsAllDone: a.questsAllDone, superGoal: a.superGoal,
      books: a.stats.map((x) => x.books), warmups: a.stats.map((x) => x.warmups), habits: a.stats.map((x) => x.habits),
      study: a.stats.map((x) => Object.values(x.study).reduce((p, q) => p + (q ?? 0), 0)), workoutEq: a.stats.map((x) => x.workoutMinutes),
      chestDates: raw.chestsOpened.filter((c) => c.memberId === st.id && c.date).map((c) => c.date!),
      bossWinDates: wins.map((w) => addDays(w.weekStart, 6)),
      mvpDates: bossHistory.filter((w) => w.finished && w.defeated && w.mvp === st.id).map((w) => addDays(w.weekStart, 6)),
      dayMvpDates: mvpDatesOf.get(st.id) ?? [],
      seasonWinDates: seasons.winDates[st.id] ?? [],
    });
  }
  return { today, members, boss: bossHistory[bossHistory.length - 1], bossHistory, familyQuests, mvp: { pending: pendingMvps, yesterday, leader, wins: mvpWins, byDate: Object.fromEntries(mvpByDate) }, seasons };
}

export { BOSSES };
