'use client';
import Link from 'next/link';
import { FamilyQuests } from '@/components/FamilyQuests';
import { EveningReminder } from '@/components/EveningReminder';
import { BattleCard } from '@/components/BattleCard';
import { WeeklyGoal } from '@/components/WeeklyGoal';
import { KidHome } from '@/components/KidHome';
import { MonthGoalCard } from '@/components/MonthGoalCard';
import { MvpCard } from '@/components/MvpCard';
import { QuestsBlock } from '@/components/Quests';
import { TasksCard } from '@/components/Tasks';
import { useGame } from '@/components/Shell';
import { Bar, FoldGroup, Section } from '@/components/ui';
import { openQuickLog } from '@/components/QuickLog';
import { FirstSteps } from '@/components/Hints';
import { HeroRing } from '@/components/HeroRing';
import { CLASS_NAMES } from '@/lib/game/classes';
import { rankFor } from '@/lib/game/ranks';
import { addDays } from '@/lib/date';

export default function Today() {
  const { s, date, setDate } = useGame();
  const d = s.detail!;
  const me = s.members.find((m) => m.id === s.me)!;
  if (me.simple) return <KidHome />;
  const pts = d.day.points;
  const minutes = pts >= me.superGoal ? s.config.superMinutes : pts >= me.goal ? s.config.minutes : 0;
  const next = pts < me.goal ? me.goal : pts < me.superGoal ? me.superGoal : null;
  const minDate = s.parent ? '2000-01-01' : addDays(s.today, -7);
  const b = s.boss;
  const hour = new Date().getHours();
  const hello = hour < 5 ? 'Доброй ночи' : hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер';

  return (
    <>
      <div className="greet">
        <div><small>{hello}</small><h1 className="title">{me.name}</h1></div>
        <span className="pill fire" title="Дней подряд с нормой">
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24"><path d="M12 2c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z" fill="#ffb14a" /></svg>
          <b>{d.streak}</b> <small>дн.</small>
        </span>
      </div>
      <div className="row between">
        <span className="muted small">{date === s.today ? 'Сегодня' : date}</span>
        <div className="row">
          <button className="btn ghost" aria-label="Предыдущий день" disabled={date <= minDate} onClick={() => setDate(addDays(date, -1))}>←</button>
          <button className="btn ghost" aria-label="Следующий день" disabled={date >= s.today} onClick={() => setDate(addDays(date, 1))}>→</button>
        </div>
      </div>

      <section className="card today-hero">
        <HeroRing emoji={me.emoji} face={me.face} level={d.level} percent={d.span ? (d.into / d.span) * 100 : 0} />
        <div className="grow">
          <div className="rankname">{rankFor(d.level, d.xp).rank.name}</div>
          <div className="row wrapRow">
            {d.hero.cls && <span className="pill">✦ {CLASS_NAMES[d.hero.cls]}</span>}
            <span className="pill" style={{ background: 'rgba(255,255,255,.1)', color: '#d6cdf5' }}>до {d.level + 1} уровня: {Math.max(0, d.span - d.into)} оп.</span>
          </div>
          <Link className="muted small" href="/hero">Герой, таланты и снаряжение →</Link>
        </div>
      </section>

      <section className="card crystal">
        <div className="row between" style={{ alignItems: 'flex-end' }}>
          <div>
            <div className="label">Очки дня</div>
            <div><span className="num">{pts}</span><span className="of">из {me.superGoal}</span></div>
          </div>
          <div className="small" style={{ textAlign: 'right', color: '#d6cdf5' }}>
            {pts >= me.goal ? 'Норма выполнена' : `до нормы ${me.goal - pts}`}<br />
            <b style={{ color: 'var(--teal)' }}>{minutes ? `+${minutes} минут игр` : 'награды пока нет'}</b>
          </div>
        </div>
        <div className="track" role="progressbar" aria-valuenow={pts} aria-valuemax={me.superGoal} aria-label="Очки дня">
          <div className="fill" style={{ width: `${Math.min(100, (pts / me.superGoal) * 100)}%` }} />
          <div className="notch" aria-hidden="true" style={{ left: `${(me.goal / me.superGoal) * 100}%` }} />
        </div>
        <div className="scale" aria-hidden="true">
          <span style={{ left: `${(me.goal / me.superGoal) * 100}%` }}>норма {me.goal}</span>
          <span style={{ left: '100%', transform: 'translateX(-100%)' }}>{me.superGoal}</span>
        </div>
        <p className="muted small">{minutes ? '' : `${me.goal} очков → ${s.config.minutes} мин игр, ${me.superGoal} → ${s.config.superMinutes} мин.`}{next && minutes ? ` До следующей награды ещё ${next - pts}.` : ''}</p>
      </section>

      <FirstSteps />

      <EveningReminder />

      <Section title="✍️ Отмечено сегодня" right={<button className="btn" onClick={() => openQuickLog('body')}>✍️ Отметить действие</button>}>
        <div className="today-marks">
          <button className="mark-tile" onClick={() => openQuickLog('body')}><span>💪</span><b>{Math.round(d.day.stats.workoutMinutes)} мин</b><small>тело{d.day.stats.warmups ? ' · зарядка ✔' : ''}</small></button>
          <button className="mark-tile" onClick={() => openQuickLog('mind')}><span>🧠</span><b>{Object.values(d.day.stats.study).reduce((a, x) => a + (x ?? 0), 0)} мин</b><small>ум · привычки {d.habits.filter((h) => h.checked).length}/{d.habits.length}</small></button>
          <button className="mark-tile" onClick={() => openQuickLog('kind')}><span>💛</span><b>{d.day.stats.deeds} из {d.deeds.cap}</b><small>добрых дел</small></button>
        </div>
      </Section>

      <TasksCard />

      <QuestsBlock />

      <BattleCard />

      <FoldGroup title="🗓 Семья и неделя" hint="цель семьи, цель недели, MVP, семейные квесты, босс" open={!!s.monthGoal.current && !s.monthGoal.current.done}>
        {s.monthGoal.current && <MonthGoalCard g={s.monthGoal.current} />}
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
