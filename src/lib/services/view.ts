import { BOSSES } from '../game/boss';
import { questHint, questProgress } from '../game/quests';
import { addDays, dateRange } from '../date';
import type { Family, Raw, MemberState } from './engine';

const bossView = (b: Family['boss']) => ({ ...b, boss: BOSSES.find((x) => x.id === b.bossId)! });

const summary = (raw: Raw, fam: Family) =>
  raw.members.map((m) => {
    const st = fam.members.get(m.id)!;
    return { id: m.id, name: m.name, emoji: m.emoji, color: m.color, isParent: m.isParent, goal: m.goal, superGoal: m.superGoal,
      level: st.level, cls: st.hero.cls, sub: st.hero.sub, pointsToday: st.days.get(fam.today)?.total ?? 0,
      damageThisWeek: fam.boss.byMember[m.id] ?? 0 };
  });

const RADAR = [
  { key: 'Тело', spheres: ['workout', 'warmup'] },
  { key: 'Учёба', spheres: ['Учёба'] },
  { key: 'Мышление', spheres: ['Мышление'] },
  { key: 'Книги', spheres: ['Книги', 'book'] },
  { key: 'Творчество', spheres: ['Творчество', 'Навыки', 'Языки'] },
  { key: 'Дисциплина', spheres: ['habits'] },
];

export function memberDetail(raw: Raw, fam: Family, st: MemberState, date: string = fam.today) {
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
    chests: { earned: st.chestsEarned, opened: st.chestsOpened, available: st.chestsAvailable },
    date, radar,
    workoutLog: raw.workouts.filter((w) => w.memberId === st.id && w.date >= addDays(fam.today, -29))
      .map((w) => ({ id: w.id, date: w.date, minutes: w.minutes, exercise: w.exercise ?? null, muscles: w.muscles ?? null })),
    entries: { workouts: mine(raw.workouts), study: mine(raw.study), warmups: mine(raw.warmups), books: raw.books.filter((b) => b.memberId === st.id && b.finishedAt === date) },
    day: { points: today.total, stats: today.stats, bySphere: today.bySphere,
      quests: today.quests.map((q, i) => ({ ...q, completed: today.questsDone[i] })) },
    habits: raw.habits.filter((h) => h.memberId === st.id).map((h) => ({
      id: h.id, name: h.name,
      checked: raw.habitChecks.some((c) => c.habitId === h.id && c.date === date),
    })),
    history: dateRange(from, fam.today).map((d) => [d, st.days.get(d)?.total ?? 0] as const),
  };
}

/** Только для родителя: очередь подтверждений, квесты всех участников, списки наград. */
export function adminView(raw: Raw, fam: Family, loot: { loot: string[]; lootRare: string[]; lootLegend: string[] }) {
  const pending: { memberId: number; date: string; index: number; t: string; xp: number }[] = [];
  const quests: Record<number, { items: unknown[]; hasDefault: boolean }> = {};
  for (const m of raw.members) {
    const st = fam.members.get(m.id)!;
    for (const d of dateRange(addDays(fam.today, -7), fam.today)) {
      st.days.get(d)?.quests.forEach((q, index) => { if (q.pending) pending.push({ memberId: m.id, date: d, index, t: q.t, xp: q.xp }); });
    }
    quests[m.id] = { items: st.days.get(fam.today)?.quests ?? [], hasDefault: raw.quests.some((q) => q.memberId === m.id && q.date === 'default') };
  }
  return { pending, quests, ...loot };
}

export function shopView(raw: Raw, memberId: number | null, parent: boolean) {
  const mine = (p: { memberId: number }) => parent || p.memberId === memberId;
  return {
    items: raw.shopItems.filter((i) => i.active),
    allItems: parent ? raw.shopItems : [],
    purchases: raw.purchases.filter(mine).sort((a, b) => b.id - a.id).slice(0, 40),
  };
}

export function buildState(raw: Raw, fam: Family, opts: { memberId: number | null; parent: boolean; date?: string; cfg: { minutes: number; superMinutes: number; timezone: string }; pinSet: boolean; admin?: ReturnType<typeof adminView> }) {
  const detailFor = (opts.memberId && fam.members.get(opts.memberId)) || null;
  return {
    today: fam.today, config: opts.cfg, pinSet: opts.pinSet, parent: opts.parent, me: opts.memberId,
    members: summary(raw, fam),
    boss: bossView(fam.boss),
    admin: opts.admin ?? null,
    shop: shopView(raw, opts.memberId, opts.parent),
    detail: detailFor ? memberDetail(raw, fam, detailFor, opts.date) : null,
  };
}

/** Публичная сводка для ТВ: без деталей записей. */
export function tvState(raw: Raw, fam: Family) {
  return {
    today: fam.today, members: summary(raw, fam), boss: bossView(fam.boss),
    quests: raw.members.map((m) => {
      const d = fam.members.get(m.id)!.days.get(fam.today)!;
      return { memberId: m.id, items: d.quests.map((q, i) => { const pr = questProgress(q, d.stats); return { t: q.t, desc: q.d ?? null, xp: q.xp, manual: q.k === 'manual', done: d.questsDone[i], pending: !!q.pending, index: i, hint: questHint(q), progress: pr ? `${Math.min(pr.have, pr.need)}/${pr.need}${pr.unit ? ' ' + pr.unit : ''}` : null }; }) };
    }),
  };
}
