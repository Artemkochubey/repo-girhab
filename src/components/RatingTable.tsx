'use client';
import type { RatingRowDto } from '@/lib/client';
import { SOURCES, sourceById, type SourceId } from '@/lib/game/rating';

const MEDAL = ['🥇', '🥈', '🥉'];
export const placeMark = (place: number) => MEDAL[place - 1] ?? `${place}`;

/** Что принесло больше всего очков героя: короткая фраза для подписи. */
export function whyText(r: { points: number; parts: { id: SourceId; points: number }[] }): string {
  if (!r.parts.length) return 'пока без очков';
  const top = r.parts[0]!;
  const share = r.points > 0 ? Math.round((top.points / r.points) * 100) : 0;
  const s = sourceById(top.id);
  const second = r.parts[1] ? `, потом ${sourceById(r.parts[1].id).emoji} ${sourceById(r.parts[1].id).name.toLowerCase()} ${r.parts[1].points}` : '';
  return `больше всего ${s.emoji} ${s.name.toLowerCase()}: ${top.points} из ${r.points} (${share}%)${second}`;
}

/** Таблица рейтинга дня: место, герой, очки, % нормы и очки по источникам; под таблицей полоски «из чего набрано». */
export function RatingTable({ rows, me = null, tv = false, onSeen }: { rows: RatingRowDto[]; me?: number | null; tv?: boolean; onSeen?: (targetId: number) => void }) {
  const used = SOURCES.filter((s) => rows.some((r) => r.parts.some((p) => p.id === s.id && p.points > 0)));
  const cell = (r: RatingRowDto, id: SourceId) => r.parts.find((p) => p.id === id)?.points ?? 0;
  const colTotal = (id: SourceId) => rows.reduce((a, r) => a + cell(r, id), 0);
  const famTotal = rows.reduce((a, r) => a + r.points, 0);
  return (
    <div className={`rating ${tv ? 'rating-tv' : ''}`}>
      <div className="rating-scroll">
        <table className="rating-table">
          <thead>
            <tr>
              <th className="c-place" scope="col"><span className="d-only">Место</span><span className="m-only">№</span></th><th className="c-who" scope="col">Герой</th><th scope="col">Очки</th><th scope="col">От нормы</th>
              {used.map((s) => <th key={s.id} scope="col" className="c-src" title={s.name}><span aria-hidden>{s.emoji}</span><small>{s.short}</small></th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={`${r.mvp ? 'is-mvp' : ''} ${r.id === me ? 'is-me' : ''}`} style={{ borderLeftColor: r.color }}>
                <td className="c-place"><b>{placeMark(r.place)}</b></td>
                <th scope="row" className="c-who"><span className="r-emoji">{r.emoji}</span> {r.name}{r.id === me ? <small className="muted"> (вы)</small> : null}{r.mvp ? <small className="gold"> 🏆 MVP</small> : null}{(() => {
                  const names = r.seen.map((id) => rows.find((x) => x.id === id)?.name).filter(Boolean).join(', ');
                  const mine = me !== null && r.seen.includes(me);
                  if (onSeen && me !== null && r.id !== me && r.points > 0) return <button className={`seen-btn ${mine ? 'on' : ''}`} onClick={() => onSeen(r.id)} aria-pressed={mine} title={names ? `Видели: ${names}` : 'Нажмите, если видели, как он старался'}>👍 {r.seen.length || 'Видел'}</button>;
                  return r.seen.length ? <span className="seen-btn static" title={`Видели: ${names}`}>👍 {r.seen.length}</span> : null;
                })()}</th>
                <td className="c-pts"><b>{r.points}</b><small className="muted"> из {r.goal}</small></td>
                <td className={`c-pct ${r.qualified ? 'ok' : ''}`}>
                  <b>{r.percent}%</b>
                  <div className="r-bar" aria-hidden><i style={{ width: `${Math.min(100, r.percent)}%`, background: r.color }} />{r.superGoal > 0 && <u style={{ left: `${Math.min(100, (r.goal / r.superGoal) * 100)}%` }} />}</div>
                  <small className="muted">{r.qualified ? '✔ норма' : `ещё ${Math.max(0, r.goal - r.points)}`}</small>
                </td>
                {used.map((s) => { const v = cell(r, s.id); return <td key={s.id} className={`c-src ${v ? '' : 'zero'} ${r.top === s.id ? 'is-top' : ''}`} style={v ? { background: `${s.color}${r.top === s.id ? '55' : '22'}` } : undefined}>{v || '·'}</td>; })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><th scope="row" colSpan={2}>Вся семья</th><td className="c-pts"><b>{famTotal}</b></td><td />{used.map((s) => <td key={s.id} className="c-src">{colTotal(s.id) || '·'}</td>)}</tr>
          </tfoot>
        </table>
      </div>

      <p className="muted small m-only">Таблицу можно листать вправо: там очки по каждому источнику.</p>
      <SourceBars rows={rows} used={used} />
    </div>
  );
}

/** Полоски «из чего набраны очки» с подписями и легенда источников. */
export function SourceBars({ rows, used, title = 'Из чего набраны очки' }: { rows: { id: number; place: number; emoji: string; name: string; points: number; parts: { id: SourceId; points: number }[] }[]; used: typeof SOURCES; title?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.points));
  return (
    <>
      <h3 className="rating-h">{title}</h3>
      <ul className="rating-bars">
        {rows.map((r) => (
          <li key={r.id}>
            <div className="rb-head"><span>{placeMark(r.place)} {r.emoji} <b>{r.name}</b></span><span className="muted">{r.points} оч.</span></div>
            <div className="rb-bar" role="img" aria-label={`${r.name}: ${r.parts.map((p) => `${sourceById(p.id).name} ${p.points}`).join(', ') || 'очков нет'}`}>
              {r.parts.map((p) => <i key={p.id} style={{ width: `${(p.points / max) * 100}%`, background: sourceById(p.id).color }} title={`${sourceById(p.id).name}: ${p.points}`}>{(p.points / max) * 100 > 9 ? `${sourceById(p.id).emoji}${p.points}` : ''}</i>)}
            </div>
            <small className="muted">{whyText(r)}</small>
          </li>
        ))}
      </ul>
      <ul className="rating-legend">
        {used.map((s) => <li key={s.id}><i style={{ background: s.color }} /> {s.emoji} {s.name}</li>)}
      </ul>
    </>
  );
}
