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
export function recommendSub(points: Record<Cls, number>, main: Cls): Cls | null {
  let best: Cls | null = null;
  for (const c of ['w', 'm', 'b', 'p'] as Cls[]) {
    if (c === main) continue;
    if (best === null || points[c] > points[best]) best = c;
  }
  return best && points[best] > 0 ? best : null;
}
