import type { ReactNode } from 'react';

/** Головные уборы по классам и редкости (tier 0..3). Цвета: --hm1 светлый, --hm2 тёмный. Голова в (120, 95). */
export function headgear(cls: 'w' | 'm' | 'b' | 'p', tier: number, gem: string, trim = '#f2c46b'): ReactNode {
  const t = Math.max(0, tier);
  const star = (x: number, y: number, s: number, c: string) => <path transform={`translate(${x} ${y}) scale(${s})`} d="M0 -8 L2 -2 L8 0 L2 2 L0 8 L-2 2 L-8 0 L-2 -2Z" fill={c} />;

  if (cls === 'w') {
    const dome = <><path className="hf-hm1" d="M88 98 Q84 54 120 50 Q156 54 152 98 L144 98 L142 78 H98 L96 98 Z" /><path className="hf-hm2" d="M120 50 Q156 54 152 98 L144 98 L142 78 H120 Z" /></>;
    if (t === 0) return <><path className="hf-hm1" d="M91 86 Q88 56 120 53 Q152 56 149 86 Q120 78 91 86Z" /><path className="hf-hm2" d="M120 53 Q152 56 149 86 Q134 81 120 80Z" /><rect x="91" y="82" width="58" height="5" rx="2" fill="#7a4a24" /></>;
    if (t === 1) return <>{dome}<rect className="hf-hm2" x="118" y="70" width="5" height="26" rx="2" /></>;
    if (t === 2) return <>{dome}<rect className="hf-hm2" x="118" y="70" width="5" height="26" rx="2" /><path d="M92 76 Q68 76 60 46 Q82 54 99 68Z" fill="#f4efff" /><path d="M148 76 Q172 76 180 46 Q158 54 141 68Z" fill="#dcd2ff" /></>;
    return <>{dome}<rect className="hf-hm2" x="118" y="70" width="5" height="26" rx="2" /><rect x="116" y="50" width="8" height="26" rx="2" fill={trim} /><path d="M120 50 Q130 10 172 20 Q150 30 146 60Z" fill={gem} /><path d="M92 90 Q74 96 66 80 Q84 82 96 80Z" fill={trim} /><path d="M148 90 Q166 96 174 80 Q156 82 144 80Z" fill={trim} /></>;
  }

  if (cls === 'm') {
    if (t === 0) return <><ellipse className="hf-hm2" cx="120" cy="76" rx="42" ry="9" /><path className="hf-hm1" d="M92 76 L126 14 L148 76Z" /></>;
    if (t === 1) return <><ellipse className="hf-hm2" cx="120" cy="76" rx="46" ry="10" /><path className="hf-hm1" d="M86 76 Q100 46 114 20 Q122 2 140 8 Q130 12 130 26 Q132 54 154 76 Z" /><path d="M92 68 Q120 78 148 68 L151 76 Q120 87 89 76Z" fill={trim} /></>;
    if (t === 2) return <><ellipse className="hf-hm2" cx="120" cy="76" rx="50" ry="11" /><path className="hf-hm1" d="M86 76 Q98 40 110 4 Q122 -14 146 -4 Q132 2 132 20 Q134 52 156 76 Z" /><path d="M90 68 Q120 80 150 68 L153 77 Q120 90 87 77Z" fill={trim} />{star(112, 46, 1.200, gem)}{star(126, 30, .8, '#fff1c2')}{star(146, -4, 1, gem)}</>;
    return <><ellipse className="hf-hm2" cx="120" cy="76" rx="54" ry="12" /><path className="hf-hm1" d="M84 76 Q96 36 108 -2 Q120 -26 150 -14 Q134 -6 134 14 Q136 52 158 76 Z" /><path d="M88 68 Q120 82 152 68 L155 78 Q120 92 85 78Z" fill={trim} /><circle cx="120" cy="80" r="5" fill={gem} /><path d="M118 20 Q128 24 128 36 Q120 32 118 20Z" fill="#fff1c2" />{star(110, 42, 1.200, gem)}{star(150, -14, 1.400, '#fff1c2')}{star(84, 20, .9, gem)}{star(160, 36, .8, gem)}</>;
  }

  if (cls === 'b') {
    if (t === 0) return <ellipse className="hf-hm2" cx="118" cy="70" rx="34" ry="12" transform="rotate(-12 118 70)" />;
    if (t === 1) return <><ellipse className="hf-hm2" cx="118" cy="68" rx="36" ry="14" transform="rotate(-12 118 68)" /><path className="hf-hm1" d="M86 78 Q116 90 148 70 L150 78 Q118 98 84 86Z" /><path d="M144 62 Q164 50 172 34 Q168 54 150 70Z" fill={gem} /></>;
    if (t === 2) return <><ellipse className="hf-hm2" cx="118" cy="76" rx="52" ry="11" transform="rotate(-8 118 76)" /><path className="hf-hm1" d="M92 76 Q92 40 118 38 Q146 40 146 70 Z" /><path d="M92 70 Q120 82 146 68 L146 76 Q120 90 92 78Z" fill={trim} /><path d="M140 56 Q182 28 198 -6 Q194 38 150 70Z" fill={gem} /><path d="M146 60 Q178 36 196 -2" stroke="#fff1c2" strokeWidth="2" fill="none" /></>;
    return <><path className="hf-hm2" d="M62 78 Q80 56 120 62 Q160 56 178 78 Q150 70 120 74 Q90 70 62 78Z" /><path className="hf-hm1" d="M88 74 Q92 42 120 40 Q148 42 152 74 Z" /><path d="M88 70 Q120 82 152 70 L152 78 Q120 90 88 78Z" fill={trim} /><circle cx="120" cy="56" r="6" fill={gem} /><path d="M146 52 Q190 24 210 -10 Q206 36 156 72Z" fill={gem} /><path d="M150 56 Q186 34 206 -6" stroke="#fff1c2" strokeWidth="2.500" fill="none" />{star(60, 54, 1, '#fff1c2')}</>;
  }

  // паладин
  const halo = (w: number, o = 1) => <ellipse className="hf-halo" cx="120" cy="34" rx={w} ry={w / 4} fill="none" stroke={gem} strokeWidth="3.500" opacity={o} />;
  if (t === 0) return <><path className="hf-hm2" d="M88 100 Q82 52 120 48 Q158 52 152 100 Q146 80 120 72 Q94 80 88 100Z" /><path className="hf-hm1" d="M92 96 Q90 58 120 54 Q150 58 148 96 Q142 78 120 76 Q98 78 92 96Z" opacity=".6" />{halo(28, .55)}</>;
  const dome = <><path className="hf-hm1" d="M88 98 Q84 54 120 50 Q156 54 152 98 L144 98 L142 78 H98 L96 98 Z" /><path className="hf-hm2" d="M120 50 Q156 54 152 98 L144 98 L142 78 H120Z" /></>;
  if (t === 1) return <>{dome}<rect x="117" y="56" width="6" height="22" rx="1.500" fill="#5f8fff" /><rect x="110" y="62" width="20" height="6" rx="1.500" fill="#5f8fff" />{halo(32, .8)}</>;
  if (t === 2) return <>{dome}<path d="M92 66 Q70 54 56 28 Q84 32 100 56Z" fill="#fff1c2" /><path d="M148 66 Q170 54 184 28 Q156 32 140 56Z" fill="#fff1c2" />{halo(36)}</>;
  return <><path className="hf-hm1" d="M90 80 Q92 52 120 50 Q148 52 150 80 Q120 70 90 80Z" /><path d="M86 66 Q60 50 48 14 Q84 22 100 54Z" fill="#fff1c2" /><path d="M154 66 Q180 50 192 14 Q156 22 140 54Z" fill="#fff1c2" /><ellipse className="hf-halo" cx="120" cy="30" rx="44" ry="11" fill="none" stroke={gem} strokeWidth="5" /><ellipse cx="120" cy="30" rx="44" ry="11" fill="none" stroke="#fff1c2" strokeWidth="1.800" opacity=".8" />{star(62, 20, 1.200, '#fff1c2')}{star(180, 14, 1, gem)}<circle cx="120" cy="52" r="5" fill={gem} /></>;
}
