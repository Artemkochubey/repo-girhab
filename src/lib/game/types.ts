import type { Cls, Sphere } from './classes';

export type StudyKind = 'Книги' | 'Языки' | 'Учёба' | 'Навыки' | 'Творчество' | 'Мышление';

/** Сводка активности участника за один день. */
export interface DayStats {
  workoutMinutes: number;
  warmups: number;          // 0 или 1
  study: Partial<Record<StudyKind, number>>;
  habits: number;           // отмеченных привычек (до лимита считается в points)
  books: number;            // прочитано книг в этот день
  deeds: number;            // засчитанных добрых дел за день (см. game/deeds.ts)
  deedPoints: number;       // очки за них
  questXp: number;          // опыт подтверждённых квестов
}

export interface HeroBuild {
  cls: Cls | null;         // null — класс ещё не выбран
  sub: Cls | null;
  talents: string[];
  level: number;            // для бонуса подкласса
  aura?: number;            // семейная аура: +% ко всем очкам от талантов семьи
}

export const emptyDay = (): DayStats => ({
  workoutMinutes: 0, warmups: 0, study: {}, habits: 0, books: 0, deeds: 0, deedPoints: 0, questXp: 0,
});

export type { Cls, Sphere };
