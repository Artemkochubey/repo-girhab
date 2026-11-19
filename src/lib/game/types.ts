import type { Cls, Sphere } from './classes';

export type StudyKind = 'Книги' | 'Языки' | 'Учёба' | 'Навыки' | 'Творчество' | 'Мышление';

/** Сводка активности участника за один день. */
export interface DayStats {
  workoutMinutes: number;
  warmups: number;          // 0 или 1
  study: Partial<Record<StudyKind, number>>;
  habits: number;           // отмеченных привычек (до лимита считается в points)
  books: number;            // прочитано книг в этот день
  questXp: number;          // опыт подтверждённых квестов
}

export interface HeroBuild {
  cls: Cls;
  sub: Cls | null;
  talents: string[];
  level: number;            // для бонуса подкласса
}

export const emptyDay = (): DayStats => ({
  workoutMinutes: 0, warmups: 0, study: {}, habits: 0, books: 0, questXp: 0,
});

export type { Cls, Sphere };
