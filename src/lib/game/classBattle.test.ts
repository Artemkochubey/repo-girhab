import { describe, it, expect } from 'vitest';
import { fight, simulate, MAX_HP } from './battle';
import { ACTIVE_ABILITIES, CLASS_BATTLE, FOCUS_PER_DAY, SPECS, SPEC_LEVEL, abilityBlocked, abilityById, abilityPower, abilityView, bossAbilityBonus, classOnly, specBossBonus, specOf, withAbilities, withClass } from './classBattle';
import { GEAR, GEAR_RARITIES, NO_GEAR, TIER_NAMES, gearBonus, gearById, gearDisplay, type Domain } from './gear';
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
    expect(CLASSES.map((c) => gearDisplay(sword, c).name)).toEqual(['Эпический меч', 'Эпический меч', 'Эпический меч', 'Эпический меч']);   // оружие у всех классов одно
    expect(gearDisplay(gearById('armor-rare')!, 'm').name).toBe('Ряса с поясом');
    expect(gearDisplay(gearById('armor-rare')!, 'p').name).toBe('Кираса');
    expect(gearDisplay(gearById('helm-common')!, 'p').name).toBe('Кольчужный капюшон');
    expect(gearDisplay(gearById('boots-epic')!, 'b').name).toBe('Ботфорты менестреля');
    expect(gearDisplay(sword, null).name).toBe(sword.name);
    expect(gearDisplay(gearById('amulet-rare')!, 'm').name).toBe(gearById('amulet-rare')!.name);   // амулеты общие
  });
  it('доспех у каждого класса бывает в четырёх разных видах по редкости', () => {
    for (const c of CLASSES) {
      for (const kind of ['armor'] as const) {
        const names = TIER_NAMES[kind][c];
        expect(names).toHaveLength(4);
        expect(new Set(names).size).toBe(4);
      }
      expect(GEAR_RARITIES.map((r) => gearDisplay(gearById(`armor-${r}`)!, c).name)).toEqual([...TIER_NAMES.armor[c]]);
    }
  });
  it('у каждого класса названия в каталоге уникальны', () => {
    for (const c of CLASSES) {
      const names = GEAR.map((g) => gearDisplay(g, c).name);
      expect(new Set(names).size).toBe(names.length);
    }
  });
});

describe('активные способности', () => {
  it('у каждого класса три способности с уникальными id; мощная стоит 2 энергии и перезаряжается 3 дня', () => {
    const ids = CLASSES.flatMap((c) => ACTIVE_ABILITIES[c].map((a) => a.id));
    expect(ids).toHaveLength(12);
    expect(new Set(ids).size).toBe(12);
    for (const c of CLASSES) {
      const l = ACTIVE_ABILITIES[c];
      expect(l.filter((a) => a.cost === 2)).toHaveLength(1);
      expect(l.find((a) => a.cost === 2)!.cd).toBe(3);
      expect(l.filter((a) => a.cost === 1).every((a) => a.cd <= 2)).toBe(true);
      expect(l.every((a) => abilityById(a.id)!.cls === c)).toBe(true);
    }
    expect(FOCUS_PER_DAY).toBe(2);
  });
  it('withAbilities добавляет эффекты и не портит исходные бонусы', () => {
    const b = withAbilities(NO_GEAR, ['w-whirl', 'w-reckless']);
    expect(b.dmg).toBeCloseTo(0.75);
    expect(b.lossMult).toBe(1);
    expect(NO_GEAR.dmg).toBe(0);
    expect(withAbilities(NO_GEAR, ['нет-такой'])).toEqual(NO_GEAR);
    expect(withAbilities(withClass(NO_GEAR, 'm'), ['m-pyro']).weak).toBeCloseTo(0.35 + 0.75);
  });
  it('энергия: две обычные способности в день или одна мощная; перезарядка по дням', () => {
    const today = '2026-11-20';
    let v = abilityView('w', [], today);
    expect(v.focusLeft).toBe(2);
    expect(v.list.every((a) => a.ready)).toBe(true);
    v = abilityView('w', [{ ability: 'w-charge', date: today }], today);
    expect(v.focusLeft).toBe(1);
    expect(v.list.find((a) => a.id === 'w-charge')).toMatchObject({ usedToday: true, ready: false });
    expect(v.list.find((a) => a.id === 'w-reckless')!.ready).toBe(false);          // мощная стоит 2, осталась 1
    v = abilityView('w', [{ ability: 'w-reckless', date: today }], today);
    expect(v.focusLeft).toBe(0);
    expect(v.list.every((a) => !a.ready)).toBe(true);
    v = abilityView('w', [{ ability: 'w-reckless', date: '2026-11-19' }], today);     // применяли вчера: перезарядка 3 дня
    expect(v.list.find((a) => a.id === 'w-reckless')).toMatchObject({ readyIn: 2, ready: false });
    expect(abilityView('w', [{ ability: 'w-reckless', date: '2026-11-17' }], today).list.find((a) => a.id === 'w-reckless')!.ready).toBe(true);
    expect(abilityView(null, [], today).list).toEqual([]);
  });
  it('причины отказа: чужой класс, уже применена, перезарядка, нет энергии', () => {
    const t = '2026-11-20';
    expect(abilityBlocked('w', 'm-pyro', [], t)).toMatch(/нет такой/);
    expect(abilityBlocked(null, 'w-charge', [], t)).toMatch(/нет такой/);
    expect(abilityBlocked('w', 'w-charge', [], t)).toBeNull();
    expect(abilityBlocked('w', 'w-charge', [{ ability: 'w-charge', date: t }], t)).toMatch(/уже применена/);
    expect(abilityBlocked('w', 'w-reckless', [{ ability: 'w-reckless', date: '2026-11-19' }], t)).toMatch(/ещё 2 дн/);
    expect(abilityBlocked('w', 'w-reckless', [{ ability: 'w-charge', date: t }], t)).toMatch(/энергии/);
  });
  it('бой: «Безрассудство» бьёт сильнее, но при поражении теряется вдвое больше; «Ледяная глыба» почти убирает потери', () => {
    const w = waves(['body', 'mind', 'will'], [30, 30, 30]);
    expect(fight(P({ gen: 80 }), w, withAbilities(NO_GEAR, ['w-reckless'])).damage).toBeGreaterThan(fight(P({ gen: 80 }), w, NO_GEAR).damage);
    const run = (ids: string[], c: Cls) => simulate({ memberId: 1, goal: 60, from: '2026-11-16', to: '2026-11-16', persisted: [], day: () => ({ bySphere: {}, total: 0 }), bonus: withClass(NO_GEAR, c), bonusFor: () => withAbilities(withClass(NO_GEAR, c), ids) }).rows[0]!;
    expect(run([], 'w').hpDelta).toBe(-25);
    expect(run(['w-reckless'], 'w').hpDelta).toBe(-50);
    expect(run(['m-iceblock'], 'm').hpDelta).toBe(-3);            // 25 × 0,1 × 1,3
    expect(run(['b-hymn'], 'b').regen).toBe(10 + 6 + 15);        // базовое лечение + «Песня отдыха» + «Гимн исцеления»
  });
  it('способность, применённая в тот день, попадает в итог дня, когда он фиксируется', () => {
    const base = { memberId: 1, goal: 60, from: '2026-11-17', to: '2026-11-17', persisted: [], day: () => ({ bySphere: { workout: 66 }, total: 66 }), bonus: withClass(NO_GEAR, 'w') };
    const none = simulate(base).rows[0]!;
    const buffed = simulate({ ...base, bonusFor: () => withAbilities(withClass(NO_GEAR, 'w'), ['w-whirl', 'w-charge']) }).rows[0]!;
    expect(buffed.cleared).toBeGreaterThanOrEqual(none.cleared);
    expect(buffed.totalHp).toBeLessThan(none.totalHp);            // «Рывок» делает первую волну слабее
  });
});

describe('специализации и сила способностей', () => {
  it('у каждого класса две специализации со своими способностями, id не повторяются', () => {
    const ids = CLASSES.flatMap((c) => SPECS[c].map((s) => s.ability.id));
    expect(ids).toHaveLength(8); expect(new Set(ids).size).toBe(8);
    for (const c of CLASSES) { expect(SPECS[c].map((s) => s.id)).toEqual(['a', 'b']); expect(SPECS[c][0].name).not.toBe(SPECS[c][1].name); }
    expect(SPEC_LEVEL).toBe(8);
    expect(specOf('w', 'a')!.name).toBe('Берсерк'); expect(specOf('w', null)).toBeNull(); expect(specOf(null, 'a')).toBeNull();
  });
  it('бонус специализации добавляется к классу, без неё всё как раньше', () => {
    const base = withClass(NO_GEAR, 'w', null);
    const berserk = withClass(NO_GEAR, 'w', 'a');
    expect(berserk.dmg).toBeCloseTo(base.dmg + 0.08);
    expect(berserk.lossMult).toBeCloseTo(base.lossMult + 0.15);
    expect(base).toEqual(withClass(NO_GEAR, 'w'));
    expect(withClass(NO_GEAR, 'p', 'b').guard).toBeCloseTo(0.35 + 0.2);
  });
  it('способность специализации видна и доступна только с ней', () => {
    expect(abilityView('m', [], '2026-11-20', null).list).toHaveLength(3);
    const v = abilityView('m', [], '2026-11-20', 'a');
    expect(v.list).toHaveLength(4);
    expect(v.list.at(-1)!.id).toBe('m-comet');
    expect(abilityBlocked('m', 'm-comet', [], '2026-11-20', null)).toMatch(/специализац/);
    expect(abilityBlocked('m', 'm-comet', [], '2026-11-20', 'a')).toBeNull();
    expect(abilityBlocked('m', 'm-frost', [], '2026-11-20', 'a')).toMatch(/специализац/);      // чужая ветка
  });
  it('сила способностей растёт с уровнем: +4% за уровень, предел +60%', () => {
    expect(abilityPower(1)).toBe(1);
    expect(abilityPower(11)).toBeCloseTo(1.4);
    expect(abilityPower(100)).toBe(1.6);
    expect(abilityView('w', [], '2026-11-20', null, 6).power).toBeCloseTo(1.2);
    const plain = withAbilities(NO_GEAR, ['w-whirl']);
    const strong = withAbilities(NO_GEAR, ['w-whirl'], 1.4);
    expect(plain.dmg).toBeCloseTo(0.25); expect(strong.dmg).toBeCloseTo(0.35);
  });
  it('в бою с боссом способности усиливают урон и вдвое мягче слабость', () => {
    expect(bossAbilityBonus(['w-whirl'])).toEqual({ dmg: 0.25, weak: 0 });
    expect(bossAbilityBonus(['m-pyro'])).toEqual({ dmg: 0, weak: 0.375 });
    expect(bossAbilityBonus(['m-arcane', 'нет-такой'], 2).dmg).toBeCloseTo(0.8);
    expect(bossAbilityBonus([])).toEqual({ dmg: 0, weak: 0 });
    expect(specBossBonus('m', 'a')).toEqual({ dmg: 0.05, weak: 0.075 });
    expect(specBossBonus('b', null)).toEqual({ dmg: 0, weak: 0 });
  });
});
