'use client';
import { useState } from 'react';
import type { FamilyQuestDto } from '@/lib/client';
import { useGame } from './Shell';
import { Section } from './ui';

type Form = { title: string; description: string; xp: string; kind: 'manual' | 'points'; target: string; period: 'day' | 'week' };
const blank: Form = { title: '', description: '', xp: '30', kind: 'manual', target: '300', period: 'day' };
const statusText = (q: FamilyQuestDto) => (q.done ? '✔ выполнен' : q.pending ? '⏳ ждёт подтверждения' : q.kind === 'points' ? `${Math.round(q.progress)}/${q.target}` : 'в процессе');

export function FamilyQuestAdmin() {
  const { s, act, toast } = useGame();
  const [f, setF] = useState<Form>(blank);
  const list = s.admin?.familyQuestsAll ?? [];
  const pending = list.filter((q) => q.pending);
  const create = () => act('saveFamilyQuest', { ...f, xp: Number(f.xp), target: Number(f.target) }).then(() => { setF({ ...blank, kind: f.kind, period: f.period }); toast('Семейный квест добавлен'); }).catch(() => {});

  return (
    <Section title={`👨‍👩‍👧‍👦 Семейные квесты${pending.length ? ` (ждут подтверждения: ${pending.length})` : ''}`}>
      <p className="muted small">Общая цель на день или неделю: когда она выполнена, опыт получают все участники. «Вручную» — вы подтверждаете сами (прогулка, уборка), «По очкам» — выполняется сам, когда вся семья наберёт нужное число очков активности.</p>
      <form className="mrow" onSubmit={(e) => { e.preventDefault(); create(); }}>
        <input value={f.title} maxLength={60} placeholder="Название (например: семейная прогулка)" onChange={(e) => setF({ ...f, title: e.target.value })} />
        <input className="wide" value={f.description} maxLength={120} placeholder="Пояснение (что сделать)" onChange={(e) => setF({ ...f, description: e.target.value })} />
        <select value={f.period} onChange={(e) => setF({ ...f, period: e.target.value as Form['period'] })}><option value="day">на сегодня</option><option value="week">на неделю</option></select>
        <select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as Form['kind'] })}><option value="manual">вручную</option><option value="points">по очкам семьи</option></select>
        {f.kind === 'points' && <label className="xpl">Цель <input className="num" inputMode="numeric" value={f.target} onChange={(e) => setF({ ...f, target: e.target.value.replace(/\D/g, '') })} /></label>}
        <label className="xpl">Опыт каждому <input className="num" inputMode="numeric" value={f.xp} onChange={(e) => setF({ ...f, xp: e.target.value.replace(/\D/g, '') })} /></label>
        <button className="btn" disabled={!f.title.trim() || !f.xp}>＋ Добавить</button>
      </form>
      <ul className="list">
        {list.length === 0 && <li className="muted">Семейных квестов пока нет.</li>}
        {list.map((q) => (
          <li key={q.id} className="wrapRow">
            <span className="grow"><b>{q.title}</b> <small className="muted">· {q.period === 'week' ? 'неделя с ' : ''}{q.date} · +{q.xp} · {statusText(q)}</small></span>
            {q.kind === 'manual' && !q.done && <button className="btn" onClick={() => act('completeFamilyQuest', { id: q.id })}>{q.pending ? 'Подтвердить' : 'Выполнено'}</button>}
            {q.kind === 'manual' && (q.done || q.pending) && <button className="btn ghost" onClick={() => act('completeFamilyQuest', { id: q.id, done: false })}>Вернуть</button>}
            <button className="btn ghost" onClick={() => { if (window.confirm('Удалить квест? Опыт за него у всех участников пропадёт.')) act('deleteFamilyQuest', { id: q.id }); }}>Удалить</button>
          </li>
        ))}
      </ul>
    </Section>
  );
}
