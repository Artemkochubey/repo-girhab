'use client';
import { memo, useId, useMemo } from 'react';
import { ANATOMY, type Shape } from '@/lib/anatomy-data';
import { muscleName, type MuscleId } from '@/lib/game/muscles';

type Pt = [number, number];

/** Сглаживание многоугольника (алгоритм Чайкина): убирает «угловатость», форма становится органичной. */
function smooth(points: string, iterations = 2): string {
  const n = points.trim().split(/\s+/).map(Number);
  let p: Pt[] = [];
  for (let i = 0; i + 1 < n.length; i += 2) p.push([n[i], n[i + 1]]);
  for (let it = 0; it < iterations; it++) {
    const out: Pt[] = [];
    for (let i = 0; i < p.length; i++) {
      const a = p[i], b = p[(i + 1) % p.length];
      out.push([0.75 * a[0] + 0.25 * b[0], 0.75 * a[1] + 0.25 * b[1]], [0.25 * a[0] + 0.75 * b[0], 0.25 * a[1] + 0.75 * b[1]]);
    }
    p = out;
  }
  return 'M' + p.map(([x, y]) => `${x.toFixed(2)} ${y.toFixed(2)}`).join('L') + 'Z';
}

interface Extra { cx: number; cy: number; rx: number; ry: number; rot: number }

interface Limb { kind: 'hand' | 'foot'; x: number; y: number; rot: number; flip: 1 | -1 }

/** Недостающие части тела строятся по геометрии контуров: голова и шея — овалы, кисти и стопы — отдельные детальные формы. */
function bodyExtras(shapes: Shape[]): { ovals: Extra[]; limbs: Limb[]; bottom: number } {
  const pts = (s: Shape): Pt[] => { const n = s.p.trim().split(/\s+/).map(Number); const r: Pt[] = []; for (let i = 0; i + 1 < n.length; i += 2) r.push([n[i], n[i + 1]]); return r; };
  const ovals: Extra[] = [];
  const limbs: Limb[] = [];
  const head = shapes.find((s) => s.m === null && pts(s).every(([, y]) => y < 35));
  if (head) {
    const h = pts(head), xs = h.map((q) => q[0]), ys = h.map((q) => q[1]);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2, w = Math.max(...xs) - Math.min(...xs), bottom = Math.max(...ys);
    ovals.push({ cx, cy: bottom + 0.5, rx: w * 0.24, ry: 4.6, rot: 0 });                       // шея
    ovals.push({ cx, cy: (Math.min(...ys) + bottom) / 2, rx: w * 0.46, ry: (bottom - Math.min(...ys)) * 0.52, rot: 0 }); // голова
  }
  for (const side of [0, 1] as const) {
    const flip: 1 | -1 = side === 0 ? 1 : -1;
    const arm = shapes.filter((s) => s.m === 'forearms').flatMap(pts).filter(([x]) => (side === 0 ? x < 50 : x >= 50));
    if (arm.length) {                                                                         // кисть продолжает предплечье
      const end = arm.reduce((a, b) => (b[1] > a[1] ? b : a));
      const start = arm.reduce((a, b) => (b[1] < a[1] ? b : a));
      const ang = Math.atan2(end[1] - start[1], end[0] - start[0]);
      limbs.push({ kind: 'hand', x: end[0] - Math.cos(ang) * 1.4, y: end[1] - Math.sin(ang) * 1.4, rot: (ang * 180) / Math.PI - 90, flip });
    }
    const leg = shapes.filter((s) => s.m === 'calves').flatMap(pts).filter(([x]) => (side === 0 ? x < 50 : x >= 50));
    if (leg.length) {                                                                         // стопа под голенью, носок чуть наружу
      const low = leg.reduce((a, b) => (b[1] > a[1] ? b : a));
      limbs.push({ kind: 'foot', x: low[0] + (side === 0 ? -0.4 : 0.4), y: low[1] - 1.2, rot: side === 0 ? -9 : 9, flip });
    }
  }
  // нижняя граница рисунка: самая низкая точка фигуры, включая стопы (длина стопы ≈ 12 × масштаб 1,25)
  const bottom = Math.max(204, ...shapes.flatMap(pts).map((q) => q[1]), ...limbs.filter((l) => l.kind === 'foot').map((l) => l.y + 12 * 1.25 + 2));
  return { ovals, limbs, bottom };
}

// Кисть: ладонь, четыре пальца веером и большой палец (локальные координаты: запястье в (0,0), пальцы вниз, большой палец слева)
const PALM = 'M-2.6 -0.5 C-3.1 1.8 -3.2 3.8 -2.8 5.4 L2.8 5.4 C3.2 3.8 3.1 1.8 2.6 -0.5 Z';
const FINGERS: [number, number, number, number][] = [[-1.95, 5, -2.5, 9.1], [-0.65, 5.2, -0.7, 9.9], [0.65, 5.2, 0.9, 9.3], [1.95, 5, 2.7, 7.9]];
const THUMB: [number, number, number, number] = [-2.4, 1.2, -4.5, 5.1];
// Стопа спереди: пятка, свод, пять пальцев (большой — на внутренней стороне, справа)
const FOOT_FRONT = 'M-2.7 0 C-3.3 3 -4.4 6.2 -4.6 8.8 C-4.7 10.6 -3.2 11.4 -1.4 11.4 L2.4 11.4 C4.3 11.4 5.2 10.4 4.9 8.6 C4.5 5.6 3.5 3 2.7 0 Z';
const TOES: [number, number, number, number][] = [[3.3, 11.9, 1.55, 1.2], [1.5, 12.1, 1.1, 1], [-0.2, 12, 1, 0.95], [-1.8, 11.8, 0.9, 0.9], [-3.3, 11.5, 0.8, 0.85]];
// Стопа сзади: пятка и сухожилие
const FOOT_BACK = 'M-3 0 C-3.9 3 -3.9 7 -2.6 9.6 C-1.4 11.4 1.4 11.4 2.6 9.6 C3.9 7 3.9 3 3 0 Z';

const HAND_FILL = '#3a3160', HAND_LINE = '#7f73bd';
function Limbs({ limbs, view }: { limbs: Limb[]; view: 'front' | 'back' }) {
  return (
    <>
      {limbs.map((l, i) => (
        <g key={i} transform={`translate(${l.x} ${l.y}) rotate(${l.rot}) scale(${l.flip * (l.kind === 'hand' ? 1.5 : 1.25)} ${l.kind === 'hand' ? 1.5 : 1.25})`}>
          {l.kind === 'hand' ? (
            <>
              <g fill="none" stroke={HAND_LINE} strokeOpacity="0.55" strokeLinecap="round" strokeLinejoin="round">
                {FINGERS.map(([x1, y1, x2, y2], k) => <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="2.2" />)}
                <line x1={THUMB[0]} y1={THUMB[1]} x2={THUMB[2]} y2={THUMB[3]} strokeWidth="2.6" />
                <path d={PALM} strokeWidth="0.9" />
              </g>
              <g strokeLinecap="round" strokeLinejoin="round">
                {FINGERS.map(([x1, y1, x2, y2], k) => <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} stroke={HAND_FILL} strokeWidth="1.35" />)}
                <line x1={THUMB[0]} y1={THUMB[1]} x2={THUMB[2]} y2={THUMB[3]} stroke={HAND_FILL} strokeWidth="1.7" />
                <path d={PALM} fill={HAND_FILL} stroke={HAND_FILL} strokeWidth="0.4" />
              </g>
              <path d="M-1.2 2.5 C-0.4 3.6 0.8 3.6 1.4 2.4" fill="none" stroke={HAND_LINE} strokeOpacity="0.35" strokeWidth="0.45" />
            </>
          ) : view === 'front' ? (
            <>
              <path d={FOOT_FRONT} fill={HAND_FILL} stroke={HAND_LINE} strokeOpacity="0.55" strokeWidth="0.6" strokeLinejoin="round" />
              {TOES.map(([cx, cy, rx, ry], k) => <ellipse key={k} cx={cx} cy={cy} rx={rx} ry={ry} fill={HAND_FILL} stroke={HAND_LINE} strokeOpacity="0.55" strokeWidth="0.5" />)}
              <path d="M-1 3 C0 5.5 1.4 6.4 2.8 6.2" fill="none" stroke={HAND_LINE} strokeOpacity="0.3" strokeWidth="0.45" />
            </>
          ) : (
            <>
              <path d={FOOT_BACK} fill={HAND_FILL} stroke={HAND_LINE} strokeOpacity="0.55" strokeWidth="0.6" strokeLinejoin="round" />
              <path d="M-1.4 0.5 C-1.8 4 -1.6 7 -0.8 9.4 M1.4 0.5 C1.8 4 1.6 7 0.8 9.4" fill="none" stroke={HAND_LINE} strokeOpacity="0.3" strokeWidth="0.5" />
            </>
          )}
        </g>
      ))}
    </>
  );
}

const isHead = (s: Shape) => s.m === null && s.p.trim().split(/\s+/).map(Number).filter((_, k) => k % 2).every((y) => y < 35);

const REST = [0x4a, 0x3f, 0x73];                               // мышца без нагрузки
const STOPS: { t: number; c: number[] }[] = [                   // чем больше нагрузка, тем краснее
  { t: 0, c: [0x9a, 0x55, 0x78] }, { t: 0.5, c: [0xc9, 0x35, 0x4c] }, { t: 1, c: [0xff, 0x14, 0x24] },
];
export function loadColor(t: number): string {
  if (t <= 0) return `rgb(${REST.join(',')})`;
  const x = Math.min(1, t);
  const hi = STOPS.findIndex((s) => s.t >= x);
  const a = STOPS[Math.max(0, hi - 1)], b = STOPS[hi === -1 ? STOPS.length - 1 : hi];
  const k = b.t === a.t ? 0 : (x - a.t) / (b.t - a.t);
  return `rgb(${a.c.map((v, i) => Math.round(v + (b.c[i] - v) * k)).join(',')})`;
}

interface Props {
  view: 'front' | 'back';
  intensity: Record<MuscleId, number>;
  selected: Set<MuscleId>;
  hover: MuscleId | null;
  onPick: (m: MuscleId) => void;
  onHover: (m: MuscleId | null) => void;
}

export const BodyFigure = memo(function BodyFigure({ view, intensity, selected, hover, onPick, onHover }: Props) {
  const uid = useId().replace(/:/g, '');
  const shapes = useMemo(() => (view === 'front' ? ANATOMY.front : ANATOMY.back).map((s: Shape) => ({ ...s, d: smooth(s.p) })), [view]);
  const base = useMemo(() => shapes.filter((s) => !isHead(s)), [shapes]);
  const extras = useMemo(() => bodyExtras(view === 'front' ? ANATOMY.front : ANATOMY.back), [view]);
  const skin = '#2b2347';
  const part = (e: Extra, i: number, fill: string, extra: object = {}) => <ellipse key={i} cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} transform={`rotate(${e.rot} ${e.cx} ${e.cy})`} fill={fill} {...extra} />;

  return (
    <svg viewBox={`-3 -2 106 ${extras.bottom + 4}`} className="figure" role="group" aria-label={view === 'front' ? 'Вид спереди' : 'Вид сзади'}>
      <defs>
        <linearGradient id={`vol-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.38" />
        </linearGradient>
        <filter id={`glow-${uid}`} x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="0.9" /></filter>
      </defs>

      {/* голова, шея, кисти и стопы */}
      <g stroke="#6f62a8" strokeOpacity="0.45" strokeWidth="0.5">{extras.ovals.map((e, i) => part(e, i, '#3a3160'))}</g>
      <Limbs limbs={extras.limbs} view={view} />

      {/* силуэт тела: подложка, склеивающая все контуры */}
      <g fill={skin} stroke={skin} strokeWidth="3.2" strokeLinejoin="round">{base.map((s, i) => <path key={i} d={s.d} />)}</g>
      <g fill="none" stroke="#6f62a8" strokeWidth="3.9" strokeLinejoin="round" opacity="0.35">{base.map((s, i) => <path key={i} d={s.d} />)}</g>
      <g fill={skin} stroke={skin} strokeWidth="3" strokeLinejoin="round">{base.map((s, i) => <path key={i} d={s.d} />)}</g>

      {/* мышцы */}
      {shapes.map((s, i) => {
        if (!s.m) return isHead(s) ? null : <path key={i} d={s.d} fill="#3a3160" stroke="#1b1530" strokeWidth="0.4" />;
        const t = intensity[s.m] ?? 0;
        const isSel = selected.has(s.m);
        return (
          <g key={i}>
            <path d={s.d} fill={loadColor(t)} stroke="#1b1530" strokeWidth="0.45" strokeLinejoin="round" />
            <path d={s.d} fill={`url(#vol-${uid})`} pointerEvents="none" />
            {(isSel || hover === s.m) && (
              <path d={s.d} fill="none" stroke={isSel ? '#ffd24a' : '#fff'} strokeWidth={isSel ? 1.1 : 0.7} strokeLinejoin="round" pointerEvents="none" filter={isSel ? `url(#glow-${uid})` : undefined} />
            )}
            {isSel && <path d={s.d} fill="none" stroke="#ffd24a" strokeWidth="0.7" strokeLinejoin="round" pointerEvents="none" />}
            <path d={s.d} fill="transparent" role="button" tabIndex={0} aria-label={muscleName(s.m)} aria-pressed={isSel} className="muscle-hit"
              onClick={() => onPick(s.m!)} onMouseEnter={() => onHover(s.m)} onMouseLeave={() => onHover(null)} onFocus={() => onHover(s.m)} onBlur={() => onHover(null)}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onPick(s.m!); } }} />
          </g>
        );
      })}
    </svg>
  );
});

export function LoadLegend() {
  return (
    <div className="legend" aria-hidden>
      <span>меньше</span>
      <i style={{ background: `linear-gradient(90deg, ${loadColor(0)}, ${loadColor(0.01)}, ${loadColor(0.5)}, ${loadColor(1)})` }} />
      <span>больше нагрузки</span>
    </div>
  );
}
