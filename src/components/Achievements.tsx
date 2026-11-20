'use client';
import { useMemo } from 'react';
import type { AchievementDto } from '@/lib/client';
import { Bar, Fold } from './ui';

const fmtDate = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('ru', { day: 'numeric', month: 'short', year: 'numeric' });

/** Значки: полученные цветные с датой, остальные серые с прогрессом. */
export function Achievements({ items }: { items: AchievementDto[] }) {
  const groups = useMemo(() => {
    const m = new Map<string, AchievementDto[]>();
    for (const a of items) m.set(a.group, [...(m.get(a.group) ?? []), a]);
    return [...m.entries()].map(([g, list]) => [g, list.sort((a, b) => a.target - b.target)] as const);
  }, [items]);
  const earned = items.filter((a) => a.earnedOn).length;
  return (
    <Fold title="🏅 Достижения" right={<b>{earned} из {items.length}</b>}>
      {groups.map(([g, list]) => (
        <div key={g}>
          <h3>{g}</h3>
          <div className="badges">
            {list.map((a) => (
              <div key={a.id} className={`badge ${a.earnedOn ? 'on' : 'off'}`} title={a.text}>
                <span className="b-ico" aria-hidden>{a.earnedOn ? a.emoji : '🔒'}</span>
                <b>{a.name}</b>
                <small>{a.text}</small>
                {a.earnedOn
                  ? <small className="gold">{fmtDate(a.earnedOn)}</small>
                  : <Bar value={Math.min(a.value, a.target)} max={a.target} label={`${Math.min(a.value, a.target)}/${a.target}`} />}
              </div>
            ))}
          </div>
        </div>
      ))}
    </Fold>
  );
}
