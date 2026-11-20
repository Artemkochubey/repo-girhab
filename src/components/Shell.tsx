'use client';
import { Avatar } from './Face';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { post, rpc, type State } from '@/lib/client';
import { APP_EMOJI, APP_NAME, APP_VERSION } from '@/lib/brand';
import { rankFor } from '@/lib/game/ranks';
import { ClassPicker } from './ClassPicker';
import { SubclassPicker } from './SubclassPicker';
import { TABS, activeTab } from '@/lib/nav';

interface Ctx {
  s: State; date: string; setDate: (d: string) => void; reload: () => Promise<void>;
  act: (action: string, args?: Record<string, unknown>) => Promise<unknown>; toast: (m: string) => void; askPin: () => void; askClass: () => void;
}
const C = createContext<Ctx | null>(null);
export const useGame = () => useContext(C)!;

export function Shell({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<State | null>(null);
  const [date, setDate] = useState('');
  const [msg, setMsg] = useState('');
  const [pinOpen, setPinOpen] = useState(false);
  const [newAch, setNewAch] = useState<{ id: string; name: string; emoji: string; text: string }[]>([]);
  const [classLater, setClassLaterState] = useState(false);
  const setClassLater = (v: boolean) => { setClassLaterState(v); try { if (v) sessionStorage.setItem('mr_class_later', '1'); else sessionStorage.removeItem('mr_class_later'); } catch { /* без хранилища просто покажем снова */ } };
  useEffect(() => { try { if (sessionStorage.getItem('mr_class_later')) setClassLaterState(true); } catch { /* ignore */ } }, []);
  // окно выбора подкласса (с 5 уровня): «Выберу позже» действует до закрытия вкладки
  const [subLater, setSubLaterState] = useState(false);
  const setSubLater = (v: boolean) => { setSubLaterState(v); try { if (v) sessionStorage.setItem('mr_sub_later', '1'); else sessionStorage.removeItem('mr_sub_later'); } catch { /* без хранилища просто покажем снова */ } };
  useEffect(() => { try { if (sessionStorage.getItem('mr_sub_later')) setSubLaterState(true); } catch { /* ignore */ } }, []);
  const path = usePathname();

  const toast = useCallback((m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3500); }, []);
  const reload = useCallback(async () => {
    const q = date ? `?date=${date}` : '';
    const r = await fetch('/api/state' + q, { cache: 'no-store' });
    if (r.ok) setS(await r.json()); else toast('Не удалось загрузить данные');
  }, [date, toast]);
  useEffect(() => { reload(); }, [reload]);
  useEffect(() => { const t = setInterval(reload, 30000); return () => clearInterval(t); }, [reload]);

  const act = useCallback(async (action: string, args: Record<string, unknown> = {}) => {
    try { const r = await rpc(action, { date: date || undefined, ...args }); await reload(); return r; }
    catch (e) {
      const msg = (e as Error).message;
      if (msg.includes('PIN')) { setPinOpen(true); toast('Режим родителя закончился: введите PIN и повторите действие'); reload(); }
      else toast(msg);
      throw e;
    }
  }, [date, reload, toast]);

  // Новые достижения: сравниваем с тем, что игрок уже видел (хранится в браузере). Первый вход — молча запоминаем.
  const achKey = s?.me ? `mr_ach_${s.me}` : null;
  const earnedIds = s?.detail?.achievements.filter((a) => a.earnedOn).map((a) => a.id).join(',') ?? '';
  useEffect(() => {
    if (!achKey || !s?.detail || (!s.detail.hero.cls && !classLater)) return;
    try {
      const raw = localStorage.getItem(achKey);
      const earned = s.detail.achievements.filter((a) => a.earnedOn);
      if (raw === null) { localStorage.setItem(achKey, JSON.stringify(earned.map((a) => a.id))); return; }
      const seen: string[] = JSON.parse(raw);
      const fresh = earned.filter((a) => !seen.includes(a.id));
      if (fresh.length) setNewAch(fresh);
    } catch { /* без хранилища просто не показываем */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [achKey, earnedIds, classLater]);
  // Поздравление, если вчера ты стал MVP дня (показываем один раз на дату)
  const [mvpWin, setMvpWin] = useState<string | null>(null);
  const yMvp = s?.mvp?.yesterday;
  useEffect(() => {
    if (!s?.me || !yMvp || yMvp.memberId !== s.me || (!s.detail?.hero.cls && !classLater)) return;
    try { const k = `mr_mvp_${s.me}`; if (localStorage.getItem(k) !== yMvp.date) setMvpWin(yMvp.date); } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s?.me, yMvp?.date, yMvp?.memberId, classLater, s?.detail?.hero.cls]);
  const closeMvp = () => { try { if (s?.me && mvpWin) localStorage.setItem(`mr_mvp_${s.me}`, mvpWin); } catch { /* ignore */ } setMvpWin(null); };
  const closeAch = () => {
    try { if (achKey && s?.detail) localStorage.setItem(achKey, JSON.stringify(s.detail.achievements.filter((a) => a.earnedOn).map((a) => a.id))); } catch { /* ignore */ }
    setNewAch([]);
  };

  if (path.startsWith('/tv')) return <>{children}</>;
  if (!s) return <main className="wrap"><p className="muted">Загрузка…</p></main>;

  if (!s.me || !s.members.some((m) => m.id === s.me)) {
    return (
      <main className="wrap">
        <h1 className="title">⚔️ Кто ты, герой?</h1>
        <div className="grid">
          {s.members.map((m) => (
            <button key={m.id} className="card pick" style={{ borderColor: m.color }}
              onClick={async () => { await post('/api/session', { memberId: m.id }); reload(); }}>
              <Avatar m={m} size={64} /><b>{m.name}</b><span className="muted">ур. {m.level} · {rankFor(m.level, m.xp).rank.emoji} {rankFor(m.level, m.xp).rank.name}</span>
            </button>
          ))}
        </div>
      </main>
    );
  }

  const me = s.members.find((m) => m.id === s.me)!;
  return (
    <C.Provider value={{ s, date: date || s.today, setDate: (d) => setDate(d === s.today ? '' : d), reload, act, toast, askPin: () => setPinOpen(true), askClass: () => setClassLater(false) }}>
      <header className="top">
        <div className="brand"><span className="brand-name">{APP_EMOJI} {APP_NAME}</span><span className="brand-ver">демо v{APP_VERSION}</span></div>
        <nav className="tabs" aria-label="Разделы">{TABS.map((t) => <Link key={t.id} href={t.href} className={activeTab(path) === t.id ? 'on' : ''} aria-current={activeTab(path) === t.id ? 'page' : undefined}><span className="em">{t.emoji}</span><span className="lb">{t.label}</span></Link>)}</nav>
        <div className="who">
          <button className="chip" onClick={async () => { await post('/api/session', { memberId: null }); reload(); }}><Avatar m={me} size={22} /> {me.name} ⇄</button>
          {s.parent
            ? <button className="chip gold" onClick={async () => { await post('/api/pin', {}, 'DELETE'); reload(); }}>🔓 Родитель</button>
            : <button className="chip" onClick={() => setPinOpen(true)}>🔒 PIN</button>}
        </div>
      </header>
      <main className="wrap">{children}</main>
      {s.detail && !s.detail.hero.cls && !classLater && <ClassPicker memberName={me.name} onClose={() => setClassLater(true)} />}
      {s.detail && s.detail.hero.cls && s.detail.level >= 5 && !s.detail.hero.sub && !subLater && newAch.length === 0 && !mvpWin && (
        <SubclassPicker memberName={me.name} cls={s.detail.hero.cls} level={s.detail.level} recommended={(s.detail.recommendedSub as 'w' | 'm' | 'b' | 'p' | null)} onClose={() => setSubLater(true)} />
      )}
      {mvpWin && newAch.length === 0 && (
        <div className="modal" onClick={closeMvp} role="dialog" aria-label="MVP дня">
          <div className="card celebrate" onClick={(e) => e.stopPropagation()}>
            <h2>🏆 Ты MVP дня!</h2>
            <div className="big">🎁</div>
            <b>Вчера ты был лучшим в семье</b>
            <div className="muted small">Тебе начислен сундук. Открой его на экране «Герой».</div>
            <button className="btn" onClick={closeMvp}>Ура!</button>
          </div>
        </div>
      )}
      {newAch.length > 0 && (
        <div className="modal" onClick={closeAch} role="dialog" aria-label="Новое достижение">
          <div className="card celebrate" onClick={(e) => e.stopPropagation()}>
            <h2>🎉 {newAch.length > 1 ? 'Новые достижения!' : 'Новое достижение!'}</h2>
            {newAch.slice(0, 4).map((a) => (<div key={a.id}><div className="big">{a.emoji}</div><b>{a.name}</b><div className="muted small">{a.text}</div></div>))}
            {newAch.length > 4 && <div className="muted">и ещё {newAch.length - 4}</div>}
            <button className="btn" onClick={closeAch}>Круто!</button>
          </div>
        </div>
      )}
      {pinOpen && <PinModal setup={!s.pinSet} onClose={() => setPinOpen(false)} onDone={() => { setPinOpen(false); reload(); }} toast={toast} />}
      {msg && <div className="toast" role="status">{msg}</div>}
    </C.Provider>
  );
}

function PinModal({ setup, onClose, onDone, toast }: { setup: boolean; onClose: () => void; onDone: () => void; toast: (m: string) => void }) {
  const [pin, setPin] = useState('');
  const go = async () => { try { await post('/api/pin', { pin }); onDone(); } catch (e) { toast((e as Error).message); setPin(''); } };
  return (
    <div className="modal" onClick={onClose}>
      <form className="card" onClick={(e) => e.stopPropagation()} onSubmit={(e) => { e.preventDefault(); go(); }}>
        <h3>{setup ? 'Задайте PIN родителя' : 'PIN родителя'}</h3>
        <input autoFocus type="password" inputMode="numeric" pattern="\d*" maxLength={8} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} placeholder="4–8 цифр" />
        <div className="row"><button className="btn" type="submit" disabled={pin.length < 4}>OK</button><button type="button" className="btn ghost" onClick={onClose}>Отмена</button></div>
      </form>
    </div>
  );
}
