'use client';
import type { MonthGoalDto } from '@/lib/client';

/** Общая цель семьи на месяц: прогресс, темп и награда. */
export function MonthGoalCard({ g, tv = false }: { g: MonthGoalDto; tv?: boolean }) {
  const tone = g.done ? 'ok' : g.onTrack ? '' : 'late';
  return (
    <section className={`card month-goal ${tone} ${tv ? 'month-goal-tv' : ''}`}>
      <div className="row between">
        <h2>{g.emoji} Цель семьи: {g.title}</h2>
        {g.done && <b className="gold">🎉 достигнута</b>}
      </div>
      <p className="muted small">{g.text}</p>
      <div className="bar" role="progressbar" aria-valuenow={g.progress} aria-valuemax={g.target}>
        <div style={{ width: `${g.percent}%`, background: g.done ? 'var(--ok)' : 'var(--accent)' }} />
        <span>{g.progress} / {g.target} {g.unit}</span>
        {!g.done && g.expected > 0 && g.expected < g.target && <u className="pace" style={{ left: `${Math.min(100, (g.expected / g.target) * 100)}%` }} title="Где мы должны быть по плану" />}
      </div>
      <p className={tv ? 'month-note' : 'muted small'}>
        {g.done
          ? <>🎉 Все вместе справились{g.doneDate ? ` ${g.doneDate.slice(8)}.${g.doneDate.slice(5, 7)}` : ''}! {g.reward ? <>Награда: <b>{g.reward}</b>{g.given ? ' (получена ✔)' : ''}</> : null}</>
          : <>{g.onTrack ? '✔ Идём по плану.' : `⚠ Немного отстаём: по плану уже ${g.expected}.`} {g.daysLeft > 0 ? `Осталось дней: ${g.daysLeft}, в среднем нужно ${g.need} ${g.unit} в день на всю семью.` : 'Месяц закончился.'}{g.reward ? <> Награда: <b>{g.reward}</b></> : null}</>}
      </p>
    </section>
  );
}
