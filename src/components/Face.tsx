import { useId } from 'react';
import { EYE_COLORS, HAIR_COLORS, SKIN_TONES, type FaceConfig } from '@/lib/game/faces';

const mix = (hex: string, k: number) => {
  const n = parseInt(hex.slice(1), 16);
  const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(v * (1 + k)))));
  return `rgb(${c.join(',')})`;
};
const INK = '#2a1a10';
const CAP = 'M21 54 Q17 20 50 17 Q83 20 79 54 Q74 40 58 34 Q50 40 42 34 Q26 40 21 54Z';
const LIP = '#7a2b2b';

/** Причёска, которая рисуется за головой (длинные волосы, хвосты, косы). */
function HairBack({ id, c }: { id: string; c: string }) {
  const o = { fill: c, stroke: mix(c, -0.35), strokeWidth: 0.8 };
  switch (id) {
    case 'long': return <path d="M19 52 Q12 92 26 98 L74 98 Q88 92 81 52 Q80 30 50 20 Q20 30 19 52Z" {...o} />;
    case 'ponytail': return <path d="M72 30 Q98 30 94 66 Q92 80 84 90 Q86 66 74 52Z" {...o} />;
    case 'bob': return <path d="M19 50 Q14 84 30 88 L70 88 Q86 84 81 50 Q79 28 50 20 Q21 28 19 50Z" {...o} />;
    case 'braids': return <g {...o}>{[66, 78, 90].map((y, i) => <ellipse key={`l${i}`} cx={20 - (i % 2)} cy={y} rx="5.5" ry="7" />)}{[66, 78, 90].map((y, i) => <ellipse key={`r${i}`} cx={80 + (i % 2)} cy={y} rx="5.5" ry="7" />)}</g>;
    case 'pigtails': return <g {...o}><circle cx="12" cy="52" r="10" /><circle cx="88" cy="52" r="10" /></g>;
    case 'wavy': return <path d="M19 52 Q10 68 20 80 Q10 92 24 98 L76 98 Q90 92 80 80 Q90 68 81 52 Q80 30 50 20 Q20 30 19 52Z" {...o} />;
    case 'halfup': return <path d="M19 52 Q12 92 26 98 L74 98 Q88 92 81 52 Q80 30 50 20 Q20 30 19 52Z" {...o} />;
    case 'curlylong': return <g {...o}><path d="M19 52 Q12 92 26 98 L74 98 Q88 92 81 52 Q80 30 50 20 Q20 30 19 52Z" />{[[16, 60], [14, 75], [20, 90], [33, 96], [50, 98], [67, 96], [80, 90], [86, 75], [84, 60]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="8" />)}</g>;
    case 'fringe': return <path d="M19 50 Q14 84 30 88 L70 88 Q86 84 81 50 Q79 28 50 20 Q21 28 19 50Z" {...o} />;
    case 'sidebraid': return <g {...o}>{[[73, 68], [75, 79], [77, 90]].map(([x, y], i) => <ellipse key={i} cx={x} cy={y} rx="5.2" ry="6.8" />)}<circle cx="78" cy="98" r="2.6" fill="#ff6fb0" stroke="none" /></g>;
    case 'sidepony': return <path d="M28 30 Q2 36 8 68 Q10 82 18 92 Q18 68 27 52Z" {...o} />;
    case 'dreads': return <g fill="none" stroke={c} strokeWidth="6" strokeLinecap="round">{['M22 48 L15 90', 'M28 54 L23 97', 'M72 54 L77 97', 'M78 48 L85 90'].map((d, i) => <path key={i} d={d} />)}</g>;
    default: return null;
  }
}

/** Причёска спереди (шапка волос и чёлка). */
function HairFront({ id, c }: { id: string; c: string }) {
  const o = { fill: c, stroke: mix(c, -0.35), strokeWidth: 0.8 };
  switch (id) {
    case 'spiky': return <path d="M21 52 L17 28 L30 34 L32 13 L42 28 L50 8 L58 28 L68 13 L70 34 L83 28 L79 52 Q72 38 50 36 Q28 38 21 52Z" {...o} />;
    case 'side': return <path d="M21 54 Q15 22 52 17 Q86 18 79 52 Q72 40 46 38 Q30 37 21 54Z" {...o} />;
    case 'curly': return <g {...o}>{[[26, 36, 9], [38, 27, 10], [52, 24, 10], [65, 28, 10], [75, 38, 9], [23, 50, 7], [78, 50, 7]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} />)}</g>;
    case 'buzz': return <path d="M23 50 Q22 24 50 23 Q78 24 77 50 Q72 38 50 36 Q28 38 23 50Z" {...o} opacity="0.85" />;
    case 'bald': return null;
    case 'pixie': return <path d="M21 54 Q17 20 50 16 Q84 20 79 52 Q70 42 56 36 Q44 44 32 38 Q24 42 21 54Z" {...o} />;
    case 'bob': return <path d="M21 54 Q17 20 50 17 Q83 20 79 54 L74 42 Q50 34 26 42Z" {...o} />;
    case 'buns': return <g {...o}><circle cx="27" cy="21" r="10" /><circle cx="73" cy="21" r="10" /><path d="M21 54 Q17 20 50 17 Q83 20 79 54 Q74 40 58 34 Q50 40 42 34 Q26 40 21 54Z" /></g>;
    case 'ponytail': return <g {...o}><path d="M21 54 Q17 20 50 17 Q83 20 79 54 Q74 40 58 34 Q50 40 42 34 Q26 40 21 54Z" /><circle cx="75" cy="34" r="3.4" fill="#ff6fb0" stroke="none" /></g>;
    case 'pigtails': return <g {...o}><path d="M21 54 Q17 20 50 17 Q83 20 79 54 Q74 40 58 34 Q50 40 42 34 Q26 40 21 54Z" /><circle cx="19" cy="46" r="2.6" fill="#ff6fb0" stroke="none" /><circle cx="81" cy="46" r="2.6" fill="#ff6fb0" stroke="none" /></g>;
    case 'afro': return <g {...o}>{[[50, 15, 16], [30, 21, 14], [70, 21, 14], [18, 37, 12], [82, 37, 12], [13, 54, 9], [87, 54, 9], [40, 11, 12], [60, 11, 12]].map(([x, y, r], i) => <circle key={i} cx={x} cy={y} r={r} />)}</g>;
    case 'mohawk': return <g {...o}><path d="M24 48 Q24 28 50 26 Q76 28 76 48 Q70 38 50 36 Q30 38 24 48Z" opacity="0.35" /><path d="M40 36 L38 14 L44 26 L46 6 L50 24 L54 6 L56 26 L62 14 L60 36Z" /></g>;
    case 'undercut': return <g {...o}><path d="M24 48 Q24 28 50 26 Q76 28 76 48 Q70 38 50 36 Q30 38 24 48Z" opacity="0.4" /><path d="M28 46 Q26 18 56 16 Q84 18 78 40 Q66 30 44 34 Q34 36 28 46Z" /></g>;
    case 'slick': return <g {...o}><path d="M22 52 Q18 22 50 17 Q82 22 78 52 Q74 34 50 30 Q26 34 22 52Z" /><path d="M34 25 Q50 20 66 25 M30 31 Q50 26 70 31" fill="none" stroke={mix(c, 0.25)} strokeWidth="1.2" /></g>;
    case 'messy': return <path d="M21 54 Q16 20 50 15 Q84 20 79 54 L72 38 L67 43 L61 34 L54 42 L46 34 L40 43 L34 36 L28 40Z" {...o} />;
    case 'topknot': return <g {...o}><circle cx="50" cy="11" r="9" /><path d={CAP} /><path d="M44 18 H56" stroke="#ff6fb0" strokeWidth="2.4" /></g>;
    case 'wavy': return <path d={CAP} {...o} />;
    case 'sidebraid': return <path d={CAP} {...o} />;
    case 'sidepony': return <g {...o}><path d={CAP} /><circle cx="26" cy="35" r="3.4" fill="#ff6fb0" stroke="none" /></g>;
    case 'dreads': return <path d={CAP} {...o} />;
    case 'fringe': return <path d="M21 54 Q17 18 50 15 Q83 18 79 54 L76 41 L24 41Z" {...o} />;
    case 'halfup': return <g {...o}><circle cx="50" cy="12" r="7.5" /><path d={CAP} /></g>;
    case 'curlylong': return <path d={CAP} {...o} />;
    case 'bun': return <g {...o}><circle cx="50" cy="10" r="11" /><path d="M44 8 Q50 14 56 8" fill="none" stroke={mix(c, -0.35)} strokeWidth="1" /><path d={CAP} /></g>;
    case 'braids': case 'long': case 'short': default:
      return <path d="M21 54 Q17 20 50 17 Q83 20 79 54 Q74 40 58 34 Q50 40 42 34 Q26 40 21 54Z" {...o} />;
  }
}

function Eyes({ style, iris, hair, female }: { style: string; iris: string; hair: string; female: boolean }) {
  const open = (cx: number, rx: number, ry: number, ir: number) => (
    <g key={cx}>
      <ellipse cx={cx} cy="52" rx={rx} ry={ry} fill="#fff" stroke={INK} strokeWidth="0.9" />
      <circle cx={cx} cy="52.5" r={ir} fill={iris} /><circle cx={cx} cy="52.5" r={ir * 0.5} fill="#111" /><circle cx={cx - ir * 0.35} cy={51} r={ir * 0.28} fill="#fff" />
    </g>
  );
  const happy = (cx: number) => <path key={cx} d={`M${cx - 6} 54 Q${cx} 46 ${cx + 6} 54`} fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />;
  const lash = female && style !== 'happy';
  return (
    <g>
      {style === 'round' && [38, 62].map((x) => open(x, 5.5, 6, 3.4))}
      {style === 'wide' && [38, 62].map((x) => open(x, 6.6, 7.6, 4.4))}
      {style === 'sleepy' && [38, 62].map((x) => <g key={x}>{open(x, 5.5, 4.2, 3.2)}<path d={`M${x - 6} 50.6 H${x + 6}`} stroke={INK} strokeWidth="1.8" strokeLinecap="round" /></g>)}
      {style === 'happy' && [38, 62].map(happy)}
      {style === 'wink' && <>{open(38, 5.5, 6, 3.4)}{happy(62)}</>}
      {lash && <path d="M32 49 L28.5 45.5 M68 49 L71.5 45.5 M33 47 L31 43 M67 47 L69 43" stroke={INK} strokeWidth="1.4" strokeLinecap="round" />}
      <path d="M31.5 43 Q38 39.5 44.5 43" fill="none" stroke={mix(hair, -0.25)} strokeWidth={female ? 2 : 2.8} strokeLinecap="round" />
      <path d="M55.5 43 Q62 39.5 68.5 43" fill="none" stroke={mix(hair, -0.25)} strokeWidth={female ? 2 : 2.8} strokeLinecap="round" />
    </g>
  );
}

function Mouth({ style }: { style: string }) {
  switch (style) {
    case 'grin': return <g><path d="M38 67 Q50 82 62 67 Z" fill="#fff" stroke={LIP} strokeWidth="1.6" strokeLinejoin="round" /><path d="M50 68 V77 M44 68 V75 M56 68 V75" stroke={LIP} strokeWidth="0.7" /></g>;
    case 'open': return <g><path d="M41 67 Q50 85 59 67 Z" fill={LIP} /><path d="M45 77 Q50 72 55 77 Q50 81 45 77Z" fill="#e46a7a" /></g>;
    case 'smirk': return <path d="M41 71 Q50 73 60 66" fill="none" stroke={LIP} strokeWidth="2.6" strokeLinecap="round" />;
    case 'calm': return <path d="M43 70 H57" stroke={LIP} strokeWidth="2.6" strokeLinecap="round" />;
    case 'tongue': return <g><path d="M40 67 Q50 77 60 67" fill="none" stroke={LIP} strokeWidth="2.6" strokeLinecap="round" /><path d="M46 72 Q46 82 50.5 82 Q55 82 55 72Z" fill="#e46a7a" stroke={LIP} strokeWidth="0.9" /></g>;
    default: return <path d="M40 67 Q50 78 60 67" fill="none" stroke={LIP} strokeWidth="2.8" strokeLinecap="round" />;
  }
}

/** Лицо в координатах 0..100 (голова по центру). Рисуется внутри чужого <svg> или обёртки Face. */
export function FaceArt({ face }: { face: FaceConfig }) {
  const skin = SKIN_TONES[face.skin] ?? SKIN_TONES[1]!;
  const hair = HAIR_COLORS[face.hairColor]?.hex ?? HAIR_COLORS[1]!.hex;
  const iris = EYE_COLORS[face.eyeColor]?.hex ?? EYE_COLORS[0]!.hex;
  const edge = mix(skin, -0.22);
  const ex = new Set(face.extras);
  const female = face.gender === 'f';
  return (
    <g>
      <HairBack id={face.hair} c={hair} />
      <circle cx="22" cy="57" r="5.4" fill={skin} stroke={edge} strokeWidth="0.9" /><circle cx="78" cy="57" r="5.4" fill={skin} stroke={edge} strokeWidth="0.9" />
      {ex.has('earring') && <circle cx="22" cy="64" r="2.4" fill="none" stroke="#ffd24a" strokeWidth="1.4" />}
      <ellipse cx="50" cy="54" rx="28" ry="31" fill={skin} stroke={edge} strokeWidth="1" />
      {ex.has('beard') && <path d="M23 58 Q24 94 50 94 Q76 94 77 58 Q72 78 50 78 Q28 78 23 58Z" fill={hair} stroke={mix(hair, -0.35)} strokeWidth="0.8" />}
      {ex.has('blush') && <g fill="#ff7a8a" opacity="0.35"><circle cx="30" cy="63" r="5.5" /><circle cx="70" cy="63" r="5.5" /></g>}
      {ex.has('freckles') && <g fill={mix(skin, -0.35)}>{[[32, 61], [37, 64], [30, 66], [68, 61], [63, 64], [70, 66], [35, 59], [65, 59]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1" />)}</g>}
      <Eyes style={face.eyes} iris={iris} hair={hair} female={female} />
      <path d="M50 55 Q46 63 50 64.5" fill="none" stroke={edge} strokeWidth="1.8" strokeLinecap="round" />
      <Mouth style={face.mouth} />
      {ex.has('mustache') && <path d="M37 63 Q44 58 50 62 Q56 58 63 63 Q56 67 50 64 Q44 67 37 63Z" fill={hair} stroke={mix(hair, -0.35)} strokeWidth="0.6" />}
      {ex.has('scar') && <g stroke="#c0645a" strokeWidth="1.6" strokeLinecap="round"><path d="M66 38 L72 54" /><path d="M64 44 L70 42 M66 50 L72 48" strokeWidth="1" /></g>}
      {ex.has('glasses') && <g fill="none" stroke="#2c2c3c" strokeWidth="1.8"><circle cx="38" cy="52" r="9" /><circle cx="62" cy="52" r="9" /><path d="M47 52 H53 M29 51 L22 49 M71 51 L78 49" /></g>}
      <HairFront id={face.hair} c={hair} />
    </g>
  );
}

/** Круглая картинка с лицом (для списков, шапки, карточек). */
export function FaceBadge({ face, size = 48, color }: { face: FaceConfig; size?: number; color?: string }) {
  const id = `fc${useId().replace(/:/g, '')}`;
  return (
    <svg viewBox="-4 -2 108 108" width={size} height={size} role="img" aria-label="Лицо героя" className="face-badge">
      <defs><clipPath id={id}><circle cx="50" cy="52" r="52" /></clipPath></defs>
      <circle cx="50" cy="52" r="52" fill={color ? `${color}33` : '#2a2147'} />
      <g clipPath={`url(#${id})`}><g transform="translate(0 6)"><FaceArt face={face} /></g></g>
    </svg>
  );
}
