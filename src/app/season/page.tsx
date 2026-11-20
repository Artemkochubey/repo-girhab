'use client';
import { Avatar } from '@/components/Face';
import { useGame } from '@/components/Shell';
import { Bar, Section } from '@/components/ui';
import { MIN_DAYS, MIN_RATIO, seasonName } from '@/lib/game/seasons';
import type { SeasonDto } from '@/lib/client';

const MEDAL = ['🥇', '🥈', '🥉'];

function Board({ season, big }: { season: SeasonDto; big?: boolean }) {
  const { s } = useGame();
  const top = Math.max(1, ...season.rows.map((r) => r.ratio));
  return (
    <ul className="board">
      {season.rows.map((r) => {
        const m = s.members.find((x) => x.id === r.memberId);
        if (!m) return null;
        const prize = r.chests ? ` · +${r.chests} 🎁` : '';
        return (
          <li key={r.memberId} className={`${m.id === s.me ? 'me' : ''} ${r.rank === 1 && r.eligible ? 'first' : ''}`}>
            <span className="pos">{r.eligible && r.rank <= 3 ? MEDAL[r.rank - 1] : r.rank}</span>
            <span className="who" style={{ color: m.color }}><Avatar m={m} size={26} /> <b>{m.name}</b>{m.id === s.me ? ' (вы)' : ''}</span>
            <b className="pct">{Math.round(r.ratio * 100)}%</b>
            <div className="bar"><div style={{ width: `${Math.min(100, (r.ratio / top) * 100)}%`, background: m.color }} /></div>
            <small className="muted">{r.points} оч. · дней с нормой {r.normDays} из {r.days}{big ? ` · лучший день ${r.bestDay}` : ''}{prize}{!r.eligible && !season.finished ? '' : !r.eligible ? ' · вне зачёта' : ''}</small>
          </li>
        );
      })}
    </ul>
  );
}

export default function SeasonPage() {
  const { s } = useGame();
  const { current, history, prizes } = s.season;
  const lead = current.rows.find((r) => r.eligible) ?? current.rows[0];
  const leader = lead && s.members.find((m) => m.id === lead.memberId);
  const nm = (id: number | null) => s.members.find((m) => m.id === id);
  return (
    <>
      <h1 className="title">🏆 Сезон: {seasonName(current.id)}</h1>

      <Section title="Рейтинг семьи" right={<span className="muted">осталось {current.daysLeft} дн.</span>}>
        {leader && lead.ratio > 0 && <p className="muted">Сейчас впереди: <b>{leader.emoji} {leader.name}</b> · {Math.round(lead.ratio * 100)}% нормы в среднем за день.</p>}
        <Board season={current} big />
        <p className="muted small">Рейтинг считается по очкам относительно личной нормы, поэтому у младшего те же шансы, что у старших. Вклад одного дня ограничен двумя нормами (сами очки и уровень не ограничены), так что накрутка одного дня победу не даёт. Сезон равен календарному месяцу. Опыт и уровень не сбрасываются: каждый месяц начинается новая таблица.</p>
      </Section>

      <Section title="🎁 Призы сезона">
        <ul className="list">
          <li>🥇 Победитель: +{prizes[0]} сундука</li>
          <li>🥈 Второе место: +{prizes[1]} сундук</li>
          <li>🏅 Значки «Чемпион сезона» и «Легенда сезонов»</li>
        </ul>
        <p className="muted small">Приз получают те, кто участвовал не меньше {MIN_DAYS} дней сезона и набрал в среднем не меньше {Math.round(MIN_RATIO * 100)}% нормы. Призы начисляются в первый день следующего месяца, начиная с сезона, который идёт сейчас.</p>
      </Section>

      <Section title="🕰 Прошлые сезоны">
        {history.length === 0 && <p className="muted">Пока нет закончившихся сезонов. Первый итог будет в начале следующего месяца.</p>}
        {history.map((h) => {
          const w = nm(h.winner), sec = nm(h.second);
          return (
            <details key={h.id} className="season-old">
              <summary><b>{seasonName(h.id)}</b> · {w ? <>🥇 {w.emoji} {w.name}{sec ? <> · 🥈 {sec.emoji} {sec.name}</> : null}</> : 'никто не набрал зачётный результат'}{h.awardable ? '' : ' · без призов'}</summary>
              <Board season={h} />
            </details>
          );
        })}
      </Section>
    </>
  );
}
