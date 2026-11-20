import { shopDiscount } from '../game/talents';
import { SEASON_CHESTS } from '../game/seasons';
import { reviewDay, reviewHidden } from '../game/review';
import { PITY, pityCounters, type Rarity } from '../game/chests';
import { gearById, SLOTS } from '../game/gear';
import { buildRating, buildWeekRating } from '../game/rating';
import { MONTH_GOAL_INFO, MONTH_GOAL_KINDS, monthEnd, monthOf, monthStart, resolveMonthGoal, suggestTarget, type MonthGoalKind } from '../game/monthGoal';
import { weekStart } from '../game/boss';
import { rankFor } from '../game/ranks';
import { DEED_DAY_CAP, deedJournal, deedSummary } from '../game/deeds';
import { parseFace } from '../game/faces';
import { CLASS_BATTLE, SPECS, SPEC_LEVEL, classOnly } from '../game/classBattle';
import { basePoints } from '../game/points';
import { repeatLabel, taskNeedsConfirm, taskProgress, taskReward, tasksOn, type TaskDayItem } from '../game/tasks';
import { GOAL_INFO, GOAL_KINDS, REWARD, TIERS, canChooseGoal, goalTarget, goalWeekStart, rewardXp, weekEnd } from '../game/goals';
import { BOSSES } from '../game/boss';
import { questHint, questProgress } from '../game/quests';
import { allocateWorkouts } from '../game/reps';
import { addDays, dateRange } from '../date';
import type { Family, Raw, MemberState } from './engine';
import type { CustomQuestSet } from '../game/questSets';

const bossView = (b: Family['boss']) => ({ ...b, boss: BOSSES.find((x) => x.id === b.bossId)! });

const summary = (raw: Raw, fam: Family) =>
  raw.members.map((m) => {
    const st = fam.members.get(m.id)!;
    return { id: m.id, name: m.name, emoji: m.emoji, simple: !!m.simple, gender: (m.gender === 'f' ? 'f' : m.gender === 'm' ? 'm' : null) as 'm' | 'f' | null, face: parseFace(m.face, m.gender === 'f' ? 'f' : 'm'), color: m.color, isParent: m.isParent, goal: m.goal, superGoal: m.superGoal,
      badges: st.achievements.filter((a) => a.earnedOn).length, xp: st.xp, level: st.level, cls: st.hero.cls, sub: st.hero.sub, pointsToday: st.days.get(fam.today)?.total ?? 0,
      damageThisWeek: fam.boss.byMember[m.id] ?? 0,
      // что надето (id предмета по слотам): для фигур героев в боях
      look: Object.fromEntries(st.equipped.map((e) => [e.item.slot, e.item.id])) as Record<string, string> };
  });

const RADAR = [
  { key: 'Тело', spheres: ['workout', 'warmup'] },
  { key: 'Учёба', spheres: ['Учёба'] },
  { key: 'Мышление', spheres: ['Мышление'] },
  { key: 'Книги', spheres: ['Книги', 'book'] },
  { key: 'Языки', spheres: ['Языки'] },
  { key: 'Творчество', spheres: ['Творчество'] },
  { key: 'Навыки', spheres: ['Навыки'] },
  { key: 'Дисциплина', spheres: ['habits'] },
  { key: 'Доброта', spheres: ['deeds'] },
];

/** Дни за последнюю неделю с меткой «проверить» (без уже просмотренных родителем). */
export function reviewFlags(raw: Raw, fam: Family, memberId: number) {
  const st = fam.members.get(memberId)!, m = raw.members.find((x) => x.id === memberId)!;
  const out: { memberId: number; date: string; points: number; reasons: string[] }[] = [];
  for (const d of dateRange(addDays(fam.today, -7), fam.today)) {
    const day = st.days.get(d);
    if (!day) continue;
    const prev = dateRange(addDays(d, -14), addDays(d, -1)).map((x) => st.days.get(x)?.total ?? 0);
    const works = raw.workouts.filter((w) => w.memberId === memberId && w.date === d).map((w, i) => ({ id: w.id ?? i, minutes: w.minutes, reps: w.reps ?? null, exercise: w.exercise ?? null }));
    const reasons = reviewDay({ points: day.total, superGoal: m.superGoal, prevPoints: prev, workouts: works });
    if (reasons.length && !reviewHidden(day.total, raw.reviewOk.find((r) => r.memberId === memberId && r.date === d))) out.push({ memberId, date: d, points: Math.round(day.total), reasons });
  }
  return out;
}

/** Недельная цель героя: текущая, прошлая, можно ли выбирать и список готовых вариантов с числами. */
export function goalView(raw: Raw, fam: Family, st: MemberState) {
  const m = raw.members.find((x) => x.id === st.id)!;
  const habits = raw.habits.filter((h) => h.memberId === st.id).length;
  const ws = goalWeekStart(fam.today);
  const options = GOAL_KINDS.map((k) => {
    const tiers = TIERS.map((tier) => ({ tier, target: goalTarget(k, tier, m.goal, habits), xp: rewardXp(tier, m.goal), chests: REWARD[tier].chests, artifact: REWARD[tier].artifact }));
    return { kind: k, name: GOAL_INFO[k].name, emoji: GOAL_INFO[k].emoji, unit: GOAL_INFO[k].unit, tiers, texts: tiers.map((t) => (t.target === null ? '' : GOAL_INFO[k].text(t.target))) };
  });
  return {
    weekStart: ws, weekEnd: weekEnd(ws), canChoose: canChooseGoal(fam.today, ws) && !st.goals.current,
    current: st.goals.current, last: st.goals.history[0] ?? null, options,
  };
}

const taskItem = (it: TaskDayItem) => ({
  id: it.task.id, title: it.task.title, emoji: it.task.emoji, done: it.done, confirmed: it.confirmed, carried: it.carried,
  points: it.task.points, chests: it.task.chests, confirm: taskNeedsConfirm(it.task),
});

/** Задачи героя: последние 7 дней (сегодня первым) — для карточки «Сегодня» и вкладки «Мои задачи». */
export function taskView(raw: Raw, fam: Family, memberId: number) {
  const defs = (raw.tasks ?? []).filter((t) => t.memberId === memberId);
  const dones = (raw.taskDone ?? []).filter((d) => defs.some((t) => t.id === d.taskId));
  const created = raw.members.find((m) => m.id === memberId)?.createdAt.slice(0, 10) ?? '';
  const days = dateRange(addDays(fam.today, -6), fam.today).reverse().filter((d, k) => k === 0 || d >= created).map((date) => {
    const items = tasksOn(defs, dones, date, fam.today);
    const reward = taskReward(defs, dones, date);
    return { date, items: items.map(taskItem), progress: taskProgress(items), reward };
  });
  return { days, has: defs.some((t) => t.until === null || t.until > fam.today) };
}

export function memberDetail(raw: Raw, fam: Family, st: MemberState, date: string = fam.today) {
  const myWorkouts = allocateWorkouts(raw.workouts.filter((w) => w.memberId === st.id).map((w, i) => ({ ...w, id: w.id ?? i })));
  const today = st.days.get(date) ?? st.days.get(fam.today)!;
  const radarFrom = addDays(fam.today, -29);
  const radar = RADAR.map((r) => ({
    key: r.key,
    value: Math.round(dateRange(radarFrom, fam.today).reduce((sum, d) => {
      const bs = st.days.get(d)?.bySphere ?? {};
      return sum + r.spheres.reduce((a, sp) => a + ((bs as Record<string, number>)[sp] ?? 0), 0);
    }, 0)),
  }));
  const mine = <T extends { memberId: number; date: string }>(rows: T[]) => rows.filter((r) => r.memberId === st.id && r.date === date);
  const from = addDays(fam.today, -364);
  return {
    id: st.id, hero: st.hero, xp: st.xp, level: st.level, into: st.into, span: st.span, streak: st.streak,
    talentPointsFree: st.talentPointsFree, recommendedSub: st.recommendedSub,
    wallet: { balance: st.balance, spent: st.spentPoints },
    shopDiscount: shopDiscount(st.hero.talents, st.hero.cls),
    mvpWins: fam.mvp.wins[st.id] ?? 0,
    chests: { earned: st.chestsEarned, opened: st.chestsOpened, available: st.chestsAvailable, fromTasks: st.taskChests, granted: st.grantedChests },
    tasks: taskView(raw, fam, st.id),
    // гарантии: сколько сундуков осталось до гарантированного редкого и легендарного, сколько сундуков за босса ждут
    pity: (() => {
      const mine = raw.chestsOpened.filter((c) => c.memberId === st.id).sort((a, b) => a.n - b.n);
      const c = pityCounters(mine.map((x) => (x.rarity ?? 'common') as Rarity));
      const bossOpened = mine.filter((x) => x.source === 'boss').length;
      return { untilRare: Math.max(0, PITY.rare - 1 - c.sinceRare), untilLegend: Math.max(0, PITY.legend - 1 - c.sinceLegend), bossWaiting: Math.max(0, Math.min(st.bossChestsEarned - bossOpened, st.chestsAvailable)) };
    })(),
    // «Моя сумка»: все невыданные призы и последние выданные
    chestLog: (() => {
      // свои сундуки (в том числе подаренные другому) и подарки, которые лежат у меня
      const mine = raw.chestsOpened.filter((c) => c.memberId === st.id || c.holder === st.id).sort((a, b) => b.n - a.n || a.memberId - b.memberId);
      return [...mine.filter((c) => (c.status ?? 'bag') !== 'delivered'), ...mine.filter((c) => c.status === 'delivered').slice(0, 100)]
        .map((c) => ({ from: c.memberId, holder: c.holder ?? c.memberId, n: c.n, date: c.date ?? '', rarity: c.rarity ?? 'common', reward: c.reward ?? '', artifact: c.artifact ?? null, gear: c.gear ?? null, status: (c.status ?? 'bag') as 'bag' | 'requested' | 'delivered', deliveredOn: c.deliveredOn ?? null }));
    })(),
    // личное сражение и снаряжение
    battle: (() => {
      const b = st.battle;
      return { abilities: b.abilities, cls: st.hero.cls, classInfo: st.hero.cls ? CLASS_BATTLE[st.hero.cls] : null, specs: st.hero.cls ? SPECS[st.hero.cls].map((x) => ({ id: x.id, emoji: x.emoji, name: x.name, text: x.text, ability: { emoji: x.ability.emoji, name: x.ability.name, text: x.ability.text } })) : [], specLevel: SPEC_LEVEL, live: b.live, hp: b.hp, streak: b.streak, xp: b.xp, recent: b.rows.slice(-7).reverse().map((r) => ({ date: r.date, hordeId: r.hordeId, cleared: r.cleared, win: r.win, hpDelta: r.hpDelta, xp: r.xp, drop: r.drop })) };
    })(),
    gear: {
      items: st.gear.map((g) => ({ ...g, item: gearById(g.itemId)! })).filter((g) => g.item),
      slots: Object.fromEntries(SLOTS.map((sl) => [sl, st.gear.find((g) => g.equipped && gearById(g.itemId)?.slot === sl)?.key ?? null])),
      bonus: st.gearBonus,                  // снаряжение + способности класса (то, что реально действует в бою)
      classBonus: classOnly(st.hero.cls, st.hero.spec),   // из них от класса
    },
    // недельная цель и артефакты
    goal: goalView(raw, fam, st),
    artifacts: st.artifacts.map((x) => ({ key: x.key, kind: x.kind, source: x.source, date: x.date, status: x.status, activeFor: x.activeFor, usedOn: x.usedOn })),
    artifactDates: (() => {
      const m = raw.members.find((x) => x.id === st.id)!;
      const used = (kind: string) => new Set(raw.artifactUse.filter((u) => u.memberId === st.id && u.kind === kind && u.activeFor).map((u) => u.activeFor!));
      const shield = used('shield'), doubler = used('doubler');
      const days = dateRange(addDays(fam.today, -7), fam.today);
      return {
        shield: days.filter((d) => d < fam.today && !shield.has(d) && basePoints((st.days.get(d)?.stats) ?? { workoutMinutes: 0, walk: 0, warmups: 0, study: {}, habits: 0, books: 0, deeds: 0, deedPoints: 0, questXp: 0, taskPoints: 0 }) < m.goal * 0.5),
        doubler: days.filter((d) => !doubler.has(d)),
      };
    })(),
    date, radar,
    deeds: (() => {
      const rows = raw.deeds?.filter((x) => x.memberId === st.id) ?? [];
      const journal = deedJournal(rows);
      return { cap: DEED_DAY_CAP, day: journal.filter((j) => j.date === date), summary: deedSummary(rows, fam.today), recent: journal.slice(0, 40) };
    })(),
    reviewDates: reviewFlags(raw, fam, st.id).map((f) => f.date),
    achievements: st.achievements.map((a) => ({ id: a.id, group: a.group, name: a.name, emoji: a.emoji, text: a.text, target: a.target, value: a.value, earnedOn: a.earnedOn })),
    // развитие ума по дням за 30 дней: для схемы мозга
    mindLog: dateRange(addDays(fam.today, -29), fam.today).flatMap((d) => {
      const x = st.days.get(d)?.stats;
      return x && (x.habits || x.books || Object.values(x.study).some((m) => (m ?? 0) > 0)) ? [{ date: d, study: x.study, habits: x.habits, books: x.books }] : [];
    }),
    workoutLog: myWorkouts.filter((w) => w.date >= addDays(fam.today, -29))
      .map((w) => ({ id: w.id, date: w.date, minutes: w.minutes, reps: w.reps ?? null, eq: w.eq, exercise: w.exercise ?? null, muscles: w.muscles ?? null })),
    entries: { workouts: myWorkouts.filter((w) => w.date === date), study: mine(raw.study), warmups: mine(raw.warmups), books: raw.books.filter((b) => b.memberId === st.id && b.finishedAt === date) },
    day: { points: today.total, stats: today.stats, bySphere: today.bySphere,
      quests: today.quests.map((q, i) => ({ ...q, completed: today.questsDone[i] })) },
    habits: raw.habits.filter((h) => h.memberId === st.id).map((h) => ({
      id: h.id, name: h.name,
      checked: raw.habitChecks.some((c) => c.habitId === h.id && c.date === date),
    })),
    history: dateRange(from, fam.today).map((d) => [d, st.days.get(d)?.total ?? 0] as const),
    // активность «Тела» по дням: минуты тренировок + 10 за зарядку
    bodyHistory: dateRange(from, fam.today).map((d) => { const s = st.days.get(d)?.stats; return [d, s ? s.workoutMinutes + (s.warmups ? 10 : 0) : 0] as const; }),
  };
}

/** Только для родителя: очередь подтверждений, квесты всех участников, списки наград. */
export function adminView(raw: Raw, fam: Family, loot: { loot: string[]; lootRare: string[]; lootLegend: string[]; questSets: CustomQuestSet[] }) {
  const pending: { memberId: number; date: string; index: number; t: string; xp: number }[] = [];
  const quests: Record<number, { items: unknown[]; hasDefault: boolean }> = {};
  for (const m of raw.members) {
    const st = fam.members.get(m.id)!;
    for (const d of dateRange(addDays(fam.today, -7), fam.today)) {
      st.days.get(d)?.quests.forEach((q, index) => { if (q.pending) pending.push({ memberId: m.id, date: d, index, t: q.t, xp: q.xp }); });
    }
    quests[m.id] = { items: st.days.get(fam.today)?.quests ?? [], hasDefault: raw.quests.some((q) => q.memberId === m.id && q.date === 'default') };
  }
  const familyQuestsAll = [...fam.familyQuests].sort((a, b) => b.id - a.id).slice(0, 30).map(fqView);
  const review = raw.members.flatMap((m) => reviewFlags(raw, fam, m.id)).map((f) => ({
    ...f, entries: allocateWorkouts(raw.workouts.filter((w) => w.memberId === f.memberId && w.date === f.date).map((w, i) => ({ ...w, id: w.id ?? i })))
      .map((w) => ({ id: w.id, minutes: w.minutes, reps: w.reps ?? null, exercise: w.exercise ?? null, eq: w.eq })),
  }));
  const prizesRequested = raw.chestsOpened.filter((c) => c.status === 'requested').sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
    .map((c) => ({ memberId: c.holder ?? c.memberId, from: c.memberId, n: c.n, date: c.date ?? '', rarity: c.rarity ?? 'common', reward: c.reward ?? '' }));
  // ручные цели (родитель отмечает выполнение): текущая и прошлая неделя
  const ws = goalWeekStart(fam.today), prev = addDays(ws, -7);
  const manualGoals = raw.weeklyGoals.filter((g) => g.manual && (g.weekStart === ws || g.weekStart === prev))
    .map((g) => ({ memberId: g.memberId, weekStart: g.weekStart, title: g.title ?? '', tier: g.tier, confirmed: g.confirmed, finished: weekEnd(g.weekStart) < fam.today }));
  // задачи на день: активные задачи по героям, отметки, которые ждут подтверждения, и недавние выдачи сундуков
  const taskDefs = (raw.tasks ?? []).filter((t) => t.until === null || t.until > fam.today);
  const tasks: Record<number, unknown[]> = {};
  for (const m of raw.members) tasks[m.id] = taskDefs.filter((t) => t.memberId === m.id).map((t) => ({ ...t, label: repeatLabel(t), confirm: taskNeedsConfirm(t) }));
  const tasksPending = (raw.taskDone ?? []).filter((d) => !d.confirmed).flatMap((d) => {
    const t = (raw.tasks ?? []).find((x) => x.id === d.taskId);
    return t ? [{ memberId: t.memberId, taskId: t.id, title: t.title, emoji: t.emoji, date: d.date, points: t.points, chests: t.chests }] : [];
  }).sort((a, b) => a.date.localeCompare(b.date));
  const grants = [...(raw.chestGrants ?? [])].sort((a, b) => (b.id ?? 0) - (a.id ?? 0)).slice(0, 12);
  return { pending, quests, familyQuestsAll, review, prizesRequested, manualGoals, tasks, tasksPending, grants, ...loot };
}

const fqView = (q: Family['familyQuests'][number]) => ({
  id: q.id, title: q.title, description: q.description, xp: q.xp, kind: q.kind, target: q.target, period: q.period, date: q.date,
  status: q.status, done: q.done, doneDate: q.doneDate, pending: q.pending, progress: q.progress, participants: q.participants.length,
});
const currentFq = (fam: Family) => fam.familyQuests.filter((q) => q.date <= fam.today && (q.period === 'day' ? q.date : addDays(q.date, 6)) >= fam.today).map(fqView);

export function shopView(raw: Raw, memberId: number | null, parent: boolean) {
  const mine = (p: { memberId: number }) => parent || p.memberId === memberId;
  return {
    items: raw.shopItems.filter((i) => i.active),
    allItems: parent ? raw.shopItems : [],
    purchases: raw.purchases.filter(mine).sort((a, b) => b.id - a.id).slice(0, 40),
  };
}

export function buildState(raw: Raw, fam: Family, opts: { memberId: number | null; parent: boolean; date?: string; cfg: { minutes: number; superMinutes: number; timezone: string; reminderHour: number }; pinSet: boolean; admin?: ReturnType<typeof adminView> }) {
  const detailFor = (opts.memberId && fam.members.get(opts.memberId)) || null;
  return {
    today: fam.today, config: opts.cfg, pinSet: opts.pinSet, parent: opts.parent, me: opts.memberId,
    members: summary(raw, fam),
    boss: bossView(fam.boss),
    admin: opts.admin ?? null,
    monthGoal: monthGoalView(raw, fam),
    familyQuests: currentFq(fam),
    tasks: Object.fromEntries(raw.members.flatMap((m) => { const p = taskView(raw, fam, m.id).days[0].progress; return p.total ? [[m.id, p]] : []; })),
    mvp: { yesterday: fam.mvp.yesterday, leader: fam.mvp.leader },
    season: { current: fam.seasons.current, history: fam.seasons.history.slice(0, 6), prizes: SEASON_CHESTS, wins: fam.seasons.wins },
    shop: shopView(raw, opts.memberId, opts.parent),
    detail: detailFor ? memberDetail(raw, fam, detailFor, opts.date) : null,
  };
}

/** «Книга достижений»: итоги каждого героя для печатной страницы. */
export function bookView(raw: Raw, fam: Family) {
  const stat = (st: MemberState, metric: string) => st.achievements.find((a) => a.metric === metric)?.value ?? 0;
  const members = raw.members.map((m) => {
    const st = fam.members.get(m.id)!;
    const rk = rankFor(st.level, st.xp).rank;
    const first = [...st.days.keys()].sort()[0] ?? fam.today;
    return {
      id: m.id, name: m.name, emoji: m.emoji, color: m.color, gender: m.gender === 'f' ? 'f' : m.gender === 'm' ? 'm' : null, face: parseFace(m.face, m.gender === 'f' ? 'f' : 'm'),
      cls: st.hero.cls, sub: st.hero.sub, level: st.level, xp: Math.round(st.xp), rank: { emoji: rk.emoji, name: rk.name }, since: first,
      look: Object.fromEntries(st.equipped.map((e) => [e.item.slot, e.item.id])) as Record<string, string>,
      counts: { bossWins: stat(st, 'bossWins'), dayMvps: stat(st, 'dayMvps'), deeds: stat(st, 'deeds'), books: stat(st, 'books'), chests: stat(st, 'chests'), seasonWins: stat(st, 'seasonWins'), workoutDays: stat(st, 'workoutDays'), streak: stat(st, 'streak') },
      achievements: st.achievements.filter((a) => a.earnedOn).sort((a, b) => (a.earnedOn! < b.earnedOn! ? 1 : -1)).map((a) => ({ id: a.id, group: a.group, name: a.name, emoji: a.emoji, text: a.text, earnedOn: a.earnedOn! })),
      achievementsTotal: st.achievements.length,
    };
  });
  const defeated = fam.bossHistory.filter((b) => b.finished && b.defeated).length;
  return { today: fam.today, members, family: { xp: members.reduce((a, m) => a + m.xp, 0), bossesDefeated: defeated, bossWeeks: fam.bossHistory.filter((b) => b.finished).length, familyQuestsDone: fam.familyQuests.filter((q) => q.done).length, deeds: members.reduce((a, m) => a + m.counts.deeds, 0) } };
}

/** Цель семьи на месяц: текущая (по сегодняшнему месяцу) и прошлого месяца, пока награда не выдана. */
export function monthGoalView(raw: Raw, fam: Family) {
  const build = (g: NonNullable<Raw['monthGoals']>[number]) => {
    const days = dateRange(monthStart(g.month), monthEnd(g.month)).filter((d) => d <= fam.today).map((date) => ({
      date, members: raw.members.flatMap((m) => { const d = fam.members.get(m.id)?.days.get(date); return d ? [{ total: d.total, goal: m.goal, deeds: d.stats.deeds }] : []; }),
    }));
    const st = resolveMonthGoal(g.kind, g.target, g.month, days, fam.today);
    return { id: g.id, month: g.month, title: g.title, emoji: g.emoji, kind: g.kind, reward: g.reward, given: g.given, text: MONTH_GOAL_INFO[g.kind].text(g.target), unit: MONTH_GOAL_INFO[g.kind].unit, ...st };
  };
  const goals = raw.monthGoals ?? [];
  const cur = goals.find((g) => g.month === monthOf(fam.today));
  const prevMonth = monthOf(addDays(monthStart(monthOf(fam.today)), -1));
  const prev = goals.find((g) => g.month === prevMonth);
  return {
    month: monthOf(fam.today),
    current: cur ? build(cur) : null,
    previous: prev && !prev.given ? build(prev) : null,
    suggest: Object.fromEntries(MONTH_GOAL_KINDS.map((k) => [k, suggestTarget(k, raw.members.filter((m) => !m.isParent).map((m) => m.goal).concat(raw.members.filter((m) => m.isParent).map((m) => m.goal)), monthOf(fam.today))])) as Record<MonthGoalKind, number>,
  };
}

/** Рейтинг дня: места, очки, процент нормы и из чего набраны очки. Дата любая, до 30 дней назад. */
export function ratingView(raw: Raw, fam: Family, date: string) {
  const rows = buildRating(raw.members.map((m) => {
    const d = fam.members.get(m.id)?.days.get(date);
    const wm = d?.stats.workoutMinutes ?? 0;
    return { id: m.id, goal: m.goal, superGoal: m.superGoal, total: d?.total ?? 0, bySphere: d?.bySphere ?? {}, questXp: d?.stats.questXp ?? 0, taskPoints: d?.stats.taskPoints ?? 0, walkShare: d && wm > 0 ? d.stats.walk / wm : 0, exists: !!d };
  })).map((r) => { const m = raw.members.find((x) => x.id === r.id)!; return { ...r, name: m.name, emoji: m.emoji, color: m.color, seen: (raw.seen ?? []).filter((x) => x.targetId === r.id && x.date === date).map((x) => x.byId) }; });
  return { date, today: fam.today, isToday: date === fam.today, rows };
}

/** Рейтинг недели (понедельник–воскресенье, к которой относится дата): места от средней доли нормы, очки по источникам и по дням. */
export function ratingWeekView(raw: Raw, fam: Family, anyDate: string) {
  const start = weekStart(anyDate), end = addDays(start, 6);
  const dates = dateRange(start, end);
  const week = buildWeekRating(dates.map((d) => ({ date: d, rows: ratingView(raw, fam, d).rows })));
  const rows = week.map((r) => { const m = raw.members.find((x) => x.id === r.id)!; return { ...r, name: m.name, emoji: m.emoji, color: m.color, goal: m.goal }; });
  return { weekStart: start, weekEnd: end, today: fam.today, isCurrent: start === weekStart(fam.today), dates, rows };
}

/** Публичная сводка для ТВ: без деталей записей. */
export function tvState(raw: Raw, fam: Family) {
  const record = (id: number) => {
    const st = fam.members.get(id)!, d = st.days.get(fam.today);
    const study = d?.stats.study ?? {};
    return {
      points: d?.total ?? 0, workoutMinutes: Math.round(d?.stats.workoutMinutes ?? 0), warmup: !!d?.stats.warmups,
      studyMinutes: Object.values(study).reduce((a, v) => a + (v ?? 0), 0), studyByKind: study, books: d?.stats.books ?? 0,
      habits: raw.habits.filter((h) => h.memberId === id).map((h) => ({ id: h.id, name: h.name, checked: raw.habitChecks.some((c) => c.habitId === h.id && c.date === fam.today) })),
      deeds: deedJournal((raw.deeds ?? []).filter((x) => x.memberId === id && x.date === fam.today)).map((j) => ({ kind: j.kind, counted: j.counted })),
    };
  };
  return {
    today: fam.today, timezone: raw.timezone, reminderHour: raw.reminderHour, rating: ratingView(raw, fam, fam.today), ratingWeek: ratingWeekView(raw, fam, fam.today), monthGoal: monthGoalView(raw, fam),
    season: { id: fam.seasons.current.id, daysLeft: fam.seasons.current.daysLeft, top: fam.seasons.current.rows.slice(0, 4).map((r) => ({ memberId: r.memberId, ratio: r.ratio, points: r.points })) }, members: summary(raw, fam), boss: bossView(fam.boss),
    familyQuests: currentFq(fam),
    mvp: { yesterday: fam.mvp.yesterday, leader: fam.mvp.leader },
    record: Object.fromEntries(raw.members.map((m) => [m.id, record(m.id)])),
    battles: Object.fromEntries(raw.members.map((m) => { const bt = fam.members.get(m.id)!.battle, l = bt.live; return [m.id, { horde: l.horde.name, emoji: l.horde.emoji, cleared: l.fight.cleared, hp: l.hp, maxHp: l.maxHp, outcome: l.fight.outcome, live: l, active: bt.abilities.activeToday }]; })),
    goals: Object.fromEntries(raw.members.map((m) => { const g = fam.members.get(m.id)!.goals.current; return [m.id, g ? { title: g.title ?? (GOAL_INFO[g.kind as keyof typeof GOAL_INFO]?.text(g.target) ?? ''), emoji: GOAL_INFO[g.kind as keyof typeof GOAL_INFO]?.emoji ?? '🎯', progress: g.progress, target: g.target, done: g.done, manual: g.manual, tier: g.tier } : null]; })),
    quests: raw.members.map((m) => {
      const d = fam.members.get(m.id)!.days.get(fam.today)!;
      return { memberId: m.id, items: d.quests.map((q, i) => { const pr = questProgress(q, d.stats); return { t: q.t, desc: q.d ?? null, xp: q.xp, manual: q.k === 'manual', done: d.questsDone[i], pending: !!q.pending, index: i, hint: questHint(q), progress: pr ? `${Math.min(pr.have, pr.need)}/${pr.need}${pr.unit ? ' ' + pr.unit : ''}` : null }; }) };
    }),
  };
}
