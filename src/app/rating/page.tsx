'use client';
import { useCallback, useEffect, useState } from 'react';
import { RatingTable } from '@/components/RatingTable';
import { WeekRatingTable } from '@/components/WeekRatingTable';
import { Hint } from '@/components/Hints';
import { useGame } from '@/components/Shell';
import type { RatingDto, RatingWeekDto } from '@/lib/client';
import { addDays } from '@/lib/date';
import { DAY_RATIO_CAP } from '@/lib/game/mvp';

type Mode = 'day' | 'week';
const MODE_KEY = 'mr_rating_mode';
const dm = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('ru', { day: 'numeric', month: 'short' });

/** «Рейтинг»: за день и за неделю, кто на каком месте и за счёт чего набраны очки. */
export default function RatingPage() {
  const { s } = useGame();
  const [mode, setMode] = useState<Mode>(() => { try { return sessionStorage.getItem(MODE_KEY) === 'week' ? 'week' : 'day'; } catch { return 'day'; } });
  const [date, setDate] = useState<string>('');       // день ('' — сегодня)
  const [anyDay, setAnyDay] = useState<string>('');   // любая дата нужной недели ('' — текущая)
  const [day, setDay] = useState<RatingDto | null>(null);
  const [week, setWeek] = useState<RatingWeekDto | null>(null);
  const [err, setErr] = useState('');
  const pick = (m: Mode) => { setMode(m); try { sessionStorage.setItem(MODE_KEY, m); } catch { /* без хранилища не запомним */ } };

  const load = useCallback(async () => {
    try {
      const url = mode === 'week' ? `/api/rating?week=${anyDay || s.today}` : `/api/rating${date ? `?date=${date}` : ''}`;
      const res = await fetch(url, { cache: 'no-store' });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      if (mode === 'week') setWeek(j); else setDay(j);
      setErr('');
    } catch { setErr('Не удалось загрузить рейтинг. Проверьте связь и обновите страницу.'); }
  }, [mode, date, anyDay, s.today]);
  useEffect(() => { load(); const t = setInterval(load, 20000); return () => clearInterval(t); }, [load]);

  const shownDay = day?.date ?? s.today;
  const oldestDay = addDays(s.today, -30);
  const wStart = week?.weekStart ?? '';
  const oldestWeek = addDays(s.today, -56);
  return (
    <>
      <div className="row between wrapRow">
        <h1 className="title">📊 Рейтинг</h1>
        {mode === 'day' ? (
          <div className="row">
            <button className="btn ghost" disabled={shownDay <= oldestDay} onClick={() => setDate(addDays(shownDay, -1))} aria-label="Предыдущий день">←</button>
            <b>{day?.isToday !== false ? 'Сегодня' : new Date(shownDay + 'T00:00:00').toLocaleDateString('ru', { weekday: 'short', day: 'numeric', month: 'long' })}</b>
            <button className="btn ghost" disabled={shownDay >= s.today} onClick={() => setDate(shownDay >= addDays(s.today, -1) ? '' : addDays(shownDay, 1))} aria-label="Следующий день">→</button>
          </div>
        ) : (
          <div className="row">
            <button className="btn ghost" disabled={!wStart || addDays(wStart, -1) < oldestWeek} onClick={() => setAnyDay(addDays(wStart, -1))} aria-label="Предыдущая неделя">←</button>
            <b>{week ? (week.isCurrent ? 'Эта неделя' : `${dm(week.weekStart)} – ${dm(week.weekEnd)}`) : '…'}</b>
            <button className="btn ghost" disabled={!week || week.isCurrent} onClick={() => setAnyDay(week && addDays(week.weekEnd, 1) > s.today ? '' : addDays(week!.weekEnd, 1))} aria-label="Следующая неделя">→</button>
          </div>
        )}
      </div>
      <div className="seg" role="tablist" aria-label="Период">
        <button role="tab" aria-selected={mode === 'day'} className={mode === 'day' ? 'on' : ''} onClick={() => pick('day')}>📅 За день</button>
        <button role="tab" aria-selected={mode === 'week'} className={mode === 'week' ? 'on' : ''} onClick={() => pick('week')}>🗓 За неделю</button>
      </div>
      <Hint id="rating" more="/rules">Места считаются от <b>личной нормы</b>: очки делятся на норму героя, поэтому у младшего и у старшего равные шансы. В таблице видно, из чего набраны очки: тренировка, прогулка, учёба, добрые дела и другие. За неделю место зависит от средней доли нормы по дням, а в разбивке «по дням» видно, кто в какой день вёл.</Hint>
      {err && <p className="bk-warn">{err}</p>}
      {mode === 'day' && !day && !err && <p className="muted">Загрузка…</p>}
      {mode === 'week' && !week && !err && <p className="muted">Загрузка…</p>}
      {mode === 'day' && day && <section className="card"><RatingTable rows={day.rows} me={s.me} /></section>}
      {mode === 'week' && week && <section className="card"><WeekRatingTable w={week} me={s.me} /></section>}
      {(mode === 'day' ? day : week) && (
        <section className="card">
          <h2>Как считается</h2>
          {mode === 'day' ? (
            <ul className="list small">
              <li><b>Место</b> определяется долей выполненной нормы: очки ÷ норма героя. В расчёт идёт не больше {DAY_RATIO_CAP} норм, поэтому накрутка одного дня обгона не даёт.</li>
              <li>При равной доле выше тот, у кого больше очков. Одинаковый результат даёт одинаковое место.</li>
              <li><b>🏆 MVP дня</b> получает первый, но только если выполнил норму (100% и больше). Он получает сундук в конце дня.</li>
              <li>Очки по источникам уже включают бонусы класса и талантов. «⭐ Бонусы талантов» это надбавки, которые не относятся к одному занятию (серии, «удвоитель» и другие). Из-за округления сумма столбцов может отличаться от очков на 1–2.</li>
            </ul>
          ) : (
            <ul className="list small">
              <li><b>Место за неделю</b> определяет средняя доля нормы: для каждого дня очки ÷ норма (не больше {DAY_RATIO_CAP} норм), потом среднее по дням. Считаются дни с понедельника до сегодняшнего; дни до появления героя в игре и будущие не считаются.</li>
              <li>При равной средней выше тот, у кого больше очков за неделю.</li>
              <li><b>Дни с нормой</b>: сколько дней герой набрал 100% нормы и больше. В клетках «по дням» золотом отмечен 🏆 MVP дня.</li>
              <li>Очки по источникам суммируются за все дни недели.</li>
            </ul>
          )}
        </section>
      )}
    </>
  );
}
