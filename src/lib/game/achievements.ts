import { levelFromXp } from './level';

export type Metric = 'dayMvps' | 'streak' | 'books' | 'workoutDays' | 'warmups' | 'study' | 'habits' | 'level' | 'questDays' | 'chests' | 'bossWins' | 'mvp' | 'bigDays' | 'seasonWins';

export interface AchievementDef { id: string; group: string; name: string; emoji: string; text: string; metric: Metric; target: number }

/** Минимум «минут-эквивалента» за день, чтобы он считался тренировочным. */
export const WORKOUT_DAY_MIN = 15;
/** «Рекордный день»: очки дня не меньше 1,5 супер-нормы. */
export const BIG_DAY_FACTOR = 1.5;

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'streak7', group: 'Серии', name: 'Неделя огня', emoji: '🔥', text: '7 дней подряд с активностью', metric: 'streak', target: 7 },
  { id: 'streak30', group: 'Серии', name: 'Месяц упорства', emoji: '🌋', text: '30 дней подряд', metric: 'streak', target: 30 },
  { id: 'streak100', group: 'Серии', name: 'Сотня непобедимых', emoji: '💯', text: '100 дней подряд', metric: 'streak', target: 100 },
  { id: 'book1', group: 'Книги', name: 'Первая книга', emoji: '📖', text: 'Прочитать первую книгу', metric: 'books', target: 1 },
  { id: 'book5', group: 'Книги', name: 'Читатель', emoji: '📚', text: 'Прочитать 5 книг', metric: 'books', target: 5 },
  { id: 'book20', group: 'Книги', name: 'Книголюб', emoji: '🏛', text: 'Прочитать 20 книг', metric: 'books', target: 20 },
  { id: 'work10', group: 'Тренировки', name: '10 тренировок', emoji: '💪', text: '10 дней с тренировкой от 15 минут', metric: 'workoutDays', target: 10 },
  { id: 'work30', group: 'Тренировки', name: '30 тренировок', emoji: '🏋️', text: '30 тренировочных дней', metric: 'workoutDays', target: 30 },
  { id: 'work100', group: 'Тренировки', name: 'Сотня тренировок', emoji: '🥇', text: '100 тренировочных дней', metric: 'workoutDays', target: 100 },
  { id: 'warm30', group: 'Зарядка', name: 'Бодрое утро', emoji: '🌅', text: '30 зарядок', metric: 'warmups', target: 30 },
  { id: 'warm100', group: 'Зарядка', name: 'Утро чемпиона', emoji: '☀️', text: '100 зарядок', metric: 'warmups', target: 100 },
  { id: 'study10', group: 'Учёба', name: '10 часов учёбы', emoji: '🎓', text: '600 минут учёбы', metric: 'study', target: 600 },
  { id: 'study50', group: 'Учёба', name: '50 часов учёбы', emoji: '🧠', text: '3000 минут учёбы', metric: 'study', target: 3000 },
  { id: 'hab100', group: 'Привычки', name: 'Привычка — сила', emoji: '✅', text: '100 отмеченных привычек', metric: 'habits', target: 100 },
  { id: 'hab500', group: 'Привычки', name: 'Железный режим', emoji: '🛡', text: '500 отмеченных привычек', metric: 'habits', target: 500 },
  { id: 'lvl5', group: 'Уровни', name: 'Уровень 5', emoji: '⭐', text: 'Достичь 5 уровня', metric: 'level', target: 5 },
  { id: 'lvl10', group: 'Уровни', name: 'Уровень 10', emoji: '🌟', text: 'Достичь 10 уровня', metric: 'level', target: 10 },
  { id: 'lvl15', group: 'Уровни', name: 'Уровень 15', emoji: '💫', text: 'Достичь 15 уровня', metric: 'level', target: 15 },
  { id: 'lvl20', group: 'Уровни', name: 'Уровень 20', emoji: '👑', text: 'Достичь 20 уровня', metric: 'level', target: 20 },
  { id: 'quest10', group: 'Квесты', name: 'Мастер квестов', emoji: '⚔️', text: '10 дней со всеми выполненными квестами', metric: 'questDays', target: 10 },
  { id: 'quest50', group: 'Квесты', name: 'Легенда квестов', emoji: '🗡', text: '50 дней со всеми квестами', metric: 'questDays', target: 50 },
  { id: 'chest10', group: 'Сундуки', name: 'Кладоискатель', emoji: '🎁', text: 'Открыть 10 сундуков', metric: 'chests', target: 10 },
  { id: 'boss1', group: 'Боссы', name: 'Охотник на боссов', emoji: '🐉', text: 'Победить босса вместе с семьёй', metric: 'bossWins', target: 1 },
  { id: 'boss5', group: 'Боссы', name: 'Гроза чудовищ', emoji: '☠️', text: 'Победить 5 боссов', metric: 'bossWins', target: 5 },
  { id: 'mvp1', group: 'Боссы', name: 'MVP недели', emoji: '🏆', text: 'Нанести больше всех урона боссу', metric: 'mvp', target: 1 },
  { id: 'mvpd1', group: 'Боссы', name: 'MVP дня', emoji: '🥇', text: 'Стать лучшим за день в семье', metric: 'dayMvps', target: 1 },
  { id: 'mvpd10', group: 'Боссы', name: 'Звезда семьи', emoji: '🌠', text: '10 раз стать MVP дня', metric: 'dayMvps', target: 10 },
  { id: 'seas1', group: 'Сезоны', name: 'Чемпион сезона', emoji: '🏅', text: 'Выиграть месячный сезон семьи', metric: 'seasonWins', target: 1 },
  { id: 'seas3', group: 'Сезоны', name: 'Легенда сезонов', emoji: '👑', text: 'Выиграть 3 сезона', metric: 'seasonWins', target: 3 },
  { id: 'big1', group: 'Рекорды', name: 'Рекордный день', emoji: '⚡', text: 'Набрать за день 1,5 супер-нормы', metric: 'bigDays', target: 1 },
  { id: 'big10', group: 'Рекорды', name: 'Машина', emoji: '🚀', text: '10 рекордных дней', metric: 'bigDays', target: 10 },
];

export interface AchievementInput {
  dates: string[];                       // по возрастанию, до сегодняшнего дня
  streak: number[];                      // длина серии на конец каждого дня
  books: number[]; warmups: number[]; habits: number[]; study: number[]; workoutEq: number[];
  points: number[];                      // очки за день (с бонусами)
  questsAllDone: boolean[];
  superGoal: number;
  chestDates: string[];
  bossWinDates: string[];
  mvpDates: string[];
  dayMvpDates: string[];
  seasonWinDates?: string[];
}

export interface AchievementState extends AchievementDef { value: number; earnedOn: string | null }

const cumulative = (xs: number[]) => { let s = 0; return xs.map((x) => (s += x)); };
const cumulativeBy = (dates: string[], events: string[]) => dates.map((d) => events.filter((e) => e <= d).length);

/** Достижения выводятся из истории (как опыт), поэтому ничего не хранится и пересчитывается само. */
export function computeAchievements(i: AchievementInput): AchievementState[] {
  let maxStreak = 0;
  const series: Record<Metric, number[]> = {
    streak: i.streak.map((s) => (maxStreak = Math.max(maxStreak, s))),
    books: cumulative(i.books),
    workoutDays: cumulative(i.workoutEq.map((m) => (m >= WORKOUT_DAY_MIN ? 1 : 0))),
    warmups: cumulative(i.warmups),
    study: cumulative(i.study),
    habits: cumulative(i.habits),
    level: cumulative(i.points).map((xp) => levelFromXp(xp)),
    questDays: cumulative(i.questsAllDone.map((x) => (x ? 1 : 0))),
    chests: cumulativeBy(i.dates, i.chestDates),
    bossWins: cumulativeBy(i.dates, i.bossWinDates),
    mvp: cumulativeBy(i.dates, i.mvpDates),
    dayMvps: cumulativeBy(i.dates, i.dayMvpDates),
    seasonWins: cumulativeBy(i.dates, i.seasonWinDates ?? []),
    bigDays: cumulative(i.points.map((p) => (p >= i.superGoal * BIG_DAY_FACTOR ? 1 : 0))),
  };
  return ACHIEVEMENTS.map((a) => {
    const s = series[a.metric];
    const idx = s.findIndex((v) => v >= a.target);
    return { ...a, value: s.length ? s[s.length - 1] : 0, earnedOn: idx >= 0 ? i.dates[idx] : null };
  });
}
