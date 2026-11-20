'use client';
import { useGame } from './Shell';

/** Активные способности класса: кнопки на сегодня, энергия и перезарядка. */
export function AbilityBar({ compact = false }: { compact?: boolean }) {
  const { s, act, toast, date } = useGame();
  const b = s.detail!.battle;
  const ab = b.abilities;
  if (!b.cls || !ab.list.length || date !== s.today) return null;
  const use = (id: string, name: string, emoji: string) => act('useAbility', { id }).then(() => toast(`${emoji} ${name}!`)).catch(() => {});
  return (
    <div className={`abilities ${compact ? 'compact' : ''}`}>
      <div className="row between"><b>⚡ Способности</b><span className="focus" title="Энергия на сегодня">{Array.from({ length: ab.focusMax }, (_, i) => <i key={i} className={i < ab.focusLeft ? 'on' : ''}>⚡</i>)}</span></div>
      <div className="abil-grid">
        {ab.list.map((a) => {
          const state = a.usedToday ? '✔ применена' : a.readyIn > 0 ? `🕒 ещё ${a.readyIn} дн.` : a.ready ? 'применить' : 'мало энергии';
          return (
            <button key={a.id} className={`abil-btn ${a.usedToday ? 'used' : ''} ${a.cost === 2 ? 'ult' : ''}`} disabled={!a.ready} onClick={() => use(a.id, a.name, a.emoji)} title={a.text}>
              <span className="ab-e">{a.emoji}</span>
              <b>{a.name}</b>
              {!compact && <small className="muted">{a.text}</small>}
              <small className="ab-s">{'⚡'.repeat(a.cost)} · {state}</small>
            </button>
          );
        })}
      </div>
    </div>
  );
}
