import type { Cls } from '@/lib/game/classes';

/**
 * Рисунки оружия и доспехов. Для каждого класса по четыре вида на каждую редкость:
 * обычное, редкое, эпическое, легендарное выглядят по-разному (форма, а не только цвет).
 * Рисуем в координатах фигуры героя (0..100 × 0..150), см. HeroFigure.
 */
const INK = '#0d0916';
const GOLD = '#ffd24a';
const WOOD = '#8a6a3b';
const STEEL = '#caa86a';
const PALE = '#f7f4ea';

type Tier = 0 | 1 | 2 | 3;
interface WProps { c: Cls | null; tier: number; col: string; gem: string | null }

/** Оружие. Рисуется вертикально (вверх — это минус по y), рукоять в (0,0), потом поворачивается к кисти героя. */
export function WeaponArt({ c, tier, col, gem }: WProps) {
  const t = Math.max(0, Math.min(3, tier)) as Tier;
  const cls = c ?? 'w';
  const g = (x: number, y: number, r = 2.6) => (gem ? <circle cx={x} cy={y} r={r} fill={gem} stroke={INK} strokeWidth="0.4" /> : null);
  const grip = <path d="M0 8 V-6" stroke={WOOD} strokeWidth="3.2" strokeLinecap="round" />;
  let body: React.ReactNode;

  if (cls === 'w') {
    // меч: короткий меч, палаш, фламберг (волнистый клинок), клеймор
    body = [
      <g key="0">
        {grip}
        <path d="M-2.2 -6 L-2.2 -42 L0 -48 L2.2 -42 L2.2 -6 Z" fill={col} stroke={INK} strokeWidth="0.7" />
        <path d="M-6 -6 H6" stroke={WOOD} strokeWidth="2.6" strokeLinecap="round" />{g(0, -28, 1.8)}
      </g>,
      <g key="1">
        {grip}
        <path d="M-4 -8 L-4 -50 L0 -58 L4 -50 L4 -8 Z" fill={col} stroke={INK} strokeWidth="0.8" />
        <path d="M0 -12 V-50" stroke="#fff" strokeOpacity="0.45" strokeWidth="1" />
        <path d="M-9 -8 H9" stroke={STEEL} strokeWidth="3.2" strokeLinecap="round" /><circle cx="0" cy="9" r="2.4" fill={STEEL} />{g(0, -30, 2)}
      </g>,
      <g key="2">
        {grip}
        <path d="M-3 -8 Q-6.5 -16 -3 -22 Q-6.5 -30 -3 -38 Q-5.5 -48 0 -62 Q5.5 -48 3 -38 Q6.5 -30 3 -22 Q6.5 -16 3 -8 Z" fill={col} stroke={INK} strokeWidth="0.8" />
        <path d="M0 -10 V-56" stroke="#fff" strokeOpacity="0.4" strokeWidth="0.9" />
        <path d="M-11 -5 Q0 -14 11 -5" fill="none" stroke={STEEL} strokeWidth="3" strokeLinecap="round" /><circle cx="0" cy="9" r="2.8" fill={col} stroke={INK} strokeWidth="0.6" />{g(0, -26, 2)}
      </g>,
      <g key="3">
        {grip}
        <path d="M-5.5 -10 L-5.5 -66 L0 -80 L5.5 -66 L5.5 -10 Z" fill={col} stroke={INK} strokeWidth="0.9" />
        <path d="M0 -12 V-72" stroke={GOLD} strokeWidth="1.6" />
        {[-28, -44, -58].map((y) => <circle key={y} cx="0" cy={y} r="1.5" fill={GOLD} />)}
        <path d="M-14 -8 Q-9 -17 0 -13 Q9 -17 14 -8 L0 -6 Z" fill={GOLD} stroke={INK} strokeWidth="0.7" />
        <circle cx="0" cy="9" r="3.4" fill={gem ?? GOLD} stroke={INK} strokeWidth="0.7" />
      </g>,
    ][t];
  } else if (cls === 'm') {
    // посох: простой, с кристаллом в когтях, с кольцом, посох архимага с крыльями
    body = [
      <g key="0">
        <path d="M0 8 V-50" stroke={WOOD} strokeWidth="3" strokeLinecap="round" />
        <circle cx="0" cy="-55" r="5.2" fill={col} stroke={INK} strokeWidth="0.8" /><circle cx="-1.6" cy="-56.6" r="1.4" fill="#fff" opacity="0.7" />{g(0, -55, 2.4)}
      </g>,
      <g key="1">
        <path d="M0 8 Q-3.5 -8 1 -22 Q4.5 -36 0 -48" fill="none" stroke={WOOD} strokeWidth="3.2" strokeLinecap="round" />
        <path d="M-6 -50 Q-7 -62 0 -66 Q7 -62 6 -50" fill="none" stroke={WOOD} strokeWidth="2" strokeLinecap="round" />
        <path d="M0 -50 L-4.4 -59 L0 -70 L4.4 -59 Z" fill={col} stroke={INK} strokeWidth="0.8" />{g(0, -59, 2.2)}
      </g>,
      <g key="2">
        <path d="M0 8 V-50" stroke={WOOD} strokeWidth="3" strokeLinecap="round" />
        <path d="M-3 -24 H3 M-3 -30 H3" stroke={STEEL} strokeWidth="1.6" />
        <circle cx="0" cy="-58" r="6.4" fill={col} stroke={INK} strokeWidth="0.8" />
        <ellipse cx="0" cy="-58" rx="13" ry="4" fill="none" stroke={col} strokeWidth="1.8" transform="rotate(-28 0 -58)" />
        <circle cx="-1.8" cy="-60" r="1.6" fill="#fff" opacity="0.75" />{g(0, -58, 2.6)}
        <text x="10" y="-64" fontSize="6" fill="#fff" textAnchor="middle">✦</text>
      </g>,
      <g key="3">
        <path d="M0 8 V-52" stroke={WOOD} strokeWidth="3.4" strokeLinecap="round" />
        <path d="M-3.4 -14 H3.4 M-3.4 -32 H3.4" stroke={GOLD} strokeWidth="2" />
        <path d="M0 -56 Q-13 -68 -19 -52 Q-9 -58 0 -50 Z" fill={PALE} stroke={GOLD} strokeWidth="0.9" />
        <path d="M0 -56 Q13 -68 19 -52 Q9 -58 0 -50 Z" fill={PALE} stroke={GOLD} strokeWidth="0.9" />
        <circle cx="0" cy="-62" r="8.4" fill={col} stroke={GOLD} strokeWidth="1.2" />
        <text x="0" y="-58.6" fontSize="10" fill="#fff" textAnchor="middle">★</text>{g(0, -62, 2.6)}
        <circle cx="-15" cy="-74" r="1.5" fill={col} /><circle cx="14" cy="-79" r="1.2" fill={GOLD} /><circle cx="-6" cy="-84" r="1" fill="#fff" />
      </g>,
    ][t];
  } else if (cls === 'b') {
    // лютня, лютня мастера, серебряная и золотая лира
    body = [
      <g key="0">
        <path d="M0 -22 V-54" stroke={WOOD} strokeWidth="2.6" strokeLinecap="round" /><rect x="-2.6" y="-58" width="5.2" height="6" rx="1.4" fill={WOOD} />
        <ellipse cx="0" cy="-10" rx="7.5" ry="11" fill={col} stroke={INK} strokeWidth="0.9" /><circle cx="0" cy="-10" r="2.6" fill="#1a1428" />{g(0, -40, 2)}
      </g>,
      <g key="1">
        <path d="M0 -22 V-54" stroke={WOOD} strokeWidth="2.8" strokeLinecap="round" />
        <path d="M-3 -58 Q0 -64 3 -58 V-52 H-3 Z" fill={WOOD} stroke={INK} strokeWidth="0.5" />
        <circle cx="-4" cy="-55" r="1.2" fill={STEEL} /><circle cx="4" cy="-55" r="1.2" fill={STEEL} />
        <ellipse cx="0" cy="-10" rx="9" ry="13" fill={col} stroke={INK} strokeWidth="0.9" />
        <ellipse cx="0" cy="-10" rx="5.6" ry="8.6" fill="none" stroke="#fff" strokeOpacity="0.4" strokeWidth="0.8" />
        <circle cx="0" cy="-12" r="3" fill="#1a1428" /><path d="M-1 -22 V-48 M1 -22 V-48" stroke="#fff" strokeOpacity="0.55" strokeWidth="0.5" />{g(0, -2, 2)}
      </g>,
      <g key="2">
        <path d="M-10 -62 Q-13 -32 -3 -22 L-3 -4 H3 L3 -22 Q13 -32 10 -62" fill="none" stroke="#d6d9e6" strokeWidth="3.2" strokeLinecap="round" />
        <path d="M-10 -60 H10" stroke={col} strokeWidth="3" strokeLinecap="round" />
        <path d="M-5 -58 V-26 M0 -58 V-22 M5 -58 V-26" stroke="#fff" strokeOpacity="0.7" strokeWidth="0.7" />
        <path d="M0 -4 V8" stroke={WOOD} strokeWidth="3.2" strokeLinecap="round" />{g(0, -60, 2.2)}
      </g>,
      <g key="3">
        <path d="M-12 -62 Q-16 -32 -4 -22 L-4 -4 H4 L4 -22 Q16 -32 12 -62" fill="none" stroke={GOLD} strokeWidth="4" strokeLinecap="round" />
        <path d="M-12 -60 H12" stroke={col} strokeWidth="3.4" strokeLinecap="round" />
        <path d="M-12 -64 Q-24 -74 -26 -60 Q-18 -62 -12 -58 Z M12 -64 Q24 -74 26 -60 Q18 -62 12 -58 Z" fill={PALE} stroke={GOLD} strokeWidth="0.9" />
        <path d="M-6 -58 V-26 M0 -58 V-22 M6 -58 V-26" stroke="#fff" strokeOpacity="0.8" strokeWidth="0.8" />
        <text x="-18" y="-80" fontSize="8" fill={GOLD}>♪</text><text x="12" y="-84" fontSize="7" fill="#fff">♫</text>
        <path d="M0 -4 V8" stroke={GOLD} strokeWidth="3.4" strokeLinecap="round" />{g(0, -60, 2.4)}
      </g>,
    ][t];
  } else {
    // булава: дубина, шипастая булава, боевой молот, солнечный скипетр
    body = [
      <g key="0">
        <path d="M0 8 V-32" stroke={WOOD} strokeWidth="3.4" strokeLinecap="round" />
        <path d="M-3 -24 L-6.5 -52 Q0 -59 6.5 -52 L3 -24 Z" fill={col} stroke={INK} strokeWidth="0.9" />{g(0, -44, 2)}
      </g>,
      <g key="1">
        <path d="M0 8 V-44" stroke={WOOD} strokeWidth="3.4" strokeLinecap="round" />
        <path d="M-10 -52 L-16 -52 M10 -52 L16 -52 M0 -63 V-69 M-7 -59 L-12 -64 M7 -59 L12 -64 M-7 -45 L-12 -40 M7 -45 L12 -40" stroke={col} strokeWidth="2.6" strokeLinecap="round" />
        <circle cx="0" cy="-52" r="8" fill={col} stroke={INK} strokeWidth="0.9" /><circle cx="-2.4" cy="-54.4" r="1.8" fill="#fff" opacity="0.6" />{g(0, -52, 2.6)}
      </g>,
      <g key="2">
        <path d="M0 8 V-48" stroke={WOOD} strokeWidth="3.4" strokeLinecap="round" />
        <rect x="-11" y="-62" width="22" height="13" rx="2" fill={col} stroke={INK} strokeWidth="0.9" />
        <path d="M11 -58 L21 -55.5 L11 -52 Z" fill={col} stroke={INK} strokeWidth="0.8" />
        <path d="M-11 -62 V-49 M-4 -62 V-49" stroke="#fff" strokeOpacity="0.35" strokeWidth="1" />
        <path d="M-2.6 -48 H2.6" stroke={STEEL} strokeWidth="3" />{g(2, -55.5, 2.2)}
      </g>,
      <g key="3">
        <path d="M0 8 V-46" stroke={GOLD} strokeWidth="3.6" strokeLinecap="round" />
        <path d="M-3.6 -14 H3.6 M-3.6 -30 H3.6" stroke={col} strokeWidth="2" />
        {Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4; return <path key={i} d={`M${Math.round(Math.cos(a) * 9 * 10) / 10} ${Math.round((-56 + Math.sin(a) * 9) * 10) / 10} L${Math.round(Math.cos(a) * 15 * 10) / 10} ${Math.round((-56 + Math.sin(a) * 15) * 10) / 10}`} stroke={GOLD} strokeWidth="2.4" strokeLinecap="round" />; })}
        <circle cx="0" cy="-56" r="8" fill={col} stroke={GOLD} strokeWidth="1.4" />
        <path d="M0 -62 V-50 M-6 -56 H6" stroke="#fff" strokeOpacity="0.8" strokeWidth="1.6" />{g(0, -56, 2.6)}
      </g>,
    ][t];
  }
  return <g transform="translate(80 98) rotate(12)">{body}</g>;
}

interface AProps { c: Cls | null; tier: number; col: string; accent: string }

/** Доспех (не щит): четыре вида на каждый класс. Рисуется поверх туловища (x 31..69, y 60..106). */
export function ArmorArt({ c, tier, col, accent }: AProps) {
  const t = Math.max(0, Math.min(3, tier)) as Tier;
  const cls = c ?? 'w';
  const seam = (x: number, y1: number, y2: number) => <path d={`M${x} ${y1} V${y2}`} stroke="#fff" strokeOpacity="0.3" strokeWidth="1" />;

  if (cls === 'w') {
    return [
      // стёганка: кожаная куртка с лямками и стежками
      <g key="0">
        <path d="M32 62 Q50 57 68 62 L66 104 H34 Z" fill={col} stroke={INK} strokeWidth="0.9" />
        <path d="M50 60 V104" stroke="#fff" strokeOpacity="0.45" strokeWidth="1" strokeDasharray="2 2" />
        <path d="M38 60 L42 70 M62 60 L58 70" stroke="#3a2a1a" strokeWidth="2.2" />
        <path d="M34 90 H66" stroke="#3a2a1a" strokeWidth="2" />
        {[38, 44, 56, 62].map((x) => <circle key={x} cx={x} cy="80" r="1.1" fill="#fff" opacity="0.6" />)}
      </g>,
      // кольчуга: ряды колец и маленькие наплечники
      <g key="1">
        <path d="M31 62 Q50 55 69 62 L67 105 Q50 110 33 105 Z" fill={col} stroke={INK} strokeWidth="0.9" />
        {[68, 76, 84, 92, 100].map((y, r) => Array.from({ length: 5 }, (_, i) => <circle key={`${r}-${i}`} cx={37 + i * 6.5 + (r % 2) * 3} cy={y} r="2.1" fill="none" stroke="#fff" strokeOpacity="0.4" strokeWidth="0.7" />))}
        <ellipse cx="30" cy="64" rx="5.5" ry="4.5" fill={col} stroke={INK} strokeWidth="0.8" /><ellipse cx="70" cy="64" rx="5.5" ry="4.5" fill={col} stroke={INK} strokeWidth="0.8" />
      </g>,
      // латный доспех: пластины, наплечники с шипами
      <g key="2">
        <path d="M30 62 Q50 54 70 62 L67 106 Q50 112 33 106 Z" fill={col} stroke={INK} strokeWidth="0.9" />
        <path d="M50 58 V108 M36 80 H64 M37 94 H63" stroke="#fff" strokeOpacity="0.35" strokeWidth="1" fill="none" />
        <ellipse cx="29" cy="64" rx="7.5" ry="6" fill={col} stroke={INK} strokeWidth="0.8" /><ellipse cx="71" cy="64" rx="7.5" ry="6" fill={col} stroke={INK} strokeWidth="0.8" />
        <path d="M24 60 L19 51 L29 58 Z M76 60 L81 51 L71 58 Z" fill={col} stroke={INK} strokeWidth="0.7" />
      </g>,
      // доспех героя: золотая отделка, большие наплечники, герб
      <g key="3">
        <path d="M30 62 Q50 53 70 62 L67 106 Q50 113 33 106 Z" fill={col} stroke={GOLD} strokeWidth="1.4" />
        <path d="M36 70 Q50 64 64 70 M37 100 Q50 106 63 100" fill="none" stroke={GOLD} strokeWidth="1.2" />
        <path d="M50 66 L56 78 L50 92 L44 78 Z" fill={accent} stroke={GOLD} strokeWidth="1.1" />
        <ellipse cx="28" cy="64" rx="9" ry="7" fill={col} stroke={GOLD} strokeWidth="1.2" /><ellipse cx="72" cy="64" rx="9" ry="7" fill={col} stroke={GOLD} strokeWidth="1.2" />
        <path d="M22 60 L15 47 L30 57 Z M78 60 L85 47 L70 57 Z" fill={GOLD} stroke={INK} strokeWidth="0.7" />
        <path d="M31 100 H69" stroke={GOLD} strokeWidth="2.4" />
      </g>,
    ][t];
  }
  if (cls === 'm') {
    return [
      // простая ряса
      <g key="0">
        <path d="M33 62 Q50 57 67 62 L70 104 L74 138 Q50 144 26 138 L30 104 Z" fill={col} stroke={INK} strokeWidth="0.9" />
        {seam(50, 60, 140)}
        <path d="M33 66 Q50 74 67 66" fill="none" stroke="#fff" strokeOpacity="0.3" strokeWidth="1" />
      </g>,
      // ряса с воротником и поясом
      <g key="1">
        <path d="M31 60 Q50 54 69 60 L72 104 L78 138 Q50 146 22 138 L28 104 Z" fill={col} stroke={INK} strokeWidth="0.9" />
        {seam(50, 62, 140)}
        <path d="M36 60 Q50 74 64 60" fill={dark2(col)} stroke={INK} strokeWidth="0.7" />
        <path d="M29 96 H71" stroke={accent} strokeWidth="4.4" /><circle cx="50" cy="96" r="3" fill={GOLD} stroke={INK} strokeWidth="0.5" />
        <path d="M24 134 Q50 142 76 134" stroke="#fff" strokeOpacity="0.5" fill="none" strokeWidth="1.2" />
      </g>,
      // звёздная мантия
      <g key="2">
        <path d="M31 60 Q50 54 69 60 L72 104 L78 138 Q50 146 22 138 L28 104 Z" fill={col} stroke={INK} strokeWidth="0.9" />
        {[[38, 74], [60, 70], [44, 90], [58, 102], [36, 112], [64, 122], [46, 128], [54, 82]].map(([x, y], i) => <text key={i} x={x} y={y} fontSize={i % 2 ? 5 : 7} fill="#fff" opacity="0.8" textAnchor="middle">✦</text>)}
        <path d="M22 134 Q50 144 78 134" stroke={GOLD} fill="none" strokeWidth="1.6" />
        <path d="M31 60 Q50 74 69 60" fill="none" stroke={GOLD} strokeWidth="1.6" />
        <path d="M29 96 H71" stroke={accent} strokeWidth="3.4" />
      </g>,
      // одеяние архимага: плащ-накидка, золотой подол, светящийся знак
      <g key="3">
        <path d="M30 60 Q50 52 70 60 L73 104 L80 140 Q50 148 20 140 L27 104 Z" fill={col} stroke={GOLD} strokeWidth="1.2" />
        <path d="M29 62 Q50 52 71 62 L76 80 Q50 90 24 80 Z" fill={dark2(col)} stroke={GOLD} strokeWidth="1.2" />
        <path d="M22 136 Q50 146 78 136" fill="none" stroke={GOLD} strokeWidth="2.2" />
        <circle cx="50" cy="104" r="6" fill="none" stroke={GOLD} strokeWidth="1.6" /><text x="50" y="108" fontSize="9" fill="#fff" textAnchor="middle">✦</text>
        {[[34, 118], [66, 118], [44, 130], [58, 128]].map(([x, y], i) => <text key={i} x={x} y={y} fontSize="5" fill={GOLD} opacity="0.9" textAnchor="middle">✦</text>)}
        <path d="M29 96 H71" stroke={accent} strokeWidth="3" />
      </g>,
    ][t];
  }
  if (cls === 'b') {
    return [
      // жилет
      <g key="0">
        <path d="M33 64 L45 61 L50 100 L33 100 Z M67 64 L55 61 L50 100 L67 100 Z" fill={col} stroke={INK} strokeWidth="0.9" />
        {[70, 80, 90].map((y) => <circle key={y} cx="47.5" cy={y} r="1.2" fill="#fff" opacity="0.7" />)}
      </g>,
      // колет со шнуровкой
      <g key="1">
        <path d="M31 62 Q50 56 69 62 L67 102 Q50 108 33 102 Z" fill={col} stroke={INK} strokeWidth="0.9" />
        <path d="M44 66 L56 74 M56 66 L44 74 M44 78 L56 86 M56 78 L44 86 M44 90 L56 98 M56 90 L44 98" stroke="#fff" strokeOpacity="0.45" strokeWidth="0.9" />
        {[[36, 72], [36, 84], [36, 96], [64, 72], [64, 84], [64, 96]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1.6" fill="#fff" opacity="0.7" />)}
      </g>,
      // камзол менестреля с длинными полами и пуговицами
      <g key="2">
        <path d="M31 62 Q50 56 69 62 L72 114 L50 106 L28 114 Z" fill={col} stroke={INK} strokeWidth="0.9" />
        <path d="M43 62 L50 82 L57 62" fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="1.1" />
        {[74, 84, 94].map((y) => <circle key={y} cx="50" cy={y} r="1.7" fill={GOLD} stroke={INK} strokeWidth="0.4" />)}
        <path d="M30 108 L50 100 L70 108" fill="none" stroke={accent} strokeWidth="2" />
      </g>,
      // парадный камзол: золотые эполеты, ноты, перо
      <g key="3">
        <path d="M30 62 Q50 55 70 62 L73 116 L50 107 L27 116 Z" fill={col} stroke={GOLD} strokeWidth="1.3" />
        <path d="M43 62 L50 84 L57 62" fill="none" stroke={GOLD} strokeWidth="1.4" />
        <circle cx="29" cy="64" r="5.4" fill={GOLD} stroke={INK} strokeWidth="0.7" /><circle cx="71" cy="64" r="5.4" fill={GOLD} stroke={INK} strokeWidth="0.7" />
        <path d="M24 66 V76 M29 69 V80 M34 66 V74 M66 66 V74 M71 69 V80 M76 66 V76" stroke={GOLD} strokeWidth="1.1" />
        <text x="50" y="100" fontSize="12" fill={GOLD} textAnchor="middle">♪</text>
        {[72, 82].map((y) => <circle key={y} cx="50" cy={y} r="1.7" fill={GOLD} stroke={INK} strokeWidth="0.4" />)}
        <path d="M30 100 H70" stroke={accent} strokeWidth="3" />
      </g>,
    ][t];
  }
  return [
    // табард поверх кольчуги
    <g key="0">
      <path d="M31 62 Q50 57 69 62 L67 104 H33 Z" fill="#9a9ab0" stroke={INK} strokeWidth="0.9" />
      <path d="M41 60 H59 V108 H41 Z" fill={col} stroke={INK} strokeWidth="0.8" />
      <path d="M50 68 V86 M44 76 H56" stroke={GOLD} strokeWidth="2.2" />
    </g>,
    // кираса
    <g key="1">
      <path d="M30 62 Q50 54 70 62 L67 106 Q50 112 33 106 Z" fill={col} stroke={INK} strokeWidth="0.9" />
      <path d="M50 58 V108 M36 80 H64 M37 94 H63" stroke={GOLD} strokeOpacity="0.9" strokeWidth="1" fill="none" />
      <ellipse cx="29" cy="64" rx="7" ry="5.5" fill={col} stroke={INK} strokeWidth="0.8" /><ellipse cx="71" cy="64" rx="7" ry="5.5" fill={col} stroke={INK} strokeWidth="0.8" />
      <path d="M50 70 V86 M43 77 H57" stroke={GOLD} strokeWidth="2.4" />
    </g>,
    // латы с крыльями на наплечниках
    <g key="2">
      <path d="M30 62 Q50 54 70 62 L67 106 Q50 112 33 106 Z" fill={col} stroke={INK} strokeWidth="0.9" />
      <path d="M50 58 V108 M36 80 H64 M37 94 H63" stroke={GOLD} strokeWidth="1" fill="none" />
      <path d="M26 62 Q10 56 6 72 Q14 68 20 74 Q18 68 28 68 Z M74 62 Q90 56 94 72 Q86 68 80 74 Q82 68 72 68 Z" fill={PALE} stroke={GOLD} strokeWidth="1" />
      <ellipse cx="29" cy="64" rx="6.5" ry="5" fill={col} stroke={INK} strokeWidth="0.8" /><ellipse cx="71" cy="64" rx="6.5" ry="5" fill={col} stroke={INK} strokeWidth="0.8" />
      <path d="M50 68 V88 M42 77 H58" stroke={GOLD} strokeWidth="2.8" />
    </g>,
    // сияющие латы: солнце на груди, золотая отделка
    <g key="3">
      {Array.from({ length: 12 }, (_, i) => { const a = (i * Math.PI) / 6; return <path key={i} d={`M${50 + Math.cos(a) * 10} ${82 + Math.sin(a) * 10} L${50 + Math.cos(a) * 19} ${82 + Math.sin(a) * 19}`} stroke={GOLD} strokeWidth="1.4" opacity="0.7" strokeLinecap="round" />; })}
      <path d="M30 62 Q50 53 70 62 L67 106 Q50 113 33 106 Z" fill={col} stroke={GOLD} strokeWidth="1.5" />
      <circle cx="50" cy="82" r="9" fill={PALE} stroke={GOLD} strokeWidth="1.4" /><path d="M50 75 V89 M43 82 H57" stroke={GOLD} strokeWidth="2.4" />
      <path d="M24 62 Q8 54 4 72 Q12 66 20 74 Q18 66 28 68 Z M76 62 Q92 54 96 72 Q88 66 80 74 Q82 66 72 68 Z" fill={PALE} stroke={GOLD} strokeWidth="1.2" />
      <ellipse cx="29" cy="64" rx="8" ry="6" fill={col} stroke={GOLD} strokeWidth="1.2" /><ellipse cx="71" cy="64" rx="8" ry="6" fill={col} stroke={GOLD} strokeWidth="1.2" />
      <path d="M33 104 H67" stroke={GOLD} strokeWidth="2.2" />
    </g>,
  ][t];
}

/** Чуть темнее цвета (для внутренних деталей). Принимает #rrggbb. */
function dark2(hex: string): string {
  if (!hex.startsWith('#') || hex.length < 7) return hex;
  const n = parseInt(hex.slice(1, 7), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v * 0.7));
  return `rgb(${c.join(',')})`;
}
