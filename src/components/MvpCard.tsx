'use client';
import { useGame } from './Shell';
import { Section } from './ui';

/** MVP дня: вчерашний победитель (получил сундук) и сегодняшний лидер. */
export function MvpCard() {
  const { s } = useGame();
  const by = (id: number) => s.members.find((m) => m.id === id);
  const y = s.mvp.yesterday, l = s.mvp.leader;
  const yM = y ? by(y.memberId) : null, lM = l ? by(l.memberId) : null;
  return (
    <Section title="🏆 MVP дня">
      <div className="mvp">
        <div className="mvp-row"><span className="muted">Вчера</span>
          {yM ? <b>{yM.emoji} {yM.name} <small className="gold">+1 🎁 · {Math.round(y!.points)} очков</small></b> : <span className="muted">MVP не было: никто не выполнил норму</span>}</div>
        <div className="mvp-row"><span className="muted">Сегодня лидирует</span>
          {lM ? <b>{lM.emoji} {lM.name} <small className={l!.qualified ? 'gold' : 'muted'}>{Math.round(l!.ratio * 100)}% нормы{l!.qualified ? '' : ' (нужно ≥ 100%)'}</small></b> : <span className="muted">пока никого</span>}</div>
      </div>
      <p className="muted small">Лучший за день, считая от своей нормы (не больше двух норм), получает сундук 🎁 в конце дня. Норму нужно выполнить.</p>
    </Section>
  );
}
