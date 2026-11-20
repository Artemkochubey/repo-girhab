import { seededRandom } from './quests';

/** Сферы развития, на которые делятся очки в бою (те же, что у классов). */
export type Domain = 'body' | 'mind' | 'art' | 'will';
export const DOMAINS: Domain[] = ['body', 'mind', 'art', 'will'];
export const DOMAIN_INFO: Record<Domain, { name: string; emoji: string; spheres: string[] }> = {
  body: { name: 'Тело', emoji: '💪', spheres: ['workout', 'warmup'] },
  mind: { name: 'Ум', emoji: '🧠', spheres: ['Учёба', 'Мышление', 'Книги', 'book'] },
  art: { name: 'Творчество', emoji: '🎨', spheres: ['Творчество', 'Навыки', 'Языки'] },
  will: { name: 'Дисциплина', emoji: '🔥', spheres: ['habits'] },
};
export const domainOf = (sphere: string): Domain | null => DOMAINS.find((d) => DOMAIN_INFO[d].spheres.includes(sphere)) ?? null;

export type Slot = 'weapon' | 'armor' | 'helm' | 'boots' | 'amulet';
export const SLOTS: Slot[] = ['weapon', 'armor', 'helm', 'boots', 'amulet'];
export const SLOT_INFO: Record<Slot, { name: string; emoji: string }> = {
  weapon: { name: 'Оружие', emoji: '🗡' }, armor: { name: 'Доспех', emoji: '🦺' }, helm: { name: 'Шлем', emoji: '⛑' },
  boots: { name: 'Сапоги', emoji: '👢' }, amulet: { name: 'Амулет', emoji: '🧿' },
};

export type GearRarity = 'common' | 'rare' | 'epic' | 'legend';
export const GEAR_RARITIES: GearRarity[] = ['common', 'rare', 'epic', 'legend'];
export const RARITY_NAMES: Record<GearRarity, string> = { common: 'Обычное', rare: 'Редкое', epic: 'Эпическое', legend: 'Легендарное' };

export type GearEffect =
  | { type: 'dmg'; pct: number }                              // +% урона всеми очками
  | { type: 'dmgDomain'; domain: Domain; pct: number }        // +% урона очками одной сферы
  | { type: 'guard'; pct: number }                            // −% потери здоровья при поражении
  | { type: 'hordeHp'; pct: number }                          // −% здоровья орды
  | { type: 'weak'; pct: number }                             // +к множителю слабости (базово ×1,5)
  | { type: 'heal'; hp: number }                              // +здоровья героя в день
  | { type: 'streak'; perDay: number; max: number }           // +% урона за каждый день серии побед
  | { type: 'wave1'; pct: number }                            // −% здоровья первой волны
  | { type: 'loot'; pct: number }                             // +к шансу снаряжения за победу
  | { type: 'winHeal'; hp: number };                          // +здоровья за победу

export interface GearItem { id: string; slot: Slot; rarity: GearRarity; family: string; name: string; emoji: string; text: string; effect: GearEffect }

type Gender = 'm' | 'f' | 'n' | 'p';
const ADJ: Record<Gender, string[]> = {
  m: ['Простой', 'Крепкий', 'Эпический', 'Легендарный'], f: ['Простая', 'Крепкая', 'Эпическая', 'Легендарная'],
  n: ['Простое', 'Крепкое', 'Эпическое', 'Легендарное'], p: ['Простые', 'Крепкие', 'Эпические', 'Легендарные'],
};
const pc = (x: number) => `${Math.round(x * 100)}%`;
const pc1 = (x: number) => `${(Math.round(x * 1000) / 10).toString().replace('.', ',')}%`;

interface Family { id: string; slot: Slot; noun: string; gender: Gender; emoji: string; make: (i: number) => GearEffect; text: (e: GearEffect) => string }
const V = <T,>(...a: T[]) => a;
const dmgV = V(0.05, 0.08, 0.12, 0.18), domV = V(0.1, 0.16, 0.24, 0.36), guardV = V(0.2, 0.35, 0.5, 0.7), hordeV = V(0.03, 0.05, 0.08, 0.12),
  weakV = V(0.05, 0.08, 0.12, 0.18), healV = V(2, 4, 6, 10), streakV = V(0.01, 0.015, 0.02, 0.03), waveV = V(0.05, 0.08, 0.12, 0.2),
  lootV = V(0.05, 0.08, 0.12, 0.2), winV = V(3, 5, 8, 12);
const at = <T,>(a: T[], i: number) => a[i] as T;

const FAMILIES: Family[] = [
  { id: 'sword', slot: 'weapon', noun: 'меч', gender: 'm', emoji: '🗡', make: (i) => ({ type: 'dmg', pct: at(dmgV, i) }), text: (e) => `Урон всеми очками +${pc((e as { pct: number }).pct)}` },
  ...(['body', 'mind', 'art', 'will'] as Domain[]).map((d): Family => {
    const n = { body: ['hammer', 'молот', 'm', '🔨'], mind: ['staff', 'посох', 'm', '🪄'], art: ['brush', 'кисть', 'f', '🖌'], will: ['banner', 'знамя', 'n', '🚩'] }[d] as [string, string, Gender, string];
    return { id: n[0], slot: 'weapon', noun: n[1], gender: n[2], emoji: n[3], make: (i) => ({ type: 'dmgDomain', domain: d, pct: at(domV, i) }), text: (e) => `Урон очками сферы «${DOMAIN_INFO[d].name}» +${pc((e as { pct: number }).pct)}` };
  }),
  { id: 'armor', slot: 'armor', noun: 'доспех', gender: 'm', emoji: '🦺', make: (i) => ({ type: 'guard', pct: at(guardV, i) }), text: (e) => `Поражение отнимает на ${pc((e as { pct: number }).pct)} меньше здоровья` },
  { id: 'shield', slot: 'armor', noun: 'щит', gender: 'm', emoji: '🛡', make: (i) => ({ type: 'hordeHp', pct: at(hordeV, i) }), text: (e) => `Орда слабее на ${pc((e as { pct: number }).pct)}` },
  { id: 'helm', slot: 'helm', noun: 'шлем', gender: 'm', emoji: '⛑', make: (i) => ({ type: 'weak', pct: at(weakV, i) }), text: (e) => `Урон по слабой сфере орды +${pc((e as { pct: number }).pct)}` },
  { id: 'crown', slot: 'helm', noun: 'венец', gender: 'm', emoji: '👑', make: (i) => ({ type: 'heal', hp: at(healV, i) }), text: (e) => `+${(e as { hp: number }).hp} здоровья в день` },
  { id: 'boots', slot: 'boots', noun: 'сапоги', gender: 'p', emoji: '👢', make: (i) => ({ type: 'streak', perDay: at(streakV, i), max: 7 }), text: (e) => `Урон +${pc1((e as { perDay: number }).perDay)} за каждый день серии побед (до 7)` },
  { id: 'sandals', slot: 'boots', noun: 'башмаки скорохода', gender: 'p', emoji: '🥾', make: (i) => ({ type: 'wave1', pct: at(waveV, i) }), text: (e) => `Первая волна слабее на ${pc((e as { pct: number }).pct)}` },
  { id: 'amulet', slot: 'amulet', noun: 'амулет', gender: 'm', emoji: '🧿', make: (i) => ({ type: 'loot', pct: at(lootV, i) }), text: (e) => `Шанс снаряжения за победу +${pc((e as { pct: number }).pct)}` },
  { id: 'medal', slot: 'amulet', noun: 'медальон', gender: 'm', emoji: '🏅', make: (i) => ({ type: 'winHeal', hp: at(winV, i) }), text: (e) => `+${(e as { hp: number }).hp} здоровья за победу` },
];

export const GEAR: GearItem[] = FAMILIES.flatMap((f) => GEAR_RARITIES.map((rarity, i): GearItem => {
  const effect = f.make(i);
  return { id: `${f.id}-${rarity}`, slot: f.slot, rarity, family: f.id, name: `${at(ADJ[f.gender], i)} ${f.noun}`, emoji: f.emoji, text: f.text(effect), effect };
}));
export const gearById = (id: string): GearItem | undefined => GEAR.find((g) => g.id === id);

export interface GearBonus {
  dmg: number; dmgDomain: Record<Domain, number>; guard: number; hordeHp: number; weak: number; heal: number;
  streakPer: number; streakMax: number; wave1: number; loot: number; winHeal: number;
  rage: number;       // +урона за каждую уже убитую волну (способность класса)
  comeback: number;   // +урона, пока здоровье героя ниже половины (способность класса)
  lossMult: number;   // +к потере здоровья при поражении, например 0,3 значит ×1,3 (слабость класса)
}
export const NO_GEAR: GearBonus = { dmg: 0, dmgDomain: { body: 0, mind: 0, art: 0, will: 0 }, guard: 0, hordeHp: 0, weak: 0, heal: 0, streakPer: 0, streakMax: 0, wave1: 0, loot: 0, winHeal: 0, rage: 0, comeback: 0, lossMult: 0 };

/** Суммарные бонусы надетых предметов (по одному на слот; лишние в слоте игнорируются). */
export function gearBonus(items: GearItem[]): GearBonus {
  const b: GearBonus = { ...NO_GEAR, dmgDomain: { ...NO_GEAR.dmgDomain } };
  const seen = new Set<Slot>();
  for (const it of items) {
    if (seen.has(it.slot)) continue;
    seen.add(it.slot);
    const e = it.effect;
    switch (e.type) {
      case 'dmg': b.dmg += e.pct; break;
      case 'dmgDomain': b.dmgDomain[e.domain] += e.pct; break;
      case 'guard': b.guard += e.pct; break;
      case 'hordeHp': b.hordeHp += e.pct; break;
      case 'weak': b.weak += e.pct; break;
      case 'heal': b.heal += e.hp; break;
      case 'streak': b.streakPer += e.perDay; b.streakMax = Math.max(b.streakMax, e.max); break;
      case 'wave1': b.wave1 += e.pct; break;
      case 'loot': b.loot += e.pct; break;
      case 'winHeal': b.winHeal += e.hp; break;
    }
  }
  return b;
}

// --- добыча ---
export type Weights = Partial<Record<GearRarity, number>>;
export const BATTLE_DROP: Weights = { common: 0.65, rare: 0.25, epic: 0.08, legend: 0.02 };
export const BOSS_DROP: Weights = { rare: 0.7, epic: 0.25, legend: 0.05 };
export const CHEST_GEAR_CHANCE = { common: 0.06, rare: 0.15, legend: 0.35 } as const;
export const CHEST_WEIGHTS: Record<'common' | 'rare' | 'legend', Weights> = {
  common: { common: 0.7, rare: 0.25, epic: 0.05 }, rare: { common: 0.3, rare: 0.5, epic: 0.17, legend: 0.03 }, legend: { rare: 0.3, epic: 0.5, legend: 0.2 },
};

function pickRarity(w: Weights, r: number): GearRarity {
  const total = GEAR_RARITIES.reduce((a, k) => a + (w[k] ?? 0), 0);
  let x = r * total;
  for (const k of GEAR_RARITIES) { const v = w[k] ?? 0; if (v > 0 && x < v) return k; x -= v; }
  return 'common';
}
/** Предмет по двум числам [0,1): редкость по весам, семейство поровну. */
export function pickGear(w: Weights, r1: number, r2: number): GearItem {
  const rarity = pickRarity(w, r1);
  const fam = FAMILIES[Math.min(FAMILIES.length - 1, Math.floor(r2 * FAMILIES.length))] as Family;
  return gearById(`${fam.id}-${rarity}`)!;
}
/** Детерминированный предмет по ключу (боссы): один и тот же ключ всегда даёт один и тот же предмет. */
export function gearFromKey(key: string, w: Weights): GearItem { const r = seededRandom('gear:' + key); return pickGear(w, r(), r()); }
/** Выпал ли предмет из сундука: r1 — шанс, r2 и r3 — предмет. */
export function rollChestGear(chest: 'common' | 'rare' | 'legend', r1: number, r2: number, r3: number): GearItem | null {
  return r1 < CHEST_GEAR_CHANCE[chest] ? pickGear(CHEST_WEIGHTS[chest], r2, r3) : null;
}

/** Предмет по ключу инвентаря (нужен до того, как собран весь инвентарь): battle:дата, boss:дата, chest:N. */
export function resolveGearKey(key: string, ctx: { battles: { date: string; drop: string | null }[]; chests: { n: number; gear: string | null }[] }): GearItem | null {
  const [kind, id = ''] = key.split(':');
  if (kind === 'battle') { const d = ctx.battles.find((b) => b.date === id)?.drop; return d ? gearById(d) ?? null : null; }
  if (kind === 'boss') return gearFromKey(key, BOSS_DROP);
  if (kind === 'chest') { const g = ctx.chests.find((c) => String(c.n) === id)?.gear; return g ? gearById(g) ?? null : null; }
  return null;
}

/** Надетый предмет с датой получения (для боссов: бонус действует только на дни после неё). */
export function resolveEquipped(equipped: { key: string }[], ctx: { battles: { date: string; drop: string | null }[]; chests: { n: number; date: string; gear: string | null }[] }): { key: string; item: GearItem; source: 'battle' | 'boss' | 'chest'; date: string }[] {
  const out: { key: string; item: GearItem; source: 'battle' | 'boss' | 'chest'; date: string }[] = [];
  for (const e of equipped) {
    const item = resolveGearKey(e.key, ctx);
    if (!item) continue;
    const [kind = '', id = ''] = e.key.split(':');
    const date = kind === 'chest' ? ctx.chests.find((c) => String(c.n) === id)?.date ?? '' : id;
    out.push({ key: e.key, item, source: kind as 'battle' | 'boss' | 'chest', date });
  }
  return out;
}

export interface GearEntry { key: string; itemId: string; source: 'battle' | 'boss' | 'chest'; date: string }
export interface GearOwned extends GearEntry { equipped: boolean }

/** Инвентарь из истории: добыча боя (сохранена), боссы (по ключу), сундуки (сохранено). */
export function deriveGear(i: {
  since: string | null;
  battles: { date: string; drop: string | null }[];
  bossWins: string[];
  chests: { n: number; date: string; gear: string | null }[];
  equipped: { slot: string; key: string }[];
}): GearOwned[] {
  const out: GearEntry[] = [];
  for (const b of i.battles) if (b.drop && gearById(b.drop)) out.push({ key: `battle:${b.date}`, itemId: b.drop, source: 'battle', date: b.date });
  for (const d of i.bossWins) if (i.since && d >= i.since) out.push({ key: `boss:${d}`, itemId: gearFromKey(`boss:${d}`, BOSS_DROP).id, source: 'boss', date: d });
  for (const c of i.chests) if (c.gear && gearById(c.gear)) out.push({ key: `chest:${c.n}`, itemId: c.gear, source: 'chest', date: c.date });
  const eq = new Set(i.equipped.map((e) => e.key));
  return out.sort((a, b) => (a.date === b.date ? (a.key < b.key ? -1 : 1) : a.date < b.date ? -1 : 1)).map((e) => ({ ...e, equipped: eq.has(e.key) }));
}

// --- названия по классам: один и тот же предмет у разных классов выглядит и называется по-разному (как типы брони в WoW) ---
import type { Cls } from './classes';
type G = 'm' | 'f' | 'n' | 'p';
const ADJ_BY: Record<G, string[]> = {
  m: ['Простой', 'Крепкий', 'Эпический', 'Легендарный'], f: ['Простая', 'Крепкая', 'Эпическая', 'Легендарная'],
  n: ['Простое', 'Крепкое', 'Эпическое', 'Легендарное'], p: ['Простые', 'Крепкие', 'Эпические', 'Легендарные'],
};
/** Название предмета по классу героя. Для нового вида (family) и класса: [существительное, род, эмодзи]. */
const CLASS_NOUN: Record<string, Record<Cls, [string, G, string]>> = {
  weapon: { w: ['меч', 'm', '🗡'], m: ['посох', 'm', '🪄'], b: ['лира', 'f', '🪕'], p: ['булава', 'f', '🔨'] },
  armor: { w: ['доспех', 'm', '🦺'], m: ['мантия', 'f', '🥻'], b: ['колет', 'm', '🧥'], p: ['латы', 'p', '🛡'] },
  shield: { w: ['щит', 'm', '🛡'], m: ['барьер', 'm', '🔮'], b: ['баклер', 'm', '🥁'], p: ['щит веры', 'm', '✝️'] },
  helm: { w: ['шлем', 'm', '⛑'], m: ['шляпа', 'f', '🎩'], b: ['берет', 'm', '🧢'], p: ['крылатый шлем', 'm', '👼'] },
  boots: { w: ['сапоги', 'p', '👢'], m: ['туфли', 'p', '🩴'], b: ['ботфорты', 'p', '🥾'], p: ['сабатоны', 'p', '👢'] },
};
const DOMAIN_OF_WEAPON: Record<Domain, string> = { body: 'силы', mind: 'мудрости', art: 'вдохновения', will: 'воли' };

export function gearDisplay(item: Pick<GearItem, 'slot' | 'family' | 'rarity' | 'name' | 'emoji'> & { effect: { type: string; domain?: Domain } }, cls: Cls | null): { name: string; emoji: string } {
  const ri = GEAR_RARITIES.indexOf(item.rarity);
  if (!cls) return { name: item.name, emoji: item.emoji };
  const kind = item.slot === 'weapon' ? 'weapon' : item.family === 'armor' ? 'armor' : item.family === 'shield' ? 'shield' : item.family === 'helm' ? 'helm' : item.family === 'boots' ? 'boots' : null;
  const n = kind ? CLASS_NOUN[kind]?.[cls] : null;
  if (!n) return { name: item.name, emoji: item.emoji };
  const suffix = item.effect.type === 'dmgDomain' && item.effect.domain ? ` ${DOMAIN_OF_WEAPON[item.effect.domain]}` : '';
  return { name: `${ADJ_BY[n[1]][ri]} ${n[0]}${suffix}`, emoji: n[2] };
}
