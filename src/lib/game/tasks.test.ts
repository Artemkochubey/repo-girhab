import { describe, it, expect } from 'vitest';
import { repeatLabel, scheduledOn, taskNeedsConfirm, taskProgress, taskReward, tasksOn, weekdayOf, type TaskDef } from './tasks';
import { dayPoints } from './points';
import { emptyDay, type HeroBuild } from './types';
import { buildRating, partsOf } from './rating';

const T = (o: Partial<TaskDef> & { id: number }): TaskDef => ({ memberId: 1, title: 'Уроки', emoji: '📚', repeat: 'daily', days: [], date: null, from: '2026-11-01', until: null, points: 5, chests: 0, needConfirm: false, ...o });
// 2026-11-19 — четверг
const TODAY = '2026-11-19';

describe('задачи на день: расписание', () => {
  it('ежедневная, по дням недели и разовая', () => {
    expect(weekdayOf(TODAY)).toBe(4);
    expect(scheduledOn(T({ id: 1 }), TODAY)).toBe(true);
    expect(scheduledOn(T({ id: 1, from: '2026-11-20' }), TODAY)).toBe(false);          // ещё не началась
    expect(scheduledOn(T({ id: 1, until: '2026-11-19' }), TODAY)).toBe(false);         // убрана с этого дня
    expect(scheduledOn(T({ id: 2, repeat: 'weekdays', days: [4] }), TODAY)).toBe(true);
    expect(scheduledOn(T({ id: 2, repeat: 'weekdays', days: [0, 6] }), TODAY)).toBe(false);
    expect(scheduledOn(T({ id: 3, repeat: 'once', date: TODAY }), TODAY)).toBe(true);
    expect(scheduledOn(T({ id: 3, repeat: 'once', date: TODAY }), '2026-11-20')).toBe(false);
  });
  it('невыполненная разовая переносится на следующие дни, выполненная нет', () => {
    const once = T({ id: 3, repeat: 'once', date: '2026-11-17', from: '2026-11-17' });
    expect(tasksOn([once], [], TODAY, TODAY).map((x) => [x.task.id, x.carried])).toEqual([[3, true]]);
    expect(tasksOn([once], [], '2026-11-16', TODAY)).toHaveLength(0);                            // до даты не видна
    const done = [{ taskId: 3, date: '2026-11-18', confirmed: true }];
    expect(tasksOn([once], done, TODAY, TODAY)).toHaveLength(0);                                 // уже сделана вчера
    expect(tasksOn([once], done, '2026-11-18', TODAY)).toHaveLength(1);                          // но в тот день видна выполненной
    expect(tasksOn([once], [], '2026-11-25', TODAY)).toHaveLength(0);                            // будущее не переносится
  });
  it('выполненные идут в конце; отметка в день вне расписания всё равно показывается', () => {
    const list = tasksOn([T({ id: 1 }), T({ id: 2 }), T({ id: 4, repeat: 'weekdays', days: [0] })], [{ taskId: 1, date: TODAY, confirmed: true }, { taskId: 4, date: TODAY, confirmed: true }], TODAY, TODAY);
    expect(list.map((x) => x.task.id)).toEqual([2, 1, 4]);
    expect(taskProgress(list)).toEqual({ total: 3, done: 2, waiting: 0 });
  });
  it('награда — только за подтверждённые отметки, сундук требует подтверждения', () => {
    const defs = [T({ id: 1, points: 10 }), T({ id: 2, points: 20, chests: 1 })];
    const r = taskReward(defs, [{ taskId: 1, date: TODAY, confirmed: true }, { taskId: 2, date: TODAY, confirmed: false }], TODAY);
    expect(r).toEqual({ points: 10, chests: 0, count: 1 });
    expect(taskReward(defs, [{ taskId: 2, date: TODAY, confirmed: true }], TODAY)).toEqual({ points: 20, chests: 1, count: 1 });
    expect(taskNeedsConfirm(defs[1])).toBe(true);
    expect(taskNeedsConfirm(defs[0])).toBe(false);
  });
  it('подписи расписания', () => {
    expect(repeatLabel({ repeat: 'daily', days: [], date: null })).toBe('каждый день');
    expect(repeatLabel({ repeat: 'weekdays', days: [1, 2, 3, 4, 5], date: null })).toBe('по будням');
    expect(repeatLabel({ repeat: 'weekdays', days: [0, 6], date: null })).toBe('по выходным');
    expect(repeatLabel({ repeat: 'weekdays', days: [3, 1], date: null })).toBe('Пн, Ср');
    expect(repeatLabel({ repeat: 'once', days: [], date: '2026-11-20' })).toBe('один раз, 20.11');
  });
});

describe('задачи на день: очки и рейтинг', () => {
  const hero: HeroBuild = { cls: null, sub: null, talents: [], level: 1 };
  it('очки за задачи прибавляются без множителей и не входят в основу', () => {
    const d = { ...emptyDay(), workoutMinutes: 10, taskPoints: 15 };
    const r = dayPoints(d, { ...hero, cls: 'w' }, 0, true);
    expect(r.tasks).toBe(15);
    expect(r.total - Math.round(r.bySphere.workout ?? 0)).toBe(15);
  });
  it('в рейтинге у задач свой источник, остаток не уходит в бонусы', () => {
    const parts = partsOf({ id: 1, goal: 60, superGoal: 100, total: 40, bySphere: { workout: 25 }, questXp: 0, walkShare: 0, taskPoints: 15 });
    expect(parts.find((p) => p.id === 'tasks')?.points).toBe(15);
    expect(parts.find((p) => p.id === 'bonus')).toBeUndefined();
    expect(buildRating([{ id: 1, goal: 60, superGoal: 100, total: 40, bySphere: { workout: 25 }, questXp: 0, walkShare: 0, taskPoints: 15 }])[0].parts.map((p) => p.id)).toContain('tasks');
  });
});
