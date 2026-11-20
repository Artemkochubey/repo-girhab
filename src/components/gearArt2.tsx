import type { Cls } from '@/lib/game/classes';

/**
 * Шлемы, сапоги, щиты и амулеты в четырёх видах на каждую редкость (как оружие и доспехи в gearArt.tsx).
 * Координаты фигуры героя: голова по центру (50,38) радиус 17.
 */
const INK = '#0d0916';
const GOLD = '#ffd24a';
const IVORY = '#f7f4ea';
type Tier = 0 | 1 | 2 | 3;
const tierOf = (n: number): Tier => Math.max(0, Math.min(3, n)) as Tier;

interface HProps { c: Cls | null; tier: number; col: string; accent: string }

/** Шлем (не корона): воин, маг, бард и паладин, по четыре вида. */
export function HelmArt({ c, tier, col, accent }: HProps) {
  const t = tierOf(tier);
  const cls = c ?? 'w';
  const o = { stroke: INK, strokeWidth: 0.9 };
  const dome = <path d="M32 38 A18 18 0 0 1 68 38 L68 31 Q50 18 32 31 Z" fill={col} {...o} />;
  if (cls === 'w') {
    return [
      <g key="0">{dome}<path d="M32 36 H68" stroke="#fff" strokeOpacity="0.4" strokeWidth="1.4" /></g>,
      <g key="1">{dome}<path d="M32 38 H68" stroke={col} strokeWidth="3.4" /><rect x="47" y="30" width="6" height="14" rx="2" fill={col} {...o} strokeWidth={0.6} /><path d="M50 14 V22" stroke="#d9534f" strokeWidth="3" /></g>,
      <g key="2">{dome}<path d="M32 38 H68" stroke={col} strokeWidth="3.4" /><rect x="47" y="30" width="6" height="14" rx="2" fill={col} {...o} strokeWidth={0.6} /><path d="M33 29 Q20 24 22 8 Q30 18 37 26 Z M67 29 Q80 24 78 8 Q70 18 63 26 Z" fill={IVORY} {...o} strokeWidth={0.8} /></g>,
      <g key="3">{dome}<path d="M32 38 H68" stroke={GOLD} strokeWidth="3.2" /><rect x="47" y="30" width="6" height="14" rx="2" fill={col} {...o} strokeWidth={0.6} /><path d="M42 18 Q50 -6 60 16 Q52 8 42 18 Z" fill="#d9534f" {...o} strokeWidth={0.8} /><circle cx="50" cy="26" r="2.4" fill={accent} stroke={GOLD} strokeWidth="0.8" /></g>,
    ][t];
  }
  if (cls === 'm') {
    return [
      <g key="0"><path d="M28 32 Q50 26 72 32 L68 35 Q50 30 32 35 Z" fill={col} {...o} /><path d="M36 32 L50 6 L64 32 Q50 27 36 32 Z" fill={col} {...o} /></g>,
      <g key="1"><path d="M28 32 Q50 24 72 32 L68 36 Q50 30 32 36 Z" fill={col} {...o} /><path d="M36 32 L50 2 L64 32 Q50 26 36 32 Z" fill={col} {...o} /><path d="M38 28 Q50 24 62 28" fill="none" stroke={accent} strokeWidth="2" /><text x="52" y="22" textAnchor="middle" fontSize="7" fill="#fff">★</text></g>,
      <g key="2"><path d="M26 33 Q50 24 74 33 L69 37 Q50 30 31 37 Z" fill={col} {...o} /><path d="M35 32 Q40 14 54 4 Q58 2 60 8 Q52 12 64 32 Q50 26 35 32 Z" fill={col} {...o} /><path d="M37 28 Q50 24 63 28" fill="none" stroke={accent} strokeWidth="2.4" /><text x="48" y="22" textAnchor="middle" fontSize="8" fill="#fff">★</text><text x="60" y="14" fontSize="7" fill={GOLD}>☾</text></g>,
      <g key="3"><path d="M24 34 Q50 22 76 34 L70 39 Q50 30 30 39 Z" fill={col} stroke={GOLD} strokeWidth="1" /><path d="M34 33 Q40 8 56 -2 Q62 0 60 8 Q54 14 66 33 Q50 26 34 33 Z" fill={col} stroke={GOLD} strokeWidth="1" /><path d="M36 29 Q50 24 64 29" fill="none" stroke={GOLD} strokeWidth="2.6" /><circle cx="50" cy="27" r="2.6" fill={accent} stroke={GOLD} strokeWidth="0.8" /><text x="46" y="18" fontSize="8" fill="#fff">★</text><text x="30" y="14" fontSize="6" fill={GOLD}>✦</text><text x="72" y="20" fontSize="6" fill={GOLD}>✦</text></g>,
    ][t];
  }
  if (cls === 'b') {
    return [
      <g key="0"><path d="M31 35 Q50 18 69 35 Q50 29 31 35 Z" fill={col} {...o} /></g>,
      <g key="1"><path d="M31 34 Q50 14 69 34 Q50 28 31 34 Z" fill={col} {...o} /><path d="M62 24 Q80 8 84 20 Q76 18 66 28 Z" fill={accent} stroke={INK} strokeWidth="0.7" /></g>,
      <g key="2"><ellipse cx="50" cy="32" rx="25" ry="5" fill={col} {...o} /><path d="M34 32 Q36 14 50 12 Q64 14 66 32 Z" fill={col} {...o} /><path d="M36 29 H64" stroke={accent} strokeWidth="2.4" /><path d="M63 16 Q84 -2 90 14 Q78 10 66 26 Z" fill={accent} stroke={INK} strokeWidth="0.7" /><rect x="47" y="26" width="6" height="5" rx="1" fill={GOLD} stroke={INK} strokeWidth="0.5" /></g>,
      <g key="3"><ellipse cx="50" cy="32" rx="26" ry="5.5" fill={col} stroke={GOLD} strokeWidth="1" /><path d="M33 32 Q35 10 50 8 Q65 10 67 32 Z" fill={col} stroke={GOLD} strokeWidth="1" /><path d="M35 28 H65" stroke={GOLD} strokeWidth="2.8" /><path d="M60 14 Q82 -10 94 10 Q78 6 66 26 Z" fill={accent} stroke={INK} strokeWidth="0.7" /><path d="M66 12 Q74 -2 86 6" fill="none" stroke="#fff" strokeOpacity="0.6" strokeWidth="0.8" /><text x="46" y="24" fontSize="9" fill={GOLD}>♪</text></g>,
    ][t];
  }
  return [
    <g key="0"><path d="M32 40 A18 18 0 0 1 68 40 L68 34 Q50 22 32 34 Z" fill={col} {...o} />{[[40, 30], [46, 27], [54, 27], [60, 30], [43, 34], [57, 34]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.4" fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="0.6" />)}</g>,
    <g key="1">{dome}<path d="M32 38 H68" stroke={GOLD} strokeWidth="2.6" /><rect x="47" y="30" width="6" height="12" rx="2" fill={col} {...o} strokeWidth={0.6} /><path d="M50 18 V28 M45 22 H55" stroke={GOLD} strokeWidth="2.2" /></g>,
    <g key="2">{dome}<path d="M32 38 H68" stroke={GOLD} strokeWidth="2.6" /><rect x="47" y="30" width="6" height="12" rx="2" fill={col} {...o} strokeWidth={0.6} /><path d="M31 30 Q14 22 12 36 Q22 34 31 36 Z M69 30 Q86 22 88 36 Q78 34 69 36 Z" fill={IVORY} stroke={GOLD} strokeWidth="1" /></g>,
    <g key="3">{dome}<path d="M32 38 H68" stroke={GOLD} strokeWidth="3" /><rect x="47" y="30" width="6" height="12" rx="2" fill={col} stroke={GOLD} strokeWidth="0.8" /><path d="M30 30 Q8 20 6 38 Q18 34 30 37 Z M70 30 Q92 20 94 38 Q82 34 70 37 Z" fill={IVORY} stroke={GOLD} strokeWidth="1.2" /><ellipse cx="50" cy="13" rx="20" ry="5.5" fill="none" stroke={GOLD} strokeWidth="2.6" /><circle cx="50" cy="24" r="2.4" fill={accent} stroke={GOLD} strokeWidth="0.8" /></g>,
  ][t];
}

/** Сапоги. Основа по классу (кожаные, туфли, ботфорты, сабатоны), тонкие украшения растут с редкостью. */
export function BootsArt({ c, tier, col }: Omit<HProps, 'accent'> & { accent?: string }) {
  const t = tierOf(tier);
  const cls = c ?? 'w';
  const o = { stroke: INK, strokeWidth: 0.8 };
  const base = cls === 'm' ? (
    <g>
      <path d="M32 134 H48 Q50 141 44 146 H30 Q28 142 32 134 Z" fill={col} {...o} />
      <path d="M52 134 H68 Q72 142 70 146 H56 Q50 141 52 134 Z" fill={col} {...o} />
      <path d="M30 146 Q24 146 25 141 M70 146 Q76 146 75 141" fill="none" stroke={col} strokeWidth="3" strokeLinecap="round" />
    </g>
  ) : (
    <g>
      <path d={cls === 'b' ? 'M33 122 H49 V141 Q49 146 44 146 H34 Q31 146 31 142 Z' : 'M33 124 H49 V141 Q49 146 44 146 H34 Q31 146 31 142 Z'} fill={col} {...o} />
      <path d={cls === 'b' ? 'M51 122 H67 V142 Q67 146 66 146 H56 Q51 146 51 141 Z' : 'M51 124 H67 V142 Q67 146 66 146 H56 Q51 146 51 141 Z'} fill={col} {...o} />
    </g>
  );
  const top = cls === 'b' ? 122 : cls === 'm' ? 134 : 124;
  const trim = cls === 'p' ? GOLD : '#fff';
  return (
    <g>
      {base}
      {t >= 1 && <path d={`M33 ${top + 3} H49 M51 ${top + 3} H67`} stroke={trim} strokeOpacity="0.7" strokeWidth="2" />}
      {t >= 2 && <g fill={GOLD} stroke={INK} strokeWidth="0.4"><circle cx="41" cy={top + 9} r="1.6" /><circle cx="59" cy={top + 9} r="1.6" /><path d="M32 144 H46 M54 144 H68" stroke={trim} strokeOpacity="0.7" strokeWidth="1.6" fill="none" /></g>}
      {t >= 3 && <g><path d={`M31 ${top + 8} Q18 ${top} 16 ${top + 12} Q24 ${top + 8} 31 ${top + 14} Z M69 ${top + 8} Q82 ${top} 84 ${top + 12} Q76 ${top + 8} 69 ${top + 14} Z`} fill={IVORY} stroke={GOLD} strokeWidth="0.9" /><path d={`M33 ${top} H49 M51 ${top} H67`} stroke={GOLD} strokeWidth="1.8" /></g>}
    </g>
  );
}

/** Щит или барьер: форма по классу, украшения по редкости. */
export function ShieldArt({ c, tier, col }: Omit<HProps, 'accent'>) {
  const t = tierOf(tier);
  const cls = c ?? 'w';
  const o = { stroke: INK, strokeWidth: 1 };
  const [cx, cy, R] = cls === 'm' ? [17, 88, 17] : cls === 'p' ? [17, 92, 15] : cls === 'b' ? [19, 90, 11] : [17, 88, 16];
  const deco = (
    <g>
      {t >= 1 && <circle cx={cx} cy={cy} r={R * 0.8} fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="1.2" />}
      {t >= 2 && <g><circle cx={cx} cy={cy} r={R * 0.28} fill={GOLD} stroke={INK} strokeWidth="0.6" />{[[0, -1], [1, 0], [0, 1], [-1, 0]].map(([x, y], i) => <circle key={i} cx={cx! + x! * R * 0.62} cy={cy! + y! * R * 0.62} r="1.3" fill="#fff" opacity="0.8" />)}</g>}
      {t >= 3 && <g><circle cx={cx} cy={cy} r={R * 0.96} fill="none" stroke={GOLD} strokeWidth="1.8" /><path d={`M${cx} ${cy! - R * 0.55} L${cx! + R * 0.2} ${cy} L${cx} ${cy! + R * 0.55} L${cx! - R * 0.2} ${cy} Z`} fill={col} stroke={GOLD} strokeWidth="0.8" opacity="0.9" /></g>}
    </g>
  );
  if (cls === 'm') return (
    <g>
      <circle cx="17" cy="88" r="17" fill={col} opacity={0.18 + t * 0.07} stroke={col} strokeWidth="1.6" strokeDasharray={t >= 2 ? undefined : '4 3'} />
      <circle cx="17" cy="88" r="10" fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="1" />
      <text x="17" y="92" textAnchor="middle" fontSize="11" fill="#fff" opacity="0.9">{t >= 2 ? '✧' : '✦'}</text>
      {deco}
    </g>
  );
  if (cls === 'p') return (
    <g>
      <path d="M3 76 H31 V92 Q31 104 17 112 Q3 104 3 92 Z" fill={col} {...o} />
      <path d="M17 80 V104 M8 88 H26" stroke={GOLD} strokeWidth="2.2" />
      {deco}
    </g>
  );
  if (cls === 'b') return (
    <g>
      <circle cx="19" cy="90" r="11" fill={col} {...o} />
      <circle cx="19" cy="90" r="7" fill="none" stroke="#fff" strokeOpacity="0.45" />
      <text x="19" y="94" textAnchor="middle" fontSize="10" fill="#fff" opacity="0.95">♪</text>
      {deco}
    </g>
  );
  return (
    <g>
      <circle cx="17" cy="88" r="16" fill={col} {...o} />
      <circle cx="17" cy="88" r="10" fill="none" stroke="#fff" strokeOpacity="0.45" strokeWidth="1.4" />
      <path d="M17 78 V98 M7 88 H27" stroke="#fff" strokeOpacity="0.4" strokeWidth="1.2" />
      {deco}
    </g>
  );
}

/** Амулет на груди: круглый камень, ромб с цепочкой, подвеска со звездой, сияющая реликвия. */
export function AmuletArt({ tier, col }: { tier: number; col: string }) {
  const t = tierOf(tier);
  return (
    <g>
      <path d="M42 62 Q50 76 58 62" fill="none" stroke="#d9c58a" strokeWidth={t >= 2 ? 1.4 : 0.9} />
      {[
        <g key="0"><circle cx="50" cy="73" r="4.2" fill={col} stroke={INK} strokeWidth="0.7" /><circle cx="49" cy="72" r="1.2" fill="#fff" opacity="0.7" /></g>,
        <g key="1"><path d="M50 67 L55 73 L50 80 L45 73 Z" fill={col} stroke={INK} strokeWidth="0.7" /><path d="M50 67 L50 80 M45 73 H55" stroke="#fff" strokeOpacity="0.45" strokeWidth="0.6" /></g>,
        <g key="2"><circle cx="50" cy="73" r="5.4" fill={col} stroke="#d9c58a" strokeWidth="1.2" /><text x="50" y="76" textAnchor="middle" fontSize="8" fill="#fff">★</text><circle cx="42" cy="69" r="1.6" fill={GOLD} /><circle cx="58" cy="69" r="1.6" fill={GOLD} /></g>,
        <g key="3">{Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4; return <path key={i} d={`M${50 + Math.cos(a) * 7} ${74 + Math.sin(a) * 7} L${50 + Math.cos(a) * 11} ${74 + Math.sin(a) * 11}`} stroke={GOLD} strokeWidth="1.2" strokeLinecap="round" />; })}<circle cx="50" cy="74" r="5.6" fill={col} stroke={GOLD} strokeWidth="1.3" /><circle cx="48.4" cy="72.4" r="1.4" fill="#fff" opacity="0.8" /></g>,
      ][t]}
    </g>
  );
}
