import type { DayStats, StudyKind } from './types';

export type QuestKind = 'manual' | 'warmup' | 'workout' | 'habits' | 'study';
export interface QuestItem { t: string; xp: number; k: QuestKind; m?: number; kind?: StudyKind | 'any'; done?: boolean; pending?: boolean }

export const QUEST_TEMPLATES: QuestItem[] = [
  { t: 'Утренняя зарядка', k: 'warmup', xp: 15 },
  { t: 'Размяться', k: 'workout', m: 20, xp: 25 },
  { t: 'Большая тренировка', k: 'workout', m: 40, xp: 40 },
  { t: 'Страницы приключений', k: 'study', kind: 'Книги', m: 20, xp: 20 },
  { t: 'Слова иного мира', k: 'study', kind: 'Языки', m: 15, xp: 20 },
  { t: 'Урок мудрости', k: 'study', kind: 'Учёба', m: 30, xp: 25 },
  { t: 'Творческий порыв', k: 'study', kind: 'Творчество', m: 20, xp: 20 },
  { t: 'Загадка сфинкса', k: 'study', kind: 'Мышление', m: 15, xp: 20 },
  { t: 'Ритуал дня', k: 'habits', m: 3, xp: 20 },
  { t: 'Помочь по дому', k: 'manual', xp: 20 },
];

/** Детерминированный генератор (mulberry32) по строке-зерну. */
export function seededRandom(seed: string): () => number {
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i++) { h = Math.imul(h ^ seed.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); }
  let a = (h ^= h >>> 16) >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const roundTo5 = (n: number) => Math.max(5, Math.round(n / 5) * 5);

/** 3 квеста из шаблонов; минуты масштабируются по goal/60. */
export function defaultQuests(memberId: number, date: string, goal: number, count = 3): QuestItem[] {
  const rnd = seededRandom(`${memberId}:${date}`);
  const pool = [...QUEST_TEMPLATES];
  const picked: QuestItem[] = [];
  while (picked.length < count && pool.length) picked.push(pool.splice(Math.floor(rnd() * pool.length), 1)[0]);
  const scale = goal / 60;
  return picked.map((q) => ({
    ...q,
    m: q.k === 'workout' || q.k === 'study' ? roundTo5((q.m ?? 0) * scale) : q.m,
  }));
}

export const validQuest = (q: QuestItem): boolean =>
  q.t.trim().length > 0 && q.t.length <= 60 && q.xp >= 1 && q.xp <= 100 && Number.isInteger(q.xp);
export const validQuestList = (qs: QuestItem[]): boolean => qs.length >= 1 && qs.length <= 5 && qs.every(validQuest);

/** Автозачёт по записям. Ручной считается выполненным только после подтверждения. */
export function questDone(q: QuestItem, d: DayStats): boolean {
  switch (q.k) {
    case 'manual': return !!q.done && !q.pending;
    case 'warmup': return d.warmups > 0;
    case 'workout': return d.workoutMinutes >= (q.m ?? 1);
    case 'habits': return d.habits >= (q.m ?? 1);
    case 'study': {
      const min = q.m ?? 1;
      if (!q.kind || q.kind === 'any') return Object.values(d.study).reduce((a, b) => a + (b ?? 0), 0) >= min;
      return (d.study[q.kind] ?? 0) >= min;
    }
  }
}

export const isAuto = (q: QuestItem) => q.k !== 'manual';
export const questXpEarned = (qs: QuestItem[], d: DayStats): number =>
  qs.reduce((s, q) => s + (questDone(q, d) ? q.xp : 0), 0);
export const allQuestsDone = (qs: QuestItem[], d: DayStats): boolean =>
  qs.length > 0 && qs.every((q) => questDone(q, d));
