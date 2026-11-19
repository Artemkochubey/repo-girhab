'use client';
import { memo, useId } from 'react';
import { BRAIN_REGIONS, type RegionId } from '@/lib/game/brain';

// Контуры долей мозга (вид сбоку, лоб слева). Границы долей идут по настоящим бороздам, поэтому доли стыкуются без зазоров:
// центральная (лобная | теменная), боковая/сильвиева (височная снизу), теменно-затылочная.
const CENTRAL = 'C112 26 120 42 110 58 C103 70 98 80 92 91';
const CENTRAL_UP = 'C98 80 103 70 110 58 C120 42 112 26 118 11';
const SYLV_A = 'C64 95 76 91 92 91';
const SYLV_A_BACK = 'C76 91 64 95 50 99';
const SYLV_B = 'C104 90 112 83 128 85 C146 87 166 80 184 78';
const SYLV_B_BACK = 'C166 80 146 87 128 85 C112 83 104 90 92 91';
const PO_UP = 'C182 40 188 58 184 78';
const PO_UP_BACK = 'C188 58 182 40 186 24';
const PO_LOW = 'C184 92 186 104 190 114';
const PO_LOW_BACK = 'C186 104 184 92 184 78';

const PATHS: Record<RegionId, string> = {
  cerebellum: 'M148 114 C168 107 200 110 213 123 C216 138 198 152 172 155 C153 153 141 134 148 114 Z',
  stem: 'M116 116 C126 122 140 127 151 131 C154 144 153 156 150 166 C149 182 149 198 150 214 C146 217 141 217 138 214 C138 196 136 180 132 168 C124 156 120 140 116 116 Z',
  frontal: `M22 93 C15 63 33 34 66 22 C88 14 106 9 118 11 ${CENTRAL} ${SYLV_A_BACK} C38 101 26 99 22 93 Z`,
  parietal: `M118 11 C142 7 168 12 186 24 ${PO_UP} ${SYLV_B_BACK} ${CENTRAL_UP} Z`,
  occipital: `M186 24 C208 36 224 58 226 84 C228 100 220 112 206 115 C196 116 192 116 190 114 ${PO_LOW_BACK} ${PO_UP_BACK} Z`,
  temporal: `M50 99 ${SYLV_A} ${SYLV_B} ${PO_LOW} C180 114 174 114 168 117 C150 129 110 135 82 127 C60 121 45 109 50 99 Z`,
  limbic: 'M94 72 C98 53 128 47 147 60 C157 67 153 74 144 71 C130 63 111 64 103 78 C99 82 92 78 94 72 Z',
};
const FISSURES = [`M50 99 ${SYLV_A} ${SYLV_B}`, `M118 11 ${CENTRAL}`, `M186 24 ${PO_UP} ${PO_LOW}`];
const CORTEX: RegionId[] = ['frontal', 'parietal', 'occipital', 'temporal'];
const FOLIA = Array.from({ length: 9 }, (_, k) => `M142 ${116 + k * 4.4} C165 ${107 + k * 4.4} 197 ${111 + k * 4.4} 218 ${123 + k * 4.4}`);
const VENTRICLE = 'M70 72 C80 52 122 44 152 57 C168 65 171 82 160 93 C151 101 140 97 146 87 C152 77 140 66 122 64 C100 62 85 72 81 86 C77 92 68 84 70 72 Z';
const DEEP: RegionId[] = ['stem', 'limbic'];                   // видны сквозь полупрозрачную кору
const ORDER: RegionId[] = ['stem', 'limbic', 'frontal', 'parietal', 'occipital', 'temporal', 'cerebellum'];
const HITS: RegionId[] = ['frontal', 'parietal', 'occipital', 'temporal', 'cerebellum', 'stem', 'limbic'];

// Голова в профиль (лицо слева), как голограмма; мозг вписан в черепную коробку
const HEAD = 'M230 300 C228 268 232 248 246 228 C266 200 274 160 268 124 C258 66 210 28 150 28 C96 28 62 58 52 100 C48 116 50 128 48 138 C46 146 40 152 36 162 C30 172 24 182 30 188 C36 192 44 192 46 198 C44 204 48 208 46 214 C44 220 50 222 48 228 C46 236 52 246 60 252 C74 262 96 262 112 256 C124 252 128 270 130 300 Z';
const BRAIN_T = 'translate(48 28) scale(0.93 1.09)';

// Череп и шея — тонкие линии для анатомического контекста
const SKULL = [
  'M60 136 C54 96 76 52 128 38 C180 26 240 44 260 96 C270 126 266 160 254 190 C244 212 228 226 210 232',   // свод черепа
  'M56 134 C62 127 82 127 88 138 C91 150 84 161 72 161 C62 161 55 150 56 134',                             // глазница
  'M88 168 C112 165 150 167 176 175',                                                                       // скуловая дуга
  'M64 236 C90 252 132 250 158 232 C170 223 174 206 171 188',                                                // нижняя челюсть
];
const VERTEBRAE = [234, 250, 266, 282].map((y) => `M150 ${y} h22 a3 3 0 0 1 3 3 v8 a3 3 0 0 1 -3 3 h-22 a3 3 0 0 1 -3 -3 v-8 a3 3 0 0 1 3 -3 Z`);

const hex = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const mix = (a: number[], b: number[], k: number) => a.map((v, i) => Math.round(v + (b[i] - v) * k));
const DIM = [34, 44, 70];
/** Цвет доли: тусклый приглушённый, пока сфера не развита, и яркий насыщенный — когда развита. */
export function regionColor(id: RegionId, t: number): string {
  const hue = hex(BRAIN_REGIONS.find((r) => r.id === id)!.color);
  const dull = mix(DIM, hue, 0.28);
  const bright = mix(hue, [255, 255, 255], 0.12);
  return `rgb(${mix(dull, bright, Math.min(1, Math.max(0, t))).join(',')})`;
}
/** Для совместимости: оттенок голубого по яркости. */
export function brainColor(t: number): string {
  return `rgb(${mix(DIM, [140, 242, 255], Math.min(1, Math.max(0, t))).join(',')})`;
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
  const reg = (id: RegionId) => BRAIN_REGIONS.find((r) => r.id === id)!;
  const rim = 0.55 + 0.45 * overall;
  return (
    <svg viewBox="0 0 300 300" className="brain" role="group" aria-label="Голова и мозг: развитие по сферам">
      <defs>
        <radialGradient id={`aura-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#4fc3ff" stopOpacity="0.5" /><stop offset="0.55" stopColor="#1f6fd6" stopOpacity="0.16" /><stop offset="1" stopColor="#1f6fd6" stopOpacity="0" />
        </radialGradient>
        <linearGradient id={`head-${uid}`} x1="0" y1="0" x2="1" y2="0.4">
          <stop offset="0" stopColor="#2f7fe0" stopOpacity="0.55" /><stop offset="0.35" stopColor="#0d2a66" stopOpacity="0.55" /><stop offset="1" stopColor="#081638" stopOpacity="0.75" />
        </linearGradient>
        <radialGradient id={`face-${uid}`} cx="18%" cy="62%" r="45%"><stop offset="0" stopColor="#8fd8ff" stopOpacity="0.45" /><stop offset="1" stopColor="#8fd8ff" stopOpacity="0" /></radialGradient>
        <linearGradient id={`shine-${uid}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#fff" stopOpacity="0.16" /><stop offset="0.4" stopColor="#fff" stopOpacity="0" /></linearGradient>
        <filter id={`blur3-${uid}`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="3" /></filter>
        <filter id={`glow-${uid}`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="5" /></filter>
        <filter id={`glow2-${uid}`} x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="10" /></filter>
        <radialGradient id={`vol-${uid}`} cx="35%" cy="22%" r="85%"><stop offset="0" stopColor="#fff" stopOpacity="0.42" /><stop offset="0.45" stopColor="#fff" stopOpacity="0.04" /><stop offset="1" stopColor="#000" stopOpacity="0.5" /></radialGradient>
        <clipPath id={`headclip-${uid}`}><path d={HEAD} /></clipPath>
        <clipPath id={`cortex-${uid}`}>{CORTEX.map((id) => <path key={id} d={PATHS[id]} />)}</clipPath>
        {ORDER.map((id) => <clipPath key={id} id={`clip-${id}-${uid}`}><path d={PATHS[id]} /></clipPath>)}
      </defs>

      {/* сияние вокруг головы растёт с общей яркостью */}
      <ellipse cx="158" cy="148" rx="140" ry="146" fill={`url(#aura-${uid})`} opacity={0.3 + 0.7 * overall} className={overall > 0.05 ? 'brain-pulse' : undefined} />

      {/* голова-голограмма: полупрозрачная заливка, подсветка лица */}
      <path d={HEAD} fill={`url(#head-${uid})`} />
      <path d={HEAD} fill={`url(#face-${uid})`} />
      <g clipPath={`url(#headclip-${uid})`} fill="none" stroke="#7fd4ff" strokeLinecap="round" opacity="0.5">
        <path d="M58 146 C64 142 72 142 78 146" strokeWidth="1.4" />{/* веко */}
        <path d="M60 150 C66 154 72 154 77 150" strokeWidth="1" opacity="0.7" />
        <path d="M54 126 C62 120 76 120 84 126" strokeWidth="1.2" opacity="0.6" />{/* бровь */}
        <path d="M182 160 C192 152 206 158 204 176 C202 192 192 200 184 194" strokeWidth="1.4" />{/* ухо */}
        <path d="M188 168 C194 164 200 170 196 180 C194 186 190 186 188 184" strokeWidth="1" opacity="0.6" />
      </g>
      <g clipPath={`url(#headclip-${uid})`} fill="none" stroke="#bfe9ff" strokeOpacity="0.22" strokeWidth="1.3" strokeLinecap="round" pointerEvents="none">
        {SKULL.map((d, i) => <path key={i} d={d} />)}
        {VERTEBRAE.map((d, i) => <path key={`v${i}`} d={d} fill="#bfe9ff" fillOpacity="0.05" />)}
      </g>

      {/* мозг */}
      <g transform={BRAIN_T}>
        <path d={VENTRICLE} fill="#9fd6ff" fillOpacity="0.14" stroke="#bfe9ff" strokeOpacity="0.45" strokeWidth="0.9" pointerEvents="none" />
        {ORDER.map((id) => {
          const t = intensity[id] ?? 0;
          const c = reg(id).color;
          const isCb = id === 'cerebellum';
          return (
            <g key={id}>
              {t > 0 && (
                <>
                  <path d={PATHS[id]} fill={c} opacity={(DEEP.includes(id) ? 0.4 : 0.25) + 0.6 * t} filter={`url(#glow2-${uid})`} className="brain-pulse" />
                  {t > 0.35 && <path d={PATHS[id]} fill={c} opacity={0.2 + 0.55 * t} filter={`url(#glow-${uid})`} className="brain-pulse" />}
                </>
              )}
              <path d={PATHS[id]} fill={regionColor(id, t)} fillOpacity={isCb ? 0.3 + 0.35 * t : DEEP.includes(id) ? 0.7 + 0.3 * t : 0.38 + 0.22 * t} />
              <path d={PATHS[id]} fill={`url(#vol-${uid})`} pointerEvents="none" />
              <g clipPath={`url(#clip-${id}-${uid})`} pointerEvents="none"><path d={PATHS[id]} fill="none" stroke="#000" strokeOpacity="0.2" strokeWidth="5" strokeLinejoin="round" /></g>
              {/* край доли светится её цветом, как у стекла (сильнее при развитии) */}
              <path d={PATHS[id]} fill="none" stroke={c} strokeOpacity={0.3 + 0.6 * t} strokeWidth="0.9" strokeLinejoin="round" pointerEvents="none" />
              {isCb && <g clipPath={`url(#clip-${id}-${uid})`} fill="none" stroke="#e6f6ff" strokeOpacity={0.45 + 0.4 * t} strokeWidth="1" pointerEvents="none">{FOLIA.map((d, i) => <path key={i} d={d} />)}</g>}
              {id === 'stem' && <g clipPath={`url(#clip-${id}-${uid})`} fill="none" stroke="#fff" strokeOpacity="0.25" strokeWidth="1" pointerEvents="none"><path d="M118 130 C121 145 120 158 119 170" /><path d="M126 132 C129 146 128 158 127 170" /></g>}
              {/* извилины коры: текстура поверх каждой доли коры (после неё рисуются мозжечок и лимбическая система) */}
              {id === 'temporal' && (
                <g clipPath={`url(#cortex-${uid})`} pointerEvents="none">
                  <image href="/brain/gyri-dark.png" x="0" y="0" width="240" height="182" preserveAspectRatio="none" opacity="0.5" />
                  <image href="/brain/gyri-light.png" x="0" y="0" width="240" height="182" preserveAspectRatio="none" opacity="0.85" />
                  <g fill="none" stroke="#050a18" strokeOpacity="0.6" strokeWidth="1.7" strokeLinecap="round">{FISSURES.map((d, i) => <path key={i} d={d} />)}</g>
                </g>
              )}
              {/* светящийся контур развитой доли */}
              {t > 0.3 && <path d={PATHS[id]} fill="none" stroke={c} strokeOpacity={0.45 + 0.5 * t} strokeWidth="1.1" strokeLinejoin="round" pointerEvents="none" />}
            </g>
          );
        })}
        {/* внутренние структуры просвечивают сквозь кору */}
        <path d={VENTRICLE} fill="none" stroke="#bfe9ff" strokeOpacity="0.28" strokeWidth="0.8" pointerEvents="none" />
        {DEEP.map((id) => {
          const t = intensity[id] ?? 0;
          const c = reg(id).color;
          return (
            <g key={`deep-${id}`} pointerEvents="none">
              {t > 0 && <path d={PATHS[id]} fill={c} opacity={0.2 + 0.5 * t} filter={`url(#glow-${uid})`} className="brain-pulse" />}
              <path d={PATHS[id]} fill={c} fillOpacity={0.08 + 0.3 * t} stroke={c} strokeOpacity={0.35 + 0.5 * t} strokeWidth="0.9" strokeDasharray={t > 0 ? undefined : '2 2'} />
            </g>
          );
        })}
        {HITS.map((id) => (
          <g key={`h-${id}`}>
            {hover === id && <path d={PATHS[id]} fill="none" stroke="#fff" strokeWidth="1.5" pointerEvents="none" />}
            <path d={PATHS[id]} fill="transparent" role="button" tabIndex={0} aria-label={`${reg(id).name}: ${reg(id).sphere}`} className="muscle-hit"
              onClick={() => onPick(id)} onMouseEnter={() => onHover(id)} onMouseLeave={() => onHover(null)} onFocus={() => onHover(id)} onBlur={() => onHover(null)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(id); } }} />
          </g>
        ))}
      </g>

      {/* стекло головы: блик и светящийся контур */}
      <path d={HEAD} fill={`url(#shine-${uid})`} pointerEvents="none" />
      <path d={HEAD} fill="none" stroke="#38bdf8" strokeWidth="7" opacity={0.35 * rim} filter={`url(#blur3-${uid})`} pointerEvents="none" />
      <path d={HEAD} fill="none" stroke="#9be4ff" strokeWidth="1.8" strokeOpacity={rim} strokeLinejoin="round" pointerEvents="none" />
    </svg>
  );
});

export function BrainLegend() {
  return (
    <div className="brain-legend" aria-hidden>
      {BRAIN_REGIONS.map((r) => (
        <span key={r.id}><i style={{ background: r.color, boxShadow: `0 0 8px ${r.color}` }} />{r.sphere}</span>
      ))}
    </div>
  );
}
