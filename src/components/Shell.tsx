'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { post, rpc, type State } from '@/lib/client';
import { ClassPicker } from './ClassPicker';

interface Ctx {
  s: State; date: string; setDate: (d: string) => void; reload: () => Promise<void>;
  act: (action: string, args?: Record<string, unknown>) => Promise<unknown>; toast: (m: string) => void; askPin: () => void;
}
const C = createContext<Ctx | null>(null);
export const useGame = () => useContext(C)!;

const NAV = [['/', '🏠 Сегодня'], ['/hero', '🛡 Герой'], ['/body', '💪 Тело'], ['/mind', '🧠 Ум'], ['/shop', '🛍 Магазин'], ['/settings', '⚙️ Настройки']] as const;

export function Shell({ children }: { children: React.ReactNode }) {
  const [s, setS] = useState<State | null>(null);
  const [date, setDate] = useState('');
  const [msg, setMsg] = useState('');
  const [pinOpen, setPinOpen] = useState(false);
  const [classLater, setClassLater] = useState(false);
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
              <span className="big">{m.emoji}</span><b>{m.name}</b><span className="muted">ур. {m.level}</span>
            </button>
          ))}
        </div>
      </main>
    );
  }

  const me = s.members.find((m) => m.id === s.me)!;
  return (
    <C.Provider value={{ s, date: date || s.today, setDate: (d) => setDate(d === s.today ? '' : d), reload, act, toast, askPin: () => setPinOpen(true) }}>
      <header className="top">
        <nav>{NAV.map(([h, l]) => <Link key={h} href={h} className={path === h ? 'on' : ''}>{l}</Link>)}</nav>
        <div className="who">
          <button className="chip" onClick={async () => { await post('/api/session', { memberId: null }); reload(); }}>{me.emoji} {me.name} ⇄</button>
          {s.parent
            ? <button className="chip gold" onClick={async () => { await post('/api/pin', {}, 'DELETE'); reload(); }}>🔓 Родитель</button>
            : <button className="chip" onClick={() => setPinOpen(true)}>🔒 PIN</button>}
        </div>
      </header>
      <main className="wrap">{children}</main>
      {s.detail && !s.detail.hero.cls && !classLater && <ClassPicker memberName={me.name} onClose={() => setClassLater(true)} />}
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
