import { addDays } from '../date';

export interface FamilyQuestInput {
  id: number; title: string; description: string; xp: number;
  kind: 'manual' | 'points'; target: number; period: 'day' | 'week';
  date: string; status: 'open' | 'pending' | 'done'; doneDate: string | null;
}

export interface FamilyQuestResult { done: boolean; doneDate: string | null; progress: number; pending: boolean }

/** Последний день квеста: сам день или воскресенье недели. */
export const questEnd = (q: Pick<FamilyQuestInput, 'period' | 'date'>) => (q.period === 'day' ? q.date : addDays(q.date, 6));

/**
 * Состояние семейного квеста.
 * manual: выполнен, когда родитель отметил (дата выполнения — день отметки).
 * points: выполнен в тот день, когда суммарные очки активности семьи за период дошли до цели.
 * familyPoints — очки активности всей семьи по датам (без бонусов и квестов, чтобы не было циклов).
 */
export function resolveFamilyQuest(q: FamilyQuestInput, familyPoints: Map<string, number>, today: string): FamilyQuestResult {
  if (q.kind === 'manual') {
    return { done: q.status === 'done', doneDate: q.status === 'done' ? q.doneDate ?? q.date : null, progress: q.status === 'done' ? 1 : 0, pending: q.status === 'pending' };
  }
  let sum = 0;
  let doneDate: string | null = null;
  for (let d = q.date; d <= questEnd(q) && d <= today; d = addDays(d, 1)) {
    sum += familyPoints.get(d) ?? 0;
    if (doneDate === null && q.target > 0 && sum >= q.target) doneDate = d;
  }
  return { done: doneDate !== null, doneDate, progress: sum, pending: false };
}

export const validFamilyQuest = (q: { title: unknown; description: unknown; xp: unknown; kind: unknown; target: unknown }): string | null => {
  if (typeof q.title !== 'string' || !q.title.trim() || q.title.length > 60) return 'Название: 1–60 символов';
  if (typeof q.description !== 'string' || q.description.length > 120) return 'Описание: до 120 символов';
  if (!Number.isInteger(q.xp) || (q.xp as number) < 1 || (q.xp as number) > 100) return 'Опыт: от 1 до 100';
  if (q.kind !== 'manual' && q.kind !== 'points') return 'Неизвестный тип квеста';
  if (q.kind === 'points' && (!Number.isInteger(q.target) || (q.target as number) < 10 || (q.target as number) > 5000)) return 'Цель по очкам: от 10 до 5000';
  return null;
};
