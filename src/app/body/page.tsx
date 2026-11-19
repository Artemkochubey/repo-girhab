'use client';
import { useGame } from '@/components/Shell';
import { Chips, Heatmap, Section } from '@/components/ui';

export default function Body() {
  const { s, act } = useGame();
  const d = s.detail!;
  const total = d.history.reduce((a, [, v]) => a + v, 0);
  const active = d.history.filter(([, v]) => v > 0).length;
  return (
    <>
      <h1 className="title">💪 Тело</h1>
      <Section title="Тренировка" right={<span className="muted">за день: {d.day.stats.workoutMinutes} мин</span>}>
        <Chips values={[15, 30, 45, 60, 90]} onPick={(n) => act('addWorkout', { minutes: n })} />
        <ul className="list">
          {d.entries.workouts.map((w) => (
            <li key={w.id}>🏃 {w.minutes} мин {s.parent && <button className="x" onClick={() => act('deleteEntry', { type: 'workout', id: w.id })}>✕</button>}</li>
          ))}
        </ul>
      </Section>
      <Section title="Зарядка">
        <button className={`btn ${d.day.stats.warmups ? '' : 'ghost'}`} onClick={() => act('toggleWarmup')}>
          {d.day.stats.warmups ? '✔ Сделана (снять — родитель)' : '○ Отметить зарядку (+10)'}
        </button>
      </Section>
      <Section title="Год по дням" right={<span className="muted">{active} активных дней · {total} очков</span>}>
        <Heatmap data={d.history as [string, number][]} />
      </Section>
    </>
  );
}
