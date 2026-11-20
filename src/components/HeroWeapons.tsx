import type { ReactNode } from 'react';

/**
 * Оружие: пять видов по три внешних вида, редкость добавляет камень (1), крылья или шипы (2), сияние и искры (3).
 * Рисунок в местных координатах: рука держит точку (0, 0), остриё и верх направлены вверх (минус по y).
 * Цвета берутся из переменных редкости (--m1 светлый металл, --m2 тёмный, --gm камень), классы gx-* лежат в magic.css.
 */
const star = (x: number, y: number, s: number) => <path key={`${x}${y}`} transform={`translate(${x} ${y}) scale(${s})`} d="M0 -8 L2 -2 L8 0 L2 2 L0 8 L-2 2 L-8 0 L-2 -2Z" className="gx-g" />;
const grip = (len = 18) => <><rect x="-3.500" y="0" width="7" height={len} rx="2" fill="#5a2f8f" /><circle cx="0" cy={len + 3} r="5" className="gx-au" /></>;

/** Куда смотрит верх оружия (для вспышки при ударе) и область для картинки предмета в списках. */
export const WEAPON_TOP: Record<string, number> = { sword: -128, hammer: -112, staff: -160, brush: -104, banner: -150 };
export const WEAPON_BOX: Record<string, string> = { sword: '-44 -150 88 190', hammer: '-48 -134 96 176', staff: '-52 -176 104 150', brush: '-44 -118 88 160', banner: '-20 -170 108 160' };

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
    if (v === 2) return <>{handle}{[0, 45, 90, 135, 180, 225, 270, 315].map((a) => <path key={a} className="gx-b" d="M-4 -19 L0 -34 L4 -19Z" transform={`translate(0 -100) rotate(${a})`} />)}
      <circle className="gx-a" cx="0" cy="-100" r="19" /><path className="gx-b" d="M0 -119 A19 19 0 0 1 0 -81Z" />{gem(0, -100, 7)}
      {t >= 2 && <><path className="gx-a" d="M-10 -126 L0 -144 L10 -126Z" /></>}{t >= 3 && <>{star(-34, -126, 1)}{star(34, -76, .9)}</>}</>;
    return <>{handle}<rect className="gx-b" x="-18" y="-130" width="36" height="52" rx="8" /><rect className="gx-a" x="-18" y="-130" width="20" height="52" rx="8" /><rect className="gx-au" x="-22" y="-118" width="44" height="6" rx="2" /><rect className="gx-au" x="-22" y="-96" width="44" height="6" rx="2" />{gem(0, -107, 6)}
      {t >= 2 && <><path className="gx-a" d="M-18 -130 L-10 -146 L-2 -130Z" /><path className="gx-a" d="M2 -130 L10 -146 L18 -130Z" /></>}{t >= 3 && <>{star(32, -140, 1.100)}{star(-32, -92, .8)}</>}</>;
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
  if (family === 'brush') {
    const handle = (len: number) => <><path className="gx-wd" d="M-4.500 -28 H4.500 L5.500 28 Q0 36 -5.500 28Z" /><path className="gx-wd2" d="M0 -28 H4.500 L5.500 28 Q3 31 0 32Z" /></>;
    if (v === 1) return <>{handle(0)}<rect className="gx-b" x="-6.500" y="-44" width="13" height="18" rx="2" /><rect className="gx-a" x="-6.500" y="-40" width="13" height="3" /><rect className="gx-au" x="-6.500" y="-32" width="13" height="2" />
      <path className="gx-g" d="M-6.500 -44 Q-9 -76 0 -100 Q9 -76 6.500 -44Z" /><path className="gx-wh" d="M-3 -48 Q-5 -72 0 -90 Q-1 -70 -1 -48Z" />
      {t >= 1 && <><circle className="gx-g" cx="22" cy="-76" r="4.500" /><circle className="gx-g" cx="30" cy="-58" r="3" /></>}{t >= 2 && <path d="M12 -20 Q30 -30 22 -46 Q14 -54 6 -46" stroke="var(--gm)" strokeWidth="3" fill="none" strokeLinecap="round" />}{t >= 3 && <>{star(-26, -92, 1.100)}{star(30, -100, .9)}</>}</>;
    if (v === 2) return <>{handle(0)}<rect className="gx-b" x="-12" y="-46" width="24" height="18" rx="2" /><rect className="gx-au" x="-12" y="-38" width="24" height="3" />
      <path className="gx-g" d="M-12 -46 L-14 -86 Q0 -92 14 -86 L12 -46Z" /><path className="gx-wh" d="M-8 -50 L-9 -80 Q-4 -83 0 -83 L0 -50Z" />{t >= 1 && <><circle className="gx-g" cx="26" cy="-66" r="4" /><circle className="gx-g" cx="32" cy="-48" r="3" /></>}
      {t >= 2 && <path className="gx-a" d="M12 -34 Q28 -34 34 -46 Q26 -44 14 -42Z" />}{t >= 3 && <>{star(-28, -84, 1)}{star(26, -96, 1.100)}</>}</>;
    return <><path className="gx-wd" d="M-3 -28 H3 L4 30 Q0 36 -4 30Z" /><path className="gx-g" d="M0 -118 Q-24 -84 -10 -30 L-3 -28 H3 L10 -30 Q24 -84 0 -118Z" /><path d="M0 -112 V-30" stroke="#fff" strokeOpacity=".7" strokeWidth="1.500" /><path d="M-6 -84 L-14 -78 M-8 -66 L-16 -62 M6 -84 L14 -78 M8 -66 L16 -62" stroke="#fff" strokeOpacity=".5" strokeWidth="1.400" />
      <rect className="gx-au" x="-5" y="-34" width="10" height="4" rx="1.500" />{t >= 1 && <circle className="gx-g" cx="0" cy="-22" r="3.500" />}{t >= 2 && <><path className="gx-a" d="M-8 -46 Q-26 -44 -32 -60 Q-18 -58 -8 -54Z" /><path className="gx-a" d="M8 -46 Q26 -44 32 -60 Q18 -58 8 -54Z" /></>}{t >= 3 && <>{star(-30, -100, 1.100)}{star(26, -112, 1)}</>}</>;
  }
  // знамя
  const pole = <><rect className="gx-wd" x="-2.500" y="-148" width="5" height="176" rx="2" /><rect className="gx-wd2" x="0" y="-148" width="2.500" height="176" /><path className="gx-au" d="M0 -162 L5 -148 H-5Z" /><circle className="gx-au" cx="0" cy="31" r="4" /></>;
  if (v === 1) return <>{pole}{t >= 2 && <path className="gx-a" d="M2 -70 H44 L36 -62 L44 -54 H2Z" />}<path className="gx-b" d="M2 -144 H56 L44 -122 L56 -100 H2Z" /><path className="gx-a" d="M2 -144 H56 L52 -139 H2Z" /><path className="gx-au" d="M26 -135 L29 -128 L36 -127 L31 -122 L33 -115 L26 -119 L19 -115 L21 -122 L16 -127 L23 -128Z" />
    {t >= 1 && <><rect className="gx-au" x="8" y="-100" width="2" height="9" /><rect className="gx-au" x="22" y="-100" width="2" height="9" /><rect className="gx-au" x="40" y="-114" width="2" height="7" /></>}{t >= 3 && <>{star(70, -146, 1)}{star(60, -74, .8)}<path d="M20 -118 V-106 M14 -112 H26" stroke="var(--gm)" strokeWidth="2" /></>}</>;
  if (v === 2) return <>{pole}<rect className="gx-au" x="-2" y="-144" width="62" height="5" rx="2" /><path className="gx-b" d="M4 -139 H56 V-90 L30 -100 L4 -90Z" /><path className="gx-a" d="M4 -139 H30 V-100 L4 -90Z" /><circle className="gx-au" cx="30" cy="-120" r="8" />{gem(30, -120, 4)}
    {t >= 2 && <path className="gx-au" d="M4 -90 L30 -100 L56 -90 L56 -86 L30 -96 L4 -86Z" />}{t >= 1 && <><rect className="gx-au" x="10" y="-90" width="2" height="9" /><rect className="gx-au" x="48" y="-90" width="2" height="9" /></>}{t >= 3 && <>{star(70, -146, 1)}{star(66, -96, .8)}</>}</>;
  return <>{pole}<path className="gx-b" d="M2 -140 L86 -124 L2 -108Z" /><path className="gx-a" d="M2 -140 L86 -124 L44 -132Z" />{gem(20, -124, 3.500)}{t >= 2 && <path className="gx-a" d="M2 -100 L58 -88 L2 -76Z" />}{t >= 1 && <><path className="gx-au" d="M86 -124 L96 -124" stroke="#f2c46b" strokeWidth="3" /></>}{t >= 3 && <>{star(92, -146, 1)}{star(60, -66, .8)}</>}</>;
}
