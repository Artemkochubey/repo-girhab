'use client';
import { useCallback, useEffect, useState } from 'react';
import { useGame } from '@/components/Shell';
import { Bar, Section } from '@/components/ui';
import { addDays } from '@/lib/date';
import type { Report, ReportMember } from '@/lib/services/report';

const MONTHS = ['января', 'февраля', 'марта', 'апреля', 'мая', 'июня', 'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря'];
const WD = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const dm = (d: string) => `${Number(d.slice(8))} ${MONTHS[Number(d.slice(5, 7)) - 1]}`;

const Delta = ({ v }: { v: number | null }) => v === null ? <span className="muted small">нет данных за прошлую неделю</span>
  : <span className={`delta ${v >= 0 ? 'up' : 'down'}`}>{v >= 0 ? '▲' : '▼'} {Math.abs(v)}%</span>;

function DailyChart({ m }: { m: ReportMember }) {
  const max = Math.max(m.superGoal * 1.2, ...m.daily.map((d) => d.points), 1);
  return (
    <div className="dchart" aria-label="Очки по дням">
      <div className="dbars">
        <div className="dgoal" style={{ bottom: `${(m.goal / max) * 100}%` }} title={`Норма ${m.goal}`} />
        {m.daily.map((d) => (
          <div key={d.date} className="dbar-wrap"><div className={`dbar ${!d.counted ? 'off' : d.hitGoal ? 'ok' : d.points > 0 ? 'mid' : 'zero'}`} style={{ height: `${Math.max(d.counted && d.points > 0 ? 4 : 0, (d.points / max) * 100)}%` }} /></div>
        ))}
      </div>
      <div className="dlabels">
        {m.daily.map((d, i) => <div key={d.date}><small>{WD[i]}</small><small className="muted">{d.counted ? Math.round(d.points) : ''}</small></div>)}
      </div>
    </div>
  );
}

function MemberCard({ m }: { m: ReportMember }) {
  const q = m.quests;
  return (
    <section className="card rep-member" style={{ borderColor: m.color }}>
      <div className="row between wrapRow">
        <h2 style={{ color: m.color }}>{m.emoji} {m.name}</h2>
        <div className="row"><b className="big-n">{Math.round(m.points)}</b><span className="muted">очков</span><Delta v={m.deltaPct} /></div>
      </div>
      <DailyChart m={m} />
      <div className="kpis">
        <div><b>{m.activeDays}/{m.daysCounted}</b><small>активных дней</small></div>
        <div><b>{m.goalDays}</b><small>дней с нормой ({m.goal})</small></div>
        <div><b>{q.total ? `${q.done}/${q.total}` : '—'}</b><small>квестов за прошедшие дни</small></div>
        <div><b>{m.levelStart === m.levelEnd ? m.levelEnd : `${m.levelStart}→${m.levelEnd}`}</b><small>уровень</small></div>
      </div>

      <table className="rep-table"><thead><tr><th>Сфера</th><th>Неделя</th><th>Прошлая</th><th /></tr></thead><tbody>
        {m.spheres.map((sp) => {
          const d = sp.prev > 0 ? Math.round(((sp.value - sp.prev) / sp.prev) * 100) : null;
          return <tr key={sp.key}><td>{sp.label}</td><td><b>{sp.value}</b> <small className="muted">{sp.unit}</small></td><td className="muted">{sp.prev}</td><td>{d !== null && d !== 0 ? <span className={`delta ${d > 0 ? 'up' : 'down'}`}>{d > 0 ? '▲' : '▼'} {Math.abs(d)}%</span> : ''}</td></tr>;
        })}
      </tbody></table>

      {m.warn.length > 0 && <div className="rep-box warn"><b>⚠ На что обратить внимание</b><ul>{m.warn.map((w, i) => <li key={i}>{w}</li>)}</ul></div>}
      {q.missed.length > 0 && (
        <div className="rep-box"><b>Невыполненные квесты</b>
          <ul>{q.missed.map((x) => <li key={x.title}>{x.title} <small className="muted">· {x.times} {x.times === 1 ? 'день' : 'дн.'}</small></li>)}</ul></div>
      )}
      {m.good.length > 0 && <div className="rep-box good"><b>✔ Что получилось</b><ul>{m.good.map((g, i) => <li key={i}>{g}</li>)}</ul></div>}
      {(m.newAchievements.length > 0 || m.mvpDays.length > 0) && (
        <p className="small">{m.newAchievements.map((a) => `${a.emoji} ${a.name}`).join(' · ')}{m.newAchievements.length > 0 && m.mvpDays.length > 0 ? ' · ' : ''}{m.mvpDays.length > 0 ? `🏆 MVP дня: ${m.mvpDays.length}` : ''}</p>
      )}
    </section>
  );
}

export default function ReportPage() {
  const { s, toast } = useGame();
  const [week, setWeek] = useState<string | null>(null);
  const [r, setR] = useState<Report | null>(null);
  const [err, setErr] = useState('');

  const load = useCallback(async (w: string | null) => {
    try {
      const res = await fetch(`/api/report${w ? `?week=${w}` : ''}`, { cache: 'no-store' });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error ?? 'Ошибка');
      setR(j); setErr('');
    } catch (e) { setErr((e as Error).message); toast((e as Error).message); }
  }, [toast]);
  useEffect(() => { if (s.parent) load(week); }, [s.parent, week, load]);

  if (!s.parent) return <><h1 className="title">📊 Отчёт</h1><section className="card"><p>Отчёт доступен только родителям. Нажмите «🔒 PIN» вверху.</p></section></>;
  if (!r) return <><h1 className="title">📊 Отчёт</h1><p className="muted">{err || 'Загрузка…'}</p></>;

  const nameOf = (id: number) => s.members.find((m) => m.id === id);
  const f = r.family;
  return (
    <>
      <div className="row between wrapRow">
        <h1 className="title">📊 Отчёт за неделю</h1>
        <div className="row noprint">
          <button className="btn ghost" disabled={r.weekStart <= r.earliestWeek} onClick={() => setWeek(addDays(r.weekStart, -7))}>← Раньше</button>
          <button className="btn ghost" disabled={r.isCurrent} onClick={() => setWeek(addDays(r.weekStart, 7))}>Позже →</button>
          <button className="btn ghost" onClick={() => window.print()}>🖨 Печать</button>
        </div>
      </div>
      <p className="muted">{dm(r.weekStart)} – {dm(r.weekEnd)}{r.isCurrent ? ` · идёт, учтено дней: ${r.daysElapsed} из 7 (сравнение с теми же днями прошлой недели)` : ''}</p>

      <Section title="👨‍👩‍👧‍👦 Семья">
        <div className="row wrapRow"><b className="big-n">{Math.round(f.points)}</b><span className="muted">очков вместе</span><Delta v={f.deltaPct} /></div>
        {f.boss && (
          <div>
            <div className="row between"><span>{f.boss.emoji} {f.boss.name}</span><small className="muted">{f.boss.defeated ? '🏆 повержен' : f.boss.finished ? 'не побеждён' : 'бой идёт'}</small></div>
            <Bar value={Math.max(0, f.boss.hp - f.boss.damage)} max={f.boss.hp} color="var(--danger)" label={`${Math.round(Math.min(f.boss.damage, f.boss.hp))} / ${f.boss.hp} урона`} />
          </div>
        )}
        {f.mvp.length > 0 && <p className="small">🏆 MVP дней: {f.mvp.map((x) => `${WD[(new Date(x.date + 'T00:00:00Z').getUTCDay() + 6) % 7]} ${nameOf(x.memberId)?.emoji ?? ''} ${nameOf(x.memberId)?.name ?? ''}`).join(' · ')}</p>}
        {f.familyQuests.length > 0 && <p className="small">👨‍👩‍👧‍👦 Семейные квесты выполнены: {f.familyQuests.map((q) => `${q.title} (+${q.xp})`).join(', ')}</p>}
      </Section>

      {r.members.map((m) => <MemberCard key={m.id} m={m} />)}
    </>
  );
}
