import { addDays } from '../date';
import { seededRandom } from './quests';
import { DOMAINS, DOMAIN_INFO, GEAR_RARITIES, NO_GEAR, BATTLE_DROP, domainOf, pickGear, type Domain, type GearBonus } from './gear';

/**
 * Личное сражение: каждый день новая орда из трёх волн. Каждая волна слаба к своей сфере (очки этой сферы бьют по ней ×1,5).
 * Урон наносят очки, которые герой и так зарабатывает за день, поэтому дополнительных записей не нужно.
 * Здоровье орды зависит от личной нормы героя; победа: убиты все три волны. Поражение отнимает здоровье героя, оно восстанавливается.
 */
export const HP_FACTOR = 1.2;                         // здоровье орды = норма × 1,2 × коэффициент дня
export const WAVE_SPLIT = [0.3, 0.33, 0.37] as const;
export const WEEKDAY_FACTOR = [1.2, 0.9, 1, 1, 1.05, 1.1, 1.2] as const;   // вс, пн, вт, ср, чт, пт, сб
export const WEAK_MULT = 0.5;                         // бонус урона по слабой сфере (×1,5)
export const MAX_HP = 100;
export const REGEN = 10;                              // здоровье героя за день
export const WIN_HP = 10;
export const LOSS_HP = 25;
export const WEAKENED_BELOW = 30;                     // ниже этого здоровья орда на 15% крепче
export const WEAKENED_PENALTY = 1.15;
export const DROP_CHANCE = { weekday: 0.35, weekend: 0.5 } as const;

export interface Horde { id: string; name: string; emoji: string; units: [string, string, string] }
export const HORDES: Horde[] = [
  { id: 'goblins', name: 'Орда гоблинов', emoji: '👺', units: ['Гоблины-разведчики', 'Гоблины-копейщики', 'Король гоблинов'] },
  { id: 'skeletons', name: 'Армия скелетов', emoji: '💀', units: ['Костяные стражи', 'Скелеты-лучники', 'Лорд костей'] },
  { id: 'orcs', name: 'Племя орков', emoji: '👹', units: ['Орки-разведчики', 'Орки-секироносцы', 'Вождь орков'] },
  { id: 'wolves', name: 'Стая волков', emoji: '🐺', units: ['Молодые волки', 'Матёрые волки', 'Вожак стаи'] },
  { id: 'ghosts', name: 'Призрачный легион', emoji: '👻', units: ['Тени', 'Привидения', 'Король призраков'] },
  { id: 'spiders', name: 'Рой пауков', emoji: '🕷', units: ['Паучата', 'Ядовитые пауки', 'Королева пауков'] },
  { id: 'trolls', name: 'Горные тролли', emoji: '🧌', units: ['Малые тролли', 'Каменные тролли', 'Тролль-великан'] },
  { id: 'bandits', name: 'Шайка разбойников', emoji: '🥷', units: ['Воришки', 'Головорезы', 'Атаман'] },
  { id: 'slimes', name: 'Болотные слизни', emoji: '🟢', units: ['Слизнята', 'Огромные слизни', 'Слизень-царь'] },
  { id: 'imps', name: 'Полчище бесов', emoji: '😈', units: ['Бесенята', 'Рогатые бесы', 'Князь бесов'] },
];

const ordinal = (date: string) => Math.floor(Date.parse(date + 'T00:00:00Z') / 86_400_000);
export const weekdayOf = (date: string) => new Date(date + 'T00:00:00Z').getUTCDay();
export const isWeekend = (date: string) => { const w = weekdayOf(date); return w === 0 || w === 6; };

export interface Wave { unit: string; weak: Domain; hp: number }
export interface HordeDay { horde: Horde; weak: [Domain, Domain, Domain]; factor: number }

/** Орда дня общая для семьи: какая орда и к чему слаба каждая волна. */
export function hordeOfDay(date: string): HordeDay {
  const horde = HORDES[ordinal(date) % HORDES.length] as Horde;
  const r = seededRandom('waves:' + date);
  const pool = [...DOMAINS];
  const weak: Domain[] = [];
  while (weak.length < 3) weak.push(pool.splice(Math.floor(r() * pool.length), 1)[0] as Domain);
  return { horde, weak: weak as [Domain, Domain, Domain], factor: WEEKDAY_FACTOR[weekdayOf(date)] as number };
}

/** Волны для героя: здоровье по личной норме, броня и сапоги ослабляют, низкое здоровье героя усиливает орду. */
export function wavesFor(day: HordeDay, goal: number, bonus: GearBonus, weakened: boolean): { waves: Wave[]; totalHp: number } {
  const total = Math.max(10, Math.round(goal * HP_FACTOR * day.factor * (1 - Math.min(0.5, bonus.hordeHp)) * (weakened ? WEAKENED_PENALTY : 1)));
  const waves = day.horde.units.map((unit, i) => ({
    unit, weak: day.weak[i] as Domain,
    hp: Math.max(1, Math.round(total * (WAVE_SPLIT[i] as number) * (i === 0 ? 1 - Math.min(0.5, bonus.wave1) : 1))),
  }));
  return { waves, totalHp: waves.reduce((a, w) => a + w.hp, 0) };
}

export type Pools = Record<Domain | 'gen', number>;
/** Очки дня по сферам: «общие» — всё, что не привязано к сфере (бонусы за день, квесты). */
export function poolsOf(bySphere: Partial<Record<string, number>>, total: number): Pools {
  const p: Pools = { body: 0, mind: 0, art: 0, will: 0, gen: 0 };
  let used = 0;
  for (const [s, v] of Object.entries(bySphere)) { const d = domainOf(s); if (d && v) { p[d] += v; used += v; } }
  p.gen = Math.max(0, total - used);
  return p;
}

export interface WaveResult extends Wave { damage: number; cleared: boolean }
export interface Fight { waves: WaveResult[]; cleared: number; damage: number; outcome: 'victory' | 'held' | 'defeat' }

/**
 * Каждая волна сначала получает урон от очков своей слабой сферы (×1,5), остаток добивается любыми очками
 * (сначала общими, потом «ненужными» следующим волнам сферами). Очки, потраченные на одну волну, на следующие не идут.
 */
export function fight(pools: Pools, waves: Wave[], bonus: GearBonus = NO_GEAR, streak = 0, hp = MAX_HP): Fight {
  const left: Pools = { ...pools };
  const streakPct = Math.min(streak, bonus.streakMax) * bonus.streakPer;
  // «возмездие» паладина: пока здоровье героя ниже половины, урон выше; «ярость» воина растёт с каждой убитой волной
  const comeback = hp < MAX_HP / 2 ? bonus.comeback : 0;
  let rage = 0;
  const mult = (d: Domain | 'gen', weak: boolean) => (1 + bonus.dmg + streakPct + comeback + rage + (d === 'gen' ? 0 : bonus.dmgDomain[d])) * (weak ? 1 + WEAK_MULT + bonus.weak : 1);
  const results: WaveResult[] = [];
  let dead = false;
  for (const [idx, w] of waves.entries()) {
    let need = w.hp, dealt = 0;
    if (!dead) {
      // остаток добивается общими очками, потом сферами, которые не нужны следующим волнам (их слабые сферы берегутся)
      const later = new Set(waves.slice(idx + 1).map((x) => x.weak));
      const others = DOMAINS.filter((d) => d !== w.weak);
      const order: (Domain | 'gen')[] = [w.weak, 'gen', ...others.filter((d) => !later.has(d)), ...others.filter((d) => later.has(d))];
      for (const d of order) {
        if (need <= 1e-9 || left[d] <= 0) continue;
        const m = mult(d, d === w.weak);
        const dmg = Math.min(need, left[d] * m);
        left[d] -= dmg / m; need -= dmg; dealt += dmg;
      }
    }
    const cleared = need <= 1e-9 && !dead;
    if (cleared) rage += bonus.rage;
    if (!cleared) dead = true;   // следующие волны не трогаем, пока предыдущая не убита
    results.push({ ...w, damage: Math.round(dealt * 10) / 10, cleared });
  }
  const cleared = results.filter((r) => r.cleared).length;
  return { waves: results, cleared, damage: Math.round(results.reduce((a, r) => a + r.damage, 0) * 10) / 10, outcome: cleared >= 3 ? 'victory' : cleared === 2 ? 'held' : 'defeat' };
}

export interface BattleRow { date: string; hordeId: string; totalHp: number; cleared: number; win: boolean; regen: number; hpDelta: number; xp: number; drop: string | null }

const r5 = (n: number) => Math.max(5, Math.round(n / 5) * 5);
export const victoryXp = (goal: number) => r5(goal * 0.4);

/** Здоровье героя после дня: восстановление, затем итог боя. */
export const hpAfter = (before: number, row: Pick<BattleRow, 'regen' | 'hpDelta'>) => Math.max(0, Math.min(MAX_HP, Math.min(MAX_HP, before + row.regen) + row.hpDelta));

export interface DayData { bySphere: Partial<Record<string, number>>; total: number }
export interface SimInput {
  memberId: number; goal: number; from: string; to: string;     // дни от from до to (включительно) закрываются итогами
  persisted: BattleRow[]; day: (date: string) => DayData | null; bonus: GearBonus;
  bonusFor?: (date: string) => GearBonus;   // бонусы конкретного дня (с примененными способностями); по умолчанию bonus
}
export interface SimResult { rows: BattleRow[]; pending: BattleRow[]; hp: number; streak: number }

/** Закрывает прошедшие дни по порядку: готовые итоги берутся как есть, недостающие считаются и ждут сохранения. */
export function simulate(i: SimInput): SimResult {
  const known = new Map(i.persisted.map((r) => [r.date, r]));
  const rows: BattleRow[] = [], pending: BattleRow[] = [];
  let hp = MAX_HP, streak = 0;
  for (let d = i.from; d <= i.to; d = addDays(d, 1)) {
    let row = known.get(d);
    if (!row) {
      const bonus = i.bonusFor ? i.bonusFor(d) : i.bonus;
      const hpDay = Math.min(MAX_HP, hp + REGEN + bonus.heal);
      const hd = hordeOfDay(d);
      const { waves, totalHp } = wavesFor(hd, i.goal, bonus, hpDay < WEAKENED_BELOW);
      const data = i.day(d) ?? { bySphere: {}, total: 0 };
      const f = fight(poolsOf(data.bySphere, data.total), waves, bonus, streak, hpDay);
      const win = f.outcome === 'victory';
      const hpDelta = win ? WIN_HP + bonus.winHeal : f.outcome === 'defeat' ? -Math.round(LOSS_HP * (1 - Math.min(0.9, bonus.guard)) * (1 + bonus.lossMult)) : 0;
      const r = seededRandom(`drop:${i.memberId}:${d}`);
      const chance = (isWeekend(d) ? DROP_CHANCE.weekend : DROP_CHANCE.weekday) + bonus.loot;
      const drop = win && r() < chance ? pickGear(BATTLE_DROP, r(), r()).id : null;
      row = { date: d, hordeId: hd.horde.id, totalHp, cleared: f.cleared, win, regen: REGEN + bonus.heal, hpDelta, xp: win ? victoryXp(i.goal) : 0, drop };
      pending.push(row);
    }
    hp = hpAfter(hp, row);
    streak = row.win ? streak + 1 : 0;
    rows.push(row);
  }
  return { rows, pending, hp, streak };
}

export interface LiveBattle {
  date: string; horde: Horde; factor: number; weakened: boolean; hp: number; maxHp: number; streak: number; totalHp: number;
  fight: Fight; weakDomains: Domain[]; winChance: number; xp: number; weekend: boolean;
}

/** Сегодняшний бой: считается на лету по текущим очкам и надетому снаряжению. */
export function liveBattle(i: { date: string; goal: number; hpYesterday: number; streak: number; bonus: GearBonus; data: DayData }): LiveBattle {
  const hp = Math.min(MAX_HP, i.hpYesterday + REGEN + i.bonus.heal);
  const weakened = hp < WEAKENED_BELOW;
  const hd = hordeOfDay(i.date);
  const { waves, totalHp } = wavesFor(hd, i.goal, i.bonus, weakened);
  const f = fight(poolsOf(i.data.bySphere, i.data.total), waves, i.bonus, i.streak, hp);
  return {
    date: i.date, horde: hd.horde, factor: hd.factor, weakened, hp, maxHp: MAX_HP, streak: i.streak, totalHp, fight: f,
    weakDomains: hd.weak, winChance: Math.min(1, (isWeekend(i.date) ? DROP_CHANCE.weekend : DROP_CHANCE.weekday) + i.bonus.loot),
    xp: victoryXp(i.goal), weekend: isWeekend(i.date),
  };
}

export { DOMAIN_INFO, GEAR_RARITIES };
