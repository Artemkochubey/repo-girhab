'use client';
import { useCallback, useEffect, useState } from 'react';
import { RatingTable } from '@/components/RatingTable';
import { Hint } from '@/components/Hints';
import { useGame } from '@/components/Shell';
import type { RatingDto } from '@/lib/client';
import { addDays } from '@/lib/date';
import { DAY_RATIO_CAP } from '@/lib/game/mvp';

/** «Рейтинг дня»: кто на каком месте и за счёт чего набраны очки. */
export default function RatingPage() {
  const { s } = useGame();
  const [date, setDate] = useState<string>('');
  const [r, setR] = useState<RatingDto | null>(null);
  const [err, setErr] = useState('');
  const load = useCallback(async (d: string) => {
    try {
      const res = await fetch(`/api/rating${d ? `?date=${d}` : ''}`, { cache: 'no-store' });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error);
      setR(j); setErr('');
    } catch { setErr('Не удалось загрузить рейтинг. Проверьте связь и обновите страницу.'); }
  }, []);
  useEffect(() => { load(date); const t = setInterval(() => load(date), 20000); return () => clearInterval(t); }, [load, date]);

  const shown = r?.date ?? s.today;
  const label = r?.isToday ? 'Сегодня' : new Date(shown + 'T00:00:00').toLocaleDateString('ru', { weekday: 'short', day: 'numeric', month: 'long' });
  const oldest = addDays(s.today, -30);
  return (
    <>
      <div className="row between wrapRow">
        <h1 className="title">📊 Рейтинг дня</h1>
        <div className="row">
          <button className="btn ghost" disabled={shown <= oldest} onClick={() => setDate(addDays(shown, -1))} aria-label="Предыдущий день">←</button>
          <b>{label}</b>
          <button className="btn ghost" disabled={shown >= s.today} onClick={() => setDate(shown >= addDays(s.today, -1) ? '' : addDays(shown, 1))} aria-label="Следующий день">→</button>
        </div>
      </div>
      <Hint id="rating">Места считаются от <b>личной нормы</b>: очки делятся на норму героя, поэтому у младшего и у старшего равные шансы. В таблице видно, из чего набраны очки: тренировка, прогулка, учёба, добрые дела и другие. Самое большое значение у героя выделено.</Hint>
      {err && <p className="bk-warn">{err}</p>}
      {!r && !err && <p className="muted">Загрузка…</p>}
      {r && (
        <>
          <section className="card">
            <RatingTable rows={r.rows} me={s.me} />
          </section>
          <section className="card">
            <h2>Как считается</h2>
            <ul className="list small">
              <li><b>Место</b> определяется долей выполненной нормы: очки ÷ норма героя. В расчёт идёт не больше {DAY_RATIO_CAP} норм, поэтому накрутка одного дня обгона не даёт.</li>
              <li>При равной доле выше тот, у кого больше очков. Одинаковый результат даёт одинаковое место.</li>
              <li><b>🏆 MVP дня</b> получает первый, но только если выполнил норму (100% и больше). Он получает сундук в конце дня.</li>
              <li>Очки по источникам уже включают бонусы класса и талантов. «⭐ Бонусы талантов» это надбавки, которые не относятся к одному занятию (серии, «удвоитель» и другие). Из-за округления сумма столбцов может отличаться от очков на 1–2.</li>
            </ul>
          </section>
        </>
      )}
    </>
  );
}
