import type { LiveBattleDto, MonthGoalViewDto, RatingDto, RatingWeekDto } from './client';
import type { FaceConfig } from './game/faces';

export interface TvFq { id: number; title: string; description: string; xp: number; kind: 'manual' | 'points'; target: number; period: 'day' | 'week'; done: boolean; pending: boolean; progress: number }
export interface TvMember { id: number; name: string; emoji: string; face: FaceConfig | null; color: string; goal: number; superGoal: number; badges: number; xp: number; level: number; pointsToday: number; look: Record<string, string>; cls: string | null }
export interface TvQuest { t: string; xp: number; manual: boolean; done: boolean; pending: boolean; index: number; desc: string | null; hint: string; progress: string | null }

/** Всё, что отдаёт `/api/tv`. */
export interface Tv {
  familyQuests: TvFq[];
  mvp: { yesterday: { memberId: number; points: number } | null; leader: { memberId: number; ratio: number; qualified: boolean } | null };
  today: string; timezone: string; reminderHour: number; rating?: RatingDto; ratingWeek?: RatingWeekDto; monthGoal?: MonthGoalViewDto;
  battles: Record<number, { horde: string; emoji: string; cleared: number; hp: number; maxHp: number; outcome: string; live: LiveBattleDto; active: string[] }>;
  goals: Record<number, { title: string; emoji: string; progress: number; target: number; done: boolean; manual: boolean; tier: string } | null>;
  season: { id: string; daysLeft: number; top: { memberId: number; ratio: number; points: number }[] };
  members: TvMember[];
  boss: { hp: number; damage: number; defeated: boolean; byMember: Record<number, number>; mvp: number | null; boss: { name: string; emoji: string; weak: readonly string[] } };
  record: Record<number, { points: number; workoutMinutes: number; warmup: boolean; studyMinutes: number; studyByKind: Record<string, number>; books: number; habits: { id: number; name: string; checked: boolean }[]; deeds: { kind: string; counted: boolean }[] }>;
  quests: { memberId: number; items: TvQuest[] }[];
  tasks?: Record<number, { done: number; total: number; waiting: number }>;   // «Мои задачи на день»: только у героев, у которых они есть
}
