export const MUSCLES = [
  { id: 'traps', name: 'Трапеции' },
  { id: 'shoulders', name: 'Дельты (плечи)' },
  { id: 'chest', name: 'Грудь' },
  { id: 'biceps', name: 'Бицепс' },
  { id: 'triceps', name: 'Трицепс' },
  { id: 'forearms', name: 'Предплечья' },
  { id: 'abs', name: 'Пресс' },
  { id: 'obliques', name: 'Косые мышцы живота' },
  { id: 'abductors', name: 'Отводящие мышцы бедра' },
  { id: 'lats', name: 'Широчайшие и верх спины' },
  { id: 'lower_back', name: 'Поясница' },
  { id: 'glutes', name: 'Ягодицы' },
  { id: 'adductors', name: 'Приводящие мышцы бедра' },
  { id: 'quads', name: 'Квадрицепс' },
  { id: 'hamstrings', name: 'Задняя поверхность бедра' },
  { id: 'calves', name: 'Икры и голень' },
] as const;

export type MuscleId = (typeof MUSCLES)[number]['id'];
export const MUSCLE_IDS = MUSCLES.map((m) => m.id) as MuscleId[];
export const muscleName = (id: string): string => MUSCLES.find((m) => m.id === id)?.name ?? id;
export const isMuscleId = (v: unknown): v is MuscleId => typeof v === 'string' && (MUSCLE_IDS as string[]).includes(v);

export type ExerciseCategory = 'Силовые' | 'Кардио' | 'Игры и спорт' | 'Растяжка';
/** Подсчёт «по повторам»: цена одного повтора, потолки засчёта и лимит за один подход. */
export interface RepSpec { pts: number; soft: number; hard: number; max: number }
/** Минутная тренировка с особой ценой: rate — очков за минуту (у обычных 1), dayCap — сколько минут в день засчитывается. */
export interface MinuteSpec { rate: number; dayCap: number }
export interface Exercise { id: string; name: string; emoji: string; cat: ExerciseCategory; w: Partial<Record<MuscleId, number>>; rep?: RepSpec; minute?: MinuteSpec }

/** Прогулка: спокойная нагрузка, поэтому очко за две минуты и не больше полутора часов в день. */
export const WALK = { id: 'stroll', rate: 0.5, dayCap: 90 } as const;

/** Вес — доля нагрузки на мышцу за минуту (0..1). Значения экспертные, округлённые. */
export const EXERCISES: Exercise[] = [
  { id: 'pushups', name: 'Отжимания', emoji: '💪', cat: 'Силовые', w: { chest: 1, triceps: 0.8, shoulders: 0.6, abs: 0.3 }, rep: { pts: 0.2, soft: 75, hard: 150, max: 100 } },
  { id: 'squats', name: 'Приседания', emoji: '🦵', cat: 'Силовые', w: { quads: 1, glutes: 0.8, hamstrings: 0.4, calves: 0.3, lower_back: 0.2 }, rep: { pts: 0.12, soft: 120, hard: 240, max: 150 } },
  { id: 'lunges', name: 'Выпады', emoji: '🚶', cat: 'Силовые', w: { quads: 0.9, glutes: 0.9, hamstrings: 0.5, calves: 0.3, adductors: 0.3 }, rep: { pts: 0.16, soft: 90, hard: 180, max: 100 } },
  { id: 'pullups', name: 'Подтягивания', emoji: '🧗', cat: 'Силовые', w: { lats: 1, biceps: 0.8, forearms: 0.5, shoulders: 0.4, traps: 0.4, abs: 0.2 }, rep: { pts: 0.5, soft: 30, hard: 60, max: 40 } },
  { id: 'plank', name: 'Планка', emoji: '🧘', cat: 'Силовые', w: { abs: 1, obliques: 0.6, shoulders: 0.4, lower_back: 0.4, glutes: 0.3 } },
  { id: 'crunches', name: 'Пресс (скручивания)', emoji: '🔥', cat: 'Силовые', w: { abs: 1, obliques: 0.5 }, rep: { pts: 0.1, soft: 150, hard: 300, max: 150 } },
  { id: 'bridge', name: 'Ягодичный мостик', emoji: '🍑', cat: 'Силовые', w: { glutes: 1, hamstrings: 0.6, lower_back: 0.4 }, rep: { pts: 0.12, soft: 120, hard: 240, max: 100 } },
  { id: 'curl', name: 'Гантели: бицепс', emoji: '🏋️', cat: 'Силовые', w: { biceps: 1, forearms: 0.5 }, rep: { pts: 0.16, soft: 90, hard: 180, max: 60 } },
  { id: 'press', name: 'Жим гантелей', emoji: '🏋️', cat: 'Силовые', w: { shoulders: 1, triceps: 0.7, chest: 0.5, traps: 0.3 }, rep: { pts: 0.16, soft: 90, hard: 180, max: 60 } },
  { id: 'dips', name: 'Брусья', emoji: '🤸', cat: 'Силовые', w: { triceps: 1, chest: 0.7, shoulders: 0.5 }, rep: { pts: 0.25, soft: 60, hard: 120, max: 60 } },
  { id: 'superman', name: 'Лодочка (спина)', emoji: '🛶', cat: 'Силовые', w: { lower_back: 1, glutes: 0.5, traps: 0.4, lats: 0.3 }, rep: { pts: 0.12, soft: 120, hard: 240, max: 100 } },
  { id: 'burpees', name: 'Берпи', emoji: '⚡', cat: 'Силовые', w: { quads: 0.6, chest: 0.5, shoulders: 0.5, abs: 0.5, triceps: 0.4, glutes: 0.4 }, rep: { pts: 0.25, soft: 60, hard: 120, max: 60 } },
  { id: 'calf_raise', name: 'Подъём на носки', emoji: '🦶', cat: 'Силовые', w: { calves: 1 }, rep: { pts: 0.07, soft: 200, hard: 400, max: 200 } },

  { id: 'running', name: 'Бег', emoji: '🏃', cat: 'Кардио', w: { calves: 0.8, quads: 0.7, hamstrings: 0.6, glutes: 0.5, abductors: 0.3, abs: 0.2 } },
  { id: 'stroll', name: 'Прогулка', emoji: '🌳', cat: 'Кардио', w: { calves: 0.3, quads: 0.25, glutes: 0.25, hamstrings: 0.2 }, minute: { rate: WALK.rate, dayCap: WALK.dayCap } },
  { id: 'walking', name: 'Быстрая ходьба', emoji: '🚶', cat: 'Кардио', w: { calves: 0.5, quads: 0.4, glutes: 0.4, hamstrings: 0.3 } },
  { id: 'jumprope', name: 'Скакалка', emoji: '🪢', cat: 'Кардио', w: { calves: 1, quads: 0.5, forearms: 0.4, shoulders: 0.3 } },
  { id: 'cycling', name: 'Велосипед', emoji: '🚴', cat: 'Кардио', w: { quads: 1, glutes: 0.6, hamstrings: 0.5, calves: 0.4 } },
  { id: 'swimming', name: 'Плавание', emoji: '🏊', cat: 'Кардио', w: { lats: 0.8, shoulders: 0.8, chest: 0.5, triceps: 0.5, abs: 0.4, quads: 0.3 } },
  { id: 'rowing', name: 'Гребля', emoji: '🚣', cat: 'Кардио', w: { lats: 1, biceps: 0.5, lower_back: 0.5, traps: 0.5, quads: 0.4, forearms: 0.4 } },
  { id: 'stairs', name: 'Лестница', emoji: '🪜', cat: 'Кардио', w: { quads: 0.8, glutes: 0.8, calves: 0.6 } },
  { id: 'rollers', name: 'Ролики / самокат', emoji: '🛼', cat: 'Кардио', w: { quads: 0.7, glutes: 0.6, adductors: 0.4, abductors: 0.4, calves: 0.4 } },

  { id: 'football', name: 'Футбол', emoji: '⚽', cat: 'Игры и спорт', w: { quads: 0.8, calves: 0.7, hamstrings: 0.6, glutes: 0.5, adductors: 0.4, abs: 0.3 } },
  { id: 'basketball', name: 'Баскетбол', emoji: '🏀', cat: 'Игры и спорт', w: { quads: 0.7, calves: 0.7, shoulders: 0.4, glutes: 0.4, forearms: 0.3 } },
  { id: 'volleyball', name: 'Волейбол', emoji: '🏐', cat: 'Игры и спорт', w: { shoulders: 0.6, quads: 0.5, calves: 0.5, forearms: 0.4, triceps: 0.3, abs: 0.3 } },
  { id: 'tennis', name: 'Теннис / бадминтон', emoji: '🎾', cat: 'Игры и спорт', w: { forearms: 0.6, shoulders: 0.6, obliques: 0.5, quads: 0.4, calves: 0.4 } },
  { id: 'martial', name: 'Единоборства', emoji: '🥋', cat: 'Игры и спорт', w: { shoulders: 0.6, obliques: 0.6, abs: 0.5, quads: 0.5, chest: 0.4, forearms: 0.4 } },
  { id: 'climbing', name: 'Скалолазание', emoji: '🧗', cat: 'Игры и спорт', w: { forearms: 1, lats: 0.9, biceps: 0.7, shoulders: 0.5, abs: 0.4, quads: 0.3 } },
  { id: 'dancing', name: 'Танцы', emoji: '💃', cat: 'Игры и спорт', w: { quads: 0.5, calves: 0.5, glutes: 0.5, abs: 0.4, obliques: 0.3, shoulders: 0.2 } },
  { id: 'skating', name: 'Коньки / лыжи', emoji: '⛸️', cat: 'Игры и спорт', w: { quads: 0.8, glutes: 0.7, adductors: 0.5, abductors: 0.5, calves: 0.4 } },
  { id: 'hockey', name: 'Хоккей', emoji: '🏒', cat: 'Игры и спорт', w: { quads: 0.9, glutes: 0.7, adductors: 0.6, abductors: 0.5, hamstrings: 0.5, calves: 0.5, abs: 0.5, obliques: 0.5, forearms: 0.5, shoulders: 0.4, lower_back: 0.3, triceps: 0.3, chest: 0.2 } },
  { id: 'games', name: 'Подвижные игры', emoji: '🤾', cat: 'Игры и спорт', w: { quads: 0.6, calves: 0.6, hamstrings: 0.4, glutes: 0.4 } },

  { id: 'stretching', name: 'Растяжка', emoji: '🤸', cat: 'Растяжка', w: { hamstrings: 0.5, quads: 0.4, lower_back: 0.4, adductors: 0.4, calves: 0.3, shoulders: 0.3 } },
  { id: 'yoga', name: 'Йога', emoji: '🧘', cat: 'Растяжка', w: { abs: 0.5, shoulders: 0.5, lower_back: 0.5, quads: 0.4, glutes: 0.4, hamstrings: 0.4, triceps: 0.3 } },
  { id: 'pilates', name: 'Пилатес', emoji: '🤍', cat: 'Растяжка', w: { abs: 1, obliques: 0.6, glutes: 0.5, lower_back: 0.5 } },
];

export const CATEGORIES: ExerciseCategory[] = ['Силовые', 'Кардио', 'Игры и спорт', 'Растяжка'];
export const exerciseById = (id: string | null | undefined) => EXERCISES.find((e) => e.id === id);
export const CUSTOM_EXERCISE = 'custom';

export interface WorkoutLike { date: string; minutes: number; eq?: number; exercise?: string | null; muscles?: string[] | null }

/** Веса мышц для записи: из каталога, либо поровну по выбранным мышцам для «своей» тренировки. */
export function entryWeights(e: Pick<WorkoutLike, 'exercise' | 'muscles'>): Partial<Record<MuscleId, number>> {
  const ex = exerciseById(e.exercise);
  if (ex) return ex.w;
  if (e.exercise === CUSTOM_EXERCISE && e.muscles?.length) {
    const w: Partial<Record<MuscleId, number>> = {};
    for (const m of e.muscles) if (isMuscleId(m)) w[m] = 1;
    return w;
  }
  return {};
}

/** Нагрузка на мышцы (взвешенные минуты) за период [from, to] включительно. */
export function muscleLoads(entries: WorkoutLike[], from: string, to: string): Record<MuscleId, number> {
  const out = Object.fromEntries(MUSCLE_IDS.map((m) => [m, 0])) as Record<MuscleId, number>;
  for (const e of entries) {
    if (e.date < from || e.date > to) continue;
    for (const [m, w] of Object.entries(entryWeights(e))) out[m as MuscleId] += (e.eq ?? e.minutes) * (w ?? 0);
  }
  return out;
}

/**
 * Интенсивность 0..1 для раскраски. Относительно самой нагруженной мышцы, но со «стартовой планкой»
 * (floor), чтобы одна короткая тренировка не красила всё в насыщенный красный.
 */
export function muscleIntensity(loads: Record<MuscleId, number>, floor: number): Record<MuscleId, number> {
  const max = Math.max(floor, ...Object.values(loads));
  return Object.fromEntries(MUSCLE_IDS.map((m) => [m, loads[m] > 0 ? Math.min(1, Math.pow(loads[m] / max, 0.85)) : 0])) as Record<MuscleId, number>;
}

/** Планка для расчёта интенсивности: ~10 взвешенных минут в день периода. */
export const intensityFloor = (days: number) => 10 * days;
