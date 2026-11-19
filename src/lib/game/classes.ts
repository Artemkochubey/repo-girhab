export type Cls = 'w' | 'm' | 'b' | 'p';
export type Sphere = 'workout' | 'warmup' | 'Книги' | 'Языки' | 'Учёба' | 'Навыки' | 'Творчество' | 'Мышление' | 'habits' | 'book';

export const CLASS_NAMES: Record<Cls, string> = { w: '⚔️ Воин', m: '🔮 Маг', b: '🎵 Бард', p: '🛡 Паладин' };

/** Какие виды очков усиливает класс (+20%). */
export const CLASS_SPHERES: Record<Cls, Sphere[]> = {
  w: ['workout', 'warmup'],
  m: ['Учёба', 'Мышление', 'book', 'Книги'],
  b: ['Творчество', 'Навыки', 'Языки'],
  p: ['habits'],
};

export const SUBCLASS_NAMES: Record<Cls, Record<Exclude<Cls, never>, string>> = {
  w: { w: '', m: 'Боевой маг', b: 'Скальд', p: 'Рыцарь' },
  m: { w: 'Руноборец', m: '', b: 'Чародей', p: 'Жрец' },
  b: { w: 'Герольд', m: 'Сказитель', b: '', p: 'Знаменосец' },
  p: { w: 'Страж', m: 'Хранитель знаний', b: 'Светлый менестрель', p: '' },
};

export const MAIN_BONUS = 0.2;

/** Бонус второй сферы: с 5 ур. +10%, с 10 ур. +15%, с 20 ур. +20%. */
export function subBonus(level: number): number {
  if (level >= 20) return 0.2;
  if (level >= 10) return 0.15;
  if (level >= 5) return 0.1;
  return 0;
}

export const HOUR = 3_600_000;
export const CLASS_FREE_WINDOW_MS = 24 * HOUR;
export const CLASS_PAUSE_MS = 7 * 24 * HOUR;

/** Смена класса: свободно 24 ч после выбора, затем пауза 7 суток. */
export function canChangeClass(changedAtMs: number, nowMs: number): { ok: boolean; reason?: 'pause'; availableAtMs?: number } {
  const elapsed = nowMs - changedAtMs;
  if (elapsed <= CLASS_FREE_WINDOW_MS) return { ok: true };
  const availableAtMs = changedAtMs + CLASS_PAUSE_MS;
  return nowMs >= availableAtMs ? { ok: true } : { ok: false, reason: 'pause', availableAtMs };
}

/** Рекомендуемая вторая сфера — где больше всего очков (кроме основной). */
export function recommendSub(points: Record<Cls, number>, main: Cls | null): Cls | null {
  let best: Cls | null = null;
  for (const c of ['w', 'm', 'b', 'p'] as Cls[]) {
    if (c === main) continue;
    if (best === null || points[c] > points[best]) best = c;
  }
  return best && points[best] > 0 ? best : null;
}

/** Описание классов для экрана выбора. */
export const CLASS_INFO: Record<Cls, {
  sphere: string; bonus: string; pitch: string; examples: string; talents: string;
}> = {
  w: {
    sphere: 'Тело',
    bonus: '+20% очков за тренировки и зарядку',
    pitch: 'Для тех, кто любит движение и спорт: каждая минута тренировки стоит больше.',
    examples: 'Тренировки, зарядка, бег, турник, танцы, игры во дворе',
    talents: 'Таланты: сильнее тренировки и ежедневные бонусы за долгую тренировку (20 и 45 минут).',
  },
  m: {
    sphere: 'Ум',
    bonus: '+20% очков за учёбу, мышление и книги',
    pitch: 'Для тех, кто любит учиться, читать и решать головоломки.',
    examples: 'Школьные задания, чтение, шахматы, логические задачи',
    talents: 'Таланты: книги, языки, мышление, бонусы за долгую учёбу.',
  },
  b: {
    sphere: 'Творчество',
    bonus: '+20% очков за творчество, навыки и языки',
    pitch: 'Для тех, кто рисует, пишет, играет музыку и осваивает новое ремесло.',
    examples: 'Рисование, музыка, поделки, изучение языков, новые навыки',
    talents: 'Таланты: творчество, навыки, языки и бонус за разнообразие в день.',
  },
  p: {
    sphere: 'Дисциплина',
    bonus: '+20% очков за привычки',
    pitch: 'Для тех, кто держит режим: сон, зубы, уборка, порядок — и не сбивается.',
    examples: 'Привычки дня: режим, вода, уборка, чтение перед сном',
    talents: 'Таланты: привычки, серии дней и «щит серии», который прощает один пропуск в неделю.',
  },
};
