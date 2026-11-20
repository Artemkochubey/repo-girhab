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

/**
 * Комплекты: несколько надетых предметов одной редкости дают дополнительный бонус.
 * 3 предмета одной редкости: бонус «из трёх», 5 предметов (все слоты): к нему добавляется бонус «из пяти».
 */
export const SET_NAMES: Record<GearRarity, string> = { common: 'Путник', rare: 'Страж', epic: 'Герой', legend: 'Легенда' };
export const SET_BONUS: Record<GearRarity, { three: Partial<GearBonus>; five: Partial<GearBonus> }> = {
  common: { three: { dmg: 0.02 }, five: { heal: 3, guard: 0.05 } },
  rare: { three: { dmg: 0.04 }, five: { heal: 5, weak: 0.05 } },
  epic: { three: { dmg: 0.06 }, five: { weak: 0.1, guard: 0.1, heal: 6 } },
  legend: { three: { dmg: 0.08 }, five: { dmg: 0.07, weak: 0.15, guard: 0.15, heal: 10 } },
};
export const SET_PIECES = { three: 3, five: 5 } as const;

const addBonus = (b: GearBonus, patch: Partial<GearBonus>) => { for (const [k, v] of Object.entries(patch)) { if (typeof v === 'number') (b[k as keyof GearBonus] as number) += v; } };

/** Короткое описание бонуса словами: «+4% урона, +5 здоровья в день». */
export function bonusText(p: Partial<GearBonus>): string {
  const pc = (x: number) => `${Math.round(x * 100)}%`;
  const out: string[] = [];
  if (p.dmg) out.push(`+${pc(p.dmg)} урона`);
  if (p.weak) out.push(`удар по слабости +${p.weak.toString().replace('.', ',')}`);
  if (p.guard) out.push(`потери при поражении −${pc(p.guard)}`);
  if (p.heal) out.push(`+${p.heal} здоровья в день`);
  if (p.winHeal) out.push(`+${p.winHeal} здоровья за победу`);
  if (p.hordeHp) out.push(`орда слабее на ${pc(p.hordeHp)}`);
  if (p.loot) out.push(`+${pc(p.loot)} к шансу снаряжения`);
  return out.join(', ');
}

export interface SetState { rarity: GearRarity; name: string; pieces: number; threeOn: boolean; fiveOn: boolean }
/** Комплекты надетого снаряжения: по каждой редкости, где есть хотя бы 2 предмета. */
export function activeSets(items: Pick<GearItem, 'slot' | 'rarity'>[]): SetState[] {
  const seen = new Set<Slot>();
  const count = new Map<GearRarity, number>();
  for (const it of items) { if (seen.has(it.slot)) continue; seen.add(it.slot); count.set(it.rarity, (count.get(it.rarity) ?? 0) + 1); }
  return GEAR_RARITIES.filter((r) => (count.get(r) ?? 0) >= 2).map((r) => ({ rarity: r, name: SET_NAMES[r], pieces: count.get(r)!, threeOn: count.get(r)! >= SET_PIECES.three, fiveOn: count.get(r)! >= SET_PIECES.five }));
}

/** Эффекты брони и здоровья в бою с боссом: небольшая прибавка к урону (защита, лечение, слабость орды дают силу и там). Не больше +20%. */
export const BOSS_ARMOR_CAP = 0.2;
export const bossArmor = (b: GearBonus): number => Math.min(BOSS_ARMOR_CAP, b.guard * 0.1 + b.hordeHp * 0.5 + b.heal * 0.003 + b.winHeal * 0.002);

/** Суммарные бонусы надетых предметов (по одному на слот; лишние в слоте игнорируются) и бонусы комплектов. */
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
  for (const s of activeSets(items)) { if (s.threeOn) addBonus(b, SET_BONUS[s.rarity].three); if (s.fiveOn) addBonus(b, SET_BONUS[s.rarity].five); }
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
export interface MergeRow { id: number; consumed: string[]; itemId: string; date: string }

export function resolveGearKey(key: string, ctx: { battles: { date: string; drop: string | null }[]; chests: { n: number; gear: string | null }[]; merges?: MergeRow[] }): GearItem | null {
  const [kind, id = ''] = key.split(':');
  if (kind === 'merge') { const m = ctx.merges?.find((x) => String(x.id) === id); return m ? gearById(m.itemId) ?? null : null; }
  if (kind === 'battle') { const d = ctx.battles.find((b) => b.date === id)?.drop; return d ? gearById(d) ?? null : null; }
  if (kind === 'boss') return gearFromKey(key, BOSS_DROP);
  if (kind === 'chest') { const g = ctx.chests.find((c) => String(c.n) === id)?.gear; return g ? gearById(g) ?? null : null; }
  return null;
}

/** Надетый предмет с датой получения (для боссов: бонус действует только на дни после неё). */
export function resolveEquipped(equipped: { key: string }[], ctx: { battles: { date: string; drop: string | null }[]; chests: { n: number; date: string; gear: string | null }[]; merges?: MergeRow[] }): { key: string; item: GearItem; source: GearSource; date: string }[] {
  const out: { key: string; item: GearItem; source: GearSource; date: string }[] = [];
  for (const e of equipped) {
    const item = resolveGearKey(e.key, ctx);
    if (!item) continue;
    const [kind = '', id = ''] = e.key.split(':');
    const date = kind === 'chest' ? ctx.chests.find((c) => String(c.n) === id)?.date ?? '' : kind === 'merge' ? ctx.merges?.find((m) => String(m.id) === id)?.date ?? '' : id;
    out.push({ key: e.key, item, source: kind as GearSource, date });
  }
  return out;
}

export type GearSource = 'battle' | 'boss' | 'chest' | 'merge';
export interface GearEntry { key: string; itemId: string; source: GearSource; date: string }
export interface GearOwned extends GearEntry { equipped: boolean }

/** Инвентарь из истории: добыча боя (сохранена), боссы (по ключу), сундуки (сохранено). */
export function deriveGear(i: {
  since: string | null;
  battles: { date: string; drop: string | null }[];
  bossWins: string[];
  chests: { n: number; date: string; gear: string | null }[];
  equipped: { slot: string; key: string }[];
  merges?: MergeRow[];
}): GearOwned[] {
  const out: GearEntry[] = [];
  for (const b of i.battles) if (b.drop && gearById(b.drop)) out.push({ key: `battle:${b.date}`, itemId: b.drop, source: 'battle', date: b.date });
  for (const d of i.bossWins) if (i.since && d >= i.since) out.push({ key: `boss:${d}`, itemId: gearFromKey(`boss:${d}`, BOSS_DROP).id, source: 'boss', date: d });
  for (const c of i.chests) if (c.gear && gearById(c.gear)) out.push({ key: `chest:${c.n}`, itemId: c.gear, source: 'chest', date: c.date });
  // слияния: «съеденные» предметы уходят из инвентаря, результат появляется под ключом merge:id
  const eaten = new Set((i.merges ?? []).flatMap((m) => m.consumed));
  const kept = out.filter((e) => !eaten.has(e.key));
  for (const m of i.merges ?? []) if (gearById(m.itemId) && !eaten.has(`merge:${m.id}`)) kept.push({ key: `merge:${m.id}`, itemId: m.itemId, source: 'merge', date: m.date });
  const eq = new Set(i.equipped.map((e) => e.key));
  return kept.sort((a, b) => (a.date === b.date ? (a.key < b.key ? -1 : 1) : a.date < b.date ? -1 : 1)).map((e) => ({ ...e, equipped: eq.has(e.key) }));
}

// --- слияние: три одинаковых предмета в один следующей редкости ---
export const nextRarity = (r: GearRarity): GearRarity | null => GEAR_RARITIES[GEAR_RARITIES.indexOf(r) + 1] ?? null;
export const MERGE_COUNT = 3;

/** Проверка слияния: ровно три разных предмета одного вида и одной редкости, не легендарных. Возвращает id результата или текст ошибки. */
export function mergeCheck(items: { key: string; itemId: string }[]): { ok: true; resultId: string } | { ok: false; error: string } {
  if (items.length !== MERGE_COUNT) return { ok: false, error: `Нужно ровно ${MERGE_COUNT} предмета` };
  if (new Set(items.map((x) => x.key)).size !== MERGE_COUNT) return { ok: false, error: 'Предметы должны быть разными' };
  const first = gearById(items[0]!.itemId);
  if (!first) return { ok: false, error: 'Неизвестный предмет' };
  if (items.some((x) => x.itemId !== first.id)) return { ok: false, error: 'Сливать можно только одинаковые предметы' };
  const next = nextRarity(first.rarity);
  if (!next) return { ok: false, error: 'Легендарные предметы не сливаются: выше уже некуда' };
  return { ok: true, resultId: `${first.family}-${next}` };
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
/** Названия оружия и доспеха по классу и редкости: у каждого свой вид (меч, палаш, фламберг, клеймор и т.д.). */
export const TIER_NAMES: Record<'weapon' | 'armor' | 'helm' | 'boots' | 'shield', Record<Cls, [string, string, string, string]>> = {
  weapon: {
    w: ['Короткий меч', 'Палаш', 'Фламберг', 'Клеймор'],
    m: ['Деревянный посох', 'Посох с кристаллом', 'Посох звёздного кольца', 'Посох архимага'],
    b: ['Простая лютня', 'Лютня мастера', 'Серебряная лира', 'Золотая лира'],
    p: ['Дубина', 'Шипастая булава', 'Боевой молот', 'Солнечный скипетр'],
  },
  armor: {
    w: ['Стёганка', 'Кольчуга', 'Латный доспех', 'Доспех героя'],
    m: ['Простая ряса', 'Ряса с поясом', 'Звёздная мантия', 'Одеяние архимага'],
    b: ['Жилет', 'Колет со шнуровкой', 'Камзол менестреля', 'Парадный камзол'],
    p: ['Табард', 'Кираса', 'Латы с крыльями', 'Сияющие латы'],
  },
  helm: {
    w: ['Шлем-шапка', 'Шлем с наносником', 'Рогатый шлем', 'Шлем с плюмажем'],
    m: ['Остроконечная шляпа', 'Шляпа с лентой', 'Звёздная шляпа', 'Шляпа архимага'],
    b: ['Простой берет', 'Берет с пером', 'Шляпа менестреля', 'Парадная шляпа'],
    p: ['Кольчужный капюшон', 'Шлем с крестом', 'Крылатый шлем', 'Нимб света'],
  },
  boots: {
    w: ['Кожаные сапоги', 'Сапоги с отворотами', 'Окованные сапоги', 'Сапоги героя'],
    m: ['Мягкие туфли', 'Туфли с загнутыми носами', 'Звёздные туфли', 'Туфли архимага'],
    b: ['Простые ботфорты', 'Ботфорты с пряжками', 'Ботфорты менестреля', 'Золотые ботфорты'],
    p: ['Простые сабатоны', 'Сабатоны с крестом', 'Крылатые сабатоны', 'Сияющие сабатоны'],
  },
  shield: {
    w: ['Деревянный щит', 'Окантованный щит', 'Щит с умбоном', 'Щит героя'],
    m: ['Слабый барьер', 'Руническое поле', 'Звёздный барьер', 'Купол архимага'],
    b: ['Малый баклер', 'Баклер с барабанной кожей', 'Резонирующий баклер', 'Золотой баклер'],
    p: ['Простой щит веры', 'Щит с крестом', 'Крылатый щит', 'Щит рассвета'],
  },
};
const DOMAIN_OF_WEAPON: Record<Domain, string> = { body: 'силы', mind: 'мудрости', art: 'вдохновения', will: 'воли' };

export function gearDisplay(item: Pick<GearItem, 'slot' | 'family' | 'rarity' | 'name' | 'emoji'> & { effect: { type: string; domain?: Domain } }, cls: Cls | null): { name: string; emoji: string } {
  const ri = GEAR_RARITIES.indexOf(item.rarity);
  if (!cls) return { name: item.name, emoji: item.emoji };
  const kind = item.slot === 'weapon' ? 'weapon' : item.family === 'armor' ? 'armor' : item.family === 'shield' ? 'shield' : item.family === 'helm' ? 'helm' : item.family === 'boots' ? 'boots' : null;
  const n = kind ? CLASS_NOUN[kind]?.[cls] : null;
  if (!n) return { name: item.name, emoji: item.emoji };
  if (kind === 'weapon' || kind === 'armor' || kind === 'helm' || kind === 'boots' || kind === 'shield') {
    const base = TIER_NAMES[kind][cls][ri] as string;
    const suffix = kind === 'weapon' && item.effect.type === 'dmgDomain' && item.effect.domain ? ` ${DOMAIN_OF_WEAPON[item.effect.domain]}` : '';
    return { name: `${base}${suffix}`, emoji: n[2] };
  }
  const suffix = item.effect.type === 'dmgDomain' && item.effect.domain ? ` ${DOMAIN_OF_WEAPON[item.effect.domain]}` : '';
  return { name: `${ADJ_BY[n[1]][ri]} ${n[0]}${suffix}`, emoji: n[2] };
}
