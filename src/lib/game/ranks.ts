import { xpNeed } from './level';

/** Звания «Восхождение»: развитие как подъём в гору. Ни одно не совпадает с классами, подклассами и талантами. */
export interface Rank { level: number; name: string; emoji: string; text: string }

export const RANKS: Rank[] = [
  { level: 1, name: 'Подножие', emoji: '🌲', text: 'Путь начинается у подножия горы' },
  { level: 3, name: 'Тропа', emoji: '🥾', text: 'Первые шаги по горной тропе' },
  { level: 5, name: 'Перевал', emoji: '⛺', text: 'Лагерь на перевале' },
  { level: 8, name: 'Склон', emoji: '🧗', text: 'Подъём по крутому склону' },
  { level: 12, name: 'Утёс', emoji: '🦅', text: 'Высоко, где гнездятся орлы' },
  { level: 16, name: 'Хребет', emoji: '🏔', text: 'Идёшь по гребню хребта' },
  { level: 20, name: 'Ледник', emoji: '❄️', text: 'Вечные льды и снега' },
  { level: 25, name: 'Пик', emoji: '🗻', text: 'Покорён первый пик' },
  { level: 30, name: 'Вершина', emoji: '🚩', text: 'Флаг на главной вершине' },
  { level: 40, name: 'Над облаками', emoji: '☁️', text: 'Облака остались внизу' },
  { level: 50, name: 'Небожитель', emoji: '✨', text: 'Живёшь среди звёзд' },
  { level: 75, name: 'Покоритель неба', emoji: '🌌', text: 'Выше уже только небо' },
];

export interface RankInfo { index: number; rank: Rank; next: Rank | null; progress: number; xpToNext: number }

/** Текущее звание, следующее и прогресс к нему (по опыту, а без опыта — по уровню). */
export function rankFor(level: number, xp?: number): RankInfo {
  let index = 0;
  for (let i = 0; i < RANKS.length; i++) if (level >= RANKS[i].level) index = i;
  const rank = RANKS[index], next = RANKS[index + 1] ?? null;
  if (!next) return { index, rank, next, progress: 1, xpToNext: 0 };
  const from = xpNeed(rank.level), to = xpNeed(next.level);
  const cur = xp ?? xpNeed(level);
  return { index, rank, next, progress: Math.max(0, Math.min(1, (cur - from) / (to - from))), xpToNext: Math.max(0, to - cur) };
}
