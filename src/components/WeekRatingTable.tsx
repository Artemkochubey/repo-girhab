'use client';
import type { RatingWeekDto } from '@/lib/client';
import { SOURCES, type SourceId } from '@/lib/game/rating';
import { SourceBars, placeMark } from './RatingTable';

const WD = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const ddmm = (d: string) => `${d.slice(8)}.${d.slice(5, 7)}`;

/** Таблица рейтинга недели: места, очки, средняя доля нормы, дни с нормой, очки по источникам, а ниже разбивка по дням. */
export function WeekRatingTable({ w, me = null, tv = false }: { w: RatingWeekDto; me?: number | null; tv?: boolean }) {
  const rows = w.rows;
  const used = SOURCES.filter((s) => rows.some((r) => r.parts.some((p) => p.id === s.id && p.points > 0)));
  const cell = (r: (typeof rows)[number], id: SourceId) => r.parts.find((p) => p.id === id)?.points ?? 0;
  const famTotal = rows.reduce((a, r) => a + r.points, 0);
  // лидер каждого дня: тот, у кого первое место и есть очки
  const leader = (i: number) => rows.find((r) => r.daily[i]?.place === 1 && (r.daily[i]?.points ?? 0) > 0 && r.daily[i]?.counted);
  return (
    <div className={`rating rating-week ${tv ? 'rating-tv' : ''}`}>
      <div className="rating-scroll">
        <table className="rating-table">
          <thead>
            <tr>
              <th className="c-place" scope="col"><span className="d-only">Место</span><span className="m-only">№</span></th><th className="c-who" scope="col">Герой</th><th scope="col">Очки</th>
              <th scope="col">В среднем<br />от нормы</th><th scope="col">Дни с<br />нормой</th>
              {used.map((s) => <th key={s.id} scope="col" className="c-src" title={s.name}><span aria-hidden>{s.emoji}</span><small>{s.short}</small></th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className={`${r.place === 1 && r.points > 0 ? 'is-mvp' : ''} ${r.id === me ? 'is-me' : ''}`} style={{ borderLeftColor: r.color }}>
                <td className="c-place"><b>{placeMark(r.place)}</b></td>
                <th scope="row" className="c-who"><span className="r-emoji">{r.emoji}</span> {r.name}{r.id === me ? <small className="muted"> (вы)</small> : null}{r.place === 1 && r.points > 0 ? <small className="gold"> 👑 лидер</small> : null}</th>
                <td className="c-pts"><b>{r.points}</b>{r.best ? <small className="muted"> лучший день {r.best.points}</small> : null}</td>
                <td className={`c-pct ${r.percent >= 100 ? 'ok' : ''}`}>
                  <b>{r.percent}%</b>
                  <div className="r-bar" aria-hidden><i style={{ width: `${Math.min(100, r.percent)}%`, background: r.color }} /></div>
                </td>
                <td className="c-days"><b>{r.normDays}</b><small className="muted"> из {r.days}</small></td>
                {used.map((s) => { const v = cell(r, s.id); return <td key={s.id} className={`c-src ${v ? '' : 'zero'} ${r.top === s.id ? 'is-top' : ''}`} style={v ? { background: `${s.color}${r.top === s.id ? '55' : '22'}` } : undefined}>{v || '·'}</td>; })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><th scope="row" colSpan={2}>Вся семья</th><td className="c-pts"><b>{famTotal}</b></td><td /><td />{used.map((s) => <td key={s.id} className="c-src">{rows.reduce((a, r) => a + cell(r, s.id), 0) || '·'}</td>)}</tr>
          </tfoot>
        </table>
      </div>

      <h3 className="rating-h">По дням: кто какое место занял</h3>
      <div className="rating-scroll">
        <table className="rating-table week-days">
          <thead>
            <tr><th className="c-who" scope="col">Герой</th>{w.dates.map((d, i) => <th key={d} scope="col" className={d === w.today ? 'is-today' : ''}>{WD[i]}<small>{ddmm(d)}</small></th>)}</tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} style={{ borderLeftColor: r.color }}>
                <th scope="row" className="c-who"><span className="r-emoji">{r.emoji}</span> {r.name}</th>
                {r.daily.map((x, i) => (
                  <td key={x.date} className={`wd ${!x.counted ? 'off' : x.mvp ? 'mvp' : x.qualified ? 'ok' : ''}`} title={x.counted ? `${x.points} очков, ${x.percent}% нормы, место ${x.place}` : 'день не считается'}>
                    {x.counted ? <><b>{x.points}</b><small>{x.points > 0 ? placeMark(x.place) : '·'}{x.mvp ? '🏆' : ''}</small></> : '–'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr><th scope="row" className="c-who">Лидер дня</th>{w.dates.map((d, i) => { const l = leader(i); return <td key={d} className="wd">{l ? <span title={l.name}>{l.emoji}</span> : '·'}</td>; })}</tr>
          </tfoot>
        </table>
      </div>
      <p className="muted small">В клетке очки за день и место в этот день. Зелёная клетка: норма выполнена, золотая: 🏆 MVP дня. Серые дни до появления героя и будущие дни не считаются.</p>

      <SourceBars rows={rows} used={used} title="Из чего набраны очки за неделю" />
    </div>
  );
}
