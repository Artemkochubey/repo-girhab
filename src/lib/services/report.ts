import { addDays, dateRange, dayDiff } from '../date';
import { BOSSES, weekStart } from '../game/boss';
import { levelFromXp } from '../game/level';
import type { Family, Raw } from './engine';

const WD = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const wdName = (date: string) => WD[(new Date(date + 'T00:00:00Z').getUTCDay() + 6) % 7];

export interface ReportMember {
  id: number; name: string; emoji: string; color: string; goal: number; superGoal: number;
  points: number; prevPoints: number; deltaPct: number | null;
  activeDays: number; goalDays: number; superDays: number; daysCounted: number;
  best: { date: string; points: number } | null;
  daily: { date: string; points: number; counted: boolean; hitGoal: boolean }[];
  spheres: { key: string; label: string; unit: string; value: number; prev: number }[];
  quests: { done: number; total: number; allDoneDays: number; missed: { title: string; times: number }[] };
  levelStart: number; levelEnd: number;
  newAchievements: { name: string; emoji: string; date: string }[];
  mvpDays: string[];
  warn: string[]; good: string[];
}

export interface Report {
  weekStart: string; weekEnd: string; isCurrent: boolean; daysElapsed: number;
  earliestWeek: string;
  family: { points: number; prevPoints: number; deltaPct: number | null; boss: { name: string; emoji: string; hp: number; damage: number; defeated: boolean; finished: boolean } | null; mvp: { date: string; memberId: number }[]; familyQuests: { title: string; xp: number }[] };
  members: ReportMember[];
}

/** Склонение по числу: 1 раз, 2 раза, 5 раз. */
export const plural = (n: number, one: string, few: string, many: string) => { const a = Math.abs(n) % 100, b = a % 10; return a > 10 && a < 20 ? many : b === 1 ? one : b >= 2 && b <= 4 ? few : many; };
const pct = (cur: number, prev: number): number | null => (prev > 0 ? Math.round(((cur - prev) / prev) * 100) : null);

/** Недельный отчёт для родителя. week — понедельник нужной недели. */
export function buildReport(raw: Raw, fam: Family, week: string): Report {
  const today = fam.today;
  const end = addDays(week, 6);
  const isCurrent = week === weekStart(today);
  const lastDay = isCurrent ? today : end;                       // для текущей недели считаем только прошедшие дни
  const daysElapsed = dayDiff(week, lastDay) + 1;
  const prevWeek = addDays(week, -7);
  const range = dateRange(week, lastDay);
  const prevRange = dateRange(prevWeek, addDays(prevWeek, daysElapsed - 1));   // те же дни прошлой недели — честное сравнение

  const members: ReportMember[] = raw.members.map((m) => {
    const st = fam.members.get(m.id)!;
    const first = [...st.days.keys()].sort()[0];
    const exist = (d: string) => d >= first;
    const day = (d: string) => st.days.get(d);
    const sumOf = (ds: string[], f: (x: NonNullable<ReturnType<typeof day>>) => number) => ds.reduce((a, d) => a + (day(d) ? f(day(d)!) : 0), 0);

    const counted = range.filter(exist);
    // сегодняшний день ещё идёт: не считаем его «без активности» и «проваленным»
    const finished = counted.filter((d) => d < today);
    const points = sumOf(range, (x) => x.total);
    const prevPoints = sumOf(prevRange, (x) => x.total);
    const activeDays = counted.filter((d) => (day(d)?.total ?? 0) >= m.goal * 0.5).length;
    const goalDays = counted.filter((d) => (day(d)?.total ?? 0) >= m.goal).length;
    const superDays = counted.filter((d) => (day(d)?.total ?? 0) >= m.superGoal).length;
    const bestDate = counted.reduce<string | null>((b, d) => ((day(d)?.total ?? 0) > (b ? day(b)!.total : 0) ? d : b), null);

    const studyMin = (ds: string[]) => sumOf(ds, (x) => Object.values(x.stats.study).reduce((a, v) => a + (v ?? 0), 0));
    const spheres = [
      { key: 'workout', label: 'Тренировки', unit: 'оч.', value: Math.round(sumOf(range, (x) => x.stats.workoutMinutes)), prev: Math.round(sumOf(prevRange, (x) => x.stats.workoutMinutes)) },
      { key: 'warmup', label: 'Зарядка', unit: 'дн.', value: sumOf(range, (x) => x.stats.warmups), prev: sumOf(prevRange, (x) => x.stats.warmups) },
      { key: 'study', label: 'Учёба', unit: 'мин', value: studyMin(range), prev: studyMin(prevRange) },
      { key: 'habits', label: 'Привычки', unit: 'шт.', value: sumOf(range, (x) => x.stats.habits), prev: sumOf(prevRange, (x) => x.stats.habits) },
      { key: 'books', label: 'Книги', unit: 'шт.', value: sumOf(range, (x) => x.stats.books), prev: sumOf(prevRange, (x) => x.stats.books) },
    ];

    // квесты считаем только за закончившиеся дни: сегодняшний ещё можно выполнить
    const missedMap = new Map<string, number>();
    let qDone = 0, qTotal = 0, allDone = 0;
    for (const d of finished) {
      const dc = day(d);
      if (!dc) continue;
      const done = dc.questsDone.filter(Boolean).length;
      qTotal += dc.quests.length; qDone += done;
      dc.quests.forEach((q, i) => { if (!dc.questsDone[i]) missedMap.set(q.t, (missedMap.get(q.t) ?? 0) + 1); });
      if (dc.quests.length && done === dc.quests.length) allDone++;
    }
    const missed = [...missedMap].map(([title, times]) => ({ title, times })).sort((a, b) => b.times - a.times).slice(0, 5);

    // уровень в начале и в конце недели
    const xpBefore = [...st.days.entries()].filter(([d]) => d < week).reduce((a, [, x]) => a + x.total, 0);
    const levelStart = levelFromXp(xpBefore), levelEnd = levelFromXp(xpBefore + points);
    const newAchievements = st.achievements.filter((a) => a.earnedOn && a.earnedOn >= week && a.earnedOn <= lastDay).map((a) => ({ name: a.name, emoji: a.emoji, date: a.earnedOn! }));
    const mvpDays = Object.entries(fam.mvp.byDate).filter(([d, id]) => id === m.id && d >= week && d <= end).map(([d]) => d).sort();

    // выводы: «просадки» и что хорошо
    const warn: string[] = [], good: string[] = [];
    const idle = finished.filter((d) => (day(d)?.total ?? 0) === 0);
    if (idle.length) warn.push(`Дни без активности: ${idle.length} (${idle.map(wdName).join(', ')})`);
    const below = finished.filter((d) => (day(d)?.total ?? 0) > 0 && (day(d)?.total ?? 0) < m.goal);
    if (below.length) warn.push(`Норма (${m.goal}) не выполнена в ${below.length + idle.length} из ${finished.length} дней`);
    else if (idle.length) warn.push(`Норма не выполнена в ${idle.length} из ${finished.length} дней`);
    for (const sp of spheres) {
      const enough = sp.key === 'habits' || sp.key === 'warmup' ? sp.prev >= 5 : sp.prev >= 30;
      if (sp.key !== 'books' && enough && sp.value < sp.prev * 0.6) warn.push(`Просадка: ${sp.label.toLowerCase()} ${sp.value} против ${sp.prev} ${sp.unit} за те же дни прошлой недели (${pct(sp.value, sp.prev)}%)`);
    }
    for (const q of missed.filter((x) => x.times >= 2).slice(0, 2)) warn.push(`Квест «${q.title}» не выполнен ${q.times} ${plural(q.times, 'раз', 'раза', 'раз')}`);
    if (qTotal > 0 && qDone / qTotal < 0.5 && finished.length >= 2) warn.push(`Выполнено меньше половины квестов: ${qDone} из ${qTotal}`);
    if (goalDays > 0) good.push(`Норма выполнена в ${goalDays} из ${counted.length} дней`);
    if (superDays > 0) good.push(`Супер-норма: ${superDays} дн.`);
    if (allDone > 0) good.push(`Все квесты выполнены в ${allDone} дн.`);
    const dp = pct(points, prevPoints);
    if (dp !== null && dp >= 15) good.push(`Очков на ${dp}% больше, чем за те же дни прошлой недели`);
    if (bestDate && (day(bestDate)?.total ?? 0) > 0) good.push(`Лучший день: ${wdName(bestDate)} ${bestDate.slice(8)}.${bestDate.slice(5, 7)}, ${day(bestDate)!.total} очков`);
    if (levelEnd > levelStart) good.push(`Новый уровень: ${levelStart} → ${levelEnd}`);

    return {
      id: m.id, name: m.name, emoji: m.emoji, color: m.color, goal: m.goal, superGoal: m.superGoal,
      points, prevPoints, deltaPct: pct(points, prevPoints),
      activeDays, goalDays, superDays, daysCounted: counted.length,
      best: bestDate && (day(bestDate)?.total ?? 0) > 0 ? { date: bestDate, points: day(bestDate)!.total } : null,
      daily: dateRange(week, end).map((d) => ({ date: d, points: day(d)?.total ?? 0, counted: d <= lastDay && exist(d), hitGoal: (day(d)?.total ?? 0) >= m.goal })),
      spheres, quests: { done: qDone, total: qTotal, allDoneDays: allDone, missed },
      levelStart, levelEnd, newAchievements, mvpDays, warn, good,
    };
  });

  const bw = fam.bossHistory.find((b) => b.weekStart === week) ?? null;
  const boss = bw ? { ...(BOSSES.find((b) => b.id === bw.bossId) ?? BOSSES[0]), hp: bw.hp, damage: bw.damage, defeated: bw.defeated, finished: bw.finished } : null;
  const famPoints = members.reduce((a, m) => a + m.points, 0), famPrev = members.reduce((a, m) => a + m.prevPoints, 0);
  const allMembersFirst = raw.members.map((m) => [...fam.members.get(m.id)!.days.keys()].sort()[0]).sort()[0] ?? week;

  return {
    weekStart: week, weekEnd: end, isCurrent, daysElapsed, earliestWeek: weekStart(allMembersFirst),
    family: {
      points: famPoints, prevPoints: famPrev, deltaPct: pct(famPoints, famPrev),
      boss: boss ? { name: boss.name, emoji: boss.emoji, hp: boss.hp, damage: boss.damage, defeated: boss.defeated, finished: boss.finished } : null,
      mvp: Object.entries(fam.mvp.byDate).filter(([d, id]) => id > 0 && d >= week && d <= end).map(([date, memberId]) => ({ date, memberId })).sort((a, b) => a.date.localeCompare(b.date)),
      familyQuests: fam.familyQuests.filter((q) => q.done && q.doneDate && q.doneDate >= week && q.doneDate <= end).map((q) => ({ title: q.title, xp: q.xp })),
    },
    members,
  };
}
