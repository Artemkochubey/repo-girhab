import { describe, it, expect } from 'vitest';
import { isWeekend, ELITE_HORDES, ELITE_DROP, EVENTS, XP_MULT, eventOf, hordeById, rewardsOfDay, MAX_HP, REGEN, WEAKENED_BELOW, fight, hordeOfDay, liveBattle, poolsOf, simulate, wavesFor, hpAfter, victoryXp, type BattleRow } from './battle';
import { GEAR, NO_GEAR, deriveGear, gearBonus, gearById, gearFromKey, pickGear, rollChestGear, BOSS_DROP, BATTLE_DROP, type Domain } from './gear';

const waves = (weak: Domain[], hp = [20, 20, 20]) => weak.map((w, i) => ({ unit: 'u' + i, weak: w, hp: hp[i] as number }));
const P = (o: Partial<Record<Domain | 'gen', number>> = {}) => ({ body: 0, mind: 0, art: 0, will: 0, gen: 0, ...o });

describe('орда дня', () => {
  it('орда и слабости зависят только от даты, у каждой орды три волны со слабостями из трёх разных сфер', () => {
    const a = hordeOfDay('2026-11-20');
    expect(hordeOfDay('2026-11-20')).toEqual(a);
    expect(new Set(a.weak).size).toBe(3);
    expect(hordeOfDay('2026-11-21').horde.id).not.toBe(a.horde.id);        // каждый день новая орда
    const weekdays = Array.from({ length: 19 }, (_, i) => `2026-12-${String(i + 1).padStart(2, '0')}`).filter((d) => !isWeekend(d));
    expect(new Set(weekdays.map((d) => hordeOfDay(d).horde.id)).size).toBeGreaterThanOrEqual(8);   // в будни орды разные
  });
  it('здоровье орды по личной норме: у младшего меньше, по выходным больше, броня и низкое здоровье героя меняют', () => {
    const day = { ...hordeOfDay('2026-11-17'), factor: 1 };        // вторник
    expect(wavesFor(day, 60, NO_GEAR, false).totalHp).toBeCloseTo(72, -1);
    expect(wavesFor(day, 40, NO_GEAR, false).totalHp).toBeLessThan(wavesFor(day, 60, NO_GEAR, false).totalHp);
    expect(wavesFor({ ...day, factor: 1.2 }, 60, NO_GEAR, false).totalHp).toBeGreaterThan(wavesFor(day, 60, NO_GEAR, false).totalHp);
    expect(wavesFor(day, 60, { ...NO_GEAR, hordeHp: 0.1 }, false).totalHp).toBeLessThan(72);
    expect(wavesFor(day, 60, NO_GEAR, true).totalHp).toBeGreaterThan(72);
    const w = wavesFor(day, 60, { ...NO_GEAR, wave1: 0.2 }, false).waves;
    expect(w[0]!.hp).toBeLessThan(wavesFor(day, 60, NO_GEAR, false).waves[0]!.hp);
  });
  it('очки делятся по сферам, остальное — общие', () => {
    expect(poolsOf({ workout: 20, warmup: 10, Учёба: 15, habits: 5 }, 60)).toEqual({ body: 30, mind: 15, art: 0, will: 5, gen: 10 });
  });
});

describe('бой с ордой', () => {
  it('очки слабой сферы бьют ×1,5; сбалансированный день у нормы побеждает', () => {
    const f = fight(P({ body: 30, mind: 20, will: 10 }), waves(['body', 'mind', 'will'], [21.6, 23.8, 26.6]));
    expect(f.outcome).toBe('victory');
    expect(f.cleared).toBe(3);
    const only = fight(P({ body: 14.4 }), waves(['body', 'mind', 'will'], [21.6, 23.8, 26.6]));
    expect(only.waves[0]!.cleared).toBe(true);                         // 14,4 × 1,5 = 21,6
  });
  it('очки одной сферы вне слабости дают ×1: поэтому один вид занятий требует больше очков', () => {
    const w = waves(['mind', 'art', 'will'], [20, 20, 20]);
    expect(fight(P({ body: 40 }), w).outcome).toBe('held');   // 40 очков одной сферы: две волны убиты, на третью не хватает
    expect(fight(P({ body: 60 }), w).outcome).toBe('victory');
  });
  it('волны идут по порядку: пока не убита предыдущая, следующая не бьётся', () => {
    const f = fight(P({ will: 120 }), waves(['body', 'mind', 'will'], [100, 10, 10]));
    expect(f.waves.map((x) => x.cleared)).toEqual([true, true, true]);   // остаток очков воли (20) переходит на следующие волны
    const stuck = fight(P({ body: 5, mind: 50 }), waves(['body', 'mind', 'will'], [100, 10, 10]));
    expect(stuck.waves.map((x) => x.cleared)).toEqual([false, false, false]);   // пока первая не убита, остальные не бьются
  });
  it('исходы: 3 волны — победа, 2 — отбились, 0–1 — поражение', () => {
    const w = waves(['body', 'mind', 'will'], [10, 10, 10]);
    expect(fight(P({ body: 20, mind: 20, will: 20 }), w).outcome).toBe('victory');
    expect(fight(P({ body: 7, mind: 7 }), w).outcome).toBe('held');
    expect(fight(P({ body: 7 }), w).outcome).toBe('defeat');
    expect(fight(P(), w)).toMatchObject({ cleared: 0, outcome: 'defeat', damage: 0 });
  });
  it('снаряжение усиливает урон: меч, оружие сферы, слабость, серия побед', () => {
    const w = waves(['body', 'mind', 'will'], [30, 30, 30]);
    const base = fight(P({ gen: 70 }), w).damage;
    expect(fight(P({ gen: 70 }), w, { ...NO_GEAR, dmg: 0.2 }).damage).toBeGreaterThan(base);
    const d1 = fight(P({ body: 10 }), w, NO_GEAR).waves[0]!.damage;
    expect(fight(P({ body: 10 }), w, { ...NO_GEAR, dmgDomain: { ...NO_GEAR.dmgDomain, body: 0.5 } }).waves[0]!.damage).toBeGreaterThan(d1);
    expect(fight(P({ body: 10 }), w, { ...NO_GEAR, weak: 0.5 }).waves[0]!.damage).toBeGreaterThan(d1);
    expect(fight(P({ body: 10 }), w, { ...NO_GEAR, streakPer: 0.05, streakMax: 7 }, 3).waves[0]!.damage).toBeGreaterThan(d1);
    expect(fight(P({ body: 10 }), w, { ...NO_GEAR, streakPer: 0.05, streakMax: 7 }, 100).waves[0]!.damage).toBeCloseTo(15 * 1.35, 0);   // серия считается не больше max дней
  });
});

describe('здоровье и дни', () => {
  const day = (total: number, bySphere = {}) => () => ({ bySphere, total });
  const sim = (o: Partial<Parameters<typeof simulate>[0]> = {}) => simulate({ memberId: 1, goal: 60, from: '2026-11-16', to: '2026-11-18', persisted: [], day: day(0), bonus: NO_GEAR, ...o });
  it('без активности: поражения отнимают здоровье, восстановление его возвращает, серия побед 0', () => {
    const r = sim();
    expect(r.rows).toHaveLength(3);
    expect(r.rows.every((x) => x.cleared === 0 && !x.win && x.hpDelta === -25)).toBe(true);
    // день 1: 100 + 10 → 100 − 25 = 75; день 2: 85 − 25 = 60; день 3: 70 − 25 = 45
    expect(r.hp).toBe(45);
    expect(r.streak).toBe(0);
    expect(r.pending).toHaveLength(3);
  });
  it('здоровье не уходит ниже нуля и не выше максимума; при низком здоровье орда крепче', () => {
    expect(hpAfter(5, { regen: 0, hpDelta: -25 })).toBe(0);
    expect(hpAfter(95, { regen: 10, hpDelta: 10 })).toBe(MAX_HP);
    const long = sim({ from: '2026-11-01', to: '2026-11-18' });
    const last = long.rows[long.rows.length - 1]!;
    expect(long.hp).toBeGreaterThanOrEqual(0);
    expect(long.hp).toBeLessThan(WEAKENED_BELOW + 40);
    expect(last.totalHp).toBeGreaterThanOrEqual(long.rows[0]!.totalHp * 0.8);
  });
  it('победа: опыт, здоровье, серия; готовые итоги не пересчитываются, пересчёт только недостающих дней', () => {
    const win = sim({ day: day(200, { workout: 70, Учёба: 70, habits: 60 }) });
    expect(win.rows.every((x) => x.win && x.xp === victoryXp(60))).toBe(true);
    expect(win.streak).toBe(3);
    expect(win.hp).toBe(MAX_HP);
    const keep: BattleRow = { ...win.rows[0]!, win: false, cleared: 0, hpDelta: -25, xp: 0, drop: null };
    const again = sim({ persisted: [keep], day: day(200, { workout: 70, Учёба: 70, habits: 60 }) });
    expect(again.rows[0]).toEqual(keep);                          // сохранённый итог не меняется, даже если сегодня снаряжение или очки другие
    expect(again.pending).toHaveLength(2);
  });
  it('снаряжение: броня уменьшает потерю, медальон и венец лечат', () => {
    const lost = sim({ bonus: { ...NO_GEAR, guard: 0.5 } });
    expect(lost.rows[0]!.hpDelta).toBe(-13);
    const heal = sim({ bonus: { ...NO_GEAR, heal: 6 } });
    expect(heal.rows[0]!.regen).toBe(REGEN + 6);
  });
  it('добыча детерминирована: те же дни дают те же предметы; в среднем выпадает примерно по шансу', () => {
    const a = sim({ from: '2026-01-01', to: '2026-03-01', day: day(300, { workout: 100, Учёба: 100, habits: 100 }) });
    const b = sim({ from: '2026-01-01', to: '2026-03-01', day: day(300, { workout: 100, Учёба: 100, habits: 100 }) });
    expect(a.rows).toEqual(b.rows);
    const drops = a.rows.filter((r) => r.drop).length;
    expect(drops).toBeGreaterThan(10); expect(drops).toBeLessThan(45);
    expect(a.rows.filter((r) => r.drop).every((r) => gearById(r.drop!))).toBe(true);
  });
  it('сегодняшний бой считается на лету и учитывает здоровье и серию', () => {
    const l = liveBattle({ date: '2026-11-20', goal: 60, hpYesterday: 15, streak: 2, bonus: NO_GEAR, data: { bySphere: { workout: 30 }, total: 30 } });
    expect(l.hp).toBe(25);
    expect(l.weakened).toBe(true);
    expect(l.fight.cleared).toBeLessThan(3);
    expect(l.xp).toBe(25);
  });
});

describe('снаряжение', () => {
  it('каталог: 13 семейств × 4 редкости, уникальные id, у каждого слота есть предметы, текст и название заполнены', () => {
    expect(GEAR).toHaveLength(52);
    expect(new Set(GEAR.map((g) => g.id)).size).toBe(52);
    for (const s of ['weapon', 'armor', 'helm', 'boots', 'amulet']) expect(GEAR.some((g) => g.slot === s)).toBe(true);
    for (const g of GEAR) { expect(g.name.length).toBeGreaterThan(3); expect(g.text).not.toMatch(/undefined|NaN/); }
  });
  it('чем реже предмет, тем сильнее эффект (по семействам)', () => {
    const val = (e: { type: string; [k: string]: unknown }) => (e.pct ?? e.hp ?? e.perDay) as number;
    for (const fam of new Set(GEAR.map((g) => g.family))) {
      const v = GEAR.filter((g) => g.family === fam).map((g) => val(g.effect as never));
      expect(v).toEqual([...v].sort((a, b) => a - b));
    }
  });
  it('бонусы суммируются по надетым предметам, один слот учитывается один раз', () => {
    const b = gearBonus([gearById('sword-epic')!, gearById('armor-rare')!, gearById('amulet-common')!, gearById('hammer-legend')!]);   // два оружия: учитывается первое
    expect(b.dmg).toBeCloseTo(0.12);
    expect(b.dmgDomain.body).toBe(0);
    expect(b.guard).toBeCloseTo(0.35);
    expect(b.loot).toBeCloseTo(0.05);
  });
  it('добыча: редкость по весам, предмет по ключу стабилен, боссы не дают обычных', () => {
    expect(pickGear(BATTLE_DROP, 0.0, 0).rarity).toBe('common');
    expect(pickGear(BATTLE_DROP, 0.99, 0).rarity).toBe('legend');
    expect(gearFromKey('boss:2026-11-15', BOSS_DROP)).toEqual(gearFromKey('boss:2026-11-15', BOSS_DROP));
    for (let i = 0; i < 60; i++) expect(gearFromKey('boss:k' + i, BOSS_DROP).rarity).not.toBe('common');
    expect(rollChestGear('common', 0.5, 0.1, 0.1)).toBeNull();
    expect(rollChestGear('legend', 0.3, 0.9, 0.5)!.rarity).toMatch(/rare|epic|legend/);
  });
  it('инвентарь из истории: бои, боссы (с даты старта) и сундуки; надетые помечены', () => {
    const g = deriveGear({ since: '2026-11-01', battles: [{ date: '2026-11-05', drop: 'sword-rare' }, { date: '2026-11-06', drop: null }], bossWins: ['2026-10-25', '2026-11-08'], chests: [{ n: 3, date: '2026-11-07', gear: 'boots-common' }, { n: 4, date: '2026-11-07', gear: null }], equipped: [{ slot: 'weapon', key: 'battle:2026-11-05' }] });
    expect(g.map((x) => x.key)).toEqual(['battle:2026-11-05', 'chest:3', 'boss:2026-11-08']);
    expect(g[0]).toMatchObject({ itemId: 'sword-rare', equipped: true });
    expect(g[1]!.equipped).toBe(false);
  });
});

import { HORDES } from './battle';
const HORDES_IDS = HORDES.map((h) => h.id);
describe('элитные и праздничные орды', () => {
  it('по выходным приходит элитная орда, суббота и воскресенье одной недели с одной ордой', () => {
    const sat = hordeOfDay('2026-11-21'), sun = hordeOfDay('2026-11-22'), mon = hordeOfDay('2026-11-23');
    expect(sat.elite).toBe(true); expect(sun.elite).toBe(true); expect(mon.elite).toBe(false);
    expect(ELITE_HORDES.map((h) => h.id)).toContain(sat.horde.id);
    expect(sat.horde.id).toBe(sun.horde.id);
    expect(sat.factor).toBeCloseTo(1.2 * 1.15);
    expect(HORDES_IDS.includes(mon.horde.id)).toBe(true);
  });
  it('праздники: даты переходят через Новый год, на праздник приходит тематическая орда', () => {
    expect(eventOf('2026-12-19')).toBeNull();
    expect(eventOf('2026-12-20')!.id).toBe('winter');
    expect(eventOf('2027-01-05')!.id).toBe('winter');
    expect(eventOf('2027-01-11')).toBeNull();
    expect(eventOf('2026-10-31')!.id).toBe('night');
    const d = hordeOfDay('2026-12-24');                       // четверг
    expect(d.event).toBe('winter'); expect(d.elite).toBe(false);
    expect(EVENTS[0]!.hordes.map((h) => h.id)).toContain(d.horde.id);
    const sat = hordeOfDay('2026-12-26');                     // суббота внутри праздника: праздник важнее элитной
    expect(sat.event).toBe('winter'); expect(sat.elite).toBe(false);
  });
  it('любую орду можно найти по id (в том числе из старых записей)', () => {
    expect(hordeById('goblins')!.name).toBe('Орда гоблинов');
    expect(hordeById('e-dragons')!.emoji).toBe('🐲');
    expect(hordeById('w-snowmen')!.units).toHaveLength(3);
    expect(hordeById('нет')).toBeUndefined();
  });
  it('награды: элитная лучше праздничной, праздничная лучше обычной', () => {
    const elite = rewardsOfDay({ elite: true, event: null }, '2026-11-21'), ev = rewardsOfDay({ elite: false, event: 'winter' }, '2026-12-24'), plain = rewardsOfDay({ elite: false, event: null }, '2026-11-24');
    expect(elite.chance).toBeGreaterThan(ev.chance); expect(ev.chance).toBeGreaterThan(plain.chance);
    expect(elite.xpMult).toBe(XP_MULT.elite); expect(ev.xpMult).toBe(XP_MULT.event); expect(plain.xpMult).toBe(1);
    expect(elite.weights).toBe(ELITE_DROP);
    expect(ELITE_DROP.common).toBeUndefined();
  });
  it('в симуляции за победу на элитной орде опыт ×1,5 и добыча не ниже редкой', () => {
    const goal = 60;
    const day = () => ({ bySphere: {}, total: 5000 });         // победа гарантирована
    const sim = simulate({ memberId: 9, goal, from: '2026-11-21', to: '2026-11-21', persisted: [], day, bonus: NO_GEAR });
    const row = sim.rows[0]!;
    expect(row.win).toBe(true);
    expect(row.xp).toBe(Math.round(victoryXp(goal) * XP_MULT.elite));
    for (let m = 1; m <= 40; m++) {
      const r = simulate({ memberId: m, goal, from: '2026-11-21', to: '2026-11-21', persisted: [], day, bonus: { ...NO_GEAR, loot: 1 } }).rows[0]!;
      expect(r.drop).not.toBeNull();
      expect(r.drop!.endsWith('-common')).toBe(false);
    }
  });
});
