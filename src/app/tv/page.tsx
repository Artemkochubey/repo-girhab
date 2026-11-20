'use client';
import { useCallback, useEffect, useState } from 'react';
import { APP_EMOJI, APP_NAME, APP_VERSION } from '@/lib/brand';
import { ClimbRoster } from '@/components/ClimbRoster';
import { MountainClimb } from '@/components/MountainClimb';
import { rankFor } from '@/lib/game/ranks';
import { hourIn } from '@/lib/clock';
import { BossScene } from '@/components/BossScene';
import { seasonName } from '@/lib/game/seasons';
import { STUDY_KINDS } from '@/lib/db/schema';
import './tv.css';

interface TvFq { id: number; title: string; description: string; xp: number; kind: 'manual' | 'points'; target: number; period: 'day' | 'week'; done: boolean; pending: boolean; progress: number }
interface Tv {
  familyQuests: TvFq[];
  mvp: { yesterday: { memberId: number; points: number } | null; leader: { memberId: number; ratio: number; qualified: boolean } | null };
  today: string; timezone: string; reminderHour: number;
  battles: Record<number, { horde: string; emoji: string; cleared: number; hp: number; maxHp: number; outcome: string }>;
  goals: Record<number, { title: string; emoji: string; progress: number; target: number; done: boolean; manual: boolean; tier: string } | null>;
  season: { id: string; daysLeft: number; top: { memberId: number; ratio: number; points: number }[] };
  members: { id: number; name: string; emoji: string; color: string; goal: number; superGoal: number; badges: number; xp: number; level: number; pointsToday: number; look: Record<string, string> }[];
  boss: { hp: number; damage: number; defeated: boolean; byMember: Record<number, number>; mvp: number | null; boss: { name: string; emoji: string; weak: readonly string[] } };
  record: Record<number, { points: number; workoutMinutes: number; warmup: boolean; studyMinutes: number; studyByKind: Record<string, number>; books: number; habits: { id: number; name: string; checked: boolean }[] }>;
  quests: { memberId: number; items: { t: string; xp: number; manual: boolean; done: boolean; pending: boolean; index: number; desc: string | null; hint: string; progress: string | null }[] }[];
}

export default function TvPage() {
  const [d, setD] = useState<Tv | null>(null);
  const [off, setOff] = useState(false);
  const [who, setWho] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const load = useCallback(async () => {
    try { const r = await fetch('/api/tv', { cache: 'no-store' }); if (!r.ok) throw 0; setD(await r.json()); setOff(false); }
    catch { setOff(true); }
  }, []);
  useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t); }, [load]);

  // Навигация пультом: стрелки двигают фокус между кнопками.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const keys: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      if (!(e.key in keys)) return;
      const els = [...document.querySelectorAll<HTMLButtonElement>('button[data-tv]:not(:disabled)')];
      if (!els.length) return;
      const i = els.indexOf(document.activeElement as HTMLButtonElement);
      els[(i + keys[e.key] + els.length) % els.length].focus();
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const mark = async (memberId: number, index: number) => {
    await fetch('/api/tv/mark', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ memberId, index }) });
    load();
  };

  // Запись сделанного: зарядка, тренировка, учёба, привычка, книга
  const record = async (body: Record<string, unknown>, okText: string) => {
    try {
      const r = await fetch('/api/tv/record', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ memberId: who, ...body }) });
      const j = await r.json();
      setNote(r.ok ? `✔ ${okText}` : `✖ ${j.error ?? 'Не получилось'}`);
    } catch { setNote('✖ Нет связи с сервером'); }
    setTimeout(() => setNote(''), 4000);
    load();
  };

  if (!d) return <div className="tv"><p className="tv-load">Загрузка…</p></div>;
  const { boss } = d;
  const hpLeft = Math.max(0, boss.hp - boss.damage);
  const pct = boss.hp ? (hpLeft / boss.hp) * 100 : 0;
  const mvp = d.members.find((m) => m.id === boss.mvp);

  return (
    <div className="tv">
      {off && <div className="tv-off">Нет связи с сервером…</div>}
      <div className="tv-brand"><b>{APP_EMOJI} {APP_NAME}</b><small>демо v{APP_VERSION}</small></div>
      <div className="tv-top">
        <div className="tv-left">
      <section className="tv-boss">
        <div className="tv-boss-main">
          <h1>{boss.defeated ? `${boss.boss.name} повержен!` : `Босс недели: ${boss.boss.name}`}</h1>
          <div className="tv-hp" role="progressbar" aria-valuenow={hpLeft} aria-valuemax={boss.hp}>
            <div style={{ width: `${pct}%` }} />
            <span>{hpLeft} / {boss.hp} HP</span>
          </div>
          <BossScene tv boss={boss.boss} hp={boss.hp} damage={boss.damage} defeated={boss.defeated}
            party={d.members.map((m) => ({ id: m.id, name: m.name, emoji: m.emoji, color: m.color, look: m.look, damage: boss.byMember[m.id] ?? 0 }))} />
          {boss.defeated && mvp && <p className="tv-mvp">⭐ MVP недели: {mvp.emoji} {mvp.name}</p>}
        </div>
      </section>

      <section className="tv-mvp-row">
        <div className="tv-mvpi"><span>🏆</span><div><small>MVP вчера</small><b>{(() => { const m = d.members.find((x) => x.id === d.mvp.yesterday?.memberId); return m ? `${m.emoji} ${m.name} +1 🎁` : 'не было'; })()}</b></div></div>
        <div className="tv-mvpi"><span>🏆</span><div><small>Сезон {seasonName(d.season.id)} · осталось {d.season.daysLeft} дн.</small><b>{(() => { const t = d.season.top.filter((r) => r.points > 0).slice(0, 3); return t.length ? t.map((r, i) => { const m = d.members.find((x) => x.id === r.memberId); return m ? `${['🥇', '🥈', '🥉'][i]} ${m.emoji} ${Math.round(r.ratio * 100)}%` : ''; }).join('  ') : 'пока никого'; })()}</b></div></div>
        <div className="tv-mvpi"><span>⚡</span><div><small>Сегодня лидирует</small><b>{(() => { const m = d.members.find((x) => x.id === d.mvp.leader?.memberId); return m ? `${m.emoji} ${m.name} · ${Math.round(d.mvp.leader!.ratio * 100)}%` : 'пока никого'; })()}</b></div></div>
      </section>

      {d.familyQuests.length > 0 && (
        <section className="tv-fq">
          {d.familyQuests.map((q) => (
            <div key={q.id} className={`tv-fqi ${q.done ? 'done' : ''}`}>
              <div className="tv-fqt"><span>👨‍👩‍👧‍👦</span><div><b>{q.title}</b>{q.description && <small>{q.description}</small>}</div><em>+{q.xp} каждому</em></div>
              {q.kind === 'points'
                ? <div className="tv-pts"><div style={{ width: `${Math.min(100, (q.progress / q.target) * 100)}%`, background: '#4cae6a' }} /></div>
                : <div className="tv-fqs">{q.done ? '✔ Выполнено!' : q.pending ? '⏳ Ждём подтверждения родителей' : 'Сделайте вместе и скажите родителям'}</div>}
              {q.kind === 'points' && <div className="tv-pts-label">{Math.round(q.progress)} / {q.target}{q.done ? ' ✔' : ''}</div>}
            </div>
          ))}
        </section>
      )}

      <section className="tv-heroes">
        {d.members.map((m) => {
          const pct = Math.min(100, (m.pointsToday / m.superGoal) * 100);
          return (
            <div key={m.id} className="tv-hero" style={{ borderColor: m.color }}>
              <div className="tv-hero-top"><span className="tv-av">{m.emoji}</span><div><b>{m.name}</b><small>уровень {m.level} · {rankFor(m.level, m.xp).rank.emoji} {rankFor(m.level, m.xp).rank.name} · 🏅 {m.badges}</small></div></div>
              <div className="tv-pts"><div style={{ width: `${pct}%`, background: m.color }} /></div>
              <div className="tv-pts-label">{m.pointsToday} / {m.superGoal}{m.pointsToday >= m.goal ? ' ✓' : ''}</div>
              {(() => {
                const bt = d.battles[m.id];
                return bt && (
                  <div className={`tv-goal ${bt.outcome === 'victory' ? 'done' : ''}`}>
                    <span>{bt.emoji} {bt.horde}: волн {bt.cleared}/3{bt.outcome === 'victory' ? ' 🏆' : ''} · ❤️ {bt.hp}</span>
                    <div className="tv-pts"><div style={{ width: `${(bt.cleared / 3) * 100}%`, background: bt.outcome === 'victory' ? '#4cae6a' : '#c0392b' }} /></div>
                  </div>
                );
              })()}
              {(() => {
                const g = d.goals[m.id];
                if (!g) return <div className="tv-goal muted">🎯 цель недели не выбрана</div>;
                return (
                  <div className={`tv-goal ${g.done ? 'done' : ''}`}>
                    <span>{g.emoji} {g.title}</span>
                    {g.manual ? <b>{g.done ? '✔' : '…'}</b> : <><div className="tv-pts"><div style={{ width: `${Math.min(100, (g.progress / g.target) * 100)}%`, background: g.done ? '#4cae6a' : m.color }} /></div><b>{g.progress}/{g.target}{g.done ? ' ✔' : ''}</b></>}
                  </div>
                );
              })()}
            </div>
          );
        })}
      </section>

        </div>
        <section className="tv-mountain">
          <h2>⛰ Восхождение семьи</h2>
          <div className="tv-mountain-box">
            <MountainClimb tv climbers={d.members.map((m) => ({ id: m.id, name: m.name, emoji: m.emoji, color: m.color, level: m.level, xp: m.xp }))} />
          </div>
          <ClimbRoster climbers={d.members.map((m) => ({ id: m.id, name: m.name, emoji: m.emoji, color: m.color, level: m.level, xp: m.xp }))} />
        </section>
      </div>

      <section className="tv-rec">
        <h2>✍️ Записать сделанное</h2>
        <div className="tv-rec-who">
          {d.members.map((m) => (
            <button key={m.id} data-tv className={`tv-who ${who === m.id ? 'on' : ''}`} style={{ borderColor: m.color }} onClick={() => setWho(who === m.id ? null : m.id)}>
              <span>{m.emoji}</span><b>{m.name}</b>
            </button>
          ))}
        </div>
        {note && <div className="tv-note" role="status">{note}</div>}
        {who === null && <p className="tv-hint">Выберите героя, чтобы записать, что он сделал сегодня.</p>}
        {who !== null && (() => {
          const m = d.members.find((x) => x.id === who)!;
          const r = d.record[who];
          const mins = [15, 30, 45, 60];
          return (
            <div className="tv-rec-grid">
              <div className="tv-rec-sum">{m.emoji} {m.name} сегодня: <b>{r.points}</b> очков · тренировка {r.workoutMinutes} мин · учёба {r.studyMinutes} мин · зарядка {r.warmup ? '✔' : '—'} · привычки {r.habits.filter((h) => h.checked).length}/{r.habits.length}</div>
              <div className="tv-rec-row"><span>🔥 Зарядка</span>
                <button data-tv className={`tv-b ${r.warmup ? 'done' : ''}`} disabled={r.warmup} onClick={() => record({ kind: 'warmup' }, 'Зарядка записана')}>{r.warmup ? '✔ Сделана' : 'Сделал(а) зарядку'}</button></div>
              <div className="tv-rec-row"><span>🏃 Тренировка</span>
                {mins.map((n) => <button key={n} data-tv className="tv-b" onClick={() => record({ kind: 'workout', minutes: n }, `Тренировка +${n} мин`)}>+{n} мин</button>)}</div>
              {STUDY_KINDS.map((k) => (
                <div key={k} className="tv-rec-row"><span>📚 {k}{r.studyByKind[k] ? ` · ${r.studyByKind[k]}` : ''}</span>
                  {[15, 30, 45].map((n) => <button key={n} data-tv className="tv-b" onClick={() => record({ kind: 'study', studyKind: k, minutes: n }, `${k} +${n} мин`)}>+{n} мин</button>)}</div>
              ))}
              <div className="tv-rec-row"><span>📖 Книга</span>
                <button data-tv className="tv-b" onClick={() => record({ kind: 'book' }, 'Книга прочитана (+50)')}>Прочитал(а) книгу</button></div>
              {r.habits.length > 0 && (
                <div className="tv-rec-row wrap"><span>✅ Привычки</span>
                  {r.habits.map((h) => (
                    <button key={h.id} data-tv className={`tv-b ${h.checked ? 'done' : ''}`} disabled={h.checked} onClick={() => record({ kind: 'habit', habitId: h.id }, 'Привычка отмечена')}>{h.checked ? '✔ ' : ''}{h.name}</button>
                  ))}</div>
              )}
              <p className="tv-hint">Записи на ТВ нельзя отменить: если ошиблись, скажите родителям.</p>
            </div>
          );
        })()}
      </section>

      <section className="tv-quests">
        {d.members.map((m) => {
          const q = d.quests.find((x) => x.memberId === m.id)?.items ?? [];
          return (
            <div key={m.id} className="tv-qcol">
              <h2 style={{ color: m.color }}>{m.emoji} {m.name}</h2>
              {q.map((it) => (
                <button key={it.index} data-tv className={`tv-q ${it.done ? 'done' : it.pending ? 'wait' : ''}`}
                  disabled={!it.manual || it.done} onClick={() => mark(m.id, it.index)}>
                  <span className="tv-mark">{it.done ? '✔' : it.pending ? '⏳' : it.manual ? '○' : '⚙'}</span>
                  <span className="tv-qt">{it.t}{it.desc && <small className="tv-desc">{it.desc}</small>}<small>{it.progress && !it.done ? `${it.progress} · ` : ''}{it.hint}</small></span><b>+{it.xp}</b>
                </button>
              ))}
            </div>
          );
        })}
      </section>
      <footer className="tv-foot">⚙ — засчитывается само · ○ — нажмите, родитель подтвердит · обновление каждые 10 с</footer>
    </div>
  );
}
