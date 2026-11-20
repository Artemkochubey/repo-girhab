import type { QuestItem } from './quests';

/** Набор квестов: готовый шаблон на день, который родитель применяет одной кнопкой. */
export interface QuestSet { id: string; name: string; emoji: string; note: string; items: QuestItem[]; custom?: boolean }
export interface CustomQuestSet { id: string; name: string; emoji: string; items: QuestItem[] }

const q = (t: string, d: string, k: QuestItem['k'], xp: number, extra: Partial<QuestItem> = {}): QuestItem => ({ t, d, k, xp, ...extra });
const Q = {
  warmup: q('Утренняя зарядка', 'Сделай комплекс упражнений утром', 'warmup', 15),
  run: q('Размяться', 'Любая активность: бег, прыжки, турник', 'workout', 25, { m: 20 }),
  big: q('Большая тренировка', 'Полноценная тренировка без отвлечения на телефон', 'workout', 40, { m: 40 }),
  huge: q('Марафон силы', 'Длинная тренировка: разминка, силовые, растяжка', 'workout', 50, { m: 60 }),
  read: q('Страницы приключений', 'Читай книгу, не отвлекаясь', 'study', 20, { kind: 'Книги', m: 20 }),
  readShort: q('Чтение перед сном', 'Несколько страниц книги', 'study', 15, { kind: 'Книги', m: 15 }),
  words: q('Слова иного мира', 'Учи слова или занимайся иностранным языком', 'study', 20, { kind: 'Языки', m: 15 }),
  school: q('Урок мудрости', 'Школьные задания или любой учебный предмет', 'study', 25, { kind: 'Учёба', m: 30 }),
  schoolLong: q('Большой урок', 'Серьёзное занятие по учёбе без отвлечений', 'study', 35, { kind: 'Учёба', m: 45 }),
  art: q('Творческий порыв', 'Рисуй, пиши, лепи или играй музыку', 'study', 20, { kind: 'Творчество', m: 20 }),
  artLong: q('Мастерская', 'Большой творческий проект', 'study', 35, { kind: 'Творчество', m: 40 }),
  riddle: q('Загадка сфинкса', 'Шахматы, головоломки, логические задачи', 'study', 20, { kind: 'Мышление', m: 15 }),
  habits: q('Ритуал дня', 'Отмечай выполненные привычки в разделе «Ум»', 'habits', 20, { m: 3 }),
  habits2: q('Малый ритуал', 'Отметь хотя бы две привычки', 'habits', 10, { m: 2 }),
  deed: q('Доброе дело', 'Сделай доброе дело и отметь его кнопкой «Отметить»', 'deeds', 20, { m: 1 }),
  deeds2: q('Два добрых дела', 'Помоги дома и порадуй кого-нибудь', 'deeds', 30, { m: 2 }),
  home: q('Помочь по дому', 'Помоги родителям: уборка, посуда, порядок в комнате', 'manual', 20),
};

export const QUEST_SETS: QuestSet[] = [
  { id: 'weekday', name: 'Будний день', emoji: '🏫', note: 'Учёба, немного движения и привычки', items: [Q.school, Q.run, Q.habits, Q.home] },
  { id: 'weekend', name: 'Выходной', emoji: '🎉', note: 'Большая тренировка, чтение и творчество', items: [Q.big, Q.read, Q.art, Q.home] },
  { id: 'holiday', name: 'Каникулы', emoji: '🏖', note: 'Зарядка, чтение, языки, загадка и привычки', items: [Q.warmup, Q.read, Q.words, Q.riddle, Q.habits] },
  { id: 'sport', name: 'Спортивный день', emoji: '💪', note: 'Зарядка и длинная тренировка', items: [Q.warmup, Q.huge, Q.habits2] },
  { id: 'smart', name: 'Умный день', emoji: '🧠', note: 'Учёба, языки, головоломки и чтение', items: [Q.schoolLong, Q.words, Q.riddle, Q.read] },
  { id: 'art', name: 'Творческий день', emoji: '🎨', note: 'Большой творческий проект и чтение', items: [Q.artLong, Q.readShort, Q.riddle, Q.habits2] },
  { id: 'kind', name: 'Добрый день', emoji: '💛', note: 'Два добрых дела, немного учёбы и движения', items: [Q.deeds2, Q.readShort, Q.run, Q.habits2] },
  { id: 'easy', name: 'Лёгкий день', emoji: '🛋', note: 'Для усталости и болезни: минимум усилий', items: [Q.warmup, Q.readShort, Q.habits2] },
];

export const MAX_CUSTOM_SETS = 20;

/** Минуты тренировки и учёбы масштабируются по личной норме (60 — база), остальное без изменений. */
export function scaleQuests(items: QuestItem[], goal: number): QuestItem[] {
  const scale = goal / 60;
  return items.map((it) => ({
    ...it,
    done: false, pending: false,
    m: it.k === 'workout' || it.k === 'study' ? Math.max(5, Math.round(((it.m ?? 0) * scale) / 5) * 5) : it.m,
  }));
}

export const findSet = (id: string, custom: CustomQuestSet[]): { set: QuestSet; scaled: boolean } | null => {
  const b = QUEST_SETS.find((x) => x.id === id);
  if (b) return { set: b, scaled: true };
  const c = custom.find((x) => x.id === id);
  return c ? { set: { id: c.id, name: c.name, emoji: c.emoji, note: 'Свой набор', items: c.items, custom: true }, scaled: false } : null;
};
