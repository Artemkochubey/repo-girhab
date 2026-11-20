import { dayDiff } from '../date';
import type { Cls } from './classes';
import { NO_GEAR, type GearBonus } from './gear';

/**
 * Классы в бою (по мотивам ролей и способностей World of Warcraft): у каждого свои сильные и слабые стороны.
 * Способности постоянные и срабатывают сами. Они складываются с бонусами снаряжения.
 *  - Воин: боец, копит ярость и быстро разгоняется.
 *  - Маг: стеклянная пушка: удар по слабости сильнее всех, но защиты нет.
 *  - Бард: поддержка: лечит, находит больше добычи, баффает всю семью в бою с боссом.
 *  - Паладин: защитник: держит удар и срывается в «возмездие», когда тяжело.
 */
export interface ClassAbility { emoji: string; name: string; text: string }
export interface ClassBattle {
  role: string; roleEmoji: string; armor: string; summary: string;
  abilities: ClassAbility[];
  bonus: Partial<GearBonus>;
  boss: { dmg: number; weak: number; party: number };   // в бою с боссом: свой урон, своя слабость, бафф всем героям
}

export const CLASS_BATTLE: Record<Cls, ClassBattle> = {
  w: {
    role: 'Боец', roleEmoji: '⚔️', armor: 'Латные доспехи',
    summary: 'Разгоняется по ходу боя: чем больше волн убито, тем сильнее удар.',
    abilities: [
      { emoji: '🏃', name: 'Рывок', text: 'первая волна слабее на 10%' },
      { emoji: '😡', name: 'Ярость', text: '+6% урона за каждую убитую волну' },
      { emoji: '🗡', name: 'Боевой клич', text: 'в бою с боссом +5% урона' },
    ],
    bonus: { wave1: 0.1, rage: 0.06 }, boss: { dmg: 0.05, weak: 0, party: 0 },
  },
  m: {
    role: 'Заклинатель', roleEmoji: '🔮', armor: 'Тканевые мантии',
    summary: 'Самый сильный удар по слабости, но хрупкий: поражение больно.',
    abilities: [
      { emoji: '🔥', name: 'Огненный шар', text: 'удар по слабой сфере сильнее: множитель ×1,85 вместо ×1,5' },
      { emoji: '🧊', name: 'Хрупкая мантия', text: 'поражение отнимает на 30% больше здоровья' },
      { emoji: '✨', name: 'Чародейский огонь', text: 'в бою с боссом слабое место бьёт сильнее' },
    ],
    bonus: { weak: 0.35, lossMult: 0.3 }, boss: { dmg: 0, weak: 0.15, party: 0 },
  },
  b: {
    role: 'Поддержка', roleEmoji: '🎶', armor: 'Кожаная лёгкая броня',
    summary: 'Лечит себя, чаще находит добычу и поёт для всей семьи в бою с боссом.',
    abilities: [
      { emoji: '🎵', name: 'Песня отдыха', text: '+6 здоровья в день и +6 за победу' },
      { emoji: '🪙', name: 'Находчивость', text: '+10% к шансу снаряжения за победу' },
      { emoji: '📯', name: 'Боевая песня', text: 'в бою с боссом +3% урона всем героям семьи' },
    ],
    bonus: { heal: 6, winHeal: 6, loot: 0.1 }, boss: { dmg: 0, weak: 0, party: 0.03 },
  },
  p: {
    role: 'Защитник', roleEmoji: '🛡', armor: 'Латы с золотой отделкой',
    summary: 'Держит удар: меньше теряет при поражении и бьёт сильнее, когда тяжело.',
    abilities: [
      { emoji: '🛡', name: 'Божественный щит', text: 'поражение отнимает на 35% меньше здоровья' },
      { emoji: '✨', name: 'Возмездие', text: '+20% урона, пока здоровье ниже половины' },
      { emoji: '🙏', name: 'Возложение рук', text: '+4 здоровья за победу' },
    ],
    bonus: { guard: 0.35, comeback: 0.2, winHeal: 4 }, boss: { dmg: 0.04, weak: 0, party: 0 },
  },
};

// --- специализации: с 8 уровня герой выбирает одну из двух веток своего класса (как в World of Warcraft) ---
export type Spec = 'a' | 'b';
export const SPEC_LEVEL = 8;
export interface SpecDef { id: Spec; emoji: string; name: string; text: string; bonus: Partial<GearBonus>; ability: ActiveAbility }
export const SPECS: Record<Cls, [SpecDef, SpecDef]> = {
  w: [
    { id: 'a', emoji: '🔥', name: 'Берсерк', text: '+8% урона, но поражение отнимает на 15% больше здоровья', bonus: { dmg: 0.08, lossMult: 0.15 },
      ability: { id: 'w-bloodlust', emoji: '🩸', name: 'Кровавая жажда', text: '+10% урона и +8% урона за каждую убитую волну', cost: 1, cd: 1, effect: { dmg: 0.1, rage: 0.08 } } },
    { id: 'b', emoji: '🛡', name: 'Страж', text: 'поражение отнимает на 25% меньше здоровья, +3 здоровья в день', bonus: { guard: 0.25, heal: 3 },
      ability: { id: 'w-wall', emoji: '🧱', name: 'Стена щитов', text: 'поражение отнимает на 60% меньше здоровья и +8 здоровья', cost: 1, cd: 1, effect: { guard: 0.6, heal: 8 } } },
  ],
  m: [
    { id: 'a', emoji: '☄️', name: 'Огневой маг', text: 'удар по слабости сильнее на 0,15, +5% урона', bonus: { weak: 0.15, dmg: 0.05 },
      ability: { id: 'm-comet', emoji: '🌠', name: 'Комета', text: 'удар по слабой сфере сильнее на 0,5 и +15% урона', cost: 1, cd: 1, effect: { weak: 0.5, dmg: 0.15 } } },
    { id: 'b', emoji: '❄️', name: 'Криомант', text: 'поражение отнимает на 30% меньше здоровья, орда слабее на 5%', bonus: { guard: 0.3, hordeHp: 0.05 },
      ability: { id: 'm-frost', emoji: '🌨', name: 'Ледяной шторм', text: 'орда слабее на 15%, поражение отнимает на 30% меньше', cost: 1, cd: 1, effect: { hordeHp: 0.15, guard: 0.3 } } },
  ],
  b: [
    { id: 'a', emoji: '🎼', name: 'Менестрель', text: '+4 здоровья в день и +4 за победу', bonus: { heal: 4, winHeal: 4 },
      ability: { id: 'b-anthem', emoji: '🎺', name: 'Гимн героев', text: '+15% урона и +8 здоровья', cost: 1, cd: 1, effect: { dmg: 0.15, heal: 8 } } },
    { id: 'b', emoji: '📯', name: 'Скальд', text: '+10% к шансу снаряжения, +5% урона', bonus: { loot: 0.1, dmg: 0.05 },
      ability: { id: 'b-treasure', emoji: '💰', name: 'Песнь о сокровищах', text: '+50% к шансу снаряжения за победу', cost: 1, cd: 1, effect: { loot: 0.5 } } },
  ],
  p: [
    { id: 'a', emoji: '⚖️', name: 'Воитель света', text: '+12% урона при здоровье ниже половины, +5% урона', bonus: { comeback: 0.12, dmg: 0.05 },
      ability: { id: 'p-smite', emoji: '⚡', name: 'Кара', text: '+30% урона и ещё +20% при здоровье ниже половины', cost: 1, cd: 1, effect: { dmg: 0.3, comeback: 0.2 } } },
    { id: 'b', emoji: '🙏', name: 'Хранитель', text: 'поражение отнимает на 20% меньше здоровья, +3 здоровья в день и +4 за победу', bonus: { guard: 0.2, heal: 3, winHeal: 4 },
      ability: { id: 'p-bulwark', emoji: '🏰', name: 'Оплот веры', text: 'поражение отнимает на 60% меньше здоровья и +10 здоровья', cost: 1, cd: 1, effect: { guard: 0.6, heal: 10 } } },
  ],
};
export const specOf = (cls: Cls | null, spec: Spec | null | undefined): SpecDef | null => (cls && spec ? SPECS[cls].find((s) => s.id === spec) ?? null : null);
export const validSpec = (v: unknown): v is Spec => v === 'a' || v === 'b';

/** Сила способностей растёт с уровнем героя: +4% за уровень после первого, не больше +60%. */
export const abilityPower = (level: number): number => 1 + Math.min(0.6, Math.max(0, level - 1) * 0.04);

/** Бонусы снаряжения плюс способности класса и специализации (для личного боя). Класс не выбран: только снаряжение. */
export function withClass(gear: GearBonus, cls: Cls | null, spec: Spec | null = null): GearBonus {
  if (!cls) return gear;
  const c = { ...CLASS_BATTLE[cls].bonus };
  const sp = specOf(cls, spec);
  const out: GearBonus = { ...gear, dmgDomain: { ...gear.dmgDomain } };
  if (sp) for (const [k, v] of Object.entries(sp.bonus)) (out[k as keyof GearBonus] as number) += v as number;
  for (const [k, v] of Object.entries(c)) {
    const key = k as keyof GearBonus;
    if (key === 'dmgDomain' || key === 'streakMax') continue;
    (out[key] as number) += v as number;
  }
  return out;
}
export const classOnly = (cls: Cls | null, spec: Spec | null = null): GearBonus => withClass(NO_GEAR, cls, spec);

// --- активные способности: нажимаются кнопкой в течение дня и усиливают сегодняшний бой ---
export const FOCUS_PER_DAY = 2;   // «энергия»: сколько очков способностей можно потратить за день (обычная стоит 1, мощная 2)

export interface ActiveAbility {
  id: string; emoji: string; name: string; text: string;
  cost: 1 | 2;                 // сколько энергии тратит
  cd: number;                  // перезарядка в днях: 1 — раз в день, 3 — раз в три дня
  effect: Partial<GearBonus>;  // что добавляет к бонусам на этот день
}

export const ACTIVE_ABILITIES: Record<Cls, ActiveAbility[]> = {
  w: [
    { id: 'w-charge', emoji: '🏃', name: 'Рывок в бой', text: 'первая волна слабее на 35%', cost: 1, cd: 1, effect: { wave1: 0.35 } },
    { id: 'w-whirl', emoji: '🌪', name: 'Вихрь клинков', text: '+25% урона сегодня', cost: 1, cd: 1, effect: { dmg: 0.25 } },
    { id: 'w-reckless', emoji: '💢', name: 'Безрассудство', text: '+50% урона, но поражение отнимает вдвое больше здоровья', cost: 2, cd: 3, effect: { dmg: 0.5, lossMult: 1 } },
  ],
  m: [
    { id: 'm-pyro', emoji: '☄️', name: 'Огненная глыба', text: 'удар по слабой сфере сильнее на 0,75', cost: 1, cd: 1, effect: { weak: 0.75 } },
    { id: 'm-iceblock', emoji: '🧊', name: 'Ледяная глыба', text: 'при поражении почти ничего не теряется', cost: 1, cd: 2, effect: { guard: 0.9 } },
    { id: 'm-arcane', emoji: '🌌', name: 'Мощь тайной магии', text: '+40% урона и сильнее удар по слабости (+0,25)', cost: 2, cd: 3, effect: { dmg: 0.4, weak: 0.25 } },
  ],
  b: [
    { id: 'b-hymn', emoji: '🎼', name: 'Гимн исцеления', text: '+15 здоровья сегодня', cost: 1, cd: 1, effect: { heal: 15 } },
    { id: 'b-luck', emoji: '🍀', name: 'Зов удачи', text: '+35% к шансу снаряжения за победу', cost: 1, cd: 1, effect: { loot: 0.35 } },
    { id: 'b-ballad', emoji: '🎤', name: 'Героическая баллада', text: '+25% урона, сильнее удар по слабости (+0,25) и +10 здоровья', cost: 2, cd: 3, effect: { dmg: 0.25, weak: 0.25, heal: 10 } },
  ],
  p: [
    { id: 'p-guard', emoji: '🛡', name: 'Божественная защита', text: 'поражение отнимает на 50% меньше здоровья', cost: 1, cd: 1, effect: { guard: 0.5 } },
    { id: 'p-justice', emoji: '⚖️', name: 'Правосудие', text: '+20% урона (а при здоровье ниже половины ещё +20%)', cost: 1, cd: 1, effect: { dmg: 0.2, comeback: 0.2 } },
    { id: 'p-hands', emoji: '🙏', name: 'Возложение рук', text: '+35 здоровья сегодня', cost: 2, cd: 3, effect: { heal: 35 } },
  ],
};

export const abilityById = (id: string): { cls: Cls; ability: ActiveAbility; spec?: Spec } | null => {
  for (const cls of ['w', 'm', 'b', 'p'] as Cls[]) {
    const a = ACTIVE_ABILITIES[cls].find((x) => x.id === id); if (a) return { cls, ability: a };
    const sp = SPECS[cls].find((x) => x.ability.id === id); if (sp) return { cls, ability: sp.ability, spec: sp.id };
  }
  return null;
};

/** Добавляет к бонусам эффекты применённых способностей (кроме неизвестных); power — сила способностей по уровню героя. */
export function withAbilities(bonus: GearBonus, ids: string[], power = 1): GearBonus {
  if (!ids.length) return bonus;
  const out: GearBonus = { ...bonus, dmgDomain: { ...bonus.dmgDomain } };
  for (const id of ids) {
    const a = abilityById(id)?.ability;
    if (!a) continue;
    for (const [k, v] of Object.entries(a.effect)) (out[k as keyof GearBonus] as number) += (v as number) * power;
  }
  return out;
}

/** Бонус специализации в бою с боссом: урон и слабость. */
export const specBossBonus = (cls: Cls | null, spec: Spec | null): { dmg: number; weak: number } => { const b = specOf(cls, spec)?.bonus ?? {}; return { dmg: b.dmg ?? 0, weak: (b.weak ?? 0) * 0.5 }; };

/** Способности в бою с боссом: урон дня и слабость босса сильнее. Слабость у босса вдвое мягче, чем у орды (базовые +25% против +50%). */
export function bossAbilityBonus(ids: string[], power = 1): { dmg: number; weak: number } {
  let dmg = 0, weak = 0;
  for (const id of ids) { const e = abilityById(id)?.ability.effect; if (!e) continue; dmg += (e.dmg ?? 0) * power; weak += (e.weak ?? 0) * 0.5 * power; }
  return { dmg, weak };
}

export interface AbilityStatus extends ActiveAbility { usedToday: boolean; readyIn: number; ready: boolean }
export interface AbilityView { list: AbilityStatus[]; focusLeft: number; focusMax: number; activeToday: string[]; power: number }

/** Состояние способностей героя на сегодня: что готово, что на перезарядке, сколько энергии осталось. */
export function abilityView(cls: Cls | null, uses: { ability: string; date: string }[], today: string, spec: Spec | null = null, level = 1): AbilityView {
  if (!cls) return { list: [], focusLeft: 0, focusMax: FOCUS_PER_DAY, activeToday: [], power: 1 };
  const todays = uses.filter((u) => u.date === today).map((u) => u.ability);
  const spent = todays.reduce((a, id) => a + (abilityById(id)?.ability.cost ?? 0), 0);
  const focusLeft = Math.max(0, FOCUS_PER_DAY - spent);
  const sp = specOf(cls, spec);
  const list = [...ACTIVE_ABILITIES[cls], ...(sp ? [sp.ability] : [])].map((a): AbilityStatus => {
    const last = uses.filter((u) => u.ability === a.id).map((u) => u.date).sort().pop();
    const since = last ? dayDiff(last, today) : Infinity;
    const readyIn = Math.max(0, a.cd - since);
    const usedToday = todays.includes(a.id);
    return { ...a, usedToday, readyIn, ready: readyIn === 0 && a.cost <= focusLeft };
  });
  return { list, focusLeft, focusMax: FOCUS_PER_DAY, activeToday: todays, power: abilityPower(level) };
}

/** Можно ли применить способность прямо сейчас: текст причины отказа или null. */
export function abilityBlocked(cls: Cls | null, id: string, uses: { ability: string; date: string }[], today: string, spec: Spec | null = null): string | null {
  const found = abilityById(id);
  if (!cls || !found || found.cls !== cls) return 'У вашего класса нет такой способности';
  if (found.spec && found.spec !== spec) return 'Эта способность открывается со специализацией';
  const st = abilityView(cls, uses, today, spec).list.find((x) => x.id === id)!;
  if (st.usedToday) return 'Сегодня уже применена';
  if (st.readyIn > 0) return `Перезарядка: ещё ${st.readyIn} дн.`;
  if (!st.ready) return 'Не хватает энергии на сегодня';
  return null;
}
