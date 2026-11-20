import { describe, it, expect } from 'vitest';
import { ARTIFACT_KINDS, deriveArtifacts, kindFromKey, rollChestArtifact } from './artifacts';
import { GOAL_KINDS, TIERS, canChooseGoal, goalProgress, goalTarget, resolveGoal, rewardXp, type GoalDay } from './goals';

const base = { since: '2026-11-01', chests: [], bossWins: [], seasonWins: [], mvpDates: [], goalWeeks: [], uses: [] };

describe('артефакты', () => {
  it('вид по ключу стабилен и из известного набора; все виды встречаются', () => {
    expect(kindFromKey('boss:2026-11-15')).toBe(kindFromKey('boss:2026-11-15'));
    const seen = new Set(Array.from({ length: 200 }, (_, i) => kindFromKey('k' + i)));
    expect([...seen].sort()).toEqual([...ARTIFACT_KINDS].sort());
  });
  it('из сундука: шанс зависит от редкости, вид выбирается вторым числом', () => {
    expect(rollChestArtifact('common', 0.5, 0.1)).toBeNull();
    expect(rollChestArtifact('common', 0.07, 0.0)).toBe('shield');
    expect(rollChestArtifact('rare', 0.19, 0.99)).toBe('luck');
    expect(rollChestArtifact('legend', 0.39, 0.5)).not.toBeNull();
    expect(rollChestArtifact('legend', 0.41, 0.5)).toBeNull();
  });
  it('выводятся из истории: сундуки всегда, победы только с даты старта', () => {
    const a = deriveArtifacts({ ...base, chests: [{ n: 3, date: '2026-10-01', artifact: 'key' }, { n: 4, date: '2026-10-02', artifact: null }], bossWins: ['2026-10-25', '2026-11-08'], seasonWins: [{ id: '2026-10', date: '2026-10-31' }, { id: '2026-11', date: '2026-11-30' }], goalWeeks: ['2026-11-09'] });
    expect(a.map((x) => x.key)).toEqual(['chest:3', 'boss:2026-11-08', 'goal:2026-11-09', 'season:2026-11']);   // по дате; победы до старта (2026-10-25, сезон 2026-10) не считаются
  });
  it('без даты старта победы артефактов не дают', () => {
    expect(deriveArtifacts({ ...base, since: null, bossWins: ['2026-11-08'], seasonWins: [{ id: '2026-11', date: '2026-11-30' }] })).toEqual([]);
  });
  it('использование: статус, день, дата', () => {
    const a = deriveArtifacts({ ...base, chests: [{ n: 1, date: '2026-11-02', artifact: 'shield' }, { n: 2, date: '2026-11-03', artifact: 'luck' }], uses: [{ key: 'chest:1', kind: 'shield', status: 'active', activeFor: '2026-11-01', usedOn: '2026-11-04' }] });
    expect(a[0]).toMatchObject({ key: 'chest:1', status: 'active', activeFor: '2026-11-01' });
    expect(a[1]).toMatchObject({ key: 'chest:2', status: 'bag', activeFor: null });
  });
  it('MVP дня даёт артефакт не каждый раз (примерно в четверти дней)', () => {
    const days = Array.from({ length: 200 }, (_, i) => `2026-12-${String((i % 28) + 1).padStart(2, '0')}-${i}`);
    const n = deriveArtifacts({ ...base, mvpDates: days }).length;
    expect(n).toBeGreaterThan(20); expect(n).toBeLessThan(90);
  });
});

const day = (total: number, o: Partial<GoalDay['stats']> = {}, q = false): GoalDay => ({ total, stats: { workoutMinutes: 0, habits: 0, study: {}, ...o }, questsAllDone: q });

describe('недельные цели', () => {
  it('цели в числах подстраиваются под норму и привычки', () => {
    expect(goalTarget('workout', 'mid', 60, 3)).toBe(200);
    expect(goalTarget('workout', 'mid', 40, 3)).toBe(135);
    expect(goalTarget('points', 'easy', 40, 3)).toBe(160);
    expect(goalTarget('normDays', 'hard', 40, 0)).toBe(7);
    expect(goalTarget('habits', 'hard', 60, 0)).toBeNull();
    expect(goalTarget('habits', 'hard', 60, 2)).toBe(14);
    for (const k of GOAL_KINDS) for (const t of TIERS) expect(goalTarget(k, t, 60, 5)!).toBeGreaterThan(0);
    for (const k of GOAL_KINDS) { const [e, m, h] = TIERS.map((t) => goalTarget(k, t, 60, 5)!); expect(e).toBeLessThan(m); expect(m).toBeLessThan(h); }
  });
  it('прогресс по видам', () => {
    const w = [day(70, { workoutMinutes: 30, habits: 2, study: { Языки: 20, Учёба: 10 } }, true), day(40, { workoutMinutes: 20 }), day(60, { habits: 3 }, true)];
    expect(goalProgress('normDays', w, 60)).toBe(2);
    expect(goalProgress('workout', w, 60)).toBe(50);
    expect(goalProgress('study', w, 60)).toBe(30);
    expect(goalProgress('habits', w, 60)).toBe(5);
    expect(goalProgress('points', w, 60)).toBe(170);
    expect(goalProgress('questDays', w, 60)).toBe(2);
  });
  it('выбирать цель можно в понедельник–среду текущей недели', () => {
    expect(canChooseGoal('2026-11-16', '2026-11-16')).toBe(true);   // понедельник
    expect(canChooseGoal('2026-11-18', '2026-11-16')).toBe(true);   // среда
    expect(canChooseGoal('2026-11-19', '2026-11-16')).toBe(false);  // четверг
    expect(canChooseGoal('2026-11-23', '2026-11-16')).toBe(false);  // чужая неделя
  });
  it('состояние цели: идёт, выполнена, провалена, ручная', () => {
    const row = { weekStart: '2026-11-16', kind: 'workout', tier: 'mid' as const, target: 50, title: null, manual: false, confirmed: false };
    const w = [day(70, { workoutMinutes: 30 }), day(40, { workoutMinutes: 20 })];
    expect(resolveGoal(row, w, '2026-11-18', 60)).toMatchObject({ progress: 50, done: true, finished: false, daysLeft: 5, rewardChests: 1, rewardArtifact: false });
    expect(resolveGoal({ ...row, target: 80 }, w, '2026-11-23', 60)).toMatchObject({ done: false, finished: true, daysLeft: 0 });
    const hard = resolveGoal({ ...row, tier: 'hard' }, w, '2026-11-24', 60);
    expect(hard.rewardArtifact).toBe(true);
    const manual = { ...row, kind: 'custom', manual: true, title: 'Прочитать 2 главы', target: 1 };
    expect(resolveGoal(manual, [], '2026-11-24', 60)).toMatchObject({ done: false, finished: true });
    expect(resolveGoal({ ...manual, confirmed: true }, [], '2026-11-24', 60)).toMatchObject({ done: true, progress: 1 });
  });
  it('бонус опыта: масштаб по норме', () => {
    expect(rewardXp('mid', 60)).toBe(90);
    expect(rewardXp('mid', 40)).toBe(60);
    expect(rewardXp('hard', 40)).toBe(100);
  });
});
