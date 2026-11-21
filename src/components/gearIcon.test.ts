import { describe, it, expect } from 'vitest';
import { GEAR, gearIconFamily } from '../lib/game/gear';
import { GEAR_SYMBOLS } from './gearSymbols';
import { CLASS_HERO_ART } from './classHeroArt';

describe('значки снаряжения и портреты классов', () => {
  it('для каждого семейства предметов игры есть значок', () => {
    for (const g of GEAR.filter((x) => x.slot !== 'weapon')) expect(GEAR_SYMBOLS, g.family).toContain(`id="gx-${g.family}"`);
  });
  it('оружие не зависит от класса', () => {
    const sword = GEAR.find((g) => g.slot === 'weapon')!;
    expect((['w', 'm', 'b', 'p'] as const).map((c) => gearIconFamily(sword, c))).toEqual(['sword', 'sword', 'sword', 'sword']);
  });
  it('доспех и шлем не меняют значок по классу', () => {
    const armor = GEAR.find((g) => g.family === 'armor')!;
    expect(gearIconFamily(armor, 'm')).toBe('armor');
  });
  it('портреты всех четырёх классов на месте и с подписью', () => {
    for (const c of ['w', 'm', 'b', 'p'] as const) { expect(CLASS_HERO_ART[c].svg.length).toBeGreaterThan(500); expect(CLASS_HERO_ART[c].label.length).toBeGreaterThan(5); }
  });
});
