import { describe, it, expect } from 'vitest';
import { fight, simulate, MAX_HP } from './battle';
import { CLASS_BATTLE, classOnly, withClass } from './classBattle';
import { GEAR, NO_GEAR, gearBonus, gearById, gearDisplay, type Domain } from './gear';
import type { Cls } from './classes';

const waves = (weak: Domain[], hp: number[]) => weak.map((w, i) => ({ unit: 'u' + i, weak: w, hp: hp[i] as number }));
const P = (o: Partial<Record<Domain | 'gen', number>> = {}) => ({ body: 0, mind: 0, art: 0, will: 0, gen: 0, ...o });
const CLASSES: Cls[] = ['w', 'm', 'b', 'p'];

describe('классы в бою', () => {
  it('у каждого класса роль, три способности и разные бонусы', () => {
    for (const c of CLASSES) { expect(CLASS_BATTLE[c].abilities).toHaveLength(3); expect(CLASS_BATTLE[c].summary.length).toBeGreaterThan(20); }
    expect(new Set(CLASSES.map((c) => JSON.stringify(CLASS_BATTLE[c].bonus))).size).toBe(4);
    expect(new Set(CLASSES.map((c) => CLASS_BATTLE[c].role)).size).toBe(4);
  });
  it('withClass: способности складываются со снаряжением, без класса только снаряжение', () => {
    const gear = gearBonus([gearById('armor-rare')!]);                                // −35% потерь
    expect(withClass(gear, 'p').guard).toBeCloseTo(0.7);
    expect(withClass(gear, 'm').guard).toBeCloseTo(0.35);
    expect(withClass(gear, 'm').weak).toBeCloseTo(0.35);
    expect(withClass(gear, null)).toEqual(gear);
    expect(classOnly('b')).toMatchObject({ heal: 6, winHeal: 6, loot: 0.1 });
    expect(NO_GEAR.weak).toBe(0);                                                       // исходные объекты не портятся
  });
  it('воин: «Ярость» усиливает удар с каждой убитой волной и добирает бой, на котором другой класс не хватает', () => {
    const w = waves(['body', 'mind', 'will'], [20, 20, 20]);
    const pools = P({ gen: 58 });
    expect(fight(pools, w, withClass(NO_GEAR, 'm' as Cls), 0, MAX_HP).cleared).toBeLessThan(3);   // у обычного (без ярости) не хватает
    const mageNoWeak = fight(pools, w, NO_GEAR);
    expect(mageNoWeak.outcome).not.toBe('victory');
    expect(fight(pools, w, withClass(NO_GEAR, 'w')).outcome).toBe('victory');
  });
  it('маг: «Огненный шар» бьёт по слабости сильнее', () => {
    const w = waves(['body', 'mind', 'will'], [17.5, 10, 10]);
    expect(fight(P({ body: 10 }), w, NO_GEAR).waves[0]!.cleared).toBe(false);          // 10 × 1,5 = 15 < 17,5
    expect(fight(P({ body: 10 }), w, withClass(NO_GEAR, 'm')).waves[0]!.cleared).toBe(true);   // 10 × 1,85 = 18,5
  });
  it('паладин: «Возмездие» работает, пока здоровье ниже половины', () => {
    const w = waves(['body', 'mind', 'will'], [30, 30, 30]);
    const hi = fight(P({ body: 10 }), w, withClass(NO_GEAR, 'p'), 0, 100).waves[0]!.damage;
    const lo = fight(P({ body: 10 }), w, withClass(NO_GEAR, 'p'), 0, 40).waves[0]!.damage;
    expect(lo).toBeGreaterThan(hi);
    expect(lo / hi).toBeCloseTo(1.2, 1);
    expect(fight(P({ body: 10 }), w, withClass(NO_GEAR, 'w'), 0, 40).waves[0]!.damage).toBe(fight(P({ body: 10 }), w, withClass(NO_GEAR, 'w'), 0, 100).waves[0]!.damage);
  });
  it('поражение: у мага теряется больше здоровья, у паладина меньше, у барда больше лечения', () => {
    const run = (c: Cls) => simulate({ memberId: 1, goal: 60, from: '2026-11-16', to: '2026-11-16', persisted: [], day: () => ({ bySphere: {}, total: 0 }), bonus: withClass(NO_GEAR, c) }).rows[0]!;
    expect(run('w').hpDelta).toBe(-25);
    expect(run('m').hpDelta).toBe(-33);        // 25 × 1,3
    expect(run('p').hpDelta).toBe(-16);        // 25 × 0,65
    expect(run('b').regen).toBe(16);           // 10 + 6
  });
});

describe('вид и названия снаряжения по классам', () => {
  it('один и тот же предмет называется по-разному', () => {
    const sword = gearById('sword-epic')!;
    expect(CLASSES.map((c) => gearDisplay(sword, c).name)).toEqual(['Эпический меч', 'Эпический посох', 'Эпическая лира', 'Эпическая булава']);
    expect(gearDisplay(gearById('hammer-legend')!, 'm').name).toBe('Легендарный посох силы');
    expect(gearDisplay(gearById('armor-rare')!, 'm').name).toBe('Крепкая мантия');
    expect(gearDisplay(gearById('armor-rare')!, 'p').name).toBe('Крепкие латы');
    expect(gearDisplay(gearById('helm-common')!, 'p').name).toBe('Простой крылатый шлем');
    expect(gearDisplay(gearById('boots-epic')!, 'b').name).toBe('Эпические ботфорты');
    expect(gearDisplay(sword, null).name).toBe(sword.name);
    expect(gearDisplay(gearById('amulet-rare')!, 'm').name).toBe(gearById('amulet-rare')!.name);   // амулеты общие
  });
  it('у каждого класса названия в каталоге уникальны', () => {
    for (const c of CLASSES) {
      const names = GEAR.map((g) => gearDisplay(g, c).name);
      expect(new Set(names).size).toBe(names.length);
    }
  });
});
