'use client';
import { Fragment } from 'react';
import { buildRules, type Block } from '@/lib/rulesContent';

/** Мини-разметка: **жирный** и `код`. */
function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return <>{parts.map((p, i) => (p.startsWith('**') ? <b key={i}>{p.slice(2, -2)}</b> : p.startsWith('`') ? <code key={i}>{p.slice(1, -1)}</code> : <Fragment key={i}>{p}</Fragment>))}</>;
}

function BlockView({ b }: { b: Block }) {
  if (typeof b === 'string') return <p><Inline text={b} /></p>;
  if ('list' in b) return <ul className="rules-list">{b.list.map((x, i) => <li key={i}><Inline text={x} /></li>)}</ul>;
  return (
    <div className="rules-table-wrap">
      <table className="rules-table">
        <thead><tr>{b.table.head.map((h) => <th key={h}>{h}</th>)}</tr></thead>
        <tbody>{b.table.rows.map((r, i) => <tr key={i}>{r.map((c, k) => <td key={k}><Inline text={c} /></td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

export default function Rules() {
  const sections = buildRules();
  return (
    <>
      <div className="row between wrapRow"><h1 className="title">📖 Правила игры</h1><button className="btn ghost sm" onClick={() => window.print()}>Печать</button></div>
      <section className="card">
        <p className="muted">Здесь описано, как всё работает: откуда берутся очки, уровни, сундуки, бои и награды. Числа берутся прямо из игры, поэтому они всегда актуальны. Нажмите на раздел, чтобы раскрыть.</p>
        <nav className="rules-toc">{sections.map((s) => <a key={s.id} href={`#${s.id}`}>{s.emoji} {s.title}</a>)}</nav>
      </section>
      {sections.map((s, i) => (
        <section key={s.id} id={s.id} className="card rules-sec">
          <details open={i === 0}>
            <summary><h2>{s.emoji} {s.title}</h2><small className="muted">{s.summary}</small></summary>
            <div className="rules-body">{s.blocks.map((b, k) => <BlockView key={k} b={b} />)}</div>
          </details>
        </section>
      ))}
    </>
  );
}
