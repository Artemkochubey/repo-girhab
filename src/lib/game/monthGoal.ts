import { addDays, dateRange } from '../date';

/** Общая цель семьи на месяц: поход, кино, поездка. Выполняют все вместе, прогресс считается из истории. */
export type MonthGoalKind = 'points' | 'deeds' | 'normDays';
export const MONTH_GOAL_KINDS: MonthGoalKind[] = ['points', 'deeds', 'normDays'];
export const MONTH_GOAL_INFO: Record<MonthGoalKind, { name: string; emoji: string; unit: string; text: (n: number) => string }> = {
  points: { name: 'Очки всей семьи', emoji: '⭐', unit: 'оч.', text: (n) => `вместе набрать ${n} очков за месяц` },
  deeds: { name: 'Добрые дела семьи', emoji: '💛', unit: 'дел', text: (n) => `вместе сделать ${n} добрых дел за месяц` },
  normDays: { name: 'Дни, когда норму выполнили все', emoji: '📅', unit: 'дн.', text: (n) => `в ${n} дн. месяца норму выполнили все герои` },
};

export const monthOf = (date: string): string => date.slice(0, 7);
export const monthStart = (month: string): string => `${month}-01`;
export const monthEnd = (month: string): string => {
  const [y, m] = month.split('-').map(Number) as [number, number];
  return addDays(`${m === 12 ? y + 1 : y}-${String(m === 12 ? 1 : m + 1).padStart(2, '0')}-01`, -1);
};
export const daysInMonth = (month: string): number => Number(monthEnd(month).slice(8));

export interface GoalDayMember { total: number; goal: number; deeds: number }
export interface GoalDay { date: string; members: GoalDayMember[] }

/** Значение цели накопительно по дням: на конец каждого дня месяца. */
export function cumulativeProgress(kind: MonthGoalKind, days: GoalDay[]): { date: string; value: number }[] {
  let acc = 0;
  return days.map((d) => {
    if (kind === 'points') acc += d.members.reduce((a, m) => a + m.total, 0);
    else if (kind === 'deeds') acc += d.members.reduce((a, m) => a + m.deeds, 0);
    else if (d.members.length > 0 && d.members.every((m) => m.goal > 0 && m.total >= m.goal)) acc += 1;
    return { date: d.date, value: Math.round(acc) };
  });
}

export interface MonthGoalState {
  progress: number; target: number; percent: number; done: boolean; doneDate: string | null;
  daysLeft: number; daysTotal: number; expected: number; onTrack: boolean; need: number;   // need — сколько в среднем нужно в оставшиеся дни, чтобы успеть
}

/** Состояние цели на сегодня: прогресс, выполнена ли (и когда), идём ли по плану. */
export function resolveMonthGoal(kind: MonthGoalKind, target: number, month: string, days: GoalDay[], today: string): MonthGoalState {
  const end = monthEnd(month);
  const upTo = days.filter((d) => d.date <= today);
  const cum = cumulativeProgress(kind, upTo);
  const progress = cum.at(-1)?.value ?? 0;
  const hit = cum.find((c) => c.value >= target);
  const total = daysInMonth(month);
  const elapsed = Math.max(0, Math.min(total, dateRange(monthStart(month), today < end ? today : end).length));
  const left = today > end ? 0 : total - elapsed;
  const expected = Math.round((target * elapsed) / total);
  return {
    progress, target, percent: target > 0 ? Math.min(100, Math.round((progress / target) * 100)) : 0, done: !!hit, doneDate: hit?.date ?? null,
    daysLeft: left, daysTotal: total, expected, onTrack: progress >= expected, need: left > 0 ? Math.max(0, Math.ceil((target - progress) / left)) : 0,
  };
}

const r5 = (n: number, step = 5) => Math.max(step, Math.round(n / step) * step);
/** Разумная цель для подсказки родителю: около 60% от того, что получилось бы при выполнении всех норм каждый день. */
export function suggestTarget(kind: MonthGoalKind, goals: number[], month: string): number {
  const days = daysInMonth(month);
  if (kind === 'points') return r5(goals.reduce((a, g) => a + g, 0) * days * 0.6, 100);
  if (kind === 'deeds') return r5(goals.length * days * 0.5, 5);
  return Math.max(3, Math.round(days * 0.6));
}

export const validMonth = (m: unknown): m is string => typeof m === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(m);
