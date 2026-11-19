import { addDays } from '../date';
import { DAY_RATIO_CAP } from './mvp';

/**
 * Сезон — календарный месяц. Рейтинг идёт по очкам относительно личной нормы (так у младшего те же шансы):
 * счёт = очки за дни сезона (день не больше 2 норм) / (норма × дни участия). Опыт и уровень не сбрасываются, сбрасывается только таблица.
 * Итоги считаются из истории, поэтому ничего не хранится; призы только за сезоны, начавшиеся после старта функции.
 */
export const SEASON_CHESTS = [3, 1] as const;     // победителю и второму месту
export const MIN_DAYS = 7;                        // минимум дней участия, чтобы претендовать на приз
export const MIN_RATIO = 0.5;                     // и средний результат не ниже половины нормы

export interface SeasonMemberInput { id: number; goal: number; createdOn: string }
export interface SeasonRow {
  memberId: number; points: number; ratio: number; days: number; normDays: number; bestDay: number;
  eligible: boolean; rank: number; chests: number;
}
export interface Season {
  id: string;                // 'YYYY-MM'
  start: string; end: string; daysLeft: number;
  finished: boolean; awardable: boolean;
  rows: SeasonRow[]; winner: number | null; second: number | null;
}
export interface SeasonsResult {
  current: Season; history: Season[];            // history: закончившиеся, новые сверху
  wins: Record<number, number>; chests: Record<number, number>; winDates: Record<number, string[]>;
}

export const monthStart = (date: string) => `${date.slice(0, 7)}-01`;
export function monthEnd(date: string): string {
  const [y, m] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10);
}
export const nextMonth = (date: string) => addDays(monthEnd(date), 1);

const MONTHS = ['Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь', 'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'];
export const seasonName = (id: string) => `${MONTHS[Number(id.slice(5, 7)) - 1]} ${id.slice(0, 4)}`;

export function buildSeason(id: string, today: string, since: string | null, members: SeasonMemberInput[], pointsOf: (memberId: number, date: string) => number): Season {
  const start = `${id}-01`, end = monthEnd(start);
  const last = end < today ? end : today;
  const rows: SeasonRow[] = [];
  for (const m of members) {
    const from = m.createdOn > start ? m.createdOn : start;
    if (from > last || m.goal <= 0) continue;
    let points = 0, counted = 0, days = 0, normDays = 0, bestDay = 0;
    for (let d = from; d <= last; d = addDays(d, 1)) {
      const p = pointsOf(m.id, d);
      points += p; counted += Math.min(p, m.goal * DAY_RATIO_CAP); days++; bestDay = Math.max(bestDay, p);
      if (p >= m.goal) normDays++;
    }
    const ratio = counted / (m.goal * days);   // вклад дня ограничен DAY_RATIO_CAP нормами
    rows.push({ memberId: m.id, points: Math.round(points), ratio, days, normDays, bestDay: Math.round(bestDay), eligible: days >= Math.min(MIN_DAYS, new Date(end).getUTCDate()) && ratio >= MIN_RATIO, rank: 0, chests: 0 });
  }
  rows.sort((a, b) => b.ratio - a.ratio || b.points - a.points || a.memberId - b.memberId);
  rows.forEach((r, i) => { r.rank = i + 1; });
  const finished = end < today;
  const awardable = finished && !!since && id >= since.slice(0, 7);
  const eligible = rows.filter((r) => r.eligible);
  if (awardable) eligible.slice(0, SEASON_CHESTS.length).forEach((r, i) => { r.chests = SEASON_CHESTS[i]; });
  return {
    id, start, end, daysLeft: finished ? 0 : Math.max(0, Math.round((Date.parse(end) - Date.parse(today)) / 86_400_000) + 1),
    finished, awardable, rows, winner: eligible[0]?.memberId ?? null, second: eligible[1]?.memberId ?? null,
  };
}

/** Все сезоны от первого месяца семьи до текущего. */
export function buildSeasons(today: string, since: string | null, members: SeasonMemberInput[], pointsOf: (memberId: number, date: string) => number): SeasonsResult {
  const first = members.reduce((a, m) => (m.createdOn < a ? m.createdOn : a), today);
  const all: Season[] = [];
  for (let d = monthStart(first); d <= today; d = nextMonth(d)) all.push(buildSeason(d.slice(0, 7), today, since, members, pointsOf));
  const current = all[all.length - 1];
  const history = all.filter((s) => s.finished).reverse();
  const wins: Record<number, number> = {}, chests: Record<number, number> = {}, winDates: Record<number, string[]> = {};
  for (const s of history) {
    if (!s.awardable) continue;
    for (const r of s.rows) if (r.chests) chests[r.memberId] = (chests[r.memberId] ?? 0) + r.chests;
    if (s.winner) { wins[s.winner] = (wins[s.winner] ?? 0) + 1; (winDates[s.winner] ??= []).push(s.end); }
  }
  return { current, history, wins, chests, winDates };
}
