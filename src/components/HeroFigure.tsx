'use client';
import { memo, useId } from 'react';
import { gearById, type GearItem, type GearRarity, type Slot } from '@/lib/game/gear';

/** Что надето: id предмета по слотам (null — пусто). */
export type Look = Partial<Record<Slot, string | null>>;

export const RARITY_COLOR: Record<GearRarity, string> = { common: '#9a97b5', rare: '#5f9dff', epic: '#b46bff', legend: '#ffd24a' };
const SKIN = '#e9c7a8';

const dark = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v * (1 - k)));
  return `rgb(${c.join(',')})`;
};

interface Props { look: Look; color: string; emoji: string; attack?: boolean; uid: string }

/** Герой в полный рост (координаты 0..100 × 0..150): одежда цвета героя, надетое снаряжение видно на фигуре. */
function Body({ look, color, emoji, attack, uid }: Props) {
  const it = (s: Slot): GearItem | null => { const id = look[s]; return id ? gearById(id) ?? null : null; };
  const weapon = it('weapon'), armor = it('armor'), helm = it('helm'), boots = it('boots'), amulet = it('amulet');
  const rc = (g: GearItem | null) => (g ? RARITY_COLOR[g.rarity] : '#555');
  const glow = (g: GearItem | null) => (g && g.rarity === 'legend' ? `url(#glow-${uid})` : undefined);
  const tunic = dark(color, 0.35), pants = dark(color, 0.6);

  return (
    <g>
      <ellipse cx="50" cy="146" rx="26" ry="4" fill="#000" opacity="0.35" />
      {/* ноги и сапоги */}
      <g>
        <rect x="36" y="104" width="12" height="34" rx="4" fill={pants} />
        <rect x="52" y="104" width="12" height="34" rx="4" fill={pants} />
        <path d="M33 124 H49 V141 Q49 146 44 146 H34 Q31 146 31 142 Z" fill={boots ? rc(boots) : '#3a3558'} stroke="#0d0916" strokeWidth="0.8" filter={glow(boots)} />
        <path d="M51 124 H67 V142 Q67 146 66 146 H56 Q51 146 51 141 Z" fill={boots ? rc(boots) : '#3a3558'} stroke="#0d0916" strokeWidth="0.8" filter={glow(boots)} />
        {boots?.family === 'boots' && <path d="M33 124 H49 M51 124 H67" stroke="#fff" strokeOpacity="0.5" strokeWidth="1.4" />}
        {boots?.family === 'sandals' && <path d="M35 132 L47 128 M53 128 L65 132" stroke="#fff" strokeOpacity="0.5" strokeWidth="1.2" />}
      </g>
      {/* щит на левой руке (семейство «щит» в слоте доспеха) */}
      {/* туловище */}
      <rect x="31" y="60" width="38" height="48" rx="9" fill={tunic} stroke="#0d0916" strokeWidth="0.8" />
      {armor?.family === 'armor' && (
        <g filter={glow(armor)}>
          <path d="M30 62 Q50 54 70 62 L67 106 Q50 112 33 106 Z" fill={rc(armor)} stroke="#0d0916" strokeWidth="0.9" />
          <path d="M50 58 V108 M36 80 H64 M37 94 H63" stroke="#fff" strokeOpacity="0.35" strokeWidth="1" fill="none" />
          <ellipse cx="29" cy="64" rx="7" ry="5.5" fill={rc(armor)} stroke="#0d0916" strokeWidth="0.8" />
          <ellipse cx="71" cy="64" rx="7" ry="5.5" fill={rc(armor)} stroke="#0d0916" strokeWidth="0.8" />
        </g>
      )}
      <rect x="31" y="100" width="38" height="5" rx="2" fill="#1a1428" />
      {amulet && (
        <g filter={glow(amulet)}>
          <path d="M42 62 Q50 76 58 62" fill="none" stroke="#d9c58a" strokeWidth="0.9" />
          <circle cx="50" cy="73" r="4.2" fill={rc(amulet)} stroke="#0d0916" strokeWidth="0.7" />
          <circle cx="49" cy="72" r="1.2" fill="#fff" opacity="0.7" />
        </g>
      )}
      {/* левая рука и щит */}
      <g>
        <path d="M31 68 Q20 82 22 98" fill="none" stroke={tunic} strokeWidth="9" strokeLinecap="round" />
        <circle cx="22" cy="100" r="4.5" fill={SKIN} />
        {armor?.family === 'shield' && (
          <g filter={glow(armor)}>
            <circle cx="17" cy="88" r="16" fill={rc(armor)} stroke="#0d0916" strokeWidth="1" />
            <circle cx="17" cy="88" r="10" fill="none" stroke="#fff" strokeOpacity="0.45" strokeWidth="1.4" />
            <path d="M17 78 V98 M7 88 H27" stroke="#fff" strokeOpacity="0.4" strokeWidth="1.2" />
          </g>
        )}
      </g>
      {/* голова */}
      <circle cx="50" cy="38" r="17" fill={SKIN} stroke="#0d0916" strokeWidth="0.8" />
      <text x="50" y="46" textAnchor="middle" fontSize="24">{emoji}</text>
      {helm?.family === 'helm' && (
        <g filter={glow(helm)}>
          <path d="M32 38 A18 18 0 0 1 68 38 L68 31 Q50 18 32 31 Z" fill={rc(helm)} stroke="#0d0916" strokeWidth="0.9" />
          <path d="M32 38 H68" stroke={rc(helm)} strokeWidth="3.4" />
          <rect x="47" y="30" width="6" height="12" rx="2" fill={rc(helm)} stroke="#0d0916" strokeWidth="0.6" />
          <path d="M50 14 V22" stroke={rc(helm)} strokeWidth="2.4" />
        </g>
      )}
      {helm?.family === 'crown' && (
        <g filter={glow(helm)}>
          <path d="M34 28 L38 14 L44 24 L50 10 L56 24 L62 14 L66 28 Z" fill={rc(helm)} stroke="#0d0916" strokeWidth="0.9" />
          <circle cx="50" cy="19" r="1.8" fill="#fff" opacity="0.75" />
        </g>
      )}
      {/* правая рука и оружие */}
      <g className={attack ? 'hf-swing' : 'hf-hold'} style={{ transformOrigin: '68px 66px', transformBox: 'view-box' }}>
        <path d="M69 68 Q82 78 80 96" fill="none" stroke={tunic} strokeWidth="9" strokeLinecap="round" />
        <circle cx="80" cy="98" r="4.5" fill={SKIN} />
        <g filter={glow(weapon)}>
          {!weapon && <path d="M80 98 L88 58" stroke="#8a6a3b" strokeWidth="3" strokeLinecap="round" />}
          {weapon?.family === 'sword' && <><path d="M80 96 L92 40 L96 42 L84 98 Z" fill={rc(weapon)} stroke="#0d0916" strokeWidth="0.8" /><path d="M74 94 L90 102" stroke="#caa86a" strokeWidth="3" strokeLinecap="round" /></>}
          {weapon?.family === 'hammer' && <><path d="M80 98 L90 50" stroke="#8a6a3b" strokeWidth="3.4" strokeLinecap="round" /><rect x="80" y="36" width="22" height="14" rx="3" transform="rotate(10 91 43)" fill={rc(weapon)} stroke="#0d0916" strokeWidth="0.9" /></>}
          {weapon?.family === 'staff' && <><path d="M80 100 L92 30" stroke="#8a6a3b" strokeWidth="3" strokeLinecap="round" /><circle cx="93" cy="26" r="7" fill={rc(weapon)} stroke="#0d0916" strokeWidth="0.9" /><circle cx="91" cy="24" r="2" fill="#fff" opacity="0.7" /></>}
          {weapon?.family === 'brush' && <><path d="M80 100 L90 44" stroke="#8a6a3b" strokeWidth="2.6" strokeLinecap="round" /><path d="M90 44 Q96 28 86 24 Q84 36 90 44 Z" fill={rc(weapon)} stroke="#0d0916" strokeWidth="0.8" /></>}
          {weapon?.family === 'banner' && <><path d="M82 100 L90 30" stroke="#8a6a3b" strokeWidth="3" strokeLinecap="round" /><path d="M90 30 L112 36 L92 48 Z" fill={rc(weapon)} stroke="#0d0916" strokeWidth="0.9" /></>}
        </g>
      </g>
    </g>
  );
}

/** Одиночная фигура героя (для карточек и списков). */
export const HeroFigure = memo(function HeroFigure({ look, color, emoji, size = 120, attack = false, className = '' }: { look: Look; color: string; emoji: string; size?: number; attack?: boolean; className?: string }) {
  const uid = useId().replace(/:/g, '');
  return (
    <svg viewBox="0 0 115 152" width={size} height={size * (152 / 115)} className={`hero-fig ${className}`} role="img" aria-label="Герой">
      <Defs uid={uid} />
      <Body look={look} color={color} emoji={emoji} attack={attack} uid={uid} />
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
