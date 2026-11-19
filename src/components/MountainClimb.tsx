'use client';
import { memo, useId } from 'react';
import { RANKS, rankFor } from '@/lib/game/ranks';

// Точки этапов на тропе: серпантин от подножия к вершине, дальше — путь по облакам и звёздам
const STAGES: [number, number][] = [
  [52, 396], [128, 374], [84, 342], [156, 316], [104, 280], [178, 252],
  [138, 214], [160, 150], [214, 104], [258, 72], [298, 46], [334, 22],
];
// Подписи: слева или справа от точки
const LABEL_LEFT = [false, false, true, false, true, false, true, true, true, true, true, true];

const MOUNTAIN = 'M0 430 L0 372 L36 340 L74 292 L112 236 L140 188 L160 140 L178 162 L214 98 L246 142 L280 196 L318 262 L360 318 L360 430 Z';
const FAR = 'M0 330 L38 270 L70 300 L118 220 L150 262 L200 200 L246 236 L300 170 L360 236 L360 430 L0 430 Z';
const SNOW = ['M160 140 L150 160 L158 158 L166 168 L172 156 L178 162 Z', 'M214 98 L196 128 L206 124 L214 134 L222 122 L232 128 L246 142 Z'];
const GLACIER = 'M232 128 C246 150 258 176 276 196 C262 204 246 196 236 182 C226 166 222 146 232 128 Z';
const TREES = Array.from({ length: 16 }, (_, i) => 6 + i * 22 + (i % 2) * 6);

/** Путь по точкам (плавные дуги между этапами). */
const trail = (pts: [number, number][]) => pts.map(([x, y], i) => (i === 0 ? `M${x} ${y}` : `Q${(pts[i - 1][0] + x) / 2 + (i % 2 ? 16 : -16)} ${(pts[i - 1][1] + y) / 2} ${x} ${y}`)).join(' ');

export interface Climber { id: number; emoji: string; color: string; level: number; xp?: number; me?: boolean; name: string }

/** Позиция героя на тропе: между текущим этапом и следующим по прогрессу опыта. */
function position(level: number, xp?: number): [number, number] {
  const r = rankFor(level, xp);
  const a = STAGES[r.index], b = STAGES[Math.min(r.index + 1, STAGES.length - 1)];
  return [a[0] + (b[0] - a[0]) * r.progress, a[1] + (b[1] - a[1]) * r.progress];
}

export const MountainClimb = memo(function MountainClimb({ climbers, tv = false }: { climbers: Climber[]; tv?: boolean }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  // свой герой; если его нет (ТВ) — лидер семьи, до него светится тропа
  const me = climbers.find((c) => c.me) ?? [...climbers].sort((a, b) => (b.xp ?? 0) - (a.xp ?? 0) || b.level - a.level)[0];
  const myRank = rankFor(me?.level ?? 1, me?.xp);
  const reached = myRank.index;
  const reachedPath = trail(STAGES.slice(0, reached + 1).concat(myRank.next ? [position(me.level, me.xp)] : []));
  // расставляем героев, чтобы стоящие рядом не перекрывали друг друга
  const placed: { c: Climber; x: number; y: number }[] = [];
  for (const c of [...climbers].sort((a, b) => Number(!!a.me) - Number(!!b.me))) {
    let [x, y] = position(c.level, c.xp);
    while (placed.some((p) => Math.hypot(p.x - x, p.y - y) < (tv ? 24 : 15))) x += tv ? 22 : 14;
    placed.push({ c, x, y });
  }

  return (
    <svg viewBox="0 0 360 430" className={`mountain${tv ? ' m-tv' : ''}`} role="img" aria-label={`Восхождение: ${myRank.rank.name}`}>
      <defs>
        <linearGradient id={`sky-${uid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0b0820" /><stop offset="0.45" stopColor="#1d1846" /><stop offset="1" stopColor="#2b2350" /></linearGradient>
        <linearGradient id={`rock-${uid}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#5a5482" /><stop offset="0.5" stopColor="#3a3462" /><stop offset="1" stopColor="#241f44" /></linearGradient>
        <linearGradient id={`far-${uid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2c2754" /><stop offset="1" stopColor="#1b1738" /></linearGradient>
        <linearGradient id={`ice-${uid}`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#d6f3ff" stopOpacity="0.85" /><stop offset="1" stopColor="#6fc3ff" stopOpacity="0.5" /></linearGradient>
        <radialGradient id={`moon-${uid}`}><stop offset="0" stopColor="#fff7d6" /><stop offset="1" stopColor="#ffe08a" stopOpacity="0" /></radialGradient>
        <filter id={`glow-${uid}`} x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3" /></filter>
      </defs>

      {/* небо, звёзды, луна */}
      <rect width="360" height="430" fill={`url(#sky-${uid})`} rx="14" />
      {[[30, 30], [80, 60], [120, 20], [180, 40], [230, 18], [300, 90], [344, 70], [20, 110], [150, 80], [270, 120], [60, 150], [340, 140]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={i % 3 ? 1 : 1.6} fill="#fff" opacity={i % 2 ? 0.5 : 0.85} />
      ))}
      <circle cx="334" cy="22" r="20" fill={`url(#moon-${uid})`} opacity="0.5" />

      {/* дальние горы, основная гора, снег, ледник, утёс, лес */}
      <path d={FAR} fill={`url(#far-${uid})`} />
      <path d={MOUNTAIN} fill={`url(#rock-${uid})`} />
      <path d="M214 98 L246 142 L280 196 L318 262 L360 318 L360 430 L250 430 L232 300 L224 200 Z" fill="#000" opacity="0.22" />{/* теневая сторона */}
      <path d={GLACIER} fill={`url(#ice-${uid})`} />
      {SNOW.map((d, i) => <path key={i} d={d} fill="#eef6ff" opacity="0.92" />)}
      <g stroke="#1a1533" strokeOpacity="0.55" strokeWidth="1.2">{[0, 1, 2, 3].map((i) => <path key={i} d={`M${88 + i * 7} ${262 + i * 4} l-4 26`} />)}</g>
      {TREES.map((x, i) => <path key={i} d={`M${x} 430 l9 -${22 + (i % 3) * 6} l9 ${22 + (i % 3) * 6} Z`} fill={i % 2 ? '#123b2e' : '#17493a'} />)}
      {/* облака у вершины */}
      <g fill="#dfe8ff" opacity="0.22">
        <ellipse cx="240" cy="96" rx="44" ry="9" /><ellipse cx="282" cy="88" rx="32" ry="8" /><ellipse cx="200" cy="112" rx="34" ry="7" /><ellipse cx="120" cy="128" rx="40" ry="8" />
      </g>

      {/* тропа: пройденная часть золотом, впереди — пунктир */}
      <path d={trail(STAGES)} fill="none" stroke="#b9b1e6" strokeOpacity="0.45" strokeWidth="2" strokeDasharray="4 5" />
      <path d={reachedPath} fill="none" stroke="#ffd24a" strokeWidth="5" opacity="0.45" filter={`url(#glow-${uid})`} />
      <path d={reachedPath} fill="none" stroke="#ffd24a" strokeWidth="2.6" strokeLinecap="round" />

      {/* этапы */}
      {RANKS.map((r, i) => {
        const [x, y] = STAGES[i];
        const done = i <= reached, cur = i === reached;
        const left = LABEL_LEFT[i];
        return (
          <g key={r.name}>
            {cur && <circle cx={x} cy={y} r="13" fill="#ffd24a" opacity="0.35" className="brain-pulse" />}
            <circle cx={x} cy={y} r={cur ? 8 : 6} fill={done ? '#ffd24a' : '#2b2552'} stroke={done ? '#fff3c4' : '#8c84bd'} strokeWidth="1.4" />
            <text x={left ? x - 12 : x + 12} y={y - 1} textAnchor={left ? 'end' : 'start'} className={`m-label ${done ? 'done' : ''} ${cur ? 'cur' : ''}`}>{r.emoji} {r.name}</text>
            <text x={left ? x - 12 : x + 12} y={y + 10} textAnchor={left ? 'end' : 'start'} className="m-lvl">ур. {r.level}</text>
          </g>
        );
      })}

      {/* герои семьи на горе */}
      {placed.map(({ c, x, y }) => (
        <g key={c.id} transform={`translate(${x} ${y - (c.me ? 20 : 15)})`}>
          <title>{`${c.name}: уровень ${c.level}, ${rankFor(c.level, c.xp).rank.name}`}</title>
          <circle r={c.me || tv ? 13 : 9.5} fill="#120d22" stroke={c.color} strokeWidth={c.me || tv ? 3 : 2} />
          <text textAnchor="middle" dominantBaseline="central" fontSize={c.me || tv ? 15 : 11}>{c.emoji}</text>
        </g>
      ))}
    </svg>
  );
});
