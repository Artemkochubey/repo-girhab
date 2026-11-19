'use client';
import { useMemo, useState } from 'react';
import {
  DIRECTIONS, FAMILY_NAME, FAMILY_NOTE, MAX_RANK, PEAK_DIR, PEAK_LEVEL, PEAK_NAME, PEAK_NEED, TALENTS,
  canBuyTalent, directionPoints, rankOf, tierNeed, type Talent,
} from '@/lib/game/talents';
import type { Cls } from '@/lib/game/classes';

/** Значок таланта по его эффекту и сфере. */
function icon(t: Talent): string {
  const e = t.effect;
  switch (e.type) {
    case 'mult': { const sp = e.spheres[0]; return ({ workout: '💪', warmup: '🌅', book: '📖', Книги: '📖', Языки: '🗣', Учёба: '🎓', Навыки: '🛠', Творчество: '🎨', Мышление: '🧩', habits: '📅' } as Record<string, string>)[sp] ?? '⭐'; }
    case 'flat': return '⚡';
    case 'all': return '✨';
    case 'boss': return '🗡';
    case 'weak': return '🎯';
    case 'luck': return e.legend ? '💎' : '🍀';
    case 'streak': return '🔥';
    case 'shield': return '🛡';
    case 'weekend': return '🎉';
    case 'over': return '🚀';
    case 'milestone': return '🏁';
    case 'streakAll': return '♾';
    case 'quest': return '📜';
    case 'shop': return '🪙';
    case 'double': return '🎁';
    case 'aura': return '🚩';
  }
}

interface Node { t: Talent; x: number; y: number }
const R = 18;

/** Узлы одного направления: ярус 1 внизу, развилка a/b, ярус 4 вверху. */
function layout(group: Talent['cls'], dir: number, cx: number, ys: Record<number, number>, dx: number): Node[] {
  return TALENTS.filter((t) => t.cls === group && t.dir === dir).map((t) => ({
    t, y: ys[t.tier], x: t.branch === 'a' ? cx - dx : t.branch === 'b' ? cx + dx : cx,
  }));
}

/** Кривая между узлами (вертикальная с плавным изгибом). */
const link = (a: Node, b: Node) => { const my = (a.y + b.y) / 2; return `M${a.x} ${a.y - R} C${a.x} ${my}, ${b.x} ${my}, ${b.x} ${b.y + R}`; };

interface Props { cls: Cls; talents: string[]; level: number; onBuy: (id: string) => void }

export function TalentTree({ cls, talents, level, onBuy }: Props) {
  const [sel, setSel] = useState<string | null>(null);
  const info = (t: Talent) => {
    const rank = rankOf(talents, t.id);
    const can = canBuyTalent(t.id, talents, cls, level);
    const locked = level < t.unlock;
    const state: 'owned' | 'max' | 'open' | 'locked' = rank >= t.maxRank ? 'max' : can.ok ? (rank ? 'owned' : 'open') : rank ? 'owned' : 'locked';
    return { rank, can, locked, state };
  };

  const classNodes = useMemo(() => {
    const ys = { 1: 372, 2: 292, 3: 212, 4: 132 } as Record<number, number>;
    return [0, 1, 2].map((d) => ({ d, cx: 60 + d * 120, nodes: layout(cls, d, 60 + d * 120, ys, 38) }));
  }, [cls]);
  const peak = TALENTS.find((t) => t.cls === cls && t.tier === 5)!;
  const peakNode: Node = { t: peak, x: 180, y: 38 };
  const famNodes = useMemo(() => layout('f', 0, 180, { 1: 200, 2: 120, 3: 40 }, 62), []);

  const all = [...classNodes.flatMap((c) => c.nodes), peakNode, ...famNodes];
  const cur = sel ? all.find((n) => n.t.id === sel)?.t ?? null : null;

  const owned = (t: Talent) => rankOf(talents, t.id) > 0;
  /** Рёбра: от нижнего узла к верхнему внутри направления. */
  const edges = (nodes: Node[]) => {
    const out: [Node, Node][] = [];
    for (const up of nodes) {
      if (up.t.tier === 1) continue;
      for (const low of nodes) {
        if (low.t.tier !== up.t.tier - 1) continue;
        if (up.t.branch && low.t.branch && up.t.branch !== low.t.branch) continue;
        out.push([low, up]);
      }
    }
    return out;
  };

  const NodeView = ({ n }: { n: Node }) => {
    const { rank, state } = info(n.t);
    const isPeak = n.t.tier === 5;
    const r = isPeak ? 22 : R;
    const blockedBranch = state === 'locked' && !!n.t.branch && TALENTS.some((o) => o.cls === n.t.cls && o.dir === n.t.dir && o.branch && o.branch !== n.t.branch && owned(o));
    return (
      <g className={`tn ${state} ${blockedBranch ? 'blocked' : ''} ${cur?.id === n.t.id ? 'sel' : ''}`} transform={`translate(${n.x} ${n.y})`} onClick={() => setSel(n.t.id)} role="button" aria-label={n.t.name}>
        <circle className="tn-halo" r={r + 6} />
        <circle className="tn-ring" r={r} />
        <text className="tn-ico" textAnchor="middle" dominantBaseline="central" fontSize={isPeak ? 22 : 17}>{state === 'locked' && level < n.t.unlock ? '🔒' : isPeak && state === 'locked' ? '⛰' : icon(n.t)}</text>
        {Array.from({ length: n.t.maxRank }, (_, i) => (
          <circle key={i} className={`tn-pip ${i < rank ? 'on' : ''}`} r={2.6} cx={(i - (n.t.maxRank - 1) / 2) * 8} cy={r + 8} />
        ))}
      </g>
    );
  };

  const Edge = ({ a, b }: { a: Node; b: Node }) => (
    <path className={`te ${owned(b.t) ? 'on' : owned(a.t) && info(b.t).state === 'open' ? 'next' : ''}`} d={link(a, b)} />
  );

  const detail = cur && (() => {
    const { rank, can, state } = info(cur);
    const group = cur.cls === 'f' ? FAMILY_NAME : cur.tier === 5 ? PEAK_NAME : DIRECTIONS[cls][cur.dir].name;
    const lock = level < cur.unlock ? `Откроется на ${cur.unlock} уровне` : null;
    return (
      <div className={`tt-detail ${state}`}>
        <div className="row"><span className="tt-big">{icon(cur)}</span>
          <div className="grow"><b>{cur.name}</b> <small className="muted">{group}{cur.branch ? ` · подветка ${cur.branch === 'a' ? 'A' : 'B'}` : ''} · ярус {cur.tier}</small>
            <div>{cur.text}</div></div></div>
        <div className="tt-ranks">{Array.from({ length: cur.maxRank }, (_, i) => <i key={i} className={i < rank ? 'on' : ''} />)} <small className="muted">ранг {rank} из {cur.maxRank} · {cur.cost} {cur.cost === 1 ? 'очко' : 'очка'} за ранг</small></div>
        {can.ok
          ? <button className="btn" onClick={() => onBuy(cur.id)}>Прокачать ({cur.cost} оч.)</button>
          : <p className="muted small">{rank >= cur.maxRank ? 'Максимальный ранг ✔' : lock ?? can.reason}</p>}
      </div>
    );
  })();

  return (
    <div className="tt">
      <p className="muted small">Дерево растёт вверх: ствол направления делится на две подветки (берётся одна), потом они сходятся. Нажмите на талант, чтобы прочитать и прокачать. Каждый ранг даёт небольшой бонус, 1 очко за ранг. Ярусы 2, 3 и 4 открываются при 2, 4 и 6 очках в направлении.</p>
      <svg className="tt-svg" viewBox="-8 0 376 470" role="group" aria-label="Дерево талантов">
        <g className="tt-edges">
          {classNodes.map((c) => edges(c.nodes).map(([a, b]) => <Edge key={a.t.id + b.t.id} a={a} b={b} />))}
          {classNodes.map((c) => { const top = c.nodes.find((n) => n.t.tier === 4)!; return <path key={'p' + c.d} className={`te peak ${directionPoints(talents, cls, c.d) >= PEAK_NEED ? 'next' : ''}`} d={`M${top.x} ${top.y - R} C${top.x} ${(top.y + peakNode.y) / 2}, ${peakNode.x} ${(top.y + peakNode.y) / 2}, ${peakNode.x} ${peakNode.y + 22}`} />; })}
        </g>
        {classNodes.map((c) => (
          <g key={c.d}>
            {c.nodes.map((n) => <NodeView key={n.t.id} n={n} />)}
            <text className="tt-dir" x={c.cx} y={425} textAnchor="middle">{DIRECTIONS[cls][c.d].name}</text>
            <text className="tt-pts" x={c.cx} y={443} textAnchor="middle">{directionPoints(talents, cls, c.d)} оч.</text>
          </g>
        ))}
        <NodeView n={peakNode} />
        <text className="tt-peak" x={180} y={8} textAnchor="middle">{PEAK_NAME} · с {PEAK_LEVEL} ур., {PEAK_NEED} оч. в ветке</text>
      </svg>
      <div className="tt-notes">{[0, 1, 2].map((d) => <small key={d} className="muted"><b>{DIRECTIONS[cls][d].name}:</b> {DIRECTIONS[cls][d].note}</small>)}</div>

      <h3 className="tt-fam">{FAMILY_NAME} <small className="muted">· {directionPoints(talents, cls, 0, 'f')} оч.</small></h3>
      <p className="muted small">{FAMILY_NOTE}.</p>
      <svg className="tt-svg fam" viewBox="-8 0 376 240" role="group" aria-label="Семейная ветка">
        <g className="tt-edges">{edges(famNodes).map(([a, b]) => <Edge key={a.t.id + b.t.id} a={a} b={b} />)}</g>
        {famNodes.map((n) => <NodeView key={n.t.id} n={n} />)}
      </svg>
      {detail ?? <p className="muted small tt-hint">👆 Нажмите на талант, чтобы увидеть описание.</p>}
    </div>
  );
}
