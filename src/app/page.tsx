'use client';
import { FamilyQuests } from '@/components/FamilyQuests';
import { EveningReminder } from '@/components/EveningReminder';
import { BattleCard } from '@/components/BattleCard';
import { BossScene } from '@/components/BossScene';
import { WeeklyGoal } from '@/components/WeeklyGoal';
import { MvpCard } from '@/components/MvpCard';
import { QuestsBlock } from '@/components/Quests';
import { useGame } from '@/components/Shell';
import { Bar, Chips, Section } from '@/components/ui';
import { addDays } from '@/lib/date';

export default function Today() {
  const { s, act, date, setDate } = useGame();
  const d = s.detail!;
  const me = s.members.find((m) => m.id === s.me)!;
  const pts = d.day.points;
  const minutes = pts >= me.superGoal ? s.config.superMinutes : pts >= me.goal ? s.config.minutes : 0;
  const next = pts < me.goal ? me.goal : pts < me.superGoal ? me.superGoal : null;
  const minDate = s.parent ? '2000-01-01' : addDays(s.today, -7);
  const b = s.boss;

  return (
    <>
      <div className="row between">
        <h1 className="title">{me.emoji} {me.name}</h1>
        <div className="row">
          <button className="btn ghost" disabled={date <= minDate} onClick={() => setDate(addDays(date, -1))}>←</button>
          <b>{date === s.today ? 'Сегодня' : date}</b>
          <button className="btn ghost" disabled={date >= s.today} onClick={() => setDate(addDays(date, 1))}>→</button>
        </div>
      </div>

      <Section title="Очки дня" right={<span className="muted">🔥 серия {d.streak}</span>}>
        <Bar value={pts} max={me.superGoal} label={`${pts} / ${me.superGoal}`} />
        <p className="muted">
          {minutes ? `🎮 Награда: ${minutes} мин развлечений` : 'Награды пока нет'}
          {next ? ` · до следующей цели ещё ${next - pts}` : ' · максимум достигнут!'}
        </p>
        <p className="muted small">Цели: {me.goal} баллов → {s.config.minutes} мин, {me.superGoal} → {s.config.superMinutes} мин</p>
      </Section>

      <EveningReminder />

      <BattleCard />

      <WeeklyGoal />

      <MvpCard />

      <QuestsBlock />

      <FamilyQuests />

      <Section title="💪 Тренировка и зарядка" right={
        <button className={`btn ${d.day.stats.warmups ? '' : 'ghost'}`} onClick={() => act('toggleWarmup')}>
          {d.day.stats.warmups ? '✔ Зарядка' : '○ Зарядка +10'}
        </button>}>
        <p className="muted">Сегодня: {d.day.stats.workoutMinutes} мин</p>
        <Chips values={[15, 30, 45, 60]} onPick={(n) => act('addWorkout', { minutes: n })} />
      </Section>

      <Section title="✅ Привычки" right={<span className="muted">{d.habits.filter((h) => h.checked).length}/{d.habits.length}</span>}>
        {d.habits.length === 0 && <p className="muted">Привычек пока нет — добавьте на вкладке «Ум».</p>}
        <ul className="list">
          {d.habits.map((h) => (
            <li key={h.id}><button className={`mark ${h.checked ? 'on' : ''}`} onClick={() => act('toggleHabit', { habitId: h.id })}>{h.checked ? '✔' : '○'}</button> {h.name}</li>
          ))}
        </ul>
      </Section>

      <Section title={`${b.boss.emoji} Босс недели: ${b.boss.name}`}>
        <Bar value={Math.max(0, b.hp - b.damage)} max={b.hp} color="var(--danger)" label={`${Math.max(0, b.hp - b.damage)} / ${b.hp} HP`} />
        <BossScene boss={b.boss} hp={b.hp} damage={b.damage} defeated={b.defeated} party={s.members.map((m) => ({ id: m.id, name: m.name, emoji: m.emoji, color: m.color, look: m.look, cls: m.cls, damage: b.byMember[m.id] ?? 0 }))} meId={s.me} />
        <p className="muted">{b.defeated ? '🏆 Босс повержен!' : 'Вся семья бьёт босса своими очками.'}</p>
      </Section>
    </>
  );
}
