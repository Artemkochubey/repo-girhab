import type { MuscleId } from './game/muscles';

type Pt = [number, number];

const parse = (points: string): Pt[] => {
  const n = points.trim().split(/\s+/).map(Number);
  const out: Pt[] = [];
  for (let i = 0; i + 1 < n.length; i += 2) out.push([n[i], n[i + 1]]);
  return out;
};
const f = (x: number) => x.toFixed(2);

/**
 * Рисунок мышечных волокон для контура мышцы: линии идут так, как идут волокна настоящей мышцы.
 * Длинные мышцы (бицепс, квадрицепс, голень) — веретеном вдоль оси, широкие (грудь, трапеция, дельта,
 * широчайшая, ягодичная) — веером от точки прикрепления, пресс — вертикальные волокна и поперечные сухожильные перемычки.
 * Линии длиннее контура: в рисунке их обрезает clipPath по форме мышцы.
 */
export interface Fibres { fibres: string; tendons: string }

type Kind = 'long' | 'fan' | 'fanIn' | 'abs';
const KIND: Record<MuscleId, Kind> = {
  chest: 'fan', traps: 'fan', lats: 'fan', glutes: 'fan', shoulders: 'fanIn',
  abs: 'abs',
  biceps: 'long', triceps: 'long', forearms: 'long', quads: 'long', hamstrings: 'long', calves: 'long',
  obliques: 'long', lower_back: 'long', adductors: 'long', abductors: 'long',
} as Record<MuscleId, Kind>;

function longFibres(pts: Pt[], spacing: number): string {
  const c = centroid(pts);
  // главная ось по методу главных компонент
  let sxx = 0, syy = 0, sxy = 0;
  for (const [x, y] of pts) { sxx += (x - c[0]) ** 2; syy += (y - c[1]) ** 2; sxy += (x - c[0]) * (y - c[1]); }
  const ang = 0.5 * Math.atan2(2 * sxy, sxx - syy);
  const u: Pt = [Math.cos(ang), Math.sin(ang)], v: Pt = [-u[1], u[0]];
  const proj = (p: Pt, a: Pt) => (p[0] - c[0]) * a[0] + (p[1] - c[1]) * a[1];
  const L = Math.max(...pts.map((p) => Math.abs(proj(p, u)))) * 1.08;
  const W = Math.max(...pts.map((p) => Math.abs(proj(p, v))));
  const n = Math.max(5, Math.min(13, Math.round((W * 2) / spacing)));
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const s = n === 1 ? 0 : (i / (n - 1)) * 2 - 1;               // -1..1 поперёк мышцы
    const e = W * s * 0.38, m = W * s * 1.3;                     // концы сходятся, середина шире: веретено
    const p0: Pt = [c[0] - u[0] * L + v[0] * e, c[1] - u[1] * L + v[1] * e];
    const p1: Pt = [c[0] + u[0] * L + v[0] * e, c[1] + u[1] * L + v[1] * e];
    const q: Pt = [c[0] + v[0] * m, c[1] + v[1] * m];
    out.push(`M${f(p0[0])} ${f(p0[1])}Q${f(q[0])} ${f(q[1])} ${f(p1[0])} ${f(p1[1])}`);
  }
  return out.join('');
}

function fanFibres(pts: Pt[], spacing: number, converge: 'near' | 'far'): string {
  const c = centroid(pts);
  const mid = (p: Pt) => Math.abs(p[0] - 50);
  const o = pts.reduce((a, b) => ((converge === 'near' ? mid(b) < mid(a) : mid(b) > mid(a)) ? b : a));   // точка прикрепления
  const base = Math.atan2(c[1] - o[1], c[0] - o[0]);
  const norm = (a: number) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
  const diffs = pts.filter((p) => p !== o).map((p) => norm(Math.atan2(p[1] - o[1], p[0] - o[0]) - base));
  const lo = Math.min(...diffs), hi = Math.max(...diffs);
  const R = Math.max(...pts.map((p) => Math.hypot(p[0] - o[0], p[1] - o[1]))) * 1.1;
  const n = Math.max(6, Math.min(14, Math.round((R * (hi - lo)) / spacing)));
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    const a = base + lo + ((hi - lo) * i) / (n - 1);
    const end: Pt = [o[0] + Math.cos(a) * R, o[1] + Math.sin(a) * R];
    const bend = (i / (n - 1) - 0.5) * 0.1 * R;                  // лёгкий изгиб веера
    const q: Pt = [o[0] + Math.cos(a) * R * 0.55 - Math.sin(a) * bend, o[1] + Math.sin(a) * R * 0.55 + Math.cos(a) * bend];
    out.push(`M${f(o[0])} ${f(o[1])}Q${f(q[0])} ${f(q[1])} ${f(end[0])} ${f(end[1])}`);
  }
  return out.join('');
}

function absLines(pts: Pt[]): Fibres {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
  const x0 = Math.min(...xs) - 1, x1 = Math.max(...xs) + 1, y0 = Math.min(...ys), y1 = Math.max(...ys);
  const xc = (x0 + x1) / 2;
  const fibres: string[] = [];
  for (let i = 0; i < 5; i++) {                                    // вертикальные волокна прямой мышцы
    const x = x0 + ((x1 - x0) * (i + 0.5)) / 5;
    fibres.push(`M${f(x)} ${f(y0 - 1)}Q${f(x + (xc - x) * 0.25)} ${f((y0 + y1) / 2)} ${f(x)} ${f(y1 + 1)}`);
  }
  const tendons: string[] = [];
  for (const k of [0.27, 0.52, 0.76]) {                            // поперечные сухожильные перемычки («кубики»)
    const y = y0 + (y1 - y0) * k;
    tendons.push(`M${f(x0)} ${f(y)}Q${f(xc)} ${f(y + 0.9)} ${f(x1)} ${f(y)}`);
  }
  return { fibres: fibres.join(''), tendons: tendons.join('') };
}

const centroid = (pts: Pt[]): Pt => [pts.reduce((a, p) => a + p[0], 0) / pts.length, pts.reduce((a, p) => a + p[1], 0) / pts.length];

export function muscleFibres(points: string, muscle: MuscleId): Fibres {
  const pts = parse(points);
  if (pts.length < 3) return { fibres: '', tendons: '' };
  switch (KIND[muscle] ?? 'long') {
    case 'abs': return absLines(pts);
    case 'fan': return { fibres: fanFibres(pts, 1.1, 'near'), tendons: '' };
    case 'fanIn': return { fibres: fanFibres(pts, 1.0, 'far'), tendons: '' };
    default: return { fibres: longFibres(pts, 0.95), tendons: '' };
  }
}
