'use client';
import { Hint } from '@/components/Hints';
import { useGame } from '@/components/Shell';
import { TaskChecklist } from '@/components/Tasks';
import { Fold, Section } from '@/components/ui';

const fmt = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('ru', { day: 'numeric', month: 'short', weekday: 'short' });

export default function Tasks() {
  const { s } = useGame();
  const t = s.detail!.tasks;
  const me = s.members.find((m) => m.id === s.me)!;
  const today = t.days[0];
  const week = t.days.reduce((a, d) => ({ done: a.done + d.progress.done, total: a.total + d.progress.total, points: a.points + d.reward.points, chests: a.chests + d.reward.chests }), { done: 0, total: 0, points: 0, chests: 0 });
  return (
    <>
      <h1 className="title">📌 Мои задачи на день: {me.emoji} {me.name}</h1>
      <Hint id="tasks">Это ваш личный список дел на сегодня. Его составляют родители. Сделали — нажмите кружок. Если рядом написано «родитель проверит», награда придёт после проверки.</Hint>

      <Section title={today.progress.total && today.progress.done === today.progress.total ? '🎉 Сегодня всё сделано!' : `Сегодня: ${today.progress.done} из ${today.progress.total}`}>
        <TaskChecklist day={today} />
        {!t.has && !today.items.length && <p className="muted">Родитель пока не добавил задач. Он делает это в «Настройки → Задачи».</p>}
      </Section>

      <Section title="🗓 Неделя">
        <div className="today-marks">
          <div className="mark-tile"><span>✅</span><b>{week.done} из {week.total}</b><small>задач за 7 дней</small></div>
          <div className="mark-tile"><span>⭐</span><b>{week.points}</b><small>очков за задачи</small></div>
          <div className="mark-tile"><span>🎁</span><b>{week.chests}</b><small>сундуков за задачи</small></div>
        </div>
        {t.days.slice(1).map((d) => (
          <Fold key={d.date} title={`${fmt(d.date)} · ${d.progress.done} из ${d.progress.total}`}>
            <TaskChecklist day={d} />
          </Fold>
        ))}
        <p className="muted small">Пропущенный день можно закрыть задним числом, но не позже чем через 7 дней.</p>
      </Section>
    </>
  );
}
