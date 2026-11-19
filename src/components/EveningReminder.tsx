'use client';
import { useEffect, useState } from 'react';
import { eveningReminder } from '@/lib/game/reminders';
import { hourIn } from '@/lib/clock';
import { useGame } from './Shell';

/** Вечерняя подсказка на «Сегодня»: что ещё успеть до конца дня, чтобы добрать норму. */
export function EveningReminder() {
  const { s, date } = useGame();
  const [hour, setHour] = useState(() => hourIn(s.config.timezone));
  useEffect(() => { const t = setInterval(() => setHour(hourIn(s.config.timezone)), 60_000); return () => clearInterval(t); }, [s.config.timezone]);
  const d = s.detail, me = s.members.find((m) => m.id === s.me);
  if (!d || !me) return null;
  const r = eveningReminder({
    hour, fromHour: s.config.reminderHour, isToday: date === s.today,
    points: d.day.points, goal: me.goal, superGoal: me.superGoal,
    warmupDone: !!d.day.stats.warmups, habitsLeft: d.habits.filter((h) => !h.checked).length,
    quests: d.day.quests.map((q) => ({ t: q.t, xp: q.xp, completed: q.completed, pending: !!q.pending })),
  });
  if (!r) return null;
  return (
    <section className={`card reminder ${r.kind}`} role="status">
      <div className="row between"><b>🌙 {r.title}</b><small className="muted">до конца дня ~{r.hoursLeft} ч</small></div>
      <p className="muted small">{r.kind === 'goal' ? 'Успейте набрать норму и получить награду дня.' : 'Норма есть! Ещё немного, и награда станет больше.'}</p>
      {r.ideas.length > 0 && <ul className="list">{r.ideas.map((x) => <li key={x}>👉 {x}</li>)}</ul>}
    </section>
  );
}
