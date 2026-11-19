'use client';
import { useGame } from './Shell';

export function Quests() {
  const { s, act } = useGame();
  const d = s.detail!;
  const qs = d.day.quests;
  return (
    <ul className="quests">
      {qs.map((q, i) => {
        const manual = q.k === 'manual';
        const state = q.completed ? 'done' : q.pending ? 'wait' : 'open';
        return (
          <li key={i} className={state}>
            <button className="mark" disabled={!manual} onClick={() => act('markQuest', { index: i })}
              aria-label={manual ? 'Отметить' : 'Засчитывается автоматически'}>
              {q.completed ? '✔' : q.pending ? '⏳' : manual ? '○' : '·'}
            </button>
            <span className="qt">{q.t}{q.m ? <small> · {q.k === 'habits' ? `${q.m} шт.` : `${q.m} мин`}</small> : null}</span>
            <b className="xp">+{q.xp}</b>
            {q.pending && s.parent && (
              <span className="row">
                <button className="btn" onClick={() => act('confirmQuest', { index: i })}>Подтвердить</button>
                <button className="btn ghost" onClick={() => act('confirmQuest', { index: i, approve: false })}>Отклонить</button>
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}
