import { describe, it, expect } from 'vitest';
import { ACHIEVEMENTS, computeAchievements, type AchievementInput } from './achievements';
import { resolveFamilyQuest, validFamilyQuest } from './familyQuests';

const days = (n: number, start = '2026-11-01') => Array.from({ length: n }, (_, i) => new Date(Date.parse(start + 'T00:00:00Z') + i * 86400000).toISOString().slice(0, 10));
const input = (n: number, o: Partial<AchievementInput> = {}): AchievementInput => ({
  dates: days(n), streak: Array(n).fill(0), books: Array(n).fill(0), warmups: Array(n).fill(0), habits: Array(n).fill(0),
  study: Array(n).fill(0), workoutEq: Array(n).fill(0), points: Array(n).fill(0), questsAllDone: Array(n).fill(false),
  superGoal: 100, chestDates: [], bossWinDates: [], mvpDates: [], dayMvpDates: [], ...o,
});
const get = (r: ReturnType<typeof computeAchievements>, id: string) => r.find((a) => a.id === id)!;

describe('достижения', () => {
  it('id уникальны, цели положительные', () => {
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
    expect(ACHIEVEMENTS.every((a) => a.target > 0)).toBe(true);
  });
  it('серия 7 дней: выдаётся в день достижения и не отзывается после обрыва', () => {
    const streak = [1, 2, 3, 4, 5, 6, 7, 8, 0, 0];
    const r = computeAchievements(input(10, { streak }));
    expect(get(r, 'streak7').earnedOn).toBe('2026-11-07');
    expect(get(r, 'streak7').value).toBe(8);          // максимальная серия сохраняется
    expect(get(r, 'streak30').earnedOn).toBeNull();
  });
  it('первая книга и 10 тренировок', () => {
    const books = [0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    const workoutEq = [20, 10, 30, 15, 40, 0, 16, 50, 20, 30, 45, 60];   // дней от 15 мин: 10 (кроме 10-минутного и пустого)
    const r = computeAchievements(input(12, { books, workoutEq }));
    expect(get(r, 'book1').earnedOn).toBe('2026-11-03');
    expect(get(r, 'work10').value).toBe(10);
    expect(get(r, 'work10').earnedOn).toBe('2026-11-12');
  });
  it('уровень считается по накопленному опыту, рекордный день — от супер-нормы', () => {
    const points = [40, 20, 100, 0, 150, 0];                 // 40,60,160,160,310 → уровень 3 на 3-й день (160 XP), 4-й уровень на 5-й
    const r = computeAchievements(input(6, { points }));
    expect(get(r, 'lvl5').earnedOn).toBeNull();
    expect(get(r, 'big1').earnedOn).toBe('2026-11-05');       // 150 ≥ 1,5 × 100
    const many = computeAchievements(input(8, { points: [60, 100, 150, 200, 300, 400, 500, 600] }));
    expect(get(many, 'lvl5').earnedOn).not.toBeNull();
  });
  it('сундуки и победы над боссами по датам событий', () => {
    const r = computeAchievements(input(5, { chestDates: Array(10).fill('2026-11-04'), bossWinDates: ['2026-11-03'], mvpDates: ['2026-11-03'] }));
    expect(get(r, 'chest10').earnedOn).toBe('2026-11-04');
    expect(get(r, 'boss1').earnedOn).toBe('2026-11-03');
    expect(get(r, 'mvp1').earnedOn).toBe('2026-11-03');
    expect(get(r, 'boss5').earnedOn).toBeNull();
  });
});

describe('семейные квесты', () => {
  const base = { id: 1, title: 'Прогулка', description: '', xp: 30, target: 0, period: 'day' as const, date: '2026-11-19', doneDate: null };
  it('ручной: выполнен после отметки родителя', () => {
    expect(resolveFamilyQuest({ ...base, kind: 'manual', status: 'open' }, new Map(), '2026-11-19')).toMatchObject({ done: false, pending: false });
    expect(resolveFamilyQuest({ ...base, kind: 'manual', status: 'pending' }, new Map(), '2026-11-19')).toMatchObject({ done: false, pending: true });
    expect(resolveFamilyQuest({ ...base, kind: 'manual', status: 'done', doneDate: '2026-11-19' }, new Map(), '2026-11-19')).toMatchObject({ done: true, doneDate: '2026-11-19' });
  });
  it('по очкам: день и неделя, дата выполнения — день достижения цели', () => {
    const fp = new Map([['2026-11-16', 100], ['2026-11-17', 150], ['2026-11-18', 200], ['2026-11-19', 50]]);
    const week = { ...base, kind: 'points' as const, status: 'open' as const, period: 'week' as const, date: '2026-11-16', target: 400 };
    expect(resolveFamilyQuest(week, fp, '2026-11-19')).toMatchObject({ done: true, doneDate: '2026-11-18', progress: 500 });
    expect(resolveFamilyQuest({ ...week, target: 600 }, fp, '2026-11-19')).toMatchObject({ done: false, progress: 500 });
    const day = { ...week, period: 'day' as const, date: '2026-11-19', target: 40 };
    expect(resolveFamilyQuest(day, fp, '2026-11-19')).toMatchObject({ done: true, doneDate: '2026-11-19' });
    expect(resolveFamilyQuest({ ...day, date: '2026-11-20' }, fp, '2026-11-19')).toMatchObject({ done: false, progress: 0 }); // будущее
  });
  it('валидация', () => {
    const ok = { title: 'Уборка', description: 'вместе', xp: 20, kind: 'manual', target: 0 };
    expect(validFamilyQuest(ok)).toBeNull();
    expect(validFamilyQuest({ ...ok, title: '' })).not.toBeNull();
    expect(validFamilyQuest({ ...ok, xp: 101 })).not.toBeNull();
    expect(validFamilyQuest({ ...ok, kind: 'points', target: 5 })).not.toBeNull();
    expect(validFamilyQuest({ ...ok, kind: 'points', target: 400 })).toBeNull();
  });
});
