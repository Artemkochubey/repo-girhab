import type { Cls, DayStats, Sphere, StudyKind } from './types';

export type Branch = Cls | 'u' | 'h' | 'l';
export const BRANCH_NAMES: Record<Branch, string> = { w: '⚔️ Воин', m: '🔮 Маг', b: '🎵 Бард', p: '🛡 Паладин', u: '🌐 Универсал', h: '🎯 Охотник на боссов', l: '🍀 Удача' };
export const BRANCH_NOTES: Record<Branch, string> = {
  w: 'Тело: тренировки и зарядка', m: 'Ум: учёба, книги, мышление', b: 'Творчество, навыки, языки', p: 'Привычки и серии дней',
  u: 'Бонусы за разностороннюю активность и ко всем очкам', h: 'Больше урона по боссу недели', l: 'Шанс редких и легендарных наград в сундуках',
};
export const BRANCHES = Object.keys(BRANCH_NAMES) as Branch[];

type Effect =
  | { type: 'mult'; spheres: Sphere[]; pct: number }
  | { type: 'all'; pct: number }
  | { type: 'boss'; pct: number }
  | { type: 'weak'; pct: number }
  | { type: 'luck'; legend?: number; rare?: number }
  | { type: 'flat'; when: (d: DayStats) => boolean; bonus: number }
  | { type: 'streak'; perDay: number; max: number }
  | { type: 'shield' };

export interface Talent { id: string; branch: Branch; tier: 1 | 2 | 3; name: string; text: string; effect: Effect }

const studyTotal = (d: DayStats) => Object.values(d.study).reduce((a, b) => a + (b ?? 0), 0);
const kinds = (d: DayStats) => Object.values(d.study).filter((m) => (m ?? 0) > 0).length;
const sum = (d: DayStats, ks: StudyKind[]) => ks.reduce((a, k) => a + (d.study[k] ?? 0), 0);
const active = (d: DayStats) => d.workoutMinutes + studyTotal(d);

export const TALENTS: Talent[] = [
  { id: 'w1a', branch: 'w', tier: 1, name: 'Разминка', text: 'Зарядка +50%', effect: { type: 'mult', spheres: ['warmup'], pct: 0.5 } },
  { id: 'w1b', branch: 'w', tier: 1, name: 'Бегун', text: 'Тренировки +15%', effect: { type: 'mult', spheres: ['workout'], pct: 0.15 } },
  { id: 'w2a', branch: 'w', tier: 2, name: 'Стальные мышцы', text: 'Тренировки +20%', effect: { type: 'mult', spheres: ['workout'], pct: 0.2 } },
  { id: 'w2b', branch: 'w', tier: 2, name: 'Второе дыхание', text: '+5/день за зарядку и тренировку', effect: { type: 'flat', when: (d) => d.warmups > 0 && d.workoutMinutes > 0, bonus: 5 } },
  { id: 'w3a', branch: 'w', tier: 3, name: 'Неутомимый', text: '+10/день за 20+ мин тренировки', effect: { type: 'flat', when: (d) => d.workoutMinutes >= 20, bonus: 10 } },
  { id: 'w3b', branch: 'w', tier: 3, name: 'Чемпион', text: '+20/день за 45+ мин тренировки', effect: { type: 'flat', when: (d) => d.workoutMinutes >= 45, bonus: 20 } },

  { id: 'm1a', branch: 'm', tier: 1, name: 'Книжный червь', text: 'Книга и чтение +50%', effect: { type: 'mult', spheres: ['book', 'Книги'], pct: 0.5 } },
  { id: 'm1b', branch: 'm', tier: 1, name: 'Зубрилка', text: 'Учёба +30%', effect: { type: 'mult', spheres: ['Учёба'], pct: 0.3 } },
  { id: 'm2a', branch: 'm', tier: 2, name: 'Полиглот', text: 'Языки +50%', effect: { type: 'mult', spheres: ['Языки'], pct: 0.5 } },
  { id: 'm2b', branch: 'm', tier: 2, name: 'Мыслитель', text: 'Мышление +50%', effect: { type: 'mult', spheres: ['Мышление'], pct: 0.5 } },
  { id: 'm3a', branch: 'm', tier: 3, name: 'Эрудит', text: '+10/день за 20+ мин любой учёбы', effect: { type: 'flat', when: (d) => studyTotal(d) >= 20, bonus: 10 } },
  { id: 'm3b', branch: 'm', tier: 3, name: 'Мудрец', text: '+20/день за 45+ мин любой учёбы', effect: { type: 'flat', when: (d) => studyTotal(d) >= 45, bonus: 20 } },

  { id: 'b1a', branch: 'b', tier: 1, name: 'Муза', text: 'Творчество +50%', effect: { type: 'mult', spheres: ['Творчество'], pct: 0.5 } },
  { id: 'b1b', branch: 'b', tier: 1, name: 'Говорун', text: 'Языки +30%', effect: { type: 'mult', spheres: ['Языки'], pct: 0.3 } },
  { id: 'b2a', branch: 'b', tier: 2, name: 'Ремесленник', text: 'Навыки +30%', effect: { type: 'mult', spheres: ['Навыки'], pct: 0.3 } },
  { id: 'b2b', branch: 'b', tier: 2, name: 'Разносторонний', text: '+8/день при 3+ видах учёбы', effect: { type: 'flat', when: (d) => kinds(d) >= 3, bonus: 8 } },
  { id: 'b3a', branch: 'b', tier: 3, name: 'Вдохновение', text: '+10/день за 20+ мин творчества', effect: { type: 'flat', when: (d) => (d.study['Творчество'] ?? 0) >= 20, bonus: 10 } },
  { id: 'b3b', branch: 'b', tier: 3, name: 'Маэстро', text: '+20/день за 45+ мин творчества, навыков и языков', effect: { type: 'flat', when: (d) => sum(d, ['Творчество', 'Навыки', 'Языки']) >= 45, bonus: 20 } },

  { id: 'p1a', branch: 'p', tier: 1, name: 'Режим дня', text: 'Привычки +40%', effect: { type: 'mult', spheres: ['habits'], pct: 0.4 } },
  { id: 'p1b', branch: 'p', tier: 1, name: 'Первый шаг', text: '+5/день, если есть хоть 1 привычка', effect: { type: 'flat', when: (d) => d.habits >= 1, bonus: 5 } },
  { id: 'p2a', branch: 'p', tier: 2, name: 'Железная воля', text: '+10/день при 4+ привычках', effect: { type: 'flat', when: (d) => d.habits >= 4, bonus: 10 } },
  { id: 'p2b', branch: 'p', tier: 2, name: 'Серийник', text: '+1 за каждый день серии, максимум +10', effect: { type: 'streak', perDay: 1, max: 10 } },
  { id: 'p3a', branch: 'p', tier: 3, name: 'Щит серии', text: 'Один пропуск в неделю не обрывает серию', effect: { type: 'shield' } },
  { id: 'p3b', branch: 'p', tier: 3, name: 'Столп', text: '+25/день при 6 привычках', effect: { type: 'flat', when: (d) => d.habits >= 6, bonus: 25 } },

  { id: 'u1a', branch: 'u', tier: 1, name: 'Разносторонний день', text: '+10/день за тело и учёбу (от 10 мин) в один день', effect: { type: 'flat', when: (d) => (d.workoutMinutes > 0 || d.warmups > 0) && studyTotal(d) >= 10, bonus: 10 } },
  { id: 'u1b', branch: 'u', tier: 1, name: 'Копилка', text: 'Все очки +3%', effect: { type: 'all', pct: 0.03 } },
  { id: 'u2a', branch: 'u', tier: 2, name: 'Марафонец дня', text: '+15/день за 60+ мин тренировки и учёбы', effect: { type: 'flat', when: (d) => active(d) >= 60, bonus: 15 } },
  { id: 'u2b', branch: 'u', tier: 2, name: 'Набор высоты', text: 'Все очки +5%', effect: { type: 'all', pct: 0.05 } },
  { id: 'u3a', branch: 'u', tier: 3, name: 'Мастер дня', text: '+25/день за 90+ мин тренировки и учёбы', effect: { type: 'flat', when: (d) => active(d) >= 90, bonus: 25 } },
  { id: 'u3b', branch: 'u', tier: 3, name: 'Легенда', text: 'Все очки +7%', effect: { type: 'all', pct: 0.07 } },

  { id: 'h1a', branch: 'h', tier: 1, name: 'Меткий удар', text: '+5% урона по боссу', effect: { type: 'boss', pct: 0.05 } },
  { id: 'h1b', branch: 'h', tier: 1, name: 'Охотник за слабостью', text: '+10% к урону по слабому месту', effect: { type: 'weak', pct: 0.1 } },
  { id: 'h2a', branch: 'h', tier: 2, name: 'Тяжёлая рука', text: '+10% урона по боссу', effect: { type: 'boss', pct: 0.1 } },
  { id: 'h2b', branch: 'h', tier: 2, name: 'Прицельный огонь', text: '+20% к урону по слабому месту', effect: { type: 'weak', pct: 0.2 } },
  { id: 'h3a', branch: 'h', tier: 3, name: 'Убийца титанов', text: '+15% урона по боссу', effect: { type: 'boss', pct: 0.15 } },
  { id: 'h3b', branch: 'h', tier: 3, name: 'Добивающий удар', text: '+30% к урону по слабому месту', effect: { type: 'weak', pct: 0.3 } },

  { id: 'l1a', branch: 'l', tier: 1, name: 'Везунчик', text: 'Легендарный сундук: шанс +3%', effect: { type: 'luck', legend: 0.03 } },
  { id: 'l1b', branch: 'l', tier: 1, name: 'Кладоискатель', text: 'Редкий сундук: шанс +10%', effect: { type: 'luck', rare: 0.1 } },
  { id: 'l2a', branch: 'l', tier: 2, name: 'Золотая жила', text: 'Легендарный сундук: шанс +4%', effect: { type: 'luck', legend: 0.04 } },
  { id: 'l2b', branch: 'l', tier: 2, name: 'Жила удачи', text: 'Редкий сундук: шанс +15%', effect: { type: 'luck', rare: 0.15 } },
  { id: 'l3a', branch: 'l', tier: 3, name: 'Король сокровищ', text: 'Легендарный сундук: шанс +5%', effect: { type: 'luck', legend: 0.05 } },
  { id: 'l3b', branch: 'l', tier: 3, name: 'Любимец фортуны', text: 'Редкий сундук: шанс +20%', effect: { type: 'luck', rare: 0.2 } },
];

/** Бонусы к урону по боссу: общий и по слабому месту. */
export function bossBonuses(owned: string[]): { boss: number; weak: number } {
  let boss = 0, weak = 0;
  for (const id of owned) {
    const e = talentById(id)?.effect;
    if (e?.type === 'boss') boss += e.pct;
    if (e?.type === 'weak') weak += e.pct;
  }
  return { boss, weak };
}

/** Прибавка к шансам сундука. */
export function luckBonuses(owned: string[]): { legend: number; rare: number } {
  let legend = 0, rare = 0;
  for (const id of owned) {
    const e = talentById(id)?.effect;
    if (e?.type === 'luck') { legend += e.legend ?? 0; rare += e.rare ?? 0; }
  }
  return { legend, rare };
}

export const talentById = (id: string) => TALENTS.find((t) => t.id === id);

/** Стоимость: номер яруса; в ветке своего класса max(1, ярус-1). */
export const talentCost = (t: Talent, cls: Cls | null): number =>
  t.branch === cls ? Math.max(1, t.tier - 1) : t.tier;

export const spentPoints = (owned: string[], cls: Cls | null): number =>
  owned.reduce((s, id) => { const t = talentById(id); return s + (t ? talentCost(t, cls) : 0); }, 0);

/** Можно ли купить талант: очки, предыдущий ярус, взаимоисключение. */
export function canBuyTalent(
  id: string, owned: string[], cls: Cls | null, level: number,
): { ok: boolean; reason?: string } {
  if (!cls) return { ok: false, reason: 'Сначала выберите класс' };
  const t = talentById(id);
  if (!t) return { ok: false, reason: 'Нет такого таланта' };
  if (owned.includes(id)) return { ok: false, reason: 'Уже куплен' };
  const twin = id.slice(0, 2) + (id.endsWith('a') ? 'b' : 'a');
  if (owned.includes(twin)) return { ok: false, reason: 'Выбран второй вариант яруса' };
  if (t.tier > 1 && !owned.some((o) => { const x = talentById(o); return x && x.branch === t.branch && x.tier === t.tier - 1; }))
    return { ok: false, reason: 'Нужен талант предыдущего яруса' };
  const free = level - 1 - spentPoints(owned, cls);
  if (free < talentCost(t, cls)) return { ok: false, reason: 'Не хватает очков таланта' };
  return { ok: true };
}

export const hasShield = (owned: string[]) => owned.includes('p3a');
