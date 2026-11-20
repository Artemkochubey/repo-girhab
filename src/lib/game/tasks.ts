// «Мои задачи на день»: личный список дел героя. Задачи и награды за них задаёт только родитель, ребёнок ставит галочку.
// Сами задачи и отметки хранятся как факты; очки и сундуки выводятся из них (см. engine.ts).

export const TASK_REPEATS = ['daily', 'weekdays', 'once'] as const;
export type TaskRepeat = (typeof TASK_REPEATS)[number];

export const TASK_TITLE_MAX = 60;
export const TASK_POINTS_MAX = 50;   // очков за одну задачу
export const TASK_CHESTS_MAX = 3;    // сундуков за одну задачу
export const TASKS_ACTIVE_MAX = 20;  // активных задач на героя
export const GRANT_CHESTS_MAX = 5;   // сундуков за одну выдачу родителем

export const WEEKDAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'] as const;   // индекс = getUTCDay()

export interface TaskDef {
  id: number; memberId: number; title: string; emoji: string;
  repeat: TaskRepeat;
  days: number[];                // для 'weekdays': 0 (вс) – 6 (сб)
  date: string | null;           // для 'once'
  from: string;                  // с какого дня показывать
  until: string | null;          // до какого дня (не включая); null — без конца
  points: number; chests: number;
  needConfirm: boolean;          // галочка ребёнка ждёт подтверждения родителя
}
export interface TaskDoneRow { taskId: number; date: string; confirmed: boolean }
export interface TaskDayItem { task: TaskDef; done: boolean; confirmed: boolean; carried: boolean }

export const weekdayOf = (date: string): number => new Date(date + 'T00:00:00Z').getUTCDay();

/** Нужно ли подтверждение: задачи с сундуком всегда подтверждает родитель. */
export const taskNeedsConfirm = (t: { needConfirm: boolean; chests: number }): boolean => t.needConfirm || t.chests > 0;

/** Задача стоит в списке на дату по расписанию (без переноса). */
export function scheduledOn(t: TaskDef, date: string): boolean {
  if (date < t.from || (t.until !== null && date >= t.until)) return false;
  if (t.repeat === 'daily') return true;
  if (t.repeat === 'weekdays') return t.days.includes(weekdayOf(date));
  return t.date === date;
}

/**
 * Список дня: задачи по расписанию, невыполненные разовые прошлых дней (переносятся на сегодня) и всё, что отмечено в этот день.
 * Сначала невыполненные, потом выполненные; внутри группы по номеру.
 */
export function tasksOn(defs: TaskDef[], dones: TaskDoneRow[], date: string, today: string): TaskDayItem[] {
  const out: TaskDayItem[] = [];
  for (const t of defs) {
    const mine = dones.filter((x) => x.taskId === t.id);
    const row = mine.find((x) => x.date === date);
    const carried = t.repeat === 'once' && !!t.date && t.date < date && date <= today && !mine.some((x) => x.date < date)
      && date >= t.from && (t.until === null || date < t.until);
    if (!row && !scheduledOn(t, date) && !carried) continue;
    out.push({ task: t, done: !!row, confirmed: !!row && row.confirmed, carried: carried && !scheduledOn(t, date) });
  }
  return out.sort((a, b) => (a.done === b.done ? a.task.id - b.task.id : a.done ? 1 : -1));
}

/** Награда за день: считаются только подтверждённые отметки. */
export function taskReward(defs: TaskDef[], dones: TaskDoneRow[], date: string): { points: number; chests: number; count: number } {
  let points = 0, chests = 0, count = 0;
  for (const d of dones) {
    if (d.date !== date || !d.confirmed) continue;
    const t = defs.find((x) => x.id === d.taskId);
    if (!t) continue;
    points += t.points; chests += t.chests; count++;
  }
  return { points, chests, count };
}

/** Сводка дня для карточки: «3 из 5». Ждущие подтверждения считаются выполненными, но награды ещё нет. */
export function taskProgress(items: TaskDayItem[]): { total: number; done: number; waiting: number } {
  return { total: items.length, done: items.filter((x) => x.done).length, waiting: items.filter((x) => x.done && !x.confirmed).length };
}

export function validRepeat(v: unknown): v is TaskRepeat { return (TASK_REPEATS as readonly unknown[]).includes(v); }

/** Описание расписания для человека. */
export function repeatLabel(t: Pick<TaskDef, 'repeat' | 'days' | 'date'>): string {
  if (t.repeat === 'daily') return 'каждый день';
  if (t.repeat === 'once') return t.date ? `один раз, ${t.date.slice(8)}.${t.date.slice(5, 7)}` : 'один раз';
  const order = [1, 2, 3, 4, 5, 6, 0];
  const d = order.filter((x) => t.days.includes(x));
  if (d.length === 5 && d.join() === '1,2,3,4,5') return 'по будням';
  if (d.length === 2 && d.join() === '6,0') return 'по выходным';
  return d.map((x) => WEEKDAYS[x]).join(', ');
}
