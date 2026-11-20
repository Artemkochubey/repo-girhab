'use client';
import { useGame } from '@/components/Shell';
import { Hint } from '@/components/Hints';
import { openQuickLog } from '@/components/QuickLog';
import { Bar, Section } from '@/components/ui';
import { DEED_CATEGORIES, DEED_DAY_CAP, deedById, kindRank } from '@/lib/game/deeds';

const fmt = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('ru', { day: 'numeric', month: 'short', weekday: 'short' });

export default function Deeds() {
  const { s, act, toast } = useGame();
  const d = s.detail!;
  const me = s.members.find((m) => m.id === s.me)!;
  const sum = d.deeds.summary;
  const r = kindRank(sum.total);
  const maxCat = Math.max(1, ...Object.values(sum.byCat));
  const kindAch = d.achievements.filter((a) => a.group === 'Доброта');
  return (
    <>
      <h1 className="title">💛 Доброта: {me.emoji} {me.name}</h1>
      <Hint id="deeds">Добрые дела делают мир лучше и приносят очки. Нажмите «Отметить» и выберите дело: помог дома, порадовал близких, позаботился о питомце. Одно и то же дело даёт очки раз в день, всего засчитывается до {DEED_DAY_CAP} дел в день.</Hint>

      <Section title={`${r.rank.emoji} ${r.rank.name}`} right={<button className="btn" onClick={() => openQuickLog('kind')}>💛 Отметить доброе дело</button>}>
        {r.next ? <Bar value={Math.round(r.progress * 100)} max={100} label={`до «${r.next.name}»: ещё ${r.left} ${r.left === 1 ? 'дело' : 'дел'}`} /> : <p className="gold">Высшее звание доброты!</p>}
        <div className="today-marks">
          <div className="mark-tile"><span>💛</span><b>{sum.total}</b><small>добрых дел всего</small></div>
          <div className="mark-tile"><span>📅</span><b>{sum.week}</b><small>за 7 дней</small></div>
          <div className="mark-tile"><span>🔗</span><b>{sum.streak}</b><small>дней подряд (рекорд {sum.bestStreak})</small></div>
        </div>
        <p className="muted small">Сегодня засчитано {sum.today} из {DEED_DAY_CAP}. Очки доброты за всё время: {sum.points}.</p>
      </Section>

      <Section title="🌈 Куда направлена доброта">
        <ul className="regions">
          {DEED_CATEGORIES.map((c) => (
            <li key={c.id}><span>{c.emoji} {c.name} <small className="muted">· {sum.byCat[c.id]}</small></span><i style={{ width: `${Math.max(sum.byCat[c.id] ? 8 : 0, Math.round((sum.byCat[c.id] / maxCat) * 100))}%`, background: 'var(--accent)' }} /></li>
          ))}
        </ul>
        {sum.total > 0 && <p className="muted small">Попробуйте дело из той категории, где пока меньше всего: так доброта получается разной.</p>}
      </Section>

      {kindAch.length > 0 && (
        <Section title="🏅 Награды за доброту" right={<b>{kindAch.filter((a) => a.earnedOn).length} из {kindAch.length}</b>}>
          <div className="badges">
            {kindAch.map((a) => (
              <div key={a.id} className={`badge ${a.earnedOn ? 'on' : 'off'}`} title={a.text}>
                <span className="b-ico" aria-hidden>{a.earnedOn ? a.emoji : '🔒'}</span><b>{a.name}</b><small>{a.text}</small>
                {a.earnedOn ? <small className="gold">получено</small> : <Bar value={Math.min(a.value, a.target)} max={a.target} label={`${Math.min(a.value, a.target)}/${a.target}`} />}
              </div>
            ))}
          </div>
        </Section>
      )}

      <Section title="📜 Журнал добрых дел">
        {d.deeds.recent.length === 0 && <p className="muted">Пока пусто. Первое доброе дело ждёт вас: нажмите «Отметить доброе дело».</p>}
        <ul className="list deed-log">
          {d.deeds.recent.map((x, i) => {
            const def = deedById(x.kind);
            return (
              <li key={x.id ?? i} className={x.counted ? '' : 'muted'}>
                <span>{def?.emoji ?? '💛'}</span>
                <span className="grow"><b>{def?.name ?? x.kind}</b>{x.note && <> · <i>{x.note}</i></>}<small className="muted"> · {fmt(x.date)}</small></span>
                <small className={x.counted ? 'gold' : 'muted'}>{x.counted ? `+${x.points}` : 'без очков'}</small>
                {s.parent && x.id && <button className="btn ghost sm" onClick={() => act('deleteEntry', { type: 'deed', id: x.id }).then(() => toast('Запись удалена')).catch(() => {})} aria-label="Удалить запись">🗑</button>}
              </li>
            );
          })}
        </ul>
        <p className="muted small">«Без очков» значит, что это дело уже было сегодня или набран дневной лимит. Запись остаётся в журнале. {s.parent ? 'Как родитель вы можете удалить запись.' : 'Удалить запись может родитель.'}</p>
      </Section>
    </>
  );
}
