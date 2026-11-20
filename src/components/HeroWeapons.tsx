import type { ReactNode } from 'react';

/** Оружие в руке по классам и редкости (tier 0..3): меч → палаш → фламберг → клеймор; посох → кристалл → звёздное кольцо → архимаг; лютня → мастерская → серебряная лира → золотая; дубина → булава → молот → солнечный скипетр. */
const star = (x: number, y: number, s: number) => <path transform={`translate(${x} ${y}) scale(${s})`} d="M0 -8 L2 -2 L8 0 L2 2 L0 8 L-2 2 L-8 0 L-2 -2Z" className="gx-g" />;

export function weaponArt(cls: 'w' | 'm' | 'b' | 'p', tier: number): ReactNode {
  const t = Math.max(0, tier);
  if (cls === 'w') {
    const grip = <><rect x="188" y="190" width="7" height="14" fill="#5a2f8f" /><circle cx="191.500" cy="208" r="5" className="gx-au" /></>;
    if (t === 0) return <><rect className="gx-a" x="186" y="112" width="9" height="72" rx="1.500" /><path className="gx-a" d="M186 112 L190.500 98 L195 112Z" /><rect className="gx-b" x="190.500" y="112" width="4.500" height="72" /><rect x="178" y="184" width="26" height="7" rx="3" fill="#7a4a24" />{grip}</>;
    if (t === 1) return <><path className="gx-a" d="M184 184 V104 Q184 78 202 58 Q204 100 198 184Z" /><path className="gx-b" d="M191 184 V110 Q192 84 202 58 Q204 100 198 184Z" /><path className="gx-au" d="M172 184 H210 L206 192 H176Z" /><path d="M176 192 Q168 208 188 210" stroke="#f2c46b" strokeWidth="3" fill="none" /><circle className="gx-g" cx="191" cy="188" r="3.200" />{grip}</>;
    if (t === 2) return <><path className="gx-a" d="M184 184 L186 160 Q180 148 186 136 Q192 124 186 112 Q180 100 187 88 Q192 74 190.500 50 Q196 74 195 88 Q201 100 195 112 Q189 124 195 136 Q201 148 195 160 L198 184Z" /><path className="gx-b" d="M190.500 50 Q196 74 195 88 Q201 100 195 112 Q189 124 195 136 Q201 148 195 160 L198 184 H190.500Z" /><path className="gx-au" d="M168 182 Q180 178 191 186 Q202 178 214 182 L210 192 Q200 188 191 194 Q182 188 172 192Z" /><circle className="gx-g" cx="191" cy="187" r="4.200" />{grip}</>;
    return <><path className="gx-a" d="M181 184 V66 L191.500 24 L202 66 V184Z" /><path className="gx-b" d="M191.500 24 L202 66 V184 H191.500Z" /><rect className="gx-g" x="190.500" y="46" width="2" height="124" opacity=".85" /><path className="gx-au" d="M158 178 Q176 172 191.500 184 Q207 172 225 178 L221 190 Q207 184 191.500 194 Q176 184 162 190Z" /><circle className="gx-g" cx="191.500" cy="187" r="5.500" /><rect x="188" y="194" width="7" height="12" fill="#5a2f8f" /><circle cx="191.500" cy="210" r="6" className="gx-au" /><circle cx="191.500" cy="210" r="2.800" className="gx-g" />{star(214, 60, 1.100)}{star(170, 90, .8)}</>;
  }
  if (cls === 'm') {
    const shaft = <><rect x="64" y="70" width="7" height="286" rx="3" fill="#7a4a24" /><rect x="67.500" y="70" width="3.500" height="286" fill="#5a3416" /></>;
    const cradle = <path d="M50 44 Q50 66 67.500 66 Q85 66 85 44" fill="none" stroke="#f2c46b" strokeWidth="5" strokeLinecap="round" />;
    if (t === 0) return <>{shaft}<path d="M64 74 Q48 58 52 30 M71 74 Q86 56 82 26 M67.500 74 V44" stroke="#7a4a24" strokeWidth="6" fill="none" strokeLinecap="round" /></>;
    if (t === 1) return <>{shaft}{cradle}<path className="gx-g" d="M67.500 14 L82 40 L67.500 68 L53 40Z" /><path className="gx-wh" d="M67.500 14 L53 40 L67.500 46Z" /></>;
    if (t === 2) return <>{shaft}{cradle}<circle className="gx-g" cx="67.500" cy="42" r="15" /><circle className="gx-wh" cx="62" cy="36" r="5" /><ellipse cx="67.500" cy="42" rx="32" ry="9" fill="none" stroke="#f2c46b" strokeWidth="3.500" />{star(67.500, 14, 1.200)}</>;
    return <>{shaft}{cradle}<path className="gx-a" d="M50 56 Q26 54 14 30 Q38 32 52 46Z" /><path className="gx-a" d="M85 56 Q109 54 121 30 Q97 32 83 46Z" /><circle className="gx-g" cx="67.500" cy="38" r="19" /><circle className="gx-wh" cx="60" cy="30" r="6" /><ellipse cx="67.500" cy="38" rx="38" ry="11" fill="none" stroke="#f2c46b" strokeWidth="3.500" /><ellipse cx="67.500" cy="38" rx="30" ry="22" fill="none" stroke="#fff1c2" strokeWidth="1.500" opacity=".8" transform="rotate(-24 67.500 38)" />{star(67.500, 6, 1.400)}{star(104, 54, .9)}{star(30, 66, .8)}</>;
  }
  if (cls === 'b') {
    if (t <= 1) {
      const body = t === 0 ? '#a8742a' : '#f2c46b';
      return (
        <g transform="rotate(-26 150 232)">
          <rect x="144" y="92" width="12" height="110" rx="3" fill="#7a4a24" /><rect x="139" y="76" width="22" height="20" rx="5" fill="#5a3416" />
          <circle cx="136" cy="82" r="3" className="gx-au" /><circle cx="164" cy="82" r="3" className="gx-au" /><circle cx="136" cy="92" r="3" className="gx-au" /><circle cx="164" cy="92" r="3" className="gx-au" />
          <ellipse cx="150" cy="238" rx="34" ry="40" fill={body} /><ellipse cx="150" cy="238" rx="26" ry="32" fill={t === 0 ? '#8a5a1e' : '#c98a1d'} />
          {t === 1 && <><circle className="gx-a" cx="150" cy="236" r="16" /><circle className="gx-g" cx="150" cy="236" r="7" /></>}
          {t === 0 && <circle cx="150" cy="236" r="10" fill="#3a2400" />}
          <path d="M148 96 V264 M152 96 V264" stroke="#fff1c2" strokeWidth="1" opacity=".7" />
        </g>
      );
    }
    // лира: уже и правее туловища, с тёмным контуром, чтобы не сливалась с одеждой; руки барда лежат поверх
    const edge = { stroke: '#3a2400', strokeWidth: 2.200, strokeOpacity: 0.55 };
    const frame = t === 2 ? 'gx-a' : 'gx-a';
    const trim = t === 2 ? 'gx-b' : 'gx-au';
    return (
      <g transform="translate(14 14) rotate(-10 150 205) translate(150 205) scale(0.82) translate(-150 -205)">
        {t === 3 && <ellipse cx="150" cy="208" rx="52" ry="84" className="gx-g" opacity=".2" />}
        <path className={frame} {...edge} d="M118 136 Q104 214 128 270 L138 266 Q118 214 130 142Z" /><path className={frame} {...edge} d="M182 136 Q196 214 172 270 L162 266 Q182 214 170 142Z" />
        <rect className={trim} {...edge} x="112" y="128" width="76" height="12" rx="6" /><rect className={trim} {...edge} x="128" y="262" width="44" height="22" rx="6" />
        {[136, 143, 150, 157, 164].map((x) => <path key={x} d={`M${x} 140 V266`} stroke="#fff1c2" strokeWidth="1.600" opacity=".9" />)}
        {t === 3 && <><circle className="gx-g" cx="150" cy="134" r="8" /><path className="gx-au" d="M112 134 Q92 132 84 114 Q104 116 114 126Z" /><path className="gx-au" d="M188 134 Q208 132 216 114 Q196 116 186 126Z" /></>}
        {t === 2 && <circle className="gx-g" cx="150" cy="134" r="5.500" />}
      </g>
    );
  }
  // паладин: ручка в руке (191, 196)
  const handle = (top: number) => <><rect x="187" y={top} width="9" height={236 - top} rx="3" fill="#7a4a24" /><rect x="187" y="206" width="9" height="3" className="gx-au" /><rect x="187" y="216" width="9" height="3" className="gx-au" /></>;
  if (t === 0) return <path d="M187 236 L186 150 Q174 120 186 92 Q196 80 208 94 Q218 124 197 152 L196 236Z" fill="#8a5a2a" stroke="#5a3416" strokeWidth="2" />;
  if (t === 1) return <>{handle(92)}<circle className="gx-a" cx="191.500" cy="82" r="20" /><path className="gx-b" d="M191.500 62 A20 20 0 0 1 191.500 102Z" />{[0, 45, 90, 135, 180, 225, 270, 315].map((a) => <path key={a} className="gx-b" d="M-4 -20 L0 -34 L4 -20Z" transform={`translate(191.500 82) rotate(${a})`} />)}<circle className="gx-g" cx="191.500" cy="82" r="6" /></>;
  if (t === 2) return <>{handle(92)}<rect className="gx-a" x="160" y="64" width="62" height="34" rx="7" /><rect className="gx-b" x="191" y="64" width="31" height="34" rx="7" /><rect className="gx-au" x="154" y="68" width="10" height="26" rx="3" /><rect className="gx-au" x="218" y="68" width="10" height="26" rx="3" /><circle className="gx-g" cx="191.500" cy="81" r="7" /></>;
  return <><circle className="gx-g" cx="191.500" cy="74" r="42" opacity=".25" />{handle(98)}{[0, 40, 80, 120, 160, 200, 240, 280, 320].map((a) => <path key={a} className="gx-au" d="M-3 -24 L0 -40 L3 -24Z" transform={`translate(191.500 74) rotate(${a})`} />)}<circle className="gx-au" cx="191.500" cy="74" r="22" /><circle className="gx-a" cx="191.500" cy="74" r="15" /><circle className="gx-g" cx="191.500" cy="74" r="8" />{star(222, 44, 1.100)}{star(160, 100, .8)}</>;
}
