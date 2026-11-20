'use client';
import type { CSSProperties, ReactNode } from 'react';
import { GEAR_RARITIES, gearById, type GearItem, type Slot } from '@/lib/game/gear';
import type { Cls } from '@/lib/game/classes';
import type { FaceConfig } from '@/lib/game/faces';
import { FaceArt } from './Face';
import { RARITY_VARS } from './GearIcon';
import { bardArmor, mageArmor, paladinArmor, warriorArmor } from './HeroArmor';

type Look = Partial<Record<Slot, string | null>>;
interface Pal { m1: string; m2: string }
const PAL: Record<string, Pal> = { common: { m1: '#c3cde6', m2: '#8392b8' }, rare: { m1: '#d9e6ff', m2: '#5f8fff' }, epic: { m1: '#ecdcff', m2: '#9a63ff' }, legend: { m1: '#fff1c2', m2: '#e0a73a' } };
const GEM: Record<string, string> = { common: '#9fb0d8', rare: '#8ff0d9', epic: '#ff7ad9', legend: '#ff9a4a' };
const GLOW: Record<string, string> = { common: '#8aa0d8', rare: '#5f8fff', epic: '#b07bff', legend: '#ffcf5a' };
const SKIN = '#f6c9a0';
const BOOTS_DEF: Pal = { m1: '#5a3fa8', m2: '#3b2a6e' };
// вид без снаряжения: у каждого класса свой костюм
const ROBE_DEF: Partial<Record<Cls, Pal>> = { m: { m1: '#8f6bff', m2: '#6d4bd6' }, b: { m1: '#ff9ad6', m2: '#ff7ac8' } };
const HAT_DEF: Partial<Record<Cls, Pal>> = { m: { m1: '#9a7bff', m2: '#7a56e8' }, b: { m1: '#ff9ad6', m2: '#ff7ac8' } };

const tierOf = (g: GearItem | null) => (g ? GEAR_RARITIES.indexOf(g.rarity) : -1);

interface BodyProps { look: Look; cls: Cls | null; face?: FaceConfig | null; attack?: boolean }

/** Лицо героя: выбранное в «Лице героя» или простое нарисованное. Рисуется в координатах фигуры 240 × 380, голова в (120, 95). */
function Head({ face, hair }: { face?: FaceConfig | null; hair?: ReactNode }) {
  if (face) return <g transform="translate(76.4 47.9) scale(0.873)"><FaceArt face={face} /></g>;
  return (
    <g>
      <circle cx="120" cy="95" r="27" fill={SKIN} />
      {hair}
      <circle cx="110" cy="98" r="2.600" fill="#2a1a4a" /><circle cx="130" cy="98" r="2.600" fill="#2a1a4a" />
      <path d="M112 107 Q120 113 128 107" stroke="#b5654a" strokeWidth="2.300" fill="none" strokeLinecap="round" />
      <ellipse cx="102" cy="105" rx="5" ry="3" fill="#ff7a8a" opacity=".28" /><ellipse cx="138" cy="105" rx="5" ry="3" fill="#ff7a8a" opacity=".28" />
    </g>
  );
}

const Spark = ({ x, y, s = 1, c = '#fff1c2', cls = 'hf-tw' }: { x: number; y: number; s?: number; c?: string; cls?: string }) => (
  <path className={cls} transform={`translate(${x} ${y}) scale(${s})`} d="M0 -8 L2 -2 L8 0 L2 2 L0 8 L-2 2 L-8 0 L-2 -2Z" fill={c} />
);

/** Оружие в руке: значок предмета нужной редкости, при ударе взмах. Без оружия: простая палка. */
function Weapon({ cls, item, attack }: { cls: Cls | null; item: GearItem | null; attack?: boolean }) {
  const vars = item ? (RARITY_VARS[item.rarity] as CSSProperties) : undefined;
  const fam = { w: 'sword', m: 'staff', b: 'lute', p: 'hammer' }[cls ?? 'w'];
  const cn = `hf-w hf-w-${cls ?? 'w'} ${attack ? 'hf-w-atk' : ''}`;
  if (cls === 'm') {
    return (
      <g className={cn}>
        <rect x="64" y={item ? 70 : 58} width="7" height={item ? 286 : 298} rx="3" fill="#7a4a24" /><rect x="67.500" y={item ? 70 : 58} width="3.500" height={item ? 286 : 298} fill="#5a3416" />
        {item && <g style={vars}><use href={`#gx-${fam}`} x="2.500" y="13" width="130" height="130" /></g>}
        {attack && <circle className="hf-flare" cx="67.500" cy="44" r="18" fill={GLOW[item?.rarity ?? 'common']} />}
      </g>
    );
  }
  if (cls === 'b') {
    return (
      <g className={cn}>
        {item ? <g style={vars}><g transform="translate(113.250 0) scale(-1 1)"><use href="#gx-lute" x="0" y="115" width="170" height="170" /></g></g>
          : <g transform="rotate(-26 150 232)"><rect x="144" y="106" width="12" height="100" rx="3" fill="#7a4a24" /><ellipse cx="150" cy="238" rx="32" ry="38" fill="#c98a1d" /><circle cx="150" cy="236" r="9" fill="#3a2400" /></g>}
        {attack && <><text className="hf-note" x="40" y="150" fontSize="34" fill="#8ff0d9">♪</text><text className="hf-note n2" x="200" y="140" fontSize="30" fill="#ffe39a">♫</text></>}
      </g>
    );
  }
  if (cls === 'p') {
    return (
      <g className={cn}>
        {item ? <g style={vars}><use href={`#gx-${fam}`} x="111" y="84" width="160" height="160" /></g>
          : <><rect x="187" y="92" width="9" height="140" rx="3" fill="#7a4a24" /><rect x="168" y="76" width="46" height="24" rx="6" fill="#9a97b5" /></>}
      </g>
    );
  }
  return (
    <g className={cn}>
      {item ? <g style={vars}><use href={`#gx-${fam}`} x="115" y="74" width="150" height="150" /></g>
        : <rect x="186" y="96" width="9" height="100" rx="3" fill="#8a6a3b" />}
    </g>
  );
}

/** Щит на левой руке (если надет предмет «щит»). */
function ShieldOnArm({ item }: { item: GearItem }) {
  return <g style={RARITY_VARS[item.rarity] as CSSProperties} className="hf-shield"><use href="#gx-shield" x="-10" y="160" width="110" height="110" /></g>;
}

export function HeroBody({ look, cls, face = null, attack = false }: BodyProps) {
  const it = (s: Slot): GearItem | null => { const id = look[s]; return id ? gearById(id) ?? null : null; };
  const weapon = it('weapon'), armorItem = it('armor'), helm = it('helm'), boots = it('boots'), amulet = it('amulet');
  const armor = armorItem?.family === 'armor' ? armorItem : null;
  const shield = armorItem?.family === 'shield' ? armorItem : null;
  const c = cls ?? 'w';
  const AT = tierOf(armor), HT = tierOf(helm), BT = tierOf(boots);
  const A = armor ? PAL[armor.rarity]! : ROBE_DEF[c] ?? PAL.common!;
  const H = helm && helm.family === 'helm' ? PAL[helm.rarity]! : HAT_DEF[c] ?? PAL.common!;
  const B = boots ? PAL[boots.rarity]! : BOOTS_DEF;
  const crown = helm?.family === 'crown' ? helm : null;
  const vars = { '--ar1': A.m1, '--ar2': A.m2, '--hm1': H.m1, '--hm2': H.m2, '--bt1': B.m1, '--bt2': B.m2 } as CSSProperties;
  const legendary = AT === 3 || HT === 3 || tierOf(weapon) === 3;
  const aura = armor ? GLOW[armor.rarity]! : helm ? GLOW[helm.rarity]! : '#ffcf5a';
  const hg = helm ? GEM[helm.rarity]! : '#8ff0d9';
  const ag = armor ? GEM[armor.rarity]! : '#f2c46b';

  return (
    <g transform="translate(2.600 0) scale(0.395)" style={vars} className="hf-fig2">
      {legendary && <ellipse className="hf-aura" cx="120" cy="210" rx="100" ry="140" fill={aura} />}
      <ellipse cx="120" cy="364" rx="92" ry="12" fill="#000" opacity=".35" />

      {c === 'w' && (() => { const P = warriorArmor(AT, ag); return (<>
        {P.back}
        <path d="M94 246 H118 L116 338 H90 Z" fill="#2c2060" /><path d="M122 246 H146 L150 338 H124 Z" fill="#2c2060" />
        <path className="hf-bt1" d="M84 332 H118 V358 H76 Q74 340 84 332Z" /><path className="hf-bt1" d="M122 332 H156 Q166 340 164 358 H122Z" />
        <rect className="hf-bt2" x="84" y="332" width="34" height="9" /><rect className="hf-bt2" x="122" y="332" width="34" height="9" />
        {BT >= 1 && <><path d="M82 336 Q62 332 54 314 Q74 316 86 328Z" fill={GEM[boots!.rarity]} /><path d="M158 336 Q178 332 186 314 Q166 316 154 328Z" fill={GEM[boots!.rarity]} /></>}
        <g className="hf-breathe">
          <path d="M92 188 H148 L152 262 L120 276 L88 262 Z" fill="#e8574a" /><path d="M120 188 H148 L152 262 L120 276 Z" fill="#a02a22" /><path d="M114 196 H126 V270 H114 Z" fill="#f2c46b" />
          <rect x="110" y="110" width="20" height="26" fill="#e8b48c" />
          {P.torso}
          <Head face={face} />
          <path className="hf-hm1" d="M88 98 Q84 54 120 50 Q156 54 152 98 L144 98 L142 78 H98 L96 98 Z" /><path className="hf-hm2" d="M120 50 Q156 54 152 98 L144 98 L142 78 H120 Z" /><rect className="hf-hm2" x="118" y="70" width="5" height="24" rx="2" />
          {crown ? <path d="M92 60 L96 40 L108 54 L120 32 L132 54 L144 40 L148 60Z" fill={PAL[crown.rarity]!.m1} /> : HT >= 1 && <path className="hf-plume" d="M120 50 Q142 24 174 34 Q154 40 144 62 Z" fill={hg} />}
          {P.shoulders}
          <path className="hf-ar2" d="M80 140 L58 186 L76 196 L96 150 Z" /><circle cx="58" cy="196" r="9" fill={SKIN} />
        </g>
        {shield && <ShieldOnArm item={shield} />}
        <path className="hf-ar2" d="M160 140 L196 188 L180 200 L150 152 Z" />
        <Weapon cls="w" item={weapon} attack={attack} />
        <circle cx="190" cy="194" r="8.500" fill={SKIN} />
      </>); })()}

      {c === 'm' && (() => { const P = mageArmor(AT, ag); return (<>
        {P.back}
        <path d="M96 250 H118 L116 338 H94Z" fill="#2c2060" /><path d="M122 250 H144 L146 338 H124Z" fill="#2c2060" />
        <path className="hf-bt1" d="M88 328 H118 V356 H80 Q78 338 88 328Z" /><path className="hf-bt1" d="M122 328 H152 Q162 338 160 356 H122Z" />
        <rect className="hf-bt2" x="88" y="328" width="30" height="8" /><rect className="hf-bt2" x="122" y="328" width="30" height="8" />
        {BT >= 1 && <path d="M86 334 Q66 330 58 312 Q78 314 90 326Z" fill={GEM[boots!.rarity]} />}
        <Weapon cls="m" item={weapon} attack={attack} />
        <g className="hf-breathe">
          <g className="hf-sway">{P.torso}</g>
          <rect x="110" y="112" width="20" height="20" fill="#e8b48c" />
          <Head face={face} hair={<path d="M94 100 Q92 78 120 76 Q148 78 146 100 Q138 88 120 88 Q102 88 94 100Z" fill="#6b3b22" />} />
          <ellipse className="hf-hm2" cx="120" cy="76" rx="48" ry="10" />
          <path className="hf-hm1" d="M86 76 Q100 46 114 20 Q122 2 140 8 Q130 12 130 26 Q132 54 154 76 Z" />
          <path d="M92 68 Q120 78 148 68 L151 76 Q120 87 89 76Z" fill="#f2c46b" />
          <path d="M118 36 l2.600 7.400 7.400 2.600-7.400 2.600-2.600 7.400-2.600-7.400-7.400-2.600 7.400-2.600z" fill={helm ? hg : '#ffe39a'} />
          {crown && <path d="M96 70 L100 52 L110 64 L120 46 L130 64 L140 52 L144 70Z" fill={PAL[crown.rarity]!.m1} />}
          {P.shoulders}
        </g>
        {shield && <ShieldOnArm item={shield} />}
        <path className="hf-ar2" d="M92 134 L64 192 L82 202 L106 152 Z" /><circle cx="70" cy="198" r="8.500" fill={SKIN} />
        <path className="hf-ar2" d="M148 134 L184 172 L172 186 L140 152 Z" /><circle cx="180" cy="178" r="8.500" fill={SKIN} />
        <g className="hf-cls"><Spark x={206} y={150} s={1.100} c="#8ff0d9" /><Spark x={216} y={192} s={.8} c="#ffe39a" cls="hf-tw2" /><Spark x={196} y={208} s={.8} c="#d9b8ff" /></g>
      </>); })()}

      {c === 'b' && (() => { const P = bardArmor(AT, ag); return (<>
        {P.back}
        <path d="M96 236 H118 L114 338 H92Z" fill="#2e8f88" /><path d="M122 236 H144 L148 338 H124Z" fill="#2e8f88" />
        <path className="hf-bt1" d="M88 302 H118 V356 H78 Q76 322 88 302Z" /><path className="hf-bt1" d="M122 302 H152 Q164 322 162 356 H122Z" />
        <rect className="hf-bt2" x="86" y="302" width="32" height="9" /><rect className="hf-bt2" x="122" y="302" width="32" height="9" />
        {BT >= 1 && <path d="M86 320 Q66 316 58 298 Q78 300 90 312Z" fill={GEM[boots!.rarity]} />}
        <g className="hf-breathe">
          <rect x="110" y="110" width="20" height="22" fill="#e8b48c" />
          {P.torso}
          <Head face={face} hair={<><path d="M93 96 Q88 66 120 64 Q152 66 147 96 Q146 78 120 76 Q96 78 93 96Z" fill="#c0613a" /><path d="M93 96 Q86 112 92 124 Q98 112 96 98Z" fill="#c0613a" /><path d="M147 96 Q154 112 148 124 Q142 112 144 98Z" fill="#c0613a" /></>} />
          <ellipse className="hf-hm2" cx="118" cy="68" rx="36" ry="14" transform="rotate(-12 118 68)" />
          <path className="hf-hm1" d="M86 78 Q116 90 148 70 L150 78 Q118 98 84 86Z" />
          <path className="hf-plume" d="M142 62 Q180 36 196 6 Q192 44 154 76 Z" fill={helm ? hg : '#f2c46b'} />
          {crown && <path d="M96 66 L100 48 L110 60 L120 42 L130 60 L140 48 L144 66Z" fill={PAL[crown.rarity]!.m1} />}
          {P.shoulders}
        </g>
        {shield && <ShieldOnArm item={shield} />}
        <Weapon cls="b" item={weapon} attack={attack} />
        <path className="hf-ar2" d="M88 136 L116 152 L106 168 L80 150 Z" /><circle cx="112" cy="156" r="8.500" fill={SKIN} />
        <path className="hf-ar2" d="M150 134 L184 214 L168 224 L138 150 Z" /><circle cx="174" cy="224" r="8.500" fill={SKIN} />
      </>); })()}

      {c === 'p' && (() => { const P = paladinArmor(AT, ag); return (<>
        {P.back ?? <><path d="M88 130 H152 L186 304 Q120 334 54 304 Z" fill="#f4efff" className="hf-sway" /><path d="M120 130 H152 L186 304 Q152 320 120 324 Z" fill="#cfc4ff" /></>}
        <path className="hf-ar2" d="M96 246 H118 L116 338 H90Z" /><path className="hf-ar2" d="M122 246 H146 L150 338 H124Z" />
        <path className="hf-bt1" d="M84 332 H118 V358 H76 Q74 340 84 332Z" /><path className="hf-bt1" d="M122 332 H156 Q166 340 164 358 H122Z" />
        {BT >= 1 && <><path d="M82 336 Q62 332 54 314 Q74 316 86 328Z" fill={GEM[boots!.rarity]} /><path d="M158 336 Q178 332 186 314 Q166 316 154 328Z" fill={GEM[boots!.rarity]} /></>}
        <g className="hf-breathe">
          <path d="M92 190 H148 L150 268 L120 280 L90 268Z" fill="#f4efff" /><path d="M120 190 H148 L150 268 L120 280Z" fill="#dcd2ff" />
          <rect x="116" y="200" width="8" height="58" rx="2" fill="#5f8fff" /><rect x="104" y="214" width="32" height="8" rx="2" fill="#5f8fff" />
          <rect x="110" y="110" width="20" height="26" fill="#e8b48c" />
          {P.torso}
          <Head face={face} />
          <path className="hf-hm1" d="M88 98 Q84 54 120 50 Q156 54 152 98 L144 98 L142 78 H98 L96 98 Z" /><path className="hf-hm2" d="M120 50 Q156 54 152 98 L144 98 L142 78 H120Z" />
          <path d="M92 66 Q70 54 56 28 Q84 32 100 56Z" fill="#fff1c2" /><path d="M148 66 Q170 54 184 28 Q156 32 140 56Z" fill="#fff1c2" />
          {crown && <path d="M96 56 L100 38 L110 50 L120 32 L130 50 L140 38 L144 56Z" fill={PAL[crown.rarity]!.m1} />}
          <ellipse className="hf-halo" cx="120" cy="34" rx="36" ry="9" fill="none" stroke={helm ? hg : '#ffe39a'} strokeWidth="3.500" />
          {P.shoulders}
          <path className="hf-ar2" d="M80 140 L62 184 L80 192 L96 150Z" />
        </g>
        {shield ? <ShieldOnArm item={shield} /> : <g><path d="M26 166 H90 V214 Q90 250 58 268 Q26 250 26 214Z" fill="#f2c46b" /><path d="M35 175 H81 V214 Q81 242 58 256 Q35 242 35 214Z" fill="#f4efff" /><rect x="54" y="182" width="8" height="66" rx="2" fill="#5f8fff" /><rect x="40" y="202" width="36" height="8" rx="2" fill="#5f8fff" /></g>}
        <path className="hf-ar2" d="M160 140 L194 190 L178 202 L150 152Z" />
        <Weapon cls="p" item={weapon} attack={attack} />
        <circle cx="191.500" cy="196" r="8.500" fill={SKIN} />
      </>); })()}

      {amulet && <g><path d="M104 130 Q120 164 136 130" fill="none" stroke="#f2c46b" strokeWidth="3" /><path d="M120 150 L130 162 L120 182 L110 162Z" fill={GEM[amulet.rarity]} stroke="#f2c46b" strokeWidth="3" /></g>}
      {legendary && <><Spark x={30} y={96} s={1.300} /><Spark x={212} y={60} s={1} c="#ffe39a" cls="hf-tw2" /><Spark x={44} y={250} s={.9} c="#8ff0d9" /></>}
    </g>
  );
}
