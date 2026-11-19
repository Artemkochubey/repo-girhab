import { POINTS } from './points';

export interface ReminderInput {
  hour: number;          // текущий час в часовом поясе семьи (0–23)
  fromHour: number;      // с какого часа напоминать, -1 — выключено
  isToday: boolean;
  points: number; goal: number; superGoal: number;
  warmupDone: boolean;
  habitsLeft: number;    // неотмеченных привычек
  quests: { t: string; xp: number; completed: boolean; pending: boolean }[];
}
export interface Reminder { kind: 'goal' | 'super'; left: number; hoursLeft: number; title: string; ideas: string[] }

/**
 * Вечернее напоминание: после заданного часа, если норма дня ещё не набрана (или не добрана супер-цель),
 * подсказывает, что ещё успеть. Опирается только на уже известные данные дня, ничего не отправляет.
 */
export function eveningReminder(i: ReminderInput): Reminder | null {
  if (i.fromHour < 0 || !i.isToday || i.hour < i.fromHour) return null;
  const kind: Reminder['kind'] | null = i.points < i.goal ? 'goal' : i.points < i.superGoal ? 'super' : null;
  if (!kind) return null;
  const left = (kind === 'goal' ? i.goal : i.superGoal) - i.points;
  const hoursLeft = Math.max(0, 24 - i.hour);

  const ideas: string[] = [];
  for (const q of [...i.quests].filter((x) => !x.completed && !x.pending).sort((a, b) => b.xp - a.xp).slice(0, 2)) ideas.push(`Квест «${q.t}»: +${q.xp}`);
  if (!i.warmupDone) ideas.push(`Зарядка: +${POINTS.warmup}`);
  if (i.habitsLeft > 0) ideas.push(`Привычки: +${POINTS.habit} за каждую (осталось ${i.habitsLeft})`);
  if (left <= 90) ideas.push(`Тренировка: примерно ${left} мин закроют недостающее`);
  return {
    kind, left, hoursLeft, ideas: ideas.slice(0, 4),
    title: kind === 'goal' ? `До нормы ещё ${left} оч.` : `До супер-цели ещё ${left} оч.`,
  };
}
