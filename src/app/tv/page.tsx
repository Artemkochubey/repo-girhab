'use client';
import { useCallback, useEffect, useState } from 'react';
import { APP_EMOJI, APP_NAME, APP_VERSION } from '@/lib/brand';
import { rankFor } from '@/lib/game/ranks';
import './tv.css';

interface TvFq { id: number; title: string; description: string; xp: number; kind: 'manual' | 'points'; target: number; period: 'day' | 'week'; done: boolean; pending: boolean; progress: number }
interface Tv {
  familyQuests: TvFq[];
  mvp: { yesterday: { memberId: number; points: number } | null; leader: { memberId: number; ratio: number; qualified: boolean } | null };
  today: string;
  members: { id: number; name: string; emoji: string; color: string; goal: number; superGoal: number; badges: number; xp: number; level: number; pointsToday: number }[];
  boss: { hp: number; damage: number; defeated: boolean; byMember: Record<number, number>; mvp: number | null; boss: { name: string; emoji: string } };
  quests: { memberId: number; items: { t: string; xp: number; manual: boolean; done: boolean; pending: boolean; index: number; desc: string | null; hint: string; progress: string | null }[] }[];
}

export default function TvPage() {
  const [d, setD] = useState<Tv | null>(null);
  const [off, setOff] = useState(false);
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

  if (!d) return <div className="tv"><p className="tv-load">Загрузка…</p></div>;
  const { boss } = d;
  const hpLeft = Math.max(0, boss.hp - boss.damage);
  const pct = boss.hp ? (hpLeft / boss.hp) * 100 : 0;
  const mvp = d.members.find((m) => m.id === boss.mvp);

  return (
    <div className="tv">
      {off && <div className="tv-off">Нет связи с сервером…</div>}
      <div className="tv-brand"><b>{APP_EMOJI} {APP_NAME}</b><small>демо v{APP_VERSION}</small></div>
      <section className="tv-boss">
        <div className="tv-boss-emoji">{boss.defeated ? '🏆' : boss.boss.emoji}</div>
        <div className="tv-boss-main">
          <h1>{boss.defeated ? `${boss.boss.name} повержен!` : `Босс недели: ${boss.boss.name}`}</h1>
          <div className="tv-hp" role="progressbar" aria-valuenow={hpLeft} aria-valuemax={boss.hp}>
            <div style={{ width: `${pct}%` }} />
            <span>{hpLeft} / {boss.hp} HP</span>
          </div>
          <div className="tv-dmg">
            {d.members.map((m) => (
              <span key={m.id} style={{ color: m.color }}>{m.emoji} {m.name}: <b>{boss.byMember[m.id] ?? 0}</b></span>
            ))}
          </div>
          {boss.defeated && mvp && <p className="tv-mvp">⭐ MVP недели: {mvp.emoji} {mvp.name}</p>}
        </div>
      </section>

      <section className="tv-mvp-row">
        <div className="tv-mvpi"><span>🏆</span><div><small>MVP вчера</small><b>{(() => { const m = d.members.find((x) => x.id === d.mvp.yesterday?.memberId); return m ? `${m.emoji} ${m.name} +1 🎁` : 'не было'; })()}</b></div></div>
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
            </div>
          );
        })}
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
