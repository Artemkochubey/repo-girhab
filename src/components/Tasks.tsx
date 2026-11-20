'use client';
import Link from 'next/link';
import type { TaskDayDto, TaskItemDto } from '@/lib/client';
import { useGame } from './Shell';
import { Section } from './ui';

const rewardText = (t: Pick<TaskItemDto, 'points' | 'chests'>) => [t.points ? `+${t.points}` : '', t.chests ? `🎁×${t.chests}` : ''].filter(Boolean).join(' ');

/** Список задач одного дня с галочками. Награду задаёт родитель, ребёнок только отмечает. */
export function TaskChecklist({ day }: { day: TaskDayDto }) {
  const { s, act } = useGame();
  if (!day.items.length) return <p className="muted small">На этот день задач нет.</p>;
  return (
    <ul className="quests tasks">
      {day.items.map((t) => {
        const state = t.done ? (t.confirmed ? 'done' : 'wait') : 'open';
        const locked = t.done && t.confirmed && t.confirm && !s.parent;   // подтверждённое снимает только родитель
        return (
          <li key={t.id} className={state}>
            <button className="mark" disabled={locked} aria-pressed={t.done} aria-label={t.done ? 'Снять отметку' : 'Отметить выполненной'}
              onClick={() => act('toggleTask', { taskId: t.id, date: day.date })}>
              {t.done ? (t.confirmed ? '✔' : '⏳') : '○'}
            </button>
            <span className="qt">
              {t.emoji} {t.title}
              <small className="hint">
                {t.done && !t.confirmed ? 'Ждёт подтверждения родителя' : t.done ? 'Сделано' : t.carried ? 'Не сделано раньше: перенесено на сегодня' : t.confirm ? 'Родитель проверит' : 'Отметьте, когда сделаете'}
              </small>
            </span>
            {rewardText(t) && <b className="xp">{rewardText(t)}</b>}
          </li>
        );
      })}
    </ul>
  );
}

/** Карточка «Мои задачи на день» на главной: «3 из 5» и список. Без задач ребёнку не показывается. */
export function TasksCard() {
  const { s, date } = useGame();
  const t = s.detail!.tasks;
  const day = t.days.find((x) => x.date === date) ?? t.days[0];
  if (!t.has && !day.items.length) {
    return s.parent ? (
      <Section title="📌 Мои задачи на день"><p className="muted small">Здесь появятся личные задачи героя. Добавьте их в <Link href="/settings">Настройках → Задачи</Link>.</p></Section>
    ) : null;
  }
  const p = day.progress;
  const all = p.total > 0 && p.done === p.total;
  return (
    <Section title="📌 Мои задачи на день" right={<Link className="btn ghost sm" href="/tasks">{all ? '🎉 ' : ''}{p.done} из {p.total}</Link>}>
      <TaskChecklist day={day} />
      {(day.reward.points > 0 || day.reward.chests > 0) && <p className="muted small">Награда за день: {day.reward.points ? `+${day.reward.points} очков` : ''}{day.reward.points && day.reward.chests ? ', ' : ''}{day.reward.chests ? `🎁 сундуков: ${day.reward.chests}` : ''}</p>}
    </Section>
  );
}
