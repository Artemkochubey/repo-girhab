'use client';
import { memo, useId } from 'react';
import { GEAR_RARITIES, gearById, type Domain, type GearItem, type GearRarity, type Slot } from '@/lib/game/gear';
import { ArmorArt, WeaponArt } from './gearArt';
import { AmuletArt, BootsArt, HelmArt, ShieldArt } from './gearArt2';
import { FaceArt } from './Face';
import type { FaceConfig } from '@/lib/game/faces';
import type { Cls } from '@/lib/game/classes';

/** Что надето: id предмета по слотам (null — пусто). */
export type Look = Partial<Record<Slot, string | null>>;
export type ClsKey = Cls | string | null | undefined;

export const RARITY_COLOR: Record<GearRarity, string> = { common: '#9a97b5', rare: '#5f9dff', epic: '#b46bff', legend: '#ffd24a' };
export const CLASS_COLOR: Record<Cls, string> = { w: '#d9534f', m: '#5b8cff', b: '#3fcf9a', p: '#ffd24a' };
const DOMAIN_GEM: Record<Domain, string> = { body: '#ff6b6b', mind: '#5f9dff', art: '#ff7ac8', will: '#ffb74d' };
const SKIN = '#e9c7a8';
const GOLD = '#ffd24a';

const dark = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v * (1 - k)));
  return `rgb(${c.join(',')})`;
};

interface Props { look: Look; color: string; emoji: string; face?: FaceConfig | null; attack?: boolean; uid: string; cls?: ClsKey }
const isCls = (c: ClsKey): c is Cls => c === 'w' || c === 'm' || c === 'b' || c === 'p';

/**
 * Герой в полный рост (0..100 × 0..150). Класс меняет силуэт и вид снаряжения, как типы брони в WoW:
 * воин в латах и с мечом, маг в мантии с посохом, бард в кожаном колете с лютней, паладин в латах с золотом, булавой и нимбом.
 */
function Body({ look, color, emoji, face, attack, uid, cls }: Props) {
  const c: Cls | null = isCls(cls) ? cls : null;
  const it = (s: Slot): GearItem | null => { const id = look[s]; return id ? gearById(id) ?? null : null; };
  const weapon = it('weapon'), armor = it('armor'), helm = it('helm'), boots = it('boots'), amulet = it('amulet');
  const rc = (g: GearItem | null) => (g ? RARITY_COLOR[g.rarity] : '#555');
  const glow = (g: GearItem | null) => (g && g.rarity === 'legend' ? `url(#glow-${uid})` : undefined);
  const accent = c ? CLASS_COLOR[c] : color;
  const tunic = dark(color, 0.35), pants = dark(color, 0.6);
  const ink = '#0d0916';
  const gem = weapon?.effect.type === 'dmgDomain' ? DOMAIN_GEM[weapon.effect.domain] : null;

  return (
    <g>
      <ellipse cx="50" cy="146" rx="26" ry="4" fill="#000" opacity="0.35" />

      {/* знаки класса за спиной: плащ воина и паладина, нимб паладина */}
      {c === 'p' && <ellipse cx="50" cy="14" rx="19" ry="5" fill="none" stroke={GOLD} strokeWidth="2.4" opacity="0.85" filter={`url(#glow-${uid})`} />}
      {(c === 'w' || c === 'p') && <path d="M31 62 Q22 100 28 128 L72 128 Q78 100 69 62 Z" fill={c === 'w' ? '#8c2b2b' : '#f3efe2'} stroke={ink} strokeWidth="0.8" opacity="0.95" />}

      {/* ноги: у мага их скрывает мантия */}
      {c === 'm' ? (
        <path d="M30 100 L26 138 Q50 144 74 138 L70 100 Z" fill={dark(color, 0.15)} stroke={ink} strokeWidth="0.8" />
      ) : (
        <g>
          <rect x="36" y="104" width="12" height="34" rx="4" fill={pants} />
          <rect x="52" y="104" width="12" height="34" rx="4" fill={pants} />
        </g>
      )}

      {/* сапоги: четыре вида на класс, вид зависит от редкости */}
      <g filter={glow(boots)}><BootsArt c={c} tier={boots ? GEAR_RARITIES.indexOf(boots.rarity) : 0} col={boots ? rc(boots) : '#3a3558'} accent={accent} /></g>

      {/* туловище */}
      <rect x="31" y="60" width="38" height="48" rx="9" fill={tunic} stroke={ink} strokeWidth="0.8" />
      {c === 'p' && <g><rect x="44" y="60" width="12" height="48" fill="#f7f4ea" stroke={ink} strokeWidth="0.5" /><path d="M50 68 V84 M44 74 H56" stroke={GOLD} strokeWidth="2.2" /></g>}
      {c === 'b' && <path d="M33 62 L67 104" stroke={accent} strokeWidth="5" opacity="0.9" />}
      {c === 'm' && <path d="M31 96 H69" stroke={accent} strokeWidth="4" />}

      {/* доспех: четыре вида на класс, вид зависит от редкости */}
      {armor?.family === 'armor' && (
        <g filter={glow(armor)}><ArmorArt c={c} tier={GEAR_RARITIES.indexOf(armor.rarity)} col={rc(armor)} accent={accent} /></g>
      )}
      <rect x="31" y="100" width="38" height="5" rx="2" fill="#1a1428" />
      {amulet && <g filter={glow(amulet)}><AmuletArt tier={GEAR_RARITIES.indexOf(amulet.rarity)} col={rc(amulet)} /></g>}

      {/* левая рука, щит или барьер */}
      <g>
        <path d="M31 68 Q20 82 22 98" fill="none" stroke={tunic} strokeWidth="9" strokeLinecap="round" />
        <circle cx="22" cy="100" r="4.5" fill={SKIN} />
        {armor?.family === 'shield' && <g filter={glow(armor)}><ShieldArt c={c} tier={GEAR_RARITIES.indexOf(armor.rarity)} col={rc(armor)} /></g>}
      </g>

      {/* голова */}
      {face ? (
        <g transform="translate(22.5 8.3) scale(0.55)"><FaceArt face={face} /></g>
      ) : (
        <>
          <circle cx="50" cy="38" r="17" fill={SKIN} stroke={ink} strokeWidth="0.8" />
          <text x="50" y="46" textAnchor="middle" fontSize="24">{emoji}</text>
        </>
      )}

      {/* шлем и головные уборы по классам */}
      {helm?.family === 'helm' && <g filter={glow(helm)}><HelmArt c={c} tier={GEAR_RARITIES.indexOf(helm.rarity)} col={rc(helm)} accent={accent} /></g>}
      {helm?.family === 'crown' && (
        <g filter={glow(helm)}>
          <path d="M34 28 L38 14 L44 24 L50 10 L56 24 L62 14 L66 28 Z" fill={rc(helm)} stroke={ink} strokeWidth="0.9" />
          <circle cx="50" cy="19" r="1.8" fill={accent} opacity="0.95" />
        </g>
      )}

      {/* правая рука и оружие по классам */}
      <g className={attack ? 'hf-swing' : 'hf-hold'} style={{ transformOrigin: '68px 66px', transformBox: 'view-box' }}>
        <path d="M69 68 Q82 78 80 96" fill="none" stroke={tunic} strokeWidth="9" strokeLinecap="round" />
        <circle cx="80" cy="98" r="4.5" fill={SKIN} />
        <g filter={glow(weapon)}>
          {!weapon && <path d="M80 98 L88 58" stroke="#8a6a3b" strokeWidth="3" strokeLinecap="round" />}
          {weapon && <WeaponArt c={c} tier={GEAR_RARITIES.indexOf(weapon.rarity)} col={rc(weapon)} gem={gem} />}
        </g>
      </g>

      {/* знаки класса: руны мага, ноты барда */}
      {c === 'm' && <g className="cls-float" fill="#9fc0ff"><text x="14" y="58" fontSize="8">✦</text><text x="86" y="70" fontSize="7">✧</text><text x="8" y="112" fontSize="6">✦</text></g>}
      {c === 'b' && <g className="cls-float" fill="#7be3b8"><text x="10" y="56" fontSize="10">♪</text><text x="88" y="52" fontSize="9">♫</text></g>}
    </g>
  );
}

/** Область фигуры для витрины снаряжения (viewBox): целиком или крупно один предмет. */
export const FOCUS_BOX: Record<'full' | Slot, string> = {
  full: '0 0 115 152', weapon: '66 4 48 112', armor: '2 50 96 96', helm: '20 0 64 56', boots: '22 104 60 46', amulet: '28 54 44 40',
};

/** Одиночная фигура героя (для карточек и списков). */
export const HeroFigure = memo(function HeroFigure({ look, color, emoji, face = null, cls = null, size = 120, attack = false, className = '', focus = 'full' }: { look: Look; color: string; emoji: string; face?: FaceConfig | null; cls?: ClsKey; size?: number; attack?: boolean; className?: string; focus?: 'full' | Slot }) {
  const uid = useId().replace(/:/g, '');
  const box = FOCUS_BOX[focus];
  const [, , w, h] = box.split(' ').map(Number) as [number, number, number, number];
  return (
    <svg viewBox={box} width={size} height={size * (h / w)} className={`hero-fig ${className}`} role="img" aria-label="Герой">
      <Defs uid={uid} />
      <Body look={look} color={color} emoji={emoji} face={face} attack={attack} uid={uid} cls={cls} />
    </svg>
  );
});

export function Defs({ uid }: { uid: string }) {
  return <defs><filter id={`glow-${uid}`} x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.6" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>;
}
/** Фигура внутри чужого SVG (сцены боёв). */
export function HeroGroup(p: Omit<Props, 'uid'> & { uid: string; transform?: string }) {
  const { transform, ...rest } = p;
  return <g transform={transform} className="hero-fig"><Body {...rest} /></g>;
}
