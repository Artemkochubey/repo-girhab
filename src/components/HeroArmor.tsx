import type { ReactNode } from 'react';

/** Доспехи по классам: у каждого класса своя одежда, а редкость меняет её фасон (tier 0..3). Цвета берутся из --ar1 (светлый) и --ar2 (тёмный). */
export interface ArmorParts { back?: ReactNode; torso: ReactNode; shoulders: ReactNode; front?: ReactNode }

const Feather = ({ d, c }: { d: string; c: string }) => <path d={d} fill={c} opacity=".95" />;
const mailRows = (x: number, rows: number[], n: number) => rows.map((y) => <path key={y} d={`M${x} ${y}${' q4 6 8 0'.repeat(n)}`} fill="none" stroke="var(--ar1)" strokeWidth="1.600" opacity=".55" />);

/** Воин: кожаная куртка → кольчуга с нагрудником → латы с набедренниками → парадные латы с крыльями и плащом. */
export function warriorArmor(tier: number, gem: string): ArmorParts {
  const t = Math.max(0, tier);
  const belt = <rect x="82" y="190" width="76" height="11" rx="5" fill={t === 0 ? '#7a4a24' : '#f2c46b'} />;
  if (t === 0) return {
    torso: <><path className="hf-ar2" d="M90 130 H150 L156 198 Q120 210 84 198Z" /><path d="M96 134 L144 196 M144 134 L96 196" stroke="var(--ar1)" strokeWidth="5" opacity=".7" fill="none" /><circle className="hf-ar1" cx="120" cy="165" r="4" />{belt}</>,
    shoulders: <><ellipse className="hf-ar2" cx="84" cy="136" rx="16" ry="11" /><ellipse className="hf-ar2" cx="156" cy="136" rx="16" ry="11" /></>,
  };
  if (t === 1) return {
    torso: <><path className="hf-ar2" d="M88 130 H152 L158 198 Q120 210 82 198Z" />{mailRows(92, [150, 162, 174, 186], 7)}<path className="hf-ar1" d="M97 132 H143 L147 182 Q120 192 93 182Z" /><path d="M120 134 V186" stroke="var(--ar2)" strokeWidth="2" />{belt}</>,
    shoulders: <><ellipse className="hf-ar1" cx="82" cy="136" rx="20" ry="14" /><ellipse className="hf-ar1" cx="158" cy="136" rx="20" ry="14" /></>,
  };
  if (t === 2) return {
    torso: <><path className="hf-ar1" d="M86 130 H154 L160 192 Q120 210 80 192Z" /><path className="hf-ar2" d="M120 130 H154 L160 192 Q140 203 120 206Z" /><path d="M86 156 Q120 166 154 156 M84 176 Q120 188 156 176" stroke="var(--ar2)" strokeWidth="3" fill="none" opacity=".6" />{belt}<circle cx="120" cy="160" r="6" fill={gem} /><path className="hf-ar2" d="M82 198 H104 L100 232 H86Z" /><path className="hf-ar2" d="M136 198 H158 L154 232 H140Z" /></>,
    shoulders: <><ellipse className="hf-ar1" cx="82" cy="136" rx="22" ry="15" /><ellipse className="hf-ar2" cx="80" cy="128" rx="18" ry="8" /><ellipse className="hf-ar1" cx="158" cy="136" rx="22" ry="15" /><ellipse className="hf-ar2" cx="160" cy="128" rx="18" ry="8" /><path className="hf-ar2" d="M66 124 L58 102 L80 118Z" /><path className="hf-ar2" d="M174 124 L182 102 L160 118Z" /></>,
  };
  return {
    back: <><path d="M84 130 Q56 200 66 292 L174 292 Q184 200 156 130Z" fill="#a02a22" /><path d="M120 130 H156 Q184 200 174 292 H120Z" fill="#7a1d18" opacity=".7" /></>,
    torso: <><path className="hf-ar1" d="M86 130 H154 L160 192 Q120 210 80 192Z" /><path className="hf-ar2" d="M120 130 H154 L160 192 Q140 203 120 206Z" /><path d="M86 130 H154 L160 192 Q120 210 80 192Z" fill="none" stroke="#f2c46b" strokeWidth="3" />{belt}<circle cx="120" cy="160" r="13" fill="#fff1c2" /><circle cx="120" cy="160" r="7" fill={gem} /><path className="hf-ar2" d="M80 198 H104 L98 238 H84Z" /><path className="hf-ar2" d="M136 198 H160 L156 238 H142Z" /></>,
    shoulders: <><Feather c={gem} d="M66 132 Q40 118 28 88 Q58 96 76 120Z" /><Feather c={gem} d="M174 132 Q200 118 212 88 Q182 96 164 120Z" /><ellipse className="hf-ar1" cx="82" cy="136" rx="22" ry="15" /><ellipse className="hf-ar2" cx="80" cy="128" rx="18" ry="8" /><ellipse className="hf-ar1" cx="158" cy="136" rx="22" ry="15" /><ellipse className="hf-ar2" cx="160" cy="128" rx="18" ry="8" /><circle cx="82" cy="136" r="5" fill={gem} /><circle cx="158" cy="136" r="5" fill={gem} /></>,
  };
}

/** Маг: простая ряса → ряса с воротником-мантией → расшитая звёздами с плащом → мантия архимага с рунным кольцом. Ноги видны. */
export function mageArmor(tier: number, gem: string): ArmorParts {
  const t = Math.max(0, tier);
  const robe = <><path className="hf-ar2" d="M92 126 H148 L170 252 Q120 270 70 252Z" /><path d="M120 126 H148 L170 252 Q146 264 120 268Z" fill="#120c33" opacity=".22" /></>;
  const cord = <><path d="M90 182 Q120 192 150 182" fill="none" stroke="#f2c46b" strokeWidth="6" strokeLinecap="round" /><circle cx="120" cy="190" r="5" fill="#ffe39a" /></>;
  const mantle = <path className="hf-ar1" d="M86 128 Q120 152 154 128 L160 148 Q120 174 80 148Z" />;
  const hem = <path d="M70 252 Q120 270 170 252" fill="none" stroke={gem} strokeWidth="5" strokeLinecap="round" />;
  if (t === 0) return { torso: <>{robe}{cord}</>, shoulders: null };
  if (t === 1) return { torso: <>{robe}{cord}{mantle}{hem}</>, shoulders: null };
  const star = (x: number, y: number, s = 1) => <path key={`${x}${y}`} transform={`translate(${x} ${y}) scale(${s})`} d="M0 -7 L2 -2 L7 0 L2 2 L0 7 L-2 2 L-7 0 L-2 -2Z" fill={gem} />;
  const embroidery = <>{star(104, 214)}{star(138, 226, .8)}{star(112, 238, .7)}{star(132, 200, .7)}</>;
  if (t === 2) return {
    back: <path className="hf-ar2" d="M86 126 Q54 196 58 272 L182 272 Q186 196 154 126Z" opacity=".55" />,
    torso: <>{robe}{embroidery}{cord}{mantle}{hem}</>,
    shoulders: <><circle cx="86" cy="134" r="5" fill={gem} /><circle cx="154" cy="134" r="5" fill={gem} /></>,
  };
  return {
    back: <><path className="hf-ar2" d="M84 126 Q46 200 50 300 L190 300 Q194 200 156 126Z" opacity=".6" /><path d="M120 126 H156 Q194 200 190 300 H120Z" fill="#120c33" opacity=".25" /></>,
    torso: <>{robe}<path className="hf-ar2" d="M70 252 L58 304 L98 280Z" /><path className="hf-ar2" d="M170 252 L182 304 L142 280Z" />{embroidery}{cord}{mantle}{hem}<ellipse className="hf-rune" cx="120" cy="200" rx="64" ry="11" fill="none" stroke={gem} strokeWidth="2.500" strokeDasharray="6 7" style={{ filter: 'none', opacity: .85 }} /><circle cx="120" cy="150" r="6" fill={gem} /></>,
    shoulders: <><path d="M80 126 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z" fill={gem} /><path d="M160 126 l3 8 8 3 -8 3 -3 8 -3 -8 -8 -3 8 -3z" fill={gem} /></>,
  };
}

/** Бард: жилет → колет с эполетом → длинный сюртук с жабо → концертный фрак с фалдами и плащом. */
export function bardArmor(tier: number, gem: string): ArmorParts {
  const t = Math.max(0, tier);
  const sash = <path d="M80 192 L160 212 L158 226 L78 206Z" fill="#f2c46b" />;
  const dots = (ys: number[]) => ys.map((y) => <circle key={y} cx="120" cy={y} r="3.500" fill="#f2c46b" />);
  const lapel = <path className="hf-ar1" d="M106 128 L120 182 L134 128 H126 L120 150 L114 128Z" />;
  if (t === 0) return {
    torso: <><path d="M102 128 H138 V216 H102Z" fill="#f4efff" /><path className="hf-ar2" d="M92 128 H108 L112 216 H84Z" /><path className="hf-ar2" d="M148 128 H132 L128 216 H156Z" /><path d="M112 140 L128 160 M128 140 L112 160 M112 170 L128 190 M128 170 L112 190" stroke="#7a4a24" strokeWidth="2" />{sash}</>,
    shoulders: null,
  };
  const coat = (hemY: number) => <><path className="hf-ar2" d={`M90 128 H150 L166 ${hemY - 12} Q120 ${hemY + 6} 74 ${hemY - 12}Z`} /><path d={`M120 128 H150 L166 ${hemY - 12} Q144 ${hemY} 120 ${hemY + 4}Z`} fill="#120c33" opacity=".2" />{lapel}{dots([196, 214, 232].filter((y) => y < hemY - 6))}{sash}</>;
  if (t === 1) return { torso: coat(250), shoulders: <><ellipse className="hf-ar1" cx="86" cy="134" rx="13" ry="9" /><Feather c={gem} d="M146 128 Q170 110 188 112 Q172 126 152 140Z" /></> };
  const ruffle = <>{[96, 106, 116, 126, 136, 144].map((x, i) => <circle key={x} cx={x} cy={130 + (i % 2) * 3} r="7" fill="#f4efff" />)}</>;
  if (t === 2) return { torso: <>{coat(256)}{ruffle}</>, shoulders: <><ellipse className="hf-ar1" cx="86" cy="134" rx="14" ry="10" /><ellipse className="hf-ar1" cx="154" cy="134" rx="14" ry="10" /><circle cx="58" cy="222" r="8" fill="#f4efff" /></> };
  return {
    back: <path className="hf-ar2" d="M84 130 Q54 210 62 300 L178 300 Q186 210 156 130Z" opacity=".85" />,
    torso: <>{coat(262)}<path className="hf-ar2" d="M82 250 L66 296 L104 268Z" /><path className="hf-ar2" d="M158 250 L174 296 L136 268Z" />{ruffle}<circle cx="120" cy="158" r="6" fill={gem} /></>,
    shoulders: <><ellipse className="hf-ar1" cx="86" cy="134" rx="14" ry="10" /><ellipse className="hf-ar1" cx="154" cy="134" rx="14" ry="10" /><Feather c={gem} d="M150 126 Q176 100 200 98 Q184 122 156 140Z" /></>,
  };
}

/** Паладин: стёганка с накидкой → нагрудник → золотые латы с крылатыми наплечниками → сияющие латы с большими крыльями и плащом света. */
export function paladinArmor(tier: number, gem: string): ArmorParts {
  const t = Math.max(0, tier);
  const belt = <rect x="80" y="188" width="80" height="11" rx="5" fill="#fff1c2" />;
  const sun = (r: number) => <><circle cx="120" cy="160" r={r} fill="#fff1c2" /><circle cx="120" cy="160" r={r * .55} fill={gem} /></>;
  const wing = (side: 1 | -1, big: boolean) => {
    const x = 120 + side * 62;
    return <path d={`M${x} 130 Q${x + side * (big ? 44 : 26)} ${big ? 104 : 114} ${x + side * (big ? 56 : 34)} ${big ? 70 : 92} Q${x + side * 12} ${big ? 84 : 100} ${x - side * 8} 120Z`} fill="#fff1c2" />;
  };
  if (t === 0) return {
    torso: <><path className="hf-ar2" d="M88 130 H152 L158 194 Q120 208 82 194Z" /><path d="M92 146 H148 M90 162 H150 M88 178 H152 M104 132 V196 M120 132 V200 M136 132 V196" stroke="var(--ar1)" strokeWidth="1.800" opacity=".5" fill="none" />{belt}</>,
    shoulders: <><ellipse className="hf-ar2" cx="84" cy="136" rx="17" ry="12" /><ellipse className="hf-ar2" cx="156" cy="136" rx="17" ry="12" /></>,
  };
  if (t === 1) return {
    torso: <><path className="hf-ar1" d="M88 130 H152 L158 192 Q120 206 82 192Z" /><path className="hf-ar2" d="M120 130 H152 L158 192 Q140 201 120 204Z" />{belt}{sun(10)}</>,
    shoulders: <><ellipse className="hf-ar1" cx="82" cy="136" rx="20" ry="14" /><ellipse className="hf-ar1" cx="158" cy="136" rx="20" ry="14" /></>,
  };
  if (t === 2) return {
    torso: <><path className="hf-ar1" d="M86 130 H154 L160 192 Q120 210 80 192Z" /><path className="hf-ar2" d="M120 130 H154 L160 192 Q140 203 120 206Z" />{belt}{sun(14)}<path className="hf-ar2" d="M82 198 H104 L100 232 H86Z" /><path className="hf-ar2" d="M136 198 H158 L154 232 H140Z" /></>,
    shoulders: <>{wing(-1, false)}{wing(1, false)}<ellipse className="hf-ar1" cx="82" cy="136" rx="22" ry="15" /><ellipse className="hf-ar1" cx="158" cy="136" rx="22" ry="15" /></>,
  };
  return {
    back: <><path d="M84 130 Q50 210 58 306 L182 306 Q190 210 156 130Z" fill="#fff1c2" opacity=".9" /><path d="M120 130 H156 Q190 210 182 306 H120Z" fill="#ffe39a" opacity=".55" /></>,
    torso: <><path className="hf-ar1" d="M86 130 H154 L160 192 Q120 210 80 192Z" /><path className="hf-ar2" d="M120 130 H154 L160 192 Q140 203 120 206Z" /><path d="M86 130 H154 L160 192 Q120 210 80 192Z" fill="none" stroke="#fff1c2" strokeWidth="3" />{belt}{sun(15)}<path d="M120 134 V146 M120 174 V186 M96 160 H108 M132 160 H144" stroke="#fff1c2" strokeWidth="3" strokeLinecap="round" /><path className="hf-ar2" d="M80 198 H104 L98 238 H84Z" /><path className="hf-ar2" d="M136 198 H160 L156 238 H142Z" /></>,
    shoulders: <>{wing(-1, true)}{wing(1, true)}<ellipse className="hf-ar1" cx="82" cy="136" rx="22" ry="15" /><ellipse className="hf-ar1" cx="158" cy="136" rx="22" ry="15" /><circle cx="82" cy="136" r="5" fill={gem} /><circle cx="158" cy="136" r="5" fill={gem} /></>,
  };
}
