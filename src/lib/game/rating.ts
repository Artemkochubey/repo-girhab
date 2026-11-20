import { DAY_RATIO_CAP, dayRatio, pickDayMvp } from './mvp';

/** Из чего складываются очки дня (для таблицы рейтинга). */
export type SourceId = 'workout' | 'walk' | 'warmup' | 'mind' | 'art' | 'books' | 'habits' | 'deeds' | 'quests' | 'bonus';
export const SOURCES: { id: SourceId; emoji: string; name: string; short: string; color: string }[] = [
  { id: 'workout', emoji: '🏃', name: 'Тренировка', short: 'Трен.', color: '#e8574a' },
  { id: 'walk', emoji: '🌳', name: 'Прогулка', short: 'Прог.', color: '#4cae6a' },
  { id: 'warmup', emoji: '🔥', name: 'Зарядка', short: 'Зар.', color: '#ff9f43' },
  { id: 'mind', emoji: '🧠', name: 'Учёба и мышление', short: 'Учёба', color: '#5f9dff' },
  { id: 'art', emoji: '🎨', name: 'Творчество', short: 'Твор.', color: '#ff7ac8' },
  { id: 'books', emoji: '📖', name: 'Книги', short: 'Книги', color: '#b46bff' },
  { id: 'habits', emoji: '✅', name: 'Привычки', short: 'Прив.', color: '#2ec4b6' },
  { id: 'deeds', emoji: '💛', name: 'Добрые дела', short: 'Добро', color: '#ffd24a' },
  { id: 'quests', emoji: '📜', name: 'Квесты', short: 'Квест', color: '#c9a24b' },
  { id: 'bonus', emoji: '⭐', name: 'Бонусы талантов', short: 'Бонус', color: '#9b8fc4' },
];
export const sourceById = (id: SourceId) => SOURCES.find((s) => s.id === id)!;

/** Какая сфера очков к какому источнику относится. */
const SPHERE_SOURCE: Record<string, SourceId> = {
  workout: 'workout', warmup: 'warmup', habits: 'habits', deeds: 'deeds', book: 'books', Книги: 'books', Творчество: 'art',
  Учёба: 'mind', Мышление: 'mind', Языки: 'mind', Навыки: 'mind',
};

export interface RatingInput {
  id: number; goal: number; superGoal: number;
  total: number;                       // очки дня целиком (с бонусами)
  bySphere: Partial<Record<string, number>>;
  questXp: number;                     // опыт квестов и семейных квестов за день
  walkShare: number;                   // доля прогулки в тренировочных очках (0..1)
}
export interface RatingPart { id: SourceId; points: number }
export interface RatingRow {
  id: number; place: number; points: number; goal: number; superGoal: number;
  percent: number;                     // очки / норма, в процентах (без потолка)
  ratio: number;                       // с потолком в DAY_RATIO_CAP норм: по нему считается место
  qualified: boolean;                  // норма выполнена
  mvp: boolean;
  parts: RatingPart[];                 // по убыванию, без нулей
  top: SourceId | null;
}

/** Разбивка очков героя за день по источникам. Сумма частей равна очкам дня с точностью до округления (остаток уходит в «бонусы»). */
export function partsOf(i: RatingInput): RatingPart[] {
  const acc = new Map<SourceId, number>();
  const add = (id: SourceId, v: number) => { if (v > 0) acc.set(id, (acc.get(id) ?? 0) + v); };
  for (const [sphere, v] of Object.entries(i.bySphere)) {
    const id = SPHERE_SOURCE[sphere];
    if (!id || !v) continue;
    if (id === 'workout') { const w = v * Math.min(1, Math.max(0, i.walkShare)); add('walk', w); add('workout', v - w); }
    else add(id, v);
  }
  const spheres = [...acc.values()].reduce((a, b) => a + b, 0);
  const quests = Math.max(0, i.questXp);
  add('quests', quests);
  const rest = i.total - spheres - quests;
  if (rest >= 0.5) add('bonus', rest);
  return [...acc.entries()].map(([id, v]) => ({ id, points: Math.round(v) })).filter((p) => p.points > 0).sort((a, b) => b.points - a.points);
}

/**
 * Рейтинг дня. Место определяется выполнением личной нормы (очки ÷ норма, не больше двух норм),
 * как в MVP дня: так у младшего и старшего равные шансы. При равенстве выше тот, у кого больше очков.
 * Одинаковый результат даёт одинаковое место.
 */
export function buildRating(inputs: RatingInput[]): RatingRow[] {
  const mvp = pickDayMvp(inputs.map((x) => ({ id: x.id, points: x.total, goal: x.goal })));
  const rows = inputs.map((x): RatingRow => {
    const parts = partsOf(x);
    const ratio = dayRatio(x.total, x.goal);
    return {
      id: x.id, place: 0, points: Math.round(x.total), goal: x.goal, superGoal: x.superGoal,
      percent: x.goal > 0 ? Math.round((x.total / x.goal) * 100) : 0, ratio, qualified: ratio >= 1, mvp: mvp?.id === x.id, parts, top: parts[0]?.id ?? null,
    };
  });
  rows.sort((a, b) => (Math.abs(b.ratio - a.ratio) > 1e-9 ? b.ratio - a.ratio : b.points - a.points) || a.id - b.id);
  rows.forEach((r, k) => {
    const p = rows[k - 1];
    r.place = p && Math.abs(p.ratio - r.ratio) <= 1e-9 && p.points === r.points ? p.place : k + 1;
  });
  return rows;
}

export { DAY_RATIO_CAP };
