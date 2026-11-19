'use client';
import { memo, useId } from 'react';
import { BRAIN_REGIONS, type RegionId } from '@/lib/game/brain';

// Контуры областей мозга (вид сбоку, лоб слева). Границы долей идут по настоящим бороздам, поэтому доли стыкуются без зазоров:
// центральная (лобная | теменная), боковая/сильвиева (височная снизу), теменно-затылочная.
const CENTRAL = 'C112 26 120 42 110 58 C103 70 98 80 92 91';           // сверху (118,11) вниз к сильвиевой (92,91)
const CENTRAL_UP = 'C98 80 103 70 110 58 C120 42 112 26 118 11';
const SYLV_A = 'C64 95 76 91 92 91';                                      // (50,99) → (92,91)
const SYLV_A_BACK = 'C76 91 64 95 50 99';
const SYLV_B = 'C104 90 112 83 128 85 C146 87 166 80 184 78';            // (92,91) → (184,78)
const SYLV_B_BACK = 'C166 80 146 87 128 85 C112 83 104 90 92 91';
const PO_UP = 'C182 40 188 58 184 78';                                    // теменно-затылочная: (186,24) → (184,78)
const PO_UP_BACK = 'C188 58 182 40 186 24';
const PO_LOW = 'C184 92 186 104 190 114';                                 // (184,78) → (190,114)
const PO_LOW_BACK = 'C186 104 184 92 184 78';

const PATHS: Record<RegionId, string> = {
  cerebellum: 'M148 114 C168 107 200 110 213 123 C216 138 198 152 172 155 C153 153 141 134 148 114 Z',
  stem: 'M103 117 C111 123 126 127 135 131 C140 144 139 158 135 172 C127 176 116 174 111 169 C112 150 108 133 103 117 Z',
  frontal: `M22 93 C15 63 33 34 66 22 C88 14 106 9 118 11 ${CENTRAL} ${SYLV_A_BACK} C38 101 26 99 22 93 Z`,
  parietal: `M118 11 C142 7 168 12 186 24 ${PO_UP} ${SYLV_B_BACK} ${CENTRAL_UP} Z`,
  occipital: `M186 24 C208 36 224 58 226 84 C228 100 220 112 206 115 C196 116 192 116 190 114 ${PO_LOW_BACK} ${PO_UP_BACK} Z`,
  temporal: `M50 99 ${SYLV_A} ${SYLV_B} ${PO_LOW} C180 114 174 114 168 117 C150 129 110 135 82 127 C60 121 45 109 50 99 Z`,
  limbic: 'M94 72 C98 53 128 47 147 60 C157 67 153 74 144 71 C130 63 111 64 103 78 C99 82 92 78 94 72 Z',
};
// Борозды поверх коры
const FISSURES = [
  `M50 99 ${SYLV_A} ${SYLV_B}`,                                              // боковая (сильвиева)
  `M118 11 ${CENTRAL}`,                                                       // центральная
  `M186 24 ${PO_UP} ${PO_LOW}`,                                               // теменно-затылочная
];
const CORTEX: RegionId[] = ['frontal', 'parietal', 'occipital', 'temporal'];
// Складки мозжечка: параллельные дуги
const FOLIA = Array.from({ length: 9 }, (_, k) => `M142 ${116 + k * 4.4} C165 ${107 + k * 4.4} 197 ${111 + k * 4.4} 218 ${123 + k * 4.4}`);

const ORDER: RegionId[] = ['cerebellum', 'stem', 'frontal', 'parietal', 'occipital', 'temporal', 'limbic'];
// Лимбическая система — внутренняя структура: рисуется поверх коры отдельно
const BASE: RegionId[] = ORDER.filter((id) => id !== 'limbic');
const REST = [0x24, 0x2f, 0x4d];
const STOPS: { t: number; c: number[] }[] = [{ t: 0, c: [0x2c, 0x47, 0x78] }, { t: 0.5, c: [0x26, 0x9a, 0xe4] }, { t: 1, c: [0x8c, 0xf2, 0xff] }];

/** От тусклого сине-серого к ярко-голубому. */
export function brainColor(t: number): string {
  if (t <= 0) return `rgb(${REST.join(',')})`;
  const x = Math.min(1, t);
  const hi = STOPS.findIndex((s) => s.t >= x);
  const a = STOPS[Math.max(0, hi - 1)], b = STOPS[hi === -1 ? STOPS.length - 1 : hi];
  const k = b.t === a.t ? 0 : (x - a.t) / (b.t - a.t);
  return `rgb(${a.c.map((v, i) => Math.round(v + (b.c[i] - v) * k)).join(',')})`;
}

interface Props {
  intensity: Record<RegionId, number>;
  overall: number;
  hover: RegionId | null;
  onHover: (r: RegionId | null) => void;
  onPick: (r: RegionId) => void;
}

export const BrainFigure = memo(function BrainFigure({ intensity, overall, hover, onHover, onPick }: Props) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const name = (id: RegionId) => BRAIN_REGIONS.find((r) => r.id === id)!;
  return (
    <svg viewBox="0 0 240 182" className="brain" role="group" aria-label="Схема мозга">
      <defs>
        <radialGradient id={`aura-${uid}`} cx="50%" cy="48%" r="55%">
          <stop offset="0" stopColor="#5ee1ff" stopOpacity="0.55" /><stop offset="0.6" stopColor="#2a8fe0" stopOpacity="0.18" /><stop offset="1" stopColor="#2a8fe0" stopOpacity="0" />
        </radialGradient>
        <filter id={`glow-${uid}`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5" /></filter>
        <filter id={`glow2-${uid}`} x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="11" /></filter>
        {/* объём: свет сверху-слева, тень снизу-справа */}
        <radialGradient id={`vol-${uid}`} cx="35%" cy="25%" r="85%"><stop offset="0" stopColor="#fff" stopOpacity="0.32" /><stop offset="0.5" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.45" /></radialGradient>
        <clipPath id={`cortex-${uid}`}>{CORTEX.map((id) => <path key={id} d={PATHS[id]} />)}</clipPath>
        {ORDER.map((id) => <clipPath key={id} id={`clip-${id}-${uid}`}><path d={PATHS[id]} /></clipPath>)}
      </defs>

      {/* общее сияние: чем больше развития, тем ярче аура вокруг мозга */}
      <ellipse cx="120" cy="88" rx="120" ry="84" fill={`url(#aura-${uid})`} opacity={overall} className={overall > 0.05 ? 'brain-pulse' : undefined} />

      {BASE.map((id) => {
        const t = intensity[id] ?? 0;
        return (
          <g key={id}>
            {t > 0 && (
              <>
                <path d={PATHS[id]} fill="#38bdf8" opacity={0.25 + 0.65 * t} filter={`url(#glow2-${uid})`} className="brain-pulse" />
                {t > 0.35 && <path d={PATHS[id]} fill="#a5f3ff" opacity={0.15 + 0.6 * t} filter={`url(#glow-${uid})`} className="brain-pulse" />}
              </>
            )}
            <path d={PATHS[id]} fill={brainColor(t)} />
            <path d={PATHS[id]} fill={`url(#vol-${uid})`} pointerEvents="none" />
            {/* затемнение у краёв доли (ощущение округлости) */}
            <g clipPath={`url(#clip-${id}-${uid})`} pointerEvents="none"><path d={PATHS[id]} fill="none" stroke="#000" strokeOpacity="0.38" strokeWidth="5" strokeLinejoin="round" /></g>
            {id === 'cerebellum' && (
              <g clipPath={`url(#clip-${id}-${uid})`} fill="none" stroke="#050a18" strokeOpacity="0.55" strokeWidth="1.1" pointerEvents="none">{FOLIA.map((d, i) => <path key={i} d={d} />)}</g>
            )}
            {id === 'stem' && <g clipPath={`url(#clip-${id}-${uid})`} fill="none" stroke="#050a18" strokeOpacity="0.35" strokeWidth="1" pointerEvents="none"><path d="M118 130 C121 145 120 158 119 170" /><path d="M126 132 C129 146 128 158 127 170" /></g>}
          </g>
        );
      })}

      {/* извилины коры поверх долей */}
      <g clipPath={`url(#cortex-${uid})`} pointerEvents="none">
        <image href="/brain/gyri-dark.png" x="0" y="0" width="240" height="182" preserveAspectRatio="none" />
        <image href="/brain/gyri-light.png" x="0" y="0" width="240" height="182" preserveAspectRatio="none" />
      </g>
      {/* главные борозды */}
      <g fill="none" stroke="#050a18" strokeOpacity="0.85" strokeWidth="1.9" strokeLinecap="round" pointerEvents="none">{FISSURES.map((d, i) => <path key={i} d={d} />)}</g>
      <g fill="none" stroke="#ffffff" strokeOpacity="0.12" strokeWidth="0.7" strokeLinecap="round" pointerEvents="none" transform="translate(-0.8 -0.8)">{FISSURES.map((d, i) => <path key={i} d={d} />)}</g>
      {/* лимбическая система: внутренняя структура поверх коры */}
      {(() => {
        const t = intensity.limbic ?? 0;
        return (
          <g pointerEvents="none">
            {t > 0 && <path d={PATHS.limbic} fill="#38bdf8" opacity={0.3 + 0.6 * t} filter={`url(#glow-${uid})`} className="brain-pulse" />}
            <path d={PATHS.limbic} fill={t > 0 ? brainColor(t) : '#33406a'} fillOpacity={t > 0 ? 0.95 : 0.82} stroke={t > 0.2 ? '#d5f7ff' : '#8fb0ea'} strokeOpacity={t > 0.2 ? 0.8 : 0.55} strokeWidth="0.9" strokeLinejoin="round" />
            <path d={PATHS.limbic} fill={`url(#vol-${uid})`} />
          </g>
        );
      })()}
      {/* контур по ярким областям светится */}
      {ORDER.map((id) => (intensity[id] ?? 0) > 0.3 && <path key={`o-${id}`} d={PATHS[id]} fill="none" stroke="#bdf4ff" strokeOpacity={0.3 + 0.45 * (intensity[id] ?? 0)} strokeWidth="1" strokeLinejoin="round" pointerEvents="none" />)}

      {ORDER.map((id) => (
        <g key={`h-${id}`}>
          {hover === id && <path d={PATHS[id]} fill="none" stroke="#fff" strokeWidth="1.3" pointerEvents="none" />}
          <path d={PATHS[id]} fill="transparent" role="button" tabIndex={0} aria-label={`${name(id).name}: ${name(id).sphere}`} className="muscle-hit"
            onClick={() => onPick(id)} onMouseEnter={() => onHover(id)} onMouseLeave={() => onHover(null)} onFocus={() => onHover(id)} onBlur={() => onHover(null)}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(id); } }} />
        </g>
      ))}
    </svg>
  );
});

export function BrainLegend() {
  return (
    <div className="legend" aria-hidden>
      <span>меньше</span>
      <i style={{ background: `linear-gradient(90deg, ${brainColor(0)}, ${brainColor(0.01)}, ${brainColor(0.5)}, ${brainColor(1)})`, boxShadow: '0 0 10px #38bdf8aa' }} />
      <span>больше развития</span>
    </div>
  );
}
