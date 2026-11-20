import type { CSSProperties } from 'react';
import { GEAR_RARITIES, gearIconFamily, type GearItem } from '@/lib/game/gear';
import { GearIcon, RARITY_VARS } from './GearIcon';
import { bardArmor, mageArmor, paladinArmor, warriorArmor } from './HeroArmor';
import { GEM, Head, PAL } from './HeroBody';
import { headgear } from './HeroHeadgear';
import { WEAPON_BOX, weaponArt } from './HeroWeapons';

type C = 'w' | 'm' | 'b' | 'p';
// какую часть рисунка героя показывать как предмет (координаты фигуры 240 × 380)
const ABOX: Record<C, string> = { w: '40 100 160 150', m: '40 100 160 190', b: '40 100 160 170', p: '40 100 160 150' };
const HBOX: Record<C, string> = { w: '70 30 100 90', m: '50 -34 140 130', b: '55 -14 130 120', p: '70 -6 100 120' };

type Item = Pick<GearItem, 'slot' | 'family' | 'rarity'> & { effect?: unknown; variant?: number };

/** Картинка предмета для списков: у оружия, доспеха, шлема и сапог рисуется вид именно этого класса и этой редкости, у остальных значок. */
export function GearPic({ item, cls, size = 64, label }: { item: Item; cls: string | null; size?: number; label?: string }) {
  const c: C = cls === 'm' || cls === 'b' || cls === 'p' ? cls : 'w';
  const tier = GEAR_RARITIES.indexOf(item.rarity);
  const pal = PAL[item.rarity]!;
  const gem = GEM[item.rarity]!;
  const vars = { ...RARITY_VARS[item.rarity], '--ar1': pal.m1, '--ar2': pal.m2, '--hm1': pal.m1, '--hm2': pal.m2, '--bt1': pal.m1, '--bt2': pal.m2 } as CSSProperties;
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true };
  const wrap = (box: string, body: React.ReactNode) => (
    <svg className="gear-pic" width={size} height={size} viewBox={box} preserveAspectRatio="xMidYMid meet" style={{ overflow: 'visible', ...vars }} {...a11y}>{body}</svg>
  );
  if (item.slot === 'weapon') return wrap(WEAPON_BOX[item.family] ?? '-44 -150 88 190', <g>{weaponArt(item.family, (item as { variant?: number }).variant ?? 1, tier)}</g>);
  if (item.family === 'armor') {
    const P = { w: warriorArmor, m: mageArmor, b: bardArmor, p: paladinArmor }[c](tier, gem);
    return wrap(ABOX[c], <g>{P.torso}{P.shoulders}</g>);
  }
  if (item.family === 'helm') return wrap(HBOX[c], <g><Head />{headgear(c, tier, gem)}</g>);
  if (item.family === 'boots') {
    return wrap('60 296 120 70', <g><path className="hf-bt1" d="M84 332 H118 V358 H76 Q74 340 84 332Z" /><path className="hf-bt1" d="M122 332 H156 Q166 340 164 358 H122Z" /><rect className="hf-bt2" x="84" y="332" width="34" height="9" /><rect className="hf-bt2" x="122" y="332" width="34" height="9" />
      {tier >= 1 && <><path d="M82 336 Q62 332 54 314 Q74 316 86 328Z" fill={gem} /><path d="M158 336 Q178 332 186 314 Q166 316 154 328Z" fill={gem} /></>}</g>);
  }
  return <GearIcon family={gearIconFamily(item as GearItem, cls as never)} rarity={item.rarity} size={size} label={label} />;
}
