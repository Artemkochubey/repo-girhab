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
  exists?: boolean;                    // герой уже был в игре в этот день (иначе день не считается), по умолчанию да
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
  exists: boolean;
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
      percent: x.goal > 0 ? Math.round((x.total / x.goal) * 100) : 0, ratio, qualified: ratio >= 1, mvp: mvp?.id === x.id, parts, top: parts[0]?.id ?? null, exists: x.exists !== false,
    };
  });
  rows.sort((a, b) => (Math.abs(b.ratio - a.ratio) > 1e-9 ? b.ratio - a.ratio : b.points - a.points) || a.id - b.id);
  rows.forEach((r, k) => {
    const p = rows[k - 1];
    r.place = p && Math.abs(p.ratio - r.ratio) <= 1e-9 && p.points === r.points ? p.place : k + 1;
  });
  return rows;
}

export interface WeekDay { date: string; rows: RatingRow[] }
export interface WeekRow {
  id: number; place: number; points: number;
  percent: number;                     // средняя за посчитанные дни доля нормы (каждый день не больше DAY_RATIO_CAP норм), в процентах
  ratio: number;                       // то же как число для сравнения
  normDays: number; days: number;      // дней с выполненной нормой из посчитанных
  best: { date: string; points: number } | null;
  parts: RatingPart[]; top: SourceId | null;
  mvpDays: number;                     // сколько дней недели был MVP дня
  daily: { date: string; points: number; percent: number; place: number; qualified: boolean; mvp: boolean; counted: boolean }[];
}

/**
 * Рейтинг недели из рейтингов дней. Место: средняя доля нормы за посчитанные дни (по каждому дню не больше двух норм),
 * при равенстве больше очков, затем меньший номер. Дни до появления героя в игре и будущие дни не считаются.
 */
export function buildWeekRating(days: WeekDay[]): WeekRow[] {
  const ids = [...new Set(days.flatMap((d) => d.rows.map((r) => r.id)))];
  const rows = ids.map((id): WeekRow => {
    const per = days.map((d) => ({ date: d.date, r: d.rows.find((x) => x.id === id) }));
    const counted = per.filter((x) => x.r?.exists);
    const sum = new Map<SourceId, number>();
    for (const x of counted) for (const p of x.r!.parts) sum.set(p.id, (sum.get(p.id) ?? 0) + p.points);
    const parts = [...sum.entries()].map(([pid, points]) => ({ id: pid, points })).filter((p) => p.points > 0).sort((a, b) => b.points - a.points);
    const points = counted.reduce((a, x) => a + x.r!.points, 0);
    const ratio = counted.length ? counted.reduce((a, x) => a + x.r!.ratio, 0) / counted.length : 0;
    const bestDay = counted.reduce<{ date: string; points: number } | null>((b, x) => (x.r!.points > (b?.points ?? 0) ? { date: x.date, points: x.r!.points } : b), null);
    return {
      id, place: 0, points, percent: Math.round(ratio * 100), ratio,
      normDays: counted.filter((x) => x.r!.qualified).length, days: counted.length, best: bestDay, parts, top: parts[0]?.id ?? null,
      mvpDays: counted.filter((x) => x.r!.mvp).length,
      daily: per.map((x) => ({ date: x.date, points: x.r?.points ?? 0, percent: x.r?.percent ?? 0, place: x.r?.place ?? 0, qualified: !!x.r?.qualified, mvp: !!x.r?.mvp, counted: !!x.r?.exists })),
    };
  });
  rows.sort((a, b) => (Math.abs(b.ratio - a.ratio) > 1e-9 ? b.ratio - a.ratio : b.points - a.points) || a.id - b.id);
  rows.forEach((r, k) => { const p = rows[k - 1]; r.place = p && Math.abs(p.ratio - r.ratio) <= 1e-9 && p.points === r.points ? p.place : k + 1; });
  return rows;
}

export { DAY_RATIO_CAP };
