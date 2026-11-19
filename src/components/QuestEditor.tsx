'use client';
import { useState } from 'react';
import { STUDY_KINDS } from '@/lib/db/schema';
import type { QuestDto } from '@/lib/client';
import { useGame } from './Shell';

const KINDS = [['manual', 'Вручную (родитель подтвердит)'], ['warmup', 'Зарядка (само)'], ['workout', 'Тренировка, мин (само)'], ['habits', 'Привычки, шт. (само)'], ['study', 'Учёба, мин (само)']] as const;
const blank = (): QuestDto => ({ t: '', xp: 20, k: 'manual' });

export function QuestEditor({ memberId, onSaved }: { memberId: number; onSaved?: () => void }) {
  const { s, act, toast } = useGame();
  const info = s.admin!.quests[memberId];
  const [items, setItems] = useState<QuestDto[]>(() => info.items.map((q) => ({ t: q.t, d: q.d, xp: q.xp, k: q.k, m: q.m, kind: q.kind })));
  const [scope, setScope] = useState<'today' | 'default'>('today');
  const set = (i: number, p: Partial<QuestDto>) => setItems(items.map((q, j) => (j === i ? { ...q, ...p } : q)));

  const save = async () => {
    const clean = items.map((q) => ({
      t: q.t, d: q.d, xp: q.xp, k: q.k,
      m: q.k === 'workout' || q.k === 'habits' || q.k === 'study' ? q.m ?? 1 : undefined,
      kind: q.k === 'study' ? q.kind ?? 'any' : undefined,
    }));
    try { await act('setQuests', { memberId, date: scope === 'default' ? 'default' : s.today, items: clean }); toast('Квесты сохранены'); onSaved?.(); } catch { /* toast уже показан */ }
  };

  return (
    <div className="qe">
      <div className="row wrapRow">
        <button className={`btn ${scope === 'today' ? '' : 'ghost'}`} onClick={() => setScope('today')}>На сегодня</button>
        <button className={`btn ${scope === 'default' ? '' : 'ghost'}`} onClick={() => setScope('default')}>На каждый день{info.hasDefault ? ' ✔' : ''}</button>
      </div>
      {items.map((q, i) => (
        <div key={i} className="qe-row">
          <input value={q.t} maxLength={60} placeholder="Название (до 60 символов)" onChange={(e) => set(i, { t: e.target.value })} />
          <input className="qe-desc" value={q.d ?? ''} maxLength={120} placeholder="Пояснение: что именно сделать (необязательно)" onChange={(e) => set(i, { d: e.target.value })} />
          <select value={q.k} onChange={(e) => set(i, { k: e.target.value, m: q.m ?? 1 })}>{KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
          {q.k === 'study' && (
            <select value={q.kind ?? 'any'} onChange={(e) => set(i, { kind: e.target.value })}>
              <option value="any">любая</option>{STUDY_KINDS.map((k) => <option key={k}>{k}</option>)}
            </select>
          )}
          {(q.k === 'workout' || q.k === 'habits' || q.k === 'study') && (
            <input className="num" inputMode="numeric" value={q.m ?? ''} onChange={(e) => set(i, { m: Number(e.target.value.replace(/\D/g, '')) })} aria-label="Минуты или штуки" />
          )}
          <label className="xpl">XP <input className="num" inputMode="numeric" value={q.xp} onChange={(e) => set(i, { xp: Number(e.target.value.replace(/\D/g, '')) })} /></label>
          <button className="x" onClick={() => setItems(items.filter((_, j) => j !== i))} aria-label="Удалить квест">✕</button>
        </div>
      ))}
      <div className="row wrapRow">
        <button className="btn ghost" disabled={items.length >= 5} onClick={() => setItems([...items, blank()])}>＋ Квест</button>
        <button className="btn" disabled={!items.length} onClick={save}>Сохранить</button>
        <button className="btn ghost" onClick={async () => { await act('resetQuests', { memberId, date: scope === 'default' ? 'default' : s.today }); toast('Возвращены случайные квесты'); }}>Вернуть случайные</button>
      </div>
      <p className="muted small">Квесты «на сегодня» сбросят сегодняшние отметки. Шаблон «на каждый день» действует, пока не задан квест на конкретный день.</p>
    </div>
  );
}
