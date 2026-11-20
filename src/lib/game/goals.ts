import { addDays, dayDiff } from '../date';
import { weekStart } from './boss';

/**
 * Недельная цель: в начале недели (понедельник–среда) герой выбирает один вид цели и сложность,
 * а родитель может задать свою (ручную: он сам отмечает выполнение). Прогресс считается из записей.
 * За выполненную цель: бонус опыта, за среднюю и сложную сундук, за сложную ещё артефакт.
 */
export type GoalKind = 'normDays' | 'workout' | 'study' | 'habits' | 'points' | 'questDays' | 'deeds';
export type GoalTier = 'easy' | 'mid' | 'hard';
export const GOAL_KINDS: GoalKind[] = ['normDays', 'workout', 'study', 'habits', 'points', 'questDays', 'deeds'];
export const TIERS: GoalTier[] = ['easy', 'mid', 'hard'];
export const TIER_NAMES: Record<GoalTier, string> = { easy: 'Лёгкая', mid: 'Средняя', hard: 'Сложная' };

export const GOAL_INFO: Record<GoalKind, { name: string; emoji: string; unit: string; text: (n: number) => string }> = {
  normDays: { name: 'Дни с нормой', emoji: '📅', unit: 'дн.', text: (n) => `выполнить дневную норму в ${n} дн. недели` },
  workout: { name: 'Тренировки', emoji: '💪', unit: 'мин', text: (n) => `${n} мин тренировок за неделю` },
  study: { name: 'Учёба', emoji: '🎓', unit: 'мин', text: (n) => `${n} мин учёбы за неделю` },
  habits: { name: 'Привычки', emoji: '✅', unit: 'шт.', text: (n) => `отметить привычки ${n} раз за неделю` },
  points: { name: 'Очки недели', emoji: '⭐', unit: 'оч.', text: (n) => `набрать ${n} очков за неделю` },
  questDays: { name: 'Квесты', emoji: '⚔️', unit: 'дн.', text: (n) => `выполнить все квесты в ${n} дн. недели` },
  deeds: { name: 'Добрые дела', emoji: '💛', unit: 'шт.', text: (n) => `сделать ${n} добрых дел за неделю` },
};

export const REWARD: Record<GoalTier, { xp: number; chests: number; artifact: boolean }> = {
  easy: { xp: 40, chests: 0, artifact: false },
  mid: { xp: 90, chests: 1, artifact: false },
  hard: { xp: 150, chests: 1, artifact: true },
};
/** Бонус опыта подстраивается под личную норму (60 — база). */
export const rewardXp = (tier: GoalTier, goal: number): number => Math.max(5, Math.round((REWARD[tier].xp * goal) / 60 / 5) * 5);

const BASE: Record<GoalKind, [number, number, number]> = {
  normDays: [3, 5, 7], workout: [120, 200, 300], study: [120, 240, 360], habits: [12, 20, 30], points: [4, 6, 8], questDays: [2, 4, 6], deeds: [4, 8, 12],
};
const r5 = (n: number) => Math.max(5, Math.round(n / 5) * 5);

/** Цель в числах для конкретного героя; null — вид цели ему недоступен (например, нет привычек). */
export function goalTarget(kind: GoalKind, tier: GoalTier, goal: number, habitsCount: number): number | null {
  const base = BASE[kind][TIERS.indexOf(tier)] as number;
  switch (kind) {
    case 'workout': case 'study': return r5((base * goal) / 60);
    case 'points': return Math.round(base * goal);
    case 'habits': return habitsCount > 0 ? Math.min(base, habitsCount * 7) : null;
    default: return base;
  }
}

export interface GoalDay { total: number; stats: { workoutMinutes: number; habits: number; deeds?: number; study: Partial<Record<string, number>> }; questsAllDone: boolean }

/** Прогресс по дням недели (дни до сегодняшнего включительно). */
export function goalProgress(kind: GoalKind, days: GoalDay[], goal: number): number {
  switch (kind) {
    case 'normDays': return days.filter((d) => d.total >= goal).length;
    case 'workout': return Math.round(days.reduce((a, d) => a + d.stats.workoutMinutes, 0));
    case 'study': return days.reduce((a, d) => a + (Object.values(d.stats.study) as (number | undefined)[]).reduce<number>((x, y) => x + (y ?? 0), 0), 0);
    case 'habits': return days.reduce((a, d) => a + d.stats.habits, 0);
    case 'points': return Math.round(days.reduce((a, d) => a + d.total, 0));
    case 'questDays': return days.filter((d) => d.questsAllDone).length;
    case 'deeds': return days.reduce((a, d) => a + (d.stats.deeds ?? 0), 0);
  }
}

export const goalWeekStart = weekStart;
export const weekEnd = (ws: string) => addDays(ws, 6);
/** Выбирать цель можно в понедельник–среду (индекс дня недели 0–2): иначе легко выбрать уже выполненную. */
export const canChooseGoal = (today: string, ws: string): boolean => weekStart(today) === ws && dayDiff(ws, today) <= 2;

export interface GoalRow { weekStart: string; kind: string; tier: GoalTier; target: number; title: string | null; manual: boolean; confirmed: boolean }
export interface GoalState {
  weekStart: string; kind: string; tier: GoalTier; target: number; title: string | null; manual: boolean; confirmed: boolean;
  progress: number; done: boolean; finished: boolean; daysLeft: number;
  rewardXp: number; rewardChests: number; rewardArtifact: boolean;
}

/** Состояние цели: прогресс, выполнена ли, закончилась ли неделя и положенная награда. */
export function resolveGoal(row: GoalRow, days: GoalDay[], today: string, goal: number): GoalState {
  const end = weekEnd(row.weekStart);
  const finished = end < today;
  const manual = row.manual;
  const progress = manual ? (row.confirmed ? row.target : 0) : goalProgress(row.kind as GoalKind, days, goal);
  const done = manual ? row.confirmed : progress >= row.target;
  const rw = REWARD[row.tier];
  return {
    ...row, progress, done, finished, daysLeft: finished ? 0 : dayDiff(today, end) + 1,
    rewardXp: rewardXp(row.tier, goal), rewardChests: rw.chests, rewardArtifact: rw.artifact,
  };
}
