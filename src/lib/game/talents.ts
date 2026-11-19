import type { Cls, DayStats, Sphere, StudyKind } from './types';

/**
 * Таланты: у каждого класса три направления по четыре таланта. Талант открывается на своём уровне
 * (в классе каждый уровень со 2-го по 13-й открывает новый талант) и качается до 3 рангов.
 * Один ранг стоит 1 очко таланта и даёт небольшой бонус. Ярус N направления требует (N−1)·2 очков в этом направлении.
 * Таланты чужих классов не действуют, их очки возвращаются. Ранг = сколько раз id встречается в списке hero.talents.
 */
export const DIRECTIONS: Record<Cls, { name: string; note: string }[]> = {
  w: [{ name: '💪 Сила', note: 'Тренировки и большие дни' }, { name: '🌅 Закалка', note: 'Зарядка и связки тела с учёбой' }, { name: '🎯 Охота', note: 'Урон по боссу недели' }],
  m: [{ name: '📚 Знание', note: 'Книги, учёба, мышление' }, { name: '🧠 Усердие', note: 'Языки и бонусы за долгую учёбу' }, { name: '💎 Сокровища', note: 'Шанс редких и легендарных наград' }],
  b: [{ name: '🎨 Муза', note: 'Творчество, навыки, языки' }, { name: '✨ Вдохновение', note: 'Бонусы за разнообразие и творчество' }, { name: '🍀 Фортуна', note: 'Шанс редких и легендарных наград' }],
  p: [{ name: '📅 Режим', note: 'Привычки каждый день' }, { name: '🔥 Серии', note: 'Серии дней и щит серии' }, { name: '🛡 Опора', note: 'Бонусы ко всем очкам и урон по боссу' }],
};
export const MAX_RANK = 3;
/** Сколько очков в направлении нужно для яруса. */
export const tierNeed = (tier: number): number => (tier - 1) * 2;

type Effect =
  | { type: 'mult'; spheres: Sphere[]; pct: number }
  | { type: 'all'; pct: number }
  | { type: 'boss'; pct: number }
  | { type: 'weak'; pct: number }
  | { type: 'luck'; legend?: number; rare?: number }
  | { type: 'flat'; when: (d: DayStats) => boolean; bonus: number }
  | { type: 'streak'; perDay: number; max: number }
  | { type: 'shield' };

/** effect — бонус одного ранга; в расчётах умножается на ранг. */
export interface Talent { id: string; cls: Cls; dir: 0 | 1 | 2; tier: 1 | 2 | 3 | 4; unlock: number; maxRank: number; name: string; text: string; effect: Effect }

const studyTotal = (d: DayStats) => Object.values(d.study).reduce((a, b) => a + (b ?? 0), 0);
const kinds = (d: DayStats) => Object.values(d.study).filter((m) => (m ?? 0) > 0).length;
const sum = (d: DayStats, ks: StudyKind[]) => ks.reduce((a, k) => a + (d.study[k] ?? 0), 0);
const active = (d: DayStats) => d.workoutMinutes + studyTotal(d);
const body = (d: DayStats) => d.workoutMinutes > 0 || d.warmups > 0;

const T = (id: string, name: string, text: string, unlock: number, effect: Effect, maxRank = MAX_RANK): Talent => {
  const cls = id[0] as Cls, dir = ('abc'.indexOf(id[1])) as 0 | 1 | 2, tier = Number(id[2]) as 1 | 2 | 3 | 4;
  return { id, cls, dir, tier, unlock, maxRank, name, text, effect };
};

export const TALENTS: Talent[] = [
  T('wa1', 'Бегун', 'Тренировки +4%', 2, { type: 'mult', spheres: ['workout'], pct: 0.04 }),
  T('wa2', 'Выносливость', '+2/день за 20+ мин тренировки', 5, { type: 'flat', when: (d) => d.workoutMinutes >= 20, bonus: 2 }),
  T('wa3', 'Неутомимый', '+3/день за 45+ мин тренировки', 8, { type: 'flat', when: (d) => d.workoutMinutes >= 45, bonus: 3 }),
  T('wa4', 'Чемпион', 'Все очки +2%', 11, { type: 'all', pct: 0.02 }),
  T('wb1', 'Разминка', 'Зарядка +15%', 3, { type: 'mult', spheres: ['warmup'], pct: 0.15 }),
  T('wb2', 'Второе дыхание', '+2/день за зарядку и тренировку', 6, { type: 'flat', when: (d) => d.warmups > 0 && d.workoutMinutes > 0, bonus: 2 }),
  T('wb3', 'Мастер дня', '+3/день за 60+ мин тренировки и учёбы', 9, { type: 'flat', when: (d) => active(d) >= 60, bonus: 3 }),
  T('wb4', 'Живая легенда', '+4/день за 90+ мин тренировки и учёбы', 12, { type: 'flat', when: (d) => active(d) >= 90, bonus: 4 }),
  T('wc1', 'Меткий удар', '+2% урона по боссу', 4, { type: 'boss', pct: 0.02 }),
  T('wc2', 'Охотник за слабостью', '+4% по слабому месту босса', 7, { type: 'weak', pct: 0.04 }),
  T('wc3', 'Тяжёлая рука', '+2% урона по боссу', 10, { type: 'boss', pct: 0.02 }),
  T('wc4', 'Убийца титанов', '+5% по слабому месту босса', 13, { type: 'weak', pct: 0.05 }),

  T('ma1', 'Книжный червь', 'Книги и чтение +5%', 2, { type: 'mult', spheres: ['book', 'Книги'], pct: 0.05 }),
  T('ma2', 'Зубрилка', 'Учёба +4%', 5, { type: 'mult', spheres: ['Учёба'], pct: 0.04 }),
  T('ma3', 'Мыслитель', 'Мышление +4%', 8, { type: 'mult', spheres: ['Мышление'], pct: 0.04 }),
  T('ma4', 'Мудрец', 'Все очки +2%', 11, { type: 'all', pct: 0.02 }),
  T('mb1', 'Полиглот', 'Языки +5%', 3, { type: 'mult', spheres: ['Языки'], pct: 0.05 }),
  T('mb2', 'Эрудит', '+2/день за 20+ мин любой учёбы', 6, { type: 'flat', when: (d) => studyTotal(d) >= 20, bonus: 2 }),
  T('mb3', 'Просветлённый', '+3/день за 45+ мин любой учёбы', 9, { type: 'flat', when: (d) => studyTotal(d) >= 45, bonus: 3 }),
  T('mb4', 'Магистр', '+3/день при 3+ видах учёбы', 12, { type: 'flat', when: (d) => kinds(d) >= 3, bonus: 3 }),
  T('mc1', 'Везунчик', 'Редкий сундук: шанс +2%', 4, { type: 'luck', rare: 0.02 }),
  T('mc2', 'Кладоискатель', 'Редкий сундук: шанс +3%', 7, { type: 'luck', rare: 0.03 }),
  T('mc3', 'Золотая жила', 'Легендарный сундук: шанс +1%', 10, { type: 'luck', legend: 0.01 }),
  T('mc4', 'Король сокровищ', 'Легендарный сундук: шанс +2%', 13, { type: 'luck', legend: 0.02 }),

  T('ba1', 'Муза', 'Творчество +5%', 2, { type: 'mult', spheres: ['Творчество'], pct: 0.05 }),
  T('ba2', 'Ремесленник', 'Навыки +4%', 5, { type: 'mult', spheres: ['Навыки'], pct: 0.04 }),
  T('ba3', 'Говорун', 'Языки +4%', 8, { type: 'mult', spheres: ['Языки'], pct: 0.04 }),
  T('ba4', 'Маэстро', 'Все очки +2%', 11, { type: 'all', pct: 0.02 }),
  T('bb1', 'Разносторонний', '+2/день при 3+ видах учёбы', 3, { type: 'flat', when: (d) => kinds(d) >= 3, bonus: 2 }),
  T('bb2', 'Вдохновение', '+2/день за 20+ мин творчества', 6, { type: 'flat', when: (d) => (d.study['Творчество'] ?? 0) >= 20, bonus: 2 }),
  T('bb3', 'Мастерская', '+3/день за 45+ мин творчества, навыков и языков', 9, { type: 'flat', when: (d) => sum(d, ['Творчество', 'Навыки', 'Языки']) >= 45, bonus: 3 }),
  T('bb4', 'Виртуоз', '+3/день при 4+ видах учёбы', 12, { type: 'flat', when: (d) => kinds(d) >= 4, bonus: 3 }),
  T('bc1', 'Счастливая нота', 'Редкий сундук: шанс +2%', 4, { type: 'luck', rare: 0.02 }),
  T('bc2', 'Ярмарка', 'Редкий сундук: шанс +3%', 7, { type: 'luck', rare: 0.03 }),
  T('bc3', 'Удачный дубль', 'Легендарный сундук: шанс +1%', 10, { type: 'luck', legend: 0.01 }),
  T('bc4', 'Бенефис', 'Легендарный сундук: шанс +2%', 13, { type: 'luck', legend: 0.02 }),

  T('pa1', 'Режим дня', 'Привычки +6%', 2, { type: 'mult', spheres: ['habits'], pct: 0.06 }),
  T('pa2', 'Первый шаг', '+2/день, если есть хоть 1 привычка', 5, { type: 'flat', when: (d) => d.habits >= 1, bonus: 2 }),
  T('pa3', 'Железная воля', '+3/день при 4+ привычках', 8, { type: 'flat', when: (d) => d.habits >= 4, bonus: 3 }),
  T('pa4', 'Столп', '+4/день при 6 привычках', 11, { type: 'flat', when: (d) => d.habits >= 6, bonus: 4 }),
  T('pb1', 'Серийник', '+0,5 за день серии, максимум +3', 3, { type: 'streak', perDay: 0.5, max: 3 }),
  T('pb2', 'Закалка воли', 'Все очки +2%', 6, { type: 'all', pct: 0.02 }),
  T('pb3', 'Щит серии', 'Один пропуск в неделю не обрывает серию', 9, { type: 'shield' }, 1),
  T('pb4', 'Несокрушимый', '+1 за день серии, максимум +5', 12, { type: 'streak', perDay: 1, max: 5 }),
  T('pc1', 'Страж', '+2% урона по боссу', 4, { type: 'boss', pct: 0.02 }),
  T('pc2', 'Оплот', 'Все очки +2%', 7, { type: 'all', pct: 0.02 }),
  T('pc3', 'Защитник семьи', '+4% по слабому месту босса', 10, { type: 'weak', pct: 0.04 }),
  T('pc4', 'Легенда стражей', 'Все очки +3%', 13, { type: 'all', pct: 0.03 }),
];

export const talentById = (id: string) => TALENTS.find((t) => t.id === id);
export const rankOf = (owned: string[], id: string): number => owned.filter((o) => o === id).length;

/** Действующие таланты героя (только своего класса) с рангами. */
export function activeTalents(owned: string[], cls: Cls | null): { t: Talent; rank: number }[] {
  if (!cls) return [];
  return TALENTS.filter((t) => t.cls === cls).map((t) => ({ t, rank: Math.min(rankOf(owned, t.id), t.maxRank) })).filter((x) => x.rank > 0);
}

/** Бонусы к урону по боссу: общий и по слабому месту. */
export function bossBonuses(owned: string[], cls: Cls | null): { boss: number; weak: number } {
  let boss = 0, weak = 0;
  for (const { t, rank } of activeTalents(owned, cls)) {
    if (t.effect.type === 'boss') boss += t.effect.pct * rank;
    if (t.effect.type === 'weak') weak += t.effect.pct * rank;
  }
  return { boss, weak };
}

/** Прибавка к шансам сундука. */
export function luckBonuses(owned: string[], cls: Cls | null): { legend: number; rare: number } {
  let legend = 0, rare = 0;
  for (const { t, rank } of activeTalents(owned, cls)) {
    if (t.effect.type === 'luck') { legend += (t.effect.legend ?? 0) * rank; rare += (t.effect.rare ?? 0) * rank; }
  }
  return { legend, rare };
}

export const hasShield = (owned: string[], cls: Cls | null) => activeTalents(owned, cls).some(({ t }) => t.effect.type === 'shield');

/** Потраченные очки: 1 за каждый ранг действующих талантов класса. */
export const spentPoints = (owned: string[], cls: Cls | null): number =>
  activeTalents(owned, cls).reduce((s, x) => s + x.rank, 0);

/** Очки, вложенные в направление. */
export const directionPoints = (owned: string[], cls: Cls | null, dir: number): number =>
  activeTalents(owned, cls).filter((x) => x.t.dir === dir).reduce((s, x) => s + x.rank, 0);

/** Можно ли прокачать талант на ранг: класс, уровень, ранг, очки в направлении, свободные очки. */
export function canBuyTalent(
  id: string, owned: string[], cls: Cls | null, level: number,
): { ok: boolean; reason?: string } {
  if (!cls) return { ok: false, reason: 'Сначала выберите класс' };
  const t = talentById(id);
  if (!t) return { ok: false, reason: 'Нет такого таланта' };
  if (t.cls !== cls) return { ok: false, reason: 'Талант другого класса' };
  if (level < t.unlock) return { ok: false, reason: `Откроется на ${t.unlock} уровне` };
  if (rankOf(owned, id) >= t.maxRank) return { ok: false, reason: 'Максимальный ранг' };
  const need = tierNeed(t.tier);
  if (directionPoints(owned, cls, t.dir) < need) return { ok: false, reason: `Нужно ${need} оч. в направлении` };
  if (level - 1 - spentPoints(owned, cls) < 1) return { ok: false, reason: 'Не хватает очков таланта' };
  return { ok: true };
}
