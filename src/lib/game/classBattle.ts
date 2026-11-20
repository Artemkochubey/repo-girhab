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

/** Бонусы снаряжения плюс способности класса (для личного боя). Класс не выбран: только снаряжение. */
export function withClass(gear: GearBonus, cls: Cls | null): GearBonus {
  if (!cls) return gear;
  const c = CLASS_BATTLE[cls].bonus;
  const out: GearBonus = { ...gear, dmgDomain: { ...gear.dmgDomain } };
  for (const [k, v] of Object.entries(c)) {
    const key = k as keyof GearBonus;
    if (key === 'dmgDomain' || key === 'streakMax') continue;
    (out[key] as number) += v as number;
  }
  return out;
}
export const classOnly = (cls: Cls | null): GearBonus => withClass(NO_GEAR, cls);
