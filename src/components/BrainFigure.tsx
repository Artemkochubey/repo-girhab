'use client';
import { memo, useId } from 'react';
import { BRAIN_REGIONS, type RegionId } from '@/lib/game/brain';

// Контуры областей мозга (вид сбоку, лоб слева). Упрощённая схема, а не медицинский атлас.
const PATHS: Record<RegionId, string> = {
  cerebellum: 'M138 114 C156 106 192 110 202 124 C200 142 176 152 152 148 C138 144 132 126 138 114 Z',
  stem: 'M108 118 C114 122 128 124 134 130 L136 164 C130 168 118 168 112 162 Z',
  frontal: 'M24 84 C21 54 44 27 76 21 C96 17 113 17 126 22 C122 40 114 64 104 86 C92 92 76 96 60 100 C44 102 28 96 24 84 Z',
  parietal: 'M126 22 C148 21 172 25 188 36 C186 54 182 74 172 80 C150 80 122 86 104 86 C114 64 122 40 126 22 Z',
  occipital: 'M188 36 C206 48 220 68 218 88 C216 102 204 113 192 115 C183 109 177 94 172 80 C182 74 186 54 188 36 Z',
  temporal: 'M60 100 C76 96 92 92 104 86 C122 86 150 80 172 80 C177 94 183 109 192 115 C176 125 150 127 120 129 C92 131 66 123 53 112 C51 106 54 102 60 100 Z',
  limbic: 'M96 62 C98 50 116 46 132 52 C146 58 148 70 136 76 C122 82 102 78 96 62 Z',
};

// Извилины: тонкие линии для объёма
const GYRI: Record<RegionId, string[]> = {
  frontal: ['M32 80 C40 68 50 76 58 64 S74 58 82 46 S100 40 110 30', 'M40 92 C52 84 60 90 70 80 S86 76 94 66', 'M60 38 C66 48 76 44 82 54 S94 58 100 50'],
  parietal: ['M132 32 C140 42 150 36 158 46 S172 50 178 42', 'M122 62 C134 56 142 64 152 58 S166 60 172 54', 'M140 74 C148 70 158 74 166 68'],
  occipital: ['M192 48 C200 56 210 54 214 64', 'M184 70 C196 74 204 70 212 80', 'M188 96 C196 98 204 94 210 98'],
  temporal: ['M66 106 C80 100 90 108 104 100 S128 98 140 96', 'M76 116 C92 112 104 118 118 112 S146 110 162 106', 'M120 92 C130 100 144 96 154 102'],
  cerebellum: ['M146 120 C160 116 180 118 194 124', 'M146 130 C160 126 182 128 194 134', 'M150 140 C162 136 178 138 188 142'],
  limbic: ['M102 62 C112 58 124 60 132 66'],
  stem: ['M114 130 C120 134 126 134 130 138', 'M114 144 C120 148 126 148 130 152'],
};

const ORDER: RegionId[] = ['cerebellum', 'stem', 'frontal', 'parietal', 'occipital', 'temporal', 'limbic'];
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
    <svg viewBox="0 0 240 180" className="brain" role="group" aria-label="Схема мозга">
      <defs>
        <radialGradient id={`aura-${uid}`} cx="50%" cy="48%" r="55%">
          <stop offset="0" stopColor="#5ee1ff" stopOpacity="0.55" /><stop offset="0.6" stopColor="#2a8fe0" stopOpacity="0.18" /><stop offset="1" stopColor="#2a8fe0" stopOpacity="0" />
        </radialGradient>
        <filter id={`glow-${uid}`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5" /></filter>
        <filter id={`glow2-${uid}`} x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="11" /></filter>
        <linearGradient id={`vol-${uid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" stopOpacity="0.28" /><stop offset="0.5" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#000" stopOpacity="0.35" /></linearGradient>
        {ORDER.map((id) => <clipPath key={id} id={`clip-${id}-${uid}`}><path d={PATHS[id]} /></clipPath>)}
      </defs>

      {/* общее сияние: чем больше развития, тем ярче аура вокруг мозга */}
      <ellipse cx="120" cy="86" rx="118" ry="82" fill={`url(#aura-${uid})`} opacity={overall} className={overall > 0.05 ? 'brain-pulse' : undefined} />

      {ORDER.map((id) => {
        const t = intensity[id] ?? 0;
        return (
          <g key={id}>
            {t > 0 && (
              <>
                <path d={PATHS[id]} fill="#38bdf8" opacity={0.25 + 0.65 * t} filter={`url(#glow2-${uid})`} className="brain-pulse" />
                {t > 0.35 && <path d={PATHS[id]} fill="#a5f3ff" opacity={0.15 + 0.6 * t} filter={`url(#glow-${uid})`} className="brain-pulse" />}
              </>
            )}
            <path d={PATHS[id]} fill={brainColor(t)} stroke={t > 0.3 ? '#bdf4ff' : '#0f1830'} strokeOpacity={t > 0.3 ? 0.35 + 0.4 * t : 0.9} strokeWidth="1.1" strokeLinejoin="round" />
            <path d={PATHS[id]} fill={`url(#vol-${uid})`} pointerEvents="none" />
            <g clipPath={`url(#clip-${id}-${uid})`} fill="none" stroke={t > 0.3 ? '#e6fbff' : '#8aa4d6'} strokeOpacity={0.16 + 0.3 * t} strokeWidth="1.2" strokeLinecap="round" pointerEvents="none">
              {GYRI[id].map((d, i) => <path key={i} d={d} />)}
            </g>
            {hover === id && <path d={PATHS[id]} fill="none" stroke="#fff" strokeWidth="1.2" pointerEvents="none" />}
            <path d={PATHS[id]} fill="transparent" role="button" tabIndex={0} aria-label={`${name(id).name}: ${name(id).sphere}`} className="muscle-hit"
              onClick={() => onPick(id)} onMouseEnter={() => onHover(id)} onMouseLeave={() => onHover(null)} onFocus={() => onHover(id)} onBlur={() => onHover(null)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(id); } }} />
          </g>
        );
      })}
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
