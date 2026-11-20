'use client';
import Link from 'next/link';
import { FamilyQuests } from '@/components/FamilyQuests';
import { EveningReminder } from '@/components/EveningReminder';
import { BattleCard } from '@/components/BattleCard';
import { WeeklyGoal } from '@/components/WeeklyGoal';
import { MvpCard } from '@/components/MvpCard';
import { QuestsBlock } from '@/components/Quests';
import { useGame } from '@/components/Shell';
import { Bar, FoldGroup, Section } from '@/components/ui';
import { openQuickLog } from '@/components/QuickLog';
import { FirstSteps } from '@/components/Hints';
import { addDays } from '@/lib/date';

export default function Today() {
  const { s, date, setDate } = useGame();
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

      <FirstSteps />

      <EveningReminder />

      <Section title="✍️ Отмечено сегодня" right={<button className="btn" onClick={() => openQuickLog('body')}>✍️ Отметить действие</button>}>
        <div className="today-marks">
          <button className="mark-tile" onClick={() => openQuickLog('body')}><span>💪</span><b>{Math.round(d.day.stats.workoutMinutes)} мин</b><small>тело{d.day.stats.warmups ? ' · зарядка ✔' : ''}</small></button>
          <button className="mark-tile" onClick={() => openQuickLog('mind')}><span>🧠</span><b>{Object.values(d.day.stats.study).reduce((a, x) => a + (x ?? 0), 0)} мин</b><small>ум · привычки {d.habits.filter((h) => h.checked).length}/{d.habits.length}</small></button>
          <button className="mark-tile" onClick={() => openQuickLog('kind')}><span>💛</span><b>{d.day.stats.deeds} из {d.deeds.cap}</b><small>добрых дел</small></button>
        </div>
      </Section>

      <QuestsBlock />

      <BattleCard />

      <FoldGroup title="🗓 Семья и неделя" hint="цель недели, MVP, семейные квесты, босс">
        <WeeklyGoal />
        <MvpCard />
        <FamilyQuests />
        <Section title={`${b.boss.emoji} Босс недели: ${b.boss.name}`} right={<Link className="btn ghost sm" href="/battle">Бой</Link>}>
          <Bar value={Math.max(0, b.hp - b.damage)} max={b.hp} color="var(--danger)" label={`${Math.max(0, b.hp - b.damage)} / ${b.hp} HP`} />
          <p className="muted">{b.defeated ? '🏆 Босс повержен!' : 'Вся семья бьёт босса своими очками.'}</p>
        </Section>
      </FoldGroup>
    </>
  );
}
