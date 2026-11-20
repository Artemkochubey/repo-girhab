'use client';
import { Avatar } from './Face';
import { rankFor } from '@/lib/game/ranks';
import type { Climber } from './MountainClimb';

/** Список «Кто где» под картой: кто на каком этапе и сколько осталось до следующего. */
export function ClimbRoster({ climbers }: { climbers: Climber[] }) {
  const sorted = [...climbers].sort((a, b) => (b.xp ?? 0) - (a.xp ?? 0) || b.level - a.level);
  return (
    <ul className="roster" aria-label="Кто где на горе">
      {sorted.map((c, i) => {
        const r = rankFor(c.level, c.xp);
        return (
          <li key={c.id} className={c.me ? 'me' : ''} style={{ borderColor: c.color }}>
            <span className="r-pos">{i + 1}</span>
            <span className="r-av" style={{ borderColor: c.color }}><Avatar m={c} size={34} /></span>
            <span className="r-main"><b>{c.name}{c.me ? ' (вы)' : ''}</b><small>{r.rank.emoji} {r.rank.name} · ур. {c.level}{r.next ? ` · до «${r.next.name}»: ${r.xpToNext}` : ''}</small></span>
            <span className="r-bar"><i style={{ width: `${Math.round(r.progress * 100)}%`, background: c.color }} /></span>
          </li>
        );
      })}
    </ul>
  );
}
