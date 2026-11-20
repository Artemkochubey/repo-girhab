'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { post, rpc, type State } from '@/lib/client';
import { APP_EMOJI, APP_NAME, APP_VERSION } from '@/lib/brand';
import { rankFor } from '@/lib/game/ranks';
import { ClassPicker } from './ClassPicker';
import { SubclassPicker } from './SubclassPicker';
import { TABS, activeTab } from '@/lib/nav';
import { QuickLog } from './QuickLog';
import { RELEASES } from '@/lib/changelogData';

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
  // Escape закрывает верхнее окно (нажатие на фон окна уже закрывает его)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key !== 'Escape') return; const m = [...document.querySelectorAll<HTMLElement>('.modal')].pop(); if (m) { m.click(); e.preventDefault(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  // точка на «Ещё», пока не открыта страница «Что нового» после обновления (первый запуск молча запоминаем)
  const [newVersion, setNewVersion] = useState(false);
  useEffect(() => {
    try {
      const cur = RELEASES[0]?.version ?? '';
      const seen = localStorage.getItem('mr_seen_version');
      if (seen === null) localStorage.setItem('mr_seen_version', cur);
      else setNewVersion(seen !== cur && !path.startsWith('/about'));
    } catch { /* без хранилища точку не показываем */ }
  }, [path]);

  const toast = useCallback((m: string) => { setMsg(m); setTimeout(() => setMsg(''), 3500); }, []);
  const [offline, setOffline] = useState(false);
  const reload = useCallback(async () => {
    const q = date ? `?date=${date}` : '';
    try {
      const r = await fetch('/api/state' + q, { cache: 'no-store' });
      if (r.ok) { setS(await r.json()); setOffline(false); } else { setOffline(false); toast('Сервер не смог загрузить данные. Подождите минуту и обновите страницу.'); }
    } catch { setOffline(true); }
  }, [date, toast]);
  useEffect(() => { reload(); }, [reload]);
  // пока связи нет, пробуем снова каждые 5 секунд, иначе раз в полминуты
  useEffect(() => { const t = setInterval(reload, offline ? 5000 : 30000); return () => clearInterval(t); }, [reload, offline]);
  useEffect(() => { const on = () => reload(); const off = () => setOffline(true); window.addEventListener('online', on); window.addEventListener('offline', off); return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); }; }, [reload]);

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
  if (!s) return <main className="wrap"><p className="muted">{offline ? 'Нет связи с сервером. Проверьте, что сайт запущен. Пробуем снова…' : 'Загрузка…'}</p></main>;

  if (!s.me || !s.members.some((m) => m.id === s.me)) {
    return (
      <main className="wrap">
        <h1 className="title">⚔️ Кто ты, герой?</h1>
        <div className="grid">
          {s.members.map((m) => (
            <button key={m.id} className="card pick" style={{ borderColor: m.color }}
              onClick={async () => { await post('/api/session', { memberId: m.id }); reload(); }}>
              <span className="big">{m.emoji}</span><b>{m.name}</b><span className="muted">ур. {m.level} · {rankFor(m.level, m.xp).rank.emoji} {rankFor(m.level, m.xp).rank.name}</span>
            </button>
          ))}
        </div>
      </main>
    );
  }

  const me = s.members.find((m) => m.id === s.me)!;
  return (
    <C.Provider value={{ s, date: date || s.today, setDate: (d) => setDate(d === s.today ? '' : d), reload, act, toast, askPin: () => setPinOpen(true), askClass: () => setClassLater(false) }}>
      <a className="skip-link" href="#main">К содержимому</a>
      <header className="top">
        <div className="brand"><span className="brand-name">{APP_EMOJI} {APP_NAME}</span><span className="brand-ver">демо v{APP_VERSION}</span></div>
        <nav className="tabs" aria-label="Разделы">{TABS.map((t) => <Link key={t.id} href={t.href} className={activeTab(path) === t.id ? 'on' : ''} aria-current={activeTab(path) === t.id ? 'page' : undefined}><span className="em">{t.emoji}</span><span className="lb">{t.label}</span>{t.id === 'more' && newVersion && <i className="new-dot" aria-label="есть новое" />}</Link>)}</nav>
        <div className="who">
          <button className="chip" onClick={async () => { await post('/api/session', { memberId: null }); reload(); }}>{me.emoji} {me.name} ⇄</button>
          {s.parent
            ? <button className="chip gold" onClick={async () => { await post('/api/pin', {}, 'DELETE'); reload(); }}>🔓 Родитель</button>
            : <button className="chip" onClick={() => setPinOpen(true)}>🔒 PIN</button>}
        </div>
      </header>
      <main className="wrap" id="main" tabIndex={-1}>{children}</main>
      {s.detail && (s.detail.hero.cls || classLater) && <QuickLog />}
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
            <div className="muted small">Тебе начислен сундук. Открой его во вкладке «Добыча».</div>
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
      {offline && <div className="offline-bar" role="alert">⚠ Нет связи с сервером. Новые записи не сохранятся. Пробуем подключиться снова…</div>}
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
