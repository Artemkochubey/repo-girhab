'use client';
import { useState } from 'react';

export const Bar = ({ value, max, color = 'var(--accent)', label }: { value: number; max: number; color?: string; label?: string }) => (
  <div className="bar" role="progressbar" aria-valuenow={value} aria-valuemax={max}>
    <div style={{ width: `${Math.min(100, max ? (value / max) * 100 : 0)}%`, background: color }} />
    {label && <span>{label}</span>}
  </div>
);

export function Chips({ values, unit = 'мин', onPick }: { values: number[]; unit?: string; onPick: (n: number) => void }) {
  const [custom, setCustom] = useState('');
  return (
    <div className="row wrapRow">
      {values.map((v) => <button key={v} className="btn" onClick={() => onPick(v)}>+{v} {unit}</button>)}
      <form className="row" onSubmit={(e) => { e.preventDefault(); const n = Number(custom); if (n > 0) { onPick(n); setCustom(''); } }}>
        <input className="num" inputMode="numeric" value={custom} onChange={(e) => setCustom(e.target.value.replace(/\D/g, ''))} placeholder="своё" />
        <button className="btn ghost" disabled={!custom}>＋</button>
      </form>
    </div>
  );
}

export function Radar({ data }: { data: { key: string; value: number }[] }) {
  const max = Math.max(50, ...data.map((d) => d.value));
  const n = data.length, R = 90, c = 120;
  const pt = (i: number, r: number) => [c + r * Math.sin((2 * Math.PI * i) / n), c - r * Math.cos((2 * Math.PI * i) / n)];
  const poly = data.map((d, i) => pt(i, (d.value / max) * R).join(',')).join(' ');
  return (
    <svg viewBox="-28 -4 296 252" className="radar" role="img" aria-label="Характеристики героя">
      {[0.33, 0.66, 1].map((k) => <polygon key={k} points={data.map((_, i) => pt(i, R * k).join(',')).join(' ')} className="grid-line" />)}
      {data.map((_, i) => <line key={i} x1={c} y1={c} x2={pt(i, R)[0]} y2={pt(i, R)[1]} className="grid-line" />)}
      <polygon points={poly} className="radar-area" />
      {data.map((d, i) => { const [x, y] = pt(i, R + 18); return <text key={d.key} x={x} y={y} textAnchor="middle" dominantBaseline="middle">{d.key}<tspan x={x} dy="12" className="val">{d.value}</tspan></text>; })}
    </svg>
  );
}

export const Section = ({ title, children, right }: { title: string; children: React.ReactNode; right?: React.ReactNode }) => (
  <section className="card"><div className="row between"><h2>{title}</h2>{right}</div>{children}</section>
);

/** Сворачиваемый блок-карточка: заголовок виден всегда, содержимое открывается по нажатию. */
export const Fold = ({ title, children, right, open = false }: { title: string; children: React.ReactNode; right?: React.ReactNode; open?: boolean }) => (
  <details className="card fold" open={open}>
    <summary><h2>{title}</h2>{right && <span className="fold-r">{right}</span>}</summary>
    <div className="fold-body">{children}</div>
  </details>
);

/** Группа карточек под одной кнопкой-заголовком (внутри обычные карточки). */
export const FoldGroup = ({ title, hint, children, open = false }: { title: string; hint?: string; children: React.ReactNode; open?: boolean }) => (
  <details className="fold-group" open={open}>
    <summary><b>{title}</b>{hint && <small className="muted">{hint}</small>}</summary>
    <div className="fold-stack">{children}</div>
  </details>
);
