import { BOSSES } from '../game/boss';
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

export function memberDetail(raw: Raw, fam: Family, st: MemberState) {
  const today = st.days.get(fam.today)!;
  const from = addDays(fam.today, -364);
  return {
    id: st.id, hero: st.hero, xp: st.xp, level: st.level, into: st.into, span: st.span, streak: st.streak,
    talentPointsFree: st.talentPointsFree, recommendedSub: st.recommendedSub,
    chests: { earned: st.chestsEarned, opened: st.chestsOpened, available: st.chestsAvailable },
    today: { points: today.total, stats: today.stats, bySphere: today.bySphere,
      quests: today.quests.map((q, i) => ({ ...q, completed: today.questsDone[i] })) },
    habits: raw.habits.filter((h) => h.memberId === st.id).map((h) => ({
      id: h.id, name: h.name,
      checkedToday: raw.habitChecks.some((c) => c.habitId === h.id && c.date === fam.today),
    })),
    history: dateRange(from, fam.today).map((d) => [d, st.days.get(d)?.total ?? 0] as const),
  };
}

export function buildState(raw: Raw, fam: Family, opts: { memberId: number | null; parent: boolean; cfg: { minutes: number; superMinutes: number; timezone: string }; pinSet: boolean }) {
  const detailFor = (opts.memberId && fam.members.get(opts.memberId)) || null;
  return {
    today: fam.today, config: opts.cfg, pinSet: opts.pinSet, parent: opts.parent, me: opts.memberId,
    members: summary(raw, fam),
    boss: bossView(fam.boss),
    detail: detailFor ? memberDetail(raw, fam, detailFor) : null,
  };
}

/** Публичная сводка для ТВ: без деталей записей. */
export function tvState(raw: Raw, fam: Family) {
  return {
    today: fam.today, members: summary(raw, fam), boss: bossView(fam.boss),
    quests: raw.members.map((m) => {
      const d = fam.members.get(m.id)!.days.get(fam.today)!;
      return { memberId: m.id, items: d.quests.map((q, i) => ({ t: q.t, xp: q.xp, manual: q.k === 'manual', done: d.questsDone[i], pending: !!q.pending, index: i })) };
    }),
  };
}
