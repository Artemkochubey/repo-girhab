import type { ReactNode } from 'react';

/**
 * Оружие: пять видов по три внешних вида, редкость добавляет камень (1), крылья или шипы (2), сияние и искры (3).
 * Рисунок в местных координатах: рука держит точку (0, 0), остриё и верх направлены вверх (минус по y).
 * Цвета берутся из переменных редкости (--m1 светлый металл, --m2 тёмный, --gm камень), классы gx-* лежат в magic.css.
 */
const star = (x: number, y: number, s: number) => <path key={`${x}${y}`} transform={`translate(${x} ${y}) scale(${s})`} d="M0 -8 L2 -2 L8 0 L2 2 L0 8 L-2 2 L-8 0 L-2 -2Z" className="gx-g" />;
const grip = (len = 18) => <><rect x="-3.500" y="0" width="7" height={len} rx="2" fill="#5a2f8f" /><circle cx="0" cy={len + 3} r="5" className="gx-au" /></>;

/** Куда смотрит верх оружия (для вспышки при ударе) и область для картинки предмета в списках. */
export const WEAPON_TOP: Record<string, number> = { sword: -128, hammer: -120, staff: -160, lyre: -104, mace: -118 };
export const WEAPON_BOX: Record<string, string> = { sword: '-44 -150 88 190', hammer: '-52 -134 96 176', staff: '-52 -176 104 150', lyre: '-44 -116 88 140', mace: '-52 -142 104 176' };

export function weaponArt(family: string, variant: number, tier: number): ReactNode {
  const t = Math.max(0, tier), v = Math.max(1, Math.min(3, variant));
  const gem = (x: number, y: number, r = 4) => t >= 1 && <><circle className="gx-g" cx={x} cy={y} r={r} /><circle className="gx-wh" cx={x - r * .3} cy={y - r * .3} r={r * .35} /></>;

  if (family === 'sword') {
    if (v === 1) return <>
      {t >= 3 && <rect className="gx-g" x="-1" y="-112" width="2" height="100" opacity=".85" />}
      <path className="gx-a" d="M-6 -8 V-104 L0 -126 L6 -104 V-8Z" /><path className="gx-b" d="M0 -126 L6 -104 V-8 H0Z" />
      {t >= 2 && <><path className="gx-a" d="M-16 -4 Q-30 -8 -36 -26 Q-22 -20 -12 -12Z" /><path className="gx-a" d="M16 -4 Q30 -8 36 -26 Q22 -20 12 -12Z" /></>}
      <path className="gx-au" d="M-20 -8 H20 L17 1 H-17Z" />{gem(0, -3.500)}{grip()}{t >= 3 && star(26, -84, 1.100)}</>;
    if (v === 2) return <>
      {t >= 3 && <path d="M0 -10 Q4 -60 16 -110" stroke="var(--gm)" strokeWidth="2" fill="none" opacity=".85" />}
      <path className="gx-a" d="M-6 -8 V-74 Q-5 -104 16 -124 Q16 -64 6 -8Z" /><path className="gx-b" d="M2 -8 V-70 Q3 -100 16 -124 Q16 -64 6 -8Z" />
      {t >= 2 && <path className="gx-a" d="M-20 -4 Q-34 -10 -38 -28 Q-24 -22 -14 -12Z" />}
      <path className="gx-au" d="M-18 -8 H18 L15 1 H-15Z" /><path d="M-14 1 Q-22 18 -4 22" stroke="#f2c46b" strokeWidth="3" fill="none" />{gem(0, -3.500)}{grip()}{t >= 3 && star(-26, -70, 1)}</>;
    return <>
      {t >= 3 && <rect className="gx-g" x="-.8" y="-128" width="1.600" height="116" opacity=".85" />}
      <path className="gx-a" d="M-3 -10 V-132 L0 -142 L3 -132 V-10Z" /><path className="gx-b" d="M0 -142 L3 -132 V-10 H0Z" />
      <path className="gx-au" d="M-22 -6 Q0 -26 22 -6 Q0 6 -22 -6Z" />{t >= 2 && <path className="gx-au" d="M-22 -6 Q-32 -16 -28 -30 Q-18 -22 -14 -12Z" />}{gem(0, -9, 3.500)}{grip(16)}{t >= 3 && star(20, -100, 1)}</>;
  }
  if (family === 'hammer') {
    const handle = <><rect className="gx-wd" x="-4" y="-92" width="8" height="120" rx="3" /><rect className="gx-au" x="-4.500" y="-4" width="9" height="3" /><rect className="gx-au" x="-4.500" y="8" width="9" height="3" /><circle className="gx-au" cx="0" cy="31" r="5" /></>;
    if (v === 1) return <>{handle}<rect className="gx-b" x="-34" y="-112" width="10" height="26" rx="3" /><rect className="gx-b" x="24" y="-112" width="10" height="26" rx="3" />
      {t >= 2 && <><path className="gx-a" d="M-16 -112 L-10 -128 L-4 -112Z" /><path className="gx-a" d="M4 -112 L10 -128 L16 -112Z" /></>}
      <rect className="gx-a" x="-26" y="-114" width="52" height="30" rx="6" /><rect className="gx-b" x="0" y="-114" width="26" height="30" rx="6" /><rect className="gx-wh" x="-22" y="-111" width="34" height="3" rx="1.500" />{gem(0, -99, 6)}
      {t >= 3 && <><path d="M-20 -108 L-12 -100 L-17 -94 L-8 -88" stroke="var(--gm)" strokeWidth="2" fill="none" /><path d="M20 -108 L12 -100 L17 -94 L8 -88" stroke="var(--gm)" strokeWidth="2" fill="none" />{star(40, -128, 1)}</>}</>;
    if (v === 2) return <>{handle}<rect className="gx-b" x="-18" y="-130" width="36" height="52" rx="8" /><rect className="gx-a" x="-18" y="-130" width="20" height="52" rx="8" /><rect className="gx-au" x="-22" y="-118" width="44" height="6" rx="2" /><rect className="gx-au" x="-22" y="-96" width="44" height="6" rx="2" />{gem(0, -107, 6)}
      {t >= 2 && <><path className="gx-a" d="M-18 -130 L-10 -146 L-2 -130Z" /><path className="gx-a" d="M2 -130 L10 -146 L18 -130Z" /></>}{t >= 3 && <>{star(32, -140, 1.100)}{star(-32, -92, .8)}</>}</>;
    return <>{handle}<path className="gx-a" d="M-10 -116 L-46 -106 L-10 -94Z" /><path className="gx-b" d="M-10 -116 L-46 -106 L-28 -105Z" opacity=".5" /><rect className="gx-b" x="-10" y="-122" width="20" height="34" rx="4" /><rect className="gx-a" x="10" y="-124" width="18" height="38" rx="3" /><rect className="gx-au" x="-12" y="-106" width="40" height="5" rx="2" />{gem(0, -103, 5)}
      {t >= 2 && <path className="gx-a" d="M-6 -122 L0 -140 L6 -122Z" />}{t >= 3 && <>{star(40, -130, 1.100)}{star(-40, -86, .8)}</>}</>;
  }
  if (family === 'staff') {
    const shaft = (top: number) => <><rect className="gx-wd" x="-3.500" y={top} width="7" height={170 - top} rx="3" /><rect className="gx-wd2" x="0" y={top} width="3.500" height={170 - top} /></>;
    if (v === 1) return <>{shaft(-90)}<path d="M-17 -112 Q-17 -86 0 -86 Q17 -86 17 -112" fill="none" stroke="#f2c46b" strokeWidth="5" strokeLinecap="round" />
      {t >= 2 && <><path className="gx-a" d="M-15 -92 Q-34 -92 -42 -112 Q-26 -112 -14 -102Z" /><path className="gx-a" d="M15 -92 Q34 -92 42 -112 Q26 -112 14 -102Z" /></>}
      <circle className="gx-g" cx="0" cy="-118" r="16" /><circle className="gx-wh" cx="-6" cy="-124" r="5" />{t === 0 && <circle cx="0" cy="-118" r="16" fill="#8392b8" opacity=".55" />}
      {t >= 1 && <><circle className="gx-a" cx="-17" cy="-100" r="3" /><circle className="gx-a" cx="17" cy="-100" r="3" /></>}{t >= 3 && <><ellipse cx="0" cy="-118" rx="30" ry="9" fill="none" stroke="#f2c46b" strokeWidth="3" />{star(0, -150, 1.200)}{star(34, -86, .8)}</>}</>;
    if (v === 2) return <>{shaft(-50)}<path className="gx-g" d="M0 -118 L14 -84 L0 -56 L-14 -84Z" /><path className="gx-wh" d="M0 -118 L-14 -84 L0 -80Z" /><path d="M-12 -62 Q0 -50 12 -62" stroke="#f2c46b" strokeWidth="4" fill="none" strokeLinecap="round" />
      {t >= 2 && <><path className="gx-a" d="M-12 -70 Q-30 -70 -38 -90 Q-22 -88 -12 -80Z" /><path className="gx-a" d="M12 -70 Q30 -70 38 -90 Q22 -88 12 -80Z" /></>}{t >= 3 && <>{star(-26, -130, 1)}{star(26, -120, .9)}<ellipse cx="0" cy="-84" rx="26" ry="8" fill="none" stroke="#f2c46b" strokeWidth="3" /></>}{t >= 1 && <circle className="gx-a" cx="0" cy="-52" r="4" />}</>;
    return <>{shaft(-80)}<path d="M-22 -134 A24 24 0 1 0 22 -134 A18 18 0 1 1 -22 -134Z" fill="#f2c46b" /><circle className="gx-g" cx="0" cy="-122" r="10" /><circle className="gx-wh" cx="-3" cy="-125" r="3.500" />
      {t >= 2 && <><path className="gx-a" d="M-12 -86 Q-32 -84 -40 -104 Q-24 -102 -12 -94Z" /><path className="gx-a" d="M12 -86 Q32 -84 40 -104 Q24 -102 12 -94Z" /></>}{t >= 1 && <circle className="gx-a" cx="0" cy="-86" r="4" />}{t >= 3 && <>{star(0, -158, 1.200)}{star(-34, -112, .9)}{star(34, -112, .9)}<ellipse cx="0" cy="-122" rx="32" ry="8" fill="none" stroke="var(--gm)" strokeWidth="2" opacity=".8" /></>}</>;
  }
  if (family === 'lyre') {
    const body = t === 0 ? '#a8742a' : '#f2c46b';
    const edge = { stroke: '#3a2400', strokeWidth: 2, strokeOpacity: 0.55 };
    if (v === 1) return <>
      <rect className="gx-wd" x="-4.500" y="-98" width="9" height="62" rx="2" /><rect className="gx-wd2" x="-9" y="-108" width="18" height="16" rx="4" />
      <circle className="gx-au" cx="-12" cy="-102" r="2.500" /><circle className="gx-au" cx="12" cy="-102" r="2.500" /><circle className="gx-au" cx="-12" cy="-94" r="2.500" /><circle className="gx-au" cx="12" cy="-94" r="2.500" />
      <ellipse cx="0" cy="-12" rx="26" ry="30" fill={body} {...edge} /><ellipse cx="0" cy="-12" rx="19" ry="23" fill={t === 0 ? '#8a5a1e' : '#c98a1d'} />
      {t >= 1 ? <><circle className="gx-a" cx="0" cy="-12" r="12" /><circle className="gx-g" cx="0" cy="-12" r="5.500" /></> : <circle cx="0" cy="-12" r="8" fill="#3a2400" />}
      <path d="M-1.600 -96 V16 M1.600 -96 V16" stroke="#fff1c2" strokeWidth="1" opacity=".7" />
      {t >= 2 && <>{star(-40, -70, 1)}<circle className="gx-g" cx="38" cy="-52" r="4" /><rect className="gx-g" x="40" y="-76" width="2.500" height="24" /></>}{t >= 3 && star(42, -92, 1.100)}</>;
    if (v === 2) return <>
      <path className="gx-a" {...edge} d="M-30 -96 Q-42 -46 -22 -14 L-14 -18 Q-30 -46 -22 -92Z" /><path className="gx-a" {...edge} d="M30 -96 Q42 -46 22 -14 L14 -18 Q30 -46 22 -92Z" />
      <rect className={t >= 3 ? 'gx-au' : 'gx-b'} {...edge} x="-34" y="-102" width="68" height="10" rx="5" /><rect className={t >= 3 ? 'gx-au' : 'gx-b'} {...edge} x="-20" y="-18" width="40" height="18" rx="5" />
      {[-14, -7, 0, 7, 14].map((x) => <path key={x} d={`M${x} -92 V-18`} stroke="#fff1c2" strokeWidth="1.600" opacity=".9" />)}
      {t >= 1 && <circle className="gx-g" cx="0" cy="-97" r="5.500" />}{t >= 2 && <><path className="gx-au" d="M-34 -97 Q-50 -98 -56 -114 Q-42 -112 -32 -104Z" /><path className="gx-au" d="M34 -97 Q50 -98 56 -114 Q42 -112 32 -104Z" /></>}{t >= 3 && <>{star(-46, -60, 1)}{star(46, -70, 1.100)}</>}</>;
    return <>
      <path className="gx-a" {...edge} d="M-26 -104 Q16 -118 32 -70 L32 -6 L18 -6 L16 -64 Q8 -94 -16 -96 L-16 -8 L-26 -8Z" /><rect className={t >= 3 ? 'gx-au' : 'gx-b'} {...edge} x="-28" y="-10" width="62" height="12" rx="4" />
      {[-9, -2, 5, 12].map((x, i) => <path key={x} d={`M${x} ${-92 + i * 8} V-10`} stroke="#fff1c2" strokeWidth="1.500" opacity=".9" />)}
      {t >= 1 && <circle className="gx-g" cx="-10" cy="-100" r="4.500" />}{t >= 2 && <path className="gx-au" d="M32 -70 Q50 -76 52 -92 Q40 -88 30 -80Z" />}{t >= 3 && <>{star(-44, -80, 1)}{star(48, -40, 1)}</>}</>;
  }
  // булава (Дисциплина)
  const mhandle = <><rect className="gx-wd" x="-4" y="-84" width="8" height="112" rx="3" /><rect className="gx-au" x="-4.500" y="-2" width="9" height="3" /><rect className="gx-au" x="-4.500" y="10" width="9" height="3" /><circle className="gx-au" cx="0" cy="31" r="5" /></>;
  const spikes = (n: number, r: number, len: number, cy: number) => Array.from({ length: n }, (_, k) => <path key={k} className="gx-b" d={`M-4 ${-r} L0 ${-r - len} L4 ${-r}Z`} transform={`translate(0 ${cy}) rotate(${(360 / n) * k})`} />);
  if (v === 1) return <>{mhandle}{spikes(8, 19, 15, -100)}<circle className="gx-a" cx="0" cy="-100" r="19" /><path className="gx-b" d="M0 -119 A19 19 0 0 1 0 -81Z" />{gem(0, -100, 7)}{t >= 2 && <path className="gx-a" d="M-10 -126 L0 -144 L10 -126Z" />}{t >= 3 && <>{star(-34, -126, 1)}{star(34, -76, .9)}</>}</>;
  if (v === 2) return <>{mhandle}{spikes(10, 15, 30, -98)}<circle className="gx-a" cx="0" cy="-98" r="15" /><path className="gx-b" d="M0 -113 A15 15 0 0 1 0 -83Z" /><path className="gx-au" d="M-6 -84 H6 V-74 H-6Z" />{gem(0, -98, 6)}{t >= 3 && <>{star(-42, -128, 1.100)}{star(44, -70, .9)}</>}</>;
  return <><rect className="gx-wd" x="-4" y="-44" width="8" height="72" rx="3" /><rect className="gx-au" x="-4.500" y="-44" width="9" height="4" /><circle className="gx-au" cx="0" cy="31" r="5" />
    <path d="M0 -46 Q-26 -70 -16 -92" stroke="#c3cde6" strokeWidth="3.500" fill="none" strokeLinecap="round" strokeDasharray="6 3" />
    {spikes(8, 14, 14, -108).map((x, i) => <g key={i} transform="translate(-16 0)">{x}</g>)}<circle className="gx-a" cx="-16" cy="-108" r="14" /><path className="gx-b" d="M-16 -122 A14 14 0 0 1 -16 -94Z" />{gem(-16, -108, 5.500)}
    {t >= 2 && <path className="gx-a" d="M-4 -46 Q14 -56 24 -76 Q10 -66 -4 -58Z" />}{t >= 3 && <>{star(18, -130, 1.100)}{star(-46, -64, .9)}</>}</>;
}
