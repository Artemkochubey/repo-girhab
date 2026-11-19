import type { Cls, DayStats, Sphere, StudyKind } from './types';

/**
 * Таланты. У каждого класса три направления: ярус 1, затем развилка на две подветки (ярусы 2–3, выбрать можно только одну),
 * затем ярус 4 для обеих подветок. Над ними «Вершина» (ярус 5, 3 очка за ранг, нужно 8 очков в одном направлении).
 * Плюс общая ветка «Семья» для всех классов. Талант открывается на своём уровне и качается до 3 рангов с небольшим бонусом.
 * Ярус N направления требует (N−1)·2 очков в этом направлении. Таланты чужих классов не действуют, очки за них возвращаются.
 * Ранг = сколько раз id встречается в списке hero.talents.
 */
/** Группа талантов: класс или общая семейная ветка. */
export type Group = Cls | 'f';

/** Направления класса (0–2) плюс «Вершина» (3). */
export const DIRECTIONS: Record<Cls, { name: string; note: string }[]> = {
  w: [{ name: '💪 Сила', note: 'Тренировки: дни или множители' }, { name: '🌅 Закалка', note: 'Зарядка, выходные и перевыполнение нормы' }, { name: '🎯 Охота', note: 'Урон по боссу или по слабому месту' }],
  m: [{ name: '📚 Знание', note: 'Книги или мышление и учёба' }, { name: '🧠 Усердие', note: 'Глубина или разнообразие учёбы' }, { name: '💎 Сокровища', note: 'Шанс редких или легендарных наград' }],
  b: [{ name: '🎨 Муза', note: 'Творчество и навыки или творческие дни' }, { name: '✨ Вдохновение', note: 'Праздничные дни или многогранность' }, { name: '🍀 Фортуна', note: 'Шанс редких или легендарных наград' }],
  p: [{ name: '📅 Режим', note: 'Привычки: дни или множители' }, { name: '🔥 Серии', note: 'Щит серии или рекорды серий' }, { name: '🛡 Опора', note: 'Ко всем очкам или урон по боссу' }],
};
export const PEAK_DIR = 3;
export const PEAK_NAME = '⛰ Вершина';
export const FAMILY_NAME = '🏰 Семья';
export const FAMILY_NOTE = 'Общая ветка для всех классов: бонусы работают на всю семью';
export const MAX_RANK = 3;
/** Сколько очков в направлении нужно для яруса (ярус 1 — без условий). */
export const tierNeed = (tier: number): number => (tier >= 5 ? 0 : (tier - 1) * 2);
/** Вершина требует столько очков в любом одном направлении. */
export const PEAK_NEED = 8;
export const PEAK_LEVEL = 15;

type Effect =
  | { type: 'mult'; spheres: Sphere[]; pct: number }
  | { type: 'all'; pct: number }
  | { type: 'boss'; pct: number }
  | { type: 'weak'; pct: number }
  | { type: 'luck'; legend?: number; rare?: number }
  | { type: 'flat'; when: (d: DayStats) => boolean; bonus: number }
  | { type: 'streak'; perDay: number; max: number }
  | { type: 'shield' }
  | { type: 'weekend'; pct: number }            // +% очков в субботу и воскресенье
  | { type: 'over'; bonus: number }             // +очки, если набрана супер-норма
  | { type: 'milestone'; bonus: number; days: number[] } // +очки в день серии 7/14/30
  | { type: 'streakAll'; min: number; pct: number }      // +% очков при серии от min дней
  | { type: 'quest'; pct: number }              // +% к опыту квестов
  | { type: 'shop'; pct: number }               // скидка на награды за очки
  | { type: 'double'; pct: number }             // шанс второго приза из сундука
  | { type: 'aura'; pct: number };              // +% очков всем в семье

/**
 * effect — бонус одного ранга; в расчётах умножается на ранг.
 * branch: 'a' | 'b' — подветка после развилки (яруса 2–3). Выбрав одну, вторую в этом направлении взять нельзя.
 */
export interface Talent {
  id: string; cls: Group; dir: number; tier: 1 | 2 | 3 | 4 | 5; branch?: 'a' | 'b';
  unlock: number; maxRank: number; cost: number; name: string; text: string; effect: Effect;
}

const studyTotal = (d: DayStats) => Object.values(d.study).reduce((a, b) => a + (b ?? 0), 0);
const kinds = (d: DayStats) => Object.values(d.study).filter((m) => (m ?? 0) > 0).length;
const sum = (d: DayStats, ks: StudyKind[]) => ks.reduce((a, k) => a + (d.study[k] ?? 0), 0);
const active = (d: DayStats) => d.workoutMinutes + studyTotal(d);

/** id: «<класс><направление a–c><ярус>[a|b|c]», вершина «<класс>5», семья «f…». */
const T = (id: string, name: string, text: string, unlock: number, effect: Effect, o: { maxRank?: number; cost?: number } = {}): Talent => {
  const cls = id[0] as Group;
  const peak = id[1] === '5';
  const dir = peak ? PEAK_DIR : 'abc'.indexOf(id[1]);
  const tier = (peak ? 5 : Number(id[2])) as Talent['tier'];
  const br = peak ? '' : id.slice(3);
  return { id, cls, dir, tier, branch: br === 'a' || br === 'b' ? br : undefined, unlock, maxRank: o.maxRank ?? MAX_RANK, cost: o.cost ?? 1, name, text, effect };
};
const PEAK = { cost: 3 };

export const TALENTS: Talent[] = [
  // ⚔️ Воин
  T('wa1', 'Бегун', 'Тренировки +4%', 2, { type: 'mult', spheres: ['workout'], pct: 0.04 }),
  T('wa2a', 'Выносливость', '+2/день за 20+ мин тренировки', 5, { type: 'flat', when: (d) => d.workoutMinutes >= 20, bonus: 2 }),
  T('wa3a', 'Неутомимый', '+3/день за 45+ мин тренировки', 8, { type: 'flat', when: (d) => d.workoutMinutes >= 45, bonus: 3 }),
  T('wa2b', 'Стальные мышцы', 'Тренировки +5%', 5, { type: 'mult', spheres: ['workout'], pct: 0.05 }),
  T('wa3b', 'Силач', 'Тренировки +5%', 8, { type: 'mult', spheres: ['workout'], pct: 0.05 }),
  T('wa4c', 'Чемпион', 'Все очки +2%', 11, { type: 'all', pct: 0.02 }),
  T('wb1', 'Разминка', 'Зарядка +15%', 3, { type: 'mult', spheres: ['warmup'], pct: 0.15 }),
  T('wb2a', 'Второе дыхание', '+2/день за зарядку и тренировку', 6, { type: 'flat', when: (d) => d.warmups > 0 && d.workoutMinutes > 0, bonus: 2 }),
  T('wb3a', 'Мастер дня', '+3/день за 60+ мин тренировки и учёбы', 9, { type: 'flat', when: (d) => active(d) >= 60, bonus: 3 }),
  T('wb2b', 'Выходной герой', 'Очки в субботу и воскресенье +4%', 6, { type: 'weekend', pct: 0.04 }),
  T('wb3b', 'Перевыполнение', '+3/день при супер-норме', 9, { type: 'over', bonus: 3 }),
  T('wb4c', 'Живая легенда', '+4/день за 90+ мин тренировки и учёбы', 12, { type: 'flat', when: (d) => active(d) >= 90, bonus: 4 }),
  T('wc1', 'Меткий удар', '+2% урона по боссу', 4, { type: 'boss', pct: 0.02 }),
  T('wc2a', 'Тяжёлая рука', '+2% урона по боссу', 7, { type: 'boss', pct: 0.02 }),
  T('wc3a', 'Сокрушитель', '+3% урона по боссу', 10, { type: 'boss', pct: 0.03 }),
  T('wc2b', 'Охотник за слабостью', '+4% по слабому месту босса', 7, { type: 'weak', pct: 0.04 }),
  T('wc3b', 'Добивающий удар', '+5% по слабому месту босса', 10, { type: 'weak', pct: 0.05 }),
  T('wc4c', 'Убийца титанов', '+3% урона по боссу', 13, { type: 'boss', pct: 0.03 }),
  T('w5', 'Титан', '+6/день за 60+ мин тренировки', PEAK_LEVEL, { type: 'flat', when: (d) => d.workoutMinutes >= 60, bonus: 6 }, PEAK),

  // 🔮 Маг
  T('ma1', 'Книжный червь', 'Книги и чтение +5%', 2, { type: 'mult', spheres: ['book', 'Книги'], pct: 0.05 }),
  T('ma2a', 'Библиотекарь', 'Книги и чтение +6%', 5, { type: 'mult', spheres: ['book', 'Книги'], pct: 0.06 }),
  T('ma3a', 'Архивариус', '+3/день, если прочитана книга', 8, { type: 'flat', when: (d) => d.books >= 1, bonus: 3 }),
  T('ma2b', 'Мыслитель', 'Мышление +4%', 5, { type: 'mult', spheres: ['Мышление'], pct: 0.04 }),
  T('ma3b', 'Зубрилка', 'Учёба +4%', 8, { type: 'mult', spheres: ['Учёба'], pct: 0.04 }),
  T('ma4c', 'Мудрец', 'Все очки +2%', 11, { type: 'all', pct: 0.02 }),
  T('mb1', 'Полиглот', 'Языки +5%', 3, { type: 'mult', spheres: ['Языки'], pct: 0.05 }),
  T('mb2a', 'Эрудит', '+2/день за 20+ мин любой учёбы', 6, { type: 'flat', when: (d) => studyTotal(d) >= 20, bonus: 2 }),
  T('mb3a', 'Просветлённый', '+3/день за 45+ мин любой учёбы', 9, { type: 'flat', when: (d) => studyTotal(d) >= 45, bonus: 3 }),
  T('mb2b', 'Всезнайка', '+2/день при 2+ видах учёбы', 6, { type: 'flat', when: (d) => kinds(d) >= 2, bonus: 2 }),
  T('mb3b', 'Магистр', '+3/день при 3+ видах учёбы', 9, { type: 'flat', when: (d) => kinds(d) >= 3, bonus: 3 }),
  T('mb4c', 'Академик', '+4/день за 90+ мин учёбы', 12, { type: 'flat', when: (d) => studyTotal(d) >= 90, bonus: 4 }),
  T('mc1', 'Везунчик', 'Редкий сундук: шанс +2%', 4, { type: 'luck', rare: 0.02 }),
  T('mc2a', 'Кладоискатель', 'Редкий сундук: шанс +3%', 7, { type: 'luck', rare: 0.03 }),
  T('mc3a', 'Счастливая жила', 'Редкий сундук: шанс +3%', 10, { type: 'luck', rare: 0.03 }),
  T('mc2b', 'Золотая жила', 'Легендарный сундук: шанс +1%', 7, { type: 'luck', legend: 0.01 }),
  T('mc3b', 'Король сокровищ', 'Легендарный сундук: шанс +1,5%', 10, { type: 'luck', legend: 0.015 }),
  T('mc4c', 'Мудрая добыча', 'Легендарный сундук: шанс +2%', 13, { type: 'luck', legend: 0.02 }),
  T('m5', 'Архимаг', '+6/день за 60+ мин учёбы', PEAK_LEVEL, { type: 'flat', when: (d) => studyTotal(d) >= 60, bonus: 6 }, PEAK),

  // 🎵 Бард
  T('ba1', 'Муза', 'Творчество +5%', 2, { type: 'mult', spheres: ['Творчество'], pct: 0.05 }),
  T('ba2a', 'Ремесленник', 'Навыки +4%', 5, { type: 'mult', spheres: ['Навыки'], pct: 0.04 }),
  T('ba3a', 'Говорун', 'Языки +4%', 8, { type: 'mult', spheres: ['Языки'], pct: 0.04 }),
  T('ba2b', 'Вдохновение', '+2/день за 20+ мин творчества', 5, { type: 'flat', when: (d) => (d.study['Творчество'] ?? 0) >= 20, bonus: 2 }),
  T('ba3b', 'Мастерская', '+3/день за 45+ мин творчества, навыков и языков', 8, { type: 'flat', when: (d) => sum(d, ['Творчество', 'Навыки', 'Языки']) >= 45, bonus: 3 }),
  T('ba4c', 'Маэстро', 'Все очки +2%', 11, { type: 'all', pct: 0.02 }),
  T('bb1', 'Разносторонний', '+2/день при 3+ видах учёбы', 3, { type: 'flat', when: (d) => kinds(d) >= 3, bonus: 2 }),
  T('bb2a', 'Выходной артист', 'Очки в субботу и воскресенье +4%', 6, { type: 'weekend', pct: 0.04 }),
  T('bb3a', 'Праздник', '+3/день при супер-норме', 9, { type: 'over', bonus: 3 }),
  T('bb2b', 'Виртуоз', '+3/день при 4+ видах учёбы', 6, { type: 'flat', when: (d) => kinds(d) >= 4, bonus: 3 }),
  T('bb3b', 'Золотая середина', '+4/день за 60+ мин творчества, навыков и языков', 9, { type: 'flat', when: (d) => sum(d, ['Творчество', 'Навыки', 'Языки']) >= 60, bonus: 4 }),
  T('bb4c', 'Звезда сцены', 'Все очки +2%', 12, { type: 'all', pct: 0.02 }),
  T('bc1', 'Счастливая нота', 'Редкий сундук: шанс +2%', 4, { type: 'luck', rare: 0.02 }),
  T('bc2a', 'Ярмарка', 'Редкий сундук: шанс +3%', 7, { type: 'luck', rare: 0.03 }),
  T('bc3a', 'Весёлый базар', 'Редкий сундук: шанс +3%', 10, { type: 'luck', rare: 0.03 }),
  T('bc2b', 'Удачный дубль', 'Легендарный сундук: шанс +1%', 7, { type: 'luck', legend: 0.01 }),
  T('bc3b', 'Громкий хит', 'Легендарный сундук: шанс +1,5%', 10, { type: 'luck', legend: 0.015 }),
  T('bc4c', 'Бенефис', 'Легендарный сундук: шанс +2%', 13, { type: 'luck', legend: 0.02 }),
  T('b5', 'Овации', '+6/день за 60+ мин творчества, навыков и языков', PEAK_LEVEL, { type: 'flat', when: (d) => sum(d, ['Творчество', 'Навыки', 'Языки']) >= 60, bonus: 6 }, PEAK),

  // 🛡 Паладин
  T('pa1', 'Режим дня', 'Привычки +6%', 2, { type: 'mult', spheres: ['habits'], pct: 0.06 }),
  T('pa2a', 'Первый шаг', '+2/день, если есть хоть 1 привычка', 5, { type: 'flat', when: (d) => d.habits >= 1, bonus: 2 }),
  T('pa3a', 'Железная воля', '+3/день при 4+ привычках', 8, { type: 'flat', when: (d) => d.habits >= 4, bonus: 3 }),
  T('pa2b', 'Привычка героя', 'Привычки +6%', 5, { type: 'mult', spheres: ['habits'], pct: 0.06 }),
  T('pa3b', 'Дисциплина', 'Все очки +2%', 8, { type: 'all', pct: 0.02 }),
  T('pa4c', 'Столп', '+4/день при 6 привычках', 11, { type: 'flat', when: (d) => d.habits >= 6, bonus: 4 }),
  T('pb1', 'Серийник', '+0,5 за день серии, максимум +3', 3, { type: 'streak', perDay: 0.5, max: 3 }),
  T('pb2a', 'Закалка воли', 'Все очки +2%', 6, { type: 'all', pct: 0.02 }),
  T('pb3a', 'Щит серии', 'Один пропуск в неделю не обрывает серию', 9, { type: 'shield' }, { maxRank: 1 }),
  T('pb2b', 'Марафонец', '+5 в 7-й, 14-й и 30-й день серии', 6, { type: 'milestone', bonus: 5, days: [7, 14, 30] }),
  T('pb3b', 'Несокрушимый', '+1 за день серии, максимум +5', 9, { type: 'streak', perDay: 1, max: 5 }),
  T('pb4c', 'Непрерывность', 'Все очки +3% при серии от 14 дней', 12, { type: 'streakAll', min: 14, pct: 0.03 }),
  T('pc1', 'Страж', '+2% урона по боссу', 4, { type: 'boss', pct: 0.02 }),
  T('pc2a', 'Оплот', 'Все очки +2%', 7, { type: 'all', pct: 0.02 }),
  T('pc3a', 'Бастион', 'Все очки +2%', 10, { type: 'all', pct: 0.02 }),
  T('pc2b', 'Защитник семьи', '+4% по слабому месту босса', 7, { type: 'weak', pct: 0.04 }),
  T('pc3b', 'Щит команды', '+3% урона по боссу', 10, { type: 'boss', pct: 0.03 }),
  T('pc4c', 'Легенда стражей', 'Все очки +3%', 13, { type: 'all', pct: 0.03 }),
  T('p5', 'Хранитель вечности', 'Все очки +3% при серии от 30 дней', PEAK_LEVEL, { type: 'streakAll', min: 30, pct: 0.03 }, PEAK),

  // 🏰 Семья: общая ветка для всех классов
  T('fa1', 'Знамя семьи', 'Все в семье получают +1% очков', 6, { type: 'aura', pct: 0.01 }),
  T('fa2a', 'Квестоман', 'Опыт квестов +5%', 9, { type: 'quest', pct: 0.05 }),
  T('fa2b', 'Торговец', 'Скидка на награды за очки −3%', 9, { type: 'shop', pct: 0.03 }),
  T('fa3c', 'Щедрая добыча', '2% шанс второго приза из сундука', 12, { type: 'double', pct: 0.02 }),
];

export const talentById = (id: string) => TALENTS.find((t) => t.id === id);
export const rankOf = (owned: string[], id: string): number => owned.filter((o) => o === id).length;

/** Действующие таланты героя (своего класса и семейные) с рангами. */
export function activeTalents(owned: string[], cls: Cls | null): { t: Talent; rank: number }[] {
  if (!cls) return [];
  return TALENTS.filter((t) => t.cls === cls || t.cls === 'f')
    .map((t) => ({ t, rank: Math.min(rankOf(owned, t.id), t.maxRank) })).filter((x) => x.rank > 0);
}

const sumEffects = <K extends Effect['type']>(owned: string[], cls: Cls | null, type: K, pick: (e: Extract<Effect, { type: K }>) => number): number =>
  activeTalents(owned, cls).reduce((s, { t, rank }) => s + (t.effect.type === type ? pick(t.effect as Extract<Effect, { type: K }>) * rank : 0), 0);

/** Бонусы к урону по боссу: общий и по слабому месту. */
export const bossBonuses = (owned: string[], cls: Cls | null): { boss: number; weak: number } => ({
  boss: sumEffects(owned, cls, 'boss', (e) => e.pct), weak: sumEffects(owned, cls, 'weak', (e) => e.pct),
});

/** Прибавка к шансам сундука. */
export const luckBonuses = (owned: string[], cls: Cls | null): { legend: number; rare: number } => ({
  legend: sumEffects(owned, cls, 'luck', (e) => e.legend ?? 0), rare: sumEffects(owned, cls, 'luck', (e) => e.rare ?? 0),
});

export const hasShield = (owned: string[], cls: Cls | null) => activeTalents(owned, cls).some(({ t }) => t.effect.type === 'shield');
/** Скидка на награды за очки. */
export const shopDiscount = (owned: string[], cls: Cls | null) => sumEffects(owned, cls, 'shop', (e) => e.pct);
/** Шанс второго приза из сундука. */
export const doubleChance = (owned: string[], cls: Cls | null) => sumEffects(owned, cls, 'double', (e) => e.pct);
/** Семейная аура этого героя (+% всем в семье). */
export const auraOf = (owned: string[], cls: Cls | null) => sumEffects(owned, cls, 'aura', (e) => e.pct);
/** Предел общей ауры: +6% очков. */
export const AURA_CAP = 0.06;

/** Потраченные очки: цена × ранг по действующим талантам. */
export const spentPoints = (owned: string[], cls: Cls | null): number =>
  activeTalents(owned, cls).reduce((s, x) => s + x.rank * x.t.cost, 0);

/** Очки, вложенные в направление группы (по умолчанию — своего класса). */
export const directionPoints = (owned: string[], cls: Cls | null, dir: number, group: Group | null = cls): number =>
  activeTalents(owned, cls).filter((x) => x.t.cls === group && x.t.dir === dir).reduce((s, x) => s + x.rank * x.t.cost, 0);

const peakReady = (owned: string[], cls: Cls | null) => [0, 1, 2].some((d) => directionPoints(owned, cls, d) >= PEAK_NEED);

/** Можно ли прокачать талант на ранг. */
export function canBuyTalent(
  id: string, owned: string[], cls: Cls | null, level: number,
): { ok: boolean; reason?: string } {
  if (!cls) return { ok: false, reason: 'Сначала выберите класс' };
  const t = talentById(id);
  if (!t) return { ok: false, reason: 'Нет такого таланта' };
  if (t.cls !== cls && t.cls !== 'f') return { ok: false, reason: 'Талант другого класса' };
  if (level < t.unlock) return { ok: false, reason: `Откроется на ${t.unlock} уровне` };
  if (rankOf(owned, id) >= t.maxRank) return { ok: false, reason: 'Максимальный ранг' };
  if (t.tier === 5) {
    if (!peakReady(owned, cls)) return { ok: false, reason: `Нужно ${PEAK_NEED} оч. в одном направлении` };
  } else {
    const need = tierNeed(t.tier);
    if (directionPoints(owned, cls, t.dir, t.cls) < need) return { ok: false, reason: `Нужно ${need} оч. в направлении` };
    const mine = activeTalents(owned, cls).filter((x) => x.t.cls === t.cls && x.t.dir === t.dir);
    if (t.branch && mine.some((x) => x.t.branch && x.t.branch !== t.branch)) return { ok: false, reason: 'Выбрана другая подветка' };
    if (t.tier > 1 && !mine.some((x) => x.t.tier === t.tier - 1 && (!t.branch || !x.t.branch || x.t.branch === t.branch)))
      return { ok: false, reason: 'Сначала возьмите талант предыдущего яруса' };
  }
  if (level - 1 - spentPoints(owned, cls) < t.cost) return { ok: false, reason: 'Не хватает очков таланта' };
  return { ok: true };
}
