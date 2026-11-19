import { describe, it, expect } from 'vitest';
import { buildFamily, type Raw } from './engine';
import { buildReport, plural } from './report';

const base = (): Raw => ({
  timezone: 'UTC',
  members: [
    { id: 1, name: 'Папа', emoji: '', color: '', isParent: true, goal: 60, superGoal: 100, createdAt: '2026-10-01T00:00:00Z' },
    { id: 2, name: 'Ребёнок', emoji: '', color: '', isParent: false, goal: 40, superGoal: 70, createdAt: '2026-10-01T00:00:00Z' },
  ],
  heroes: [
    { memberId: 1, cls: 'w', clsChosen: false, sub: null, clsChangedAt: '', talents: [] },
    { memberId: 2, cls: 'w', clsChosen: false, sub: null, clsChangedAt: '', talents: [] },
  ],
  workouts: [], warmups: [], study: [], habits: [], habitChecks: [], books: [], quests: [], chestsOpened: [],
  familyQuests: [], dayMvps: [], mvpSince: null, reminderHour: 19, seasonSince: null, reviewOk: [], shopItems: [], purchases: [],
});
// фиксированные квесты, чтобы считать предсказуемо: один автоквест «тренировка 30 мин» и один ручной
const withQuests = (raw: Raw) => { for (const id of [1, 2]) raw.quests.push({ memberId: id, date: 'default', items: [{ t: 'Тренировка', xp: 10, k: 'workout', m: 30 }, { t: 'Помочь по дому', xp: 10, k: 'manual' }] }); };
const TODAY = '2026-11-19';       // четверг; неделя с 2026-11-16, прошлая с 2026-11-09

describe('недельный отчёт', () => {
  it('очки недели, сравнение с теми же днями прошлой недели и активные дни', () => {
    const raw = base(); withQuests(raw);
    raw.workouts.push(
      { memberId: 2, date: '2026-11-16', minutes: 50 }, { memberId: 2, date: '2026-11-17', minutes: 40 },   // эта неделя: 90 + квест
      { memberId: 2, date: '2026-11-09', minutes: 40 }, { memberId: 2, date: '2026-11-10', minutes: 40 },   // прошлая, те же дни
      { memberId: 2, date: '2026-11-13', minutes: 500 },                                                     // вне сравниваемых дней
    );
    const r = buildReport(raw, buildFamily(raw, TODAY), '2026-11-16');
    const m = r.members.find((x) => x.id === 2)!;
    expect(r).toMatchObject({ isCurrent: true, daysElapsed: 4, weekStart: '2026-11-16', weekEnd: '2026-11-22' });
    expect(m.points).toBe(50 + 10 + 40 + 10);            // минуты + выполненные автоквесты (≥30 мин) за два дня
    expect(m.prevPoints).toBe(40 + 10 + 40 + 10);
    expect(m.deltaPct).toBe(Math.round(((110 - 100) / 100) * 100));
    expect(m.activeDays).toBe(2);
    expect(m.daily).toHaveLength(7);
    expect(m.daily.filter((d) => d.counted)).toHaveLength(4);
  });
  it('проваленные квесты и дни без активности: сегодняшний день не считается проваленным', () => {
    const raw = base(); withQuests(raw);
    raw.workouts.push({ memberId: 2, date: '2026-11-16', minutes: 60 });
    const m = buildReport(raw, buildFamily(raw, TODAY), '2026-11-16').members.find((x) => x.id === 2)!;
    // завершённые дни пн–ср: ручной квест не сделан 3 раза; автоквест не сделан 2 раза (вт, ср); сегодня не считаем
    expect(m.quests.missed).toEqual([{ title: 'Помочь по дому', times: 3 }, { title: 'Тренировка', times: 2 }]);
    expect(m.quests.total).toBe(6);                      // 3 завершённых дня × 2; сегодняшний день ещё идёт
    expect(m.warn.some((w) => w.includes('Дни без активности: 2') && w.includes('Вт, Ср'))).toBe(true);
    expect(m.warn.some((w) => w.includes('«Помочь по дому» не выполнен 3 раза'))).toBe(true);
  });
  it('просадка сферы по сравнению с прошлой неделей попадает в выводы', () => {
    const raw = base(); withQuests(raw);
    raw.study.push({ memberId: 2, date: '2026-11-10', kind: 'Учёба', minutes: 90 }, { memberId: 2, date: '2026-11-16', kind: 'Учёба', minutes: 20 });
    const m = buildReport(raw, buildFamily(raw, TODAY), '2026-11-16').members.find((x) => x.id === 2)!;
    expect(m.spheres.find((s) => s.key === 'study')).toMatchObject({ value: 20, prev: 90 });
    expect(m.warn.some((w) => w.startsWith('Просадка: учёба'))).toBe(true);
  });
  it('прошлая закончившаяся неделя считается целиком; хорошее попадает в good', () => {
    const raw = base(); withQuests(raw);
    for (const d of ['2026-11-09', '2026-11-10', '2026-11-11']) raw.workouts.push({ memberId: 2, date: d, minutes: 80 });
    const r = buildReport(raw, buildFamily(raw, TODAY), '2026-11-09');
    const m = r.members.find((x) => x.id === 2)!;
    expect(r).toMatchObject({ isCurrent: false, daysElapsed: 7 });
    expect(m.goalDays).toBe(3);
    expect(m.good.some((g) => g.includes('Норма выполнена в 3 из 7'))).toBe(true);
    expect(m.best?.points).toBeGreaterThan(80);
  });
  it('семья: сумма очков, босс недели', () => {
    const raw = base(); withQuests(raw);
    raw.workouts.push({ memberId: 1, date: '2026-11-16', minutes: 60 }, { memberId: 2, date: '2026-11-16', minutes: 40 });
    const r = buildReport(raw, buildFamily(raw, TODAY), '2026-11-16');
    expect(r.family.points).toBe(r.members[0].points + r.members[1].points);
    expect(r.family.boss).toMatchObject({ finished: false, defeated: false });
    expect(r.earliestWeek).toBe('2026-09-28');
  });
  it('склонение', () => {
    expect([1, 2, 4, 5, 11, 12, 21, 22, 25].map((n) => plural(n, 'раз', 'раза', 'раз'))).toEqual(['раз', 'раза', 'раза', 'раз', 'раз', 'раз', 'раз', 'раза', 'раз']);
  });
});
