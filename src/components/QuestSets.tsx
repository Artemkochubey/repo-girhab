'use client';
import { useState } from 'react';
import { QUEST_SETS } from '@/lib/game/questSets';
import { useGame } from './Shell';
import { Section } from './ui';

/** Настройки: готовые и свои наборы квестов, применение нескольким участникам одной кнопкой. */
export function QuestSets() {
  const { s, act, toast } = useGame();
  const custom = s.admin!.questSets;
  const [who, setWho] = useState<number[]>(() => s.members.filter((m) => !m.isParent).map((m) => m.id));
  const [scope, setScope] = useState<'today' | 'default'>('today');
  const all = [...QUEST_SETS.map((x) => ({ ...x, custom: false })), ...custom.map((x) => ({ ...x, note: 'Свой набор', custom: true }))];
  const toggle = (id: number) => setWho(who.includes(id) ? who.filter((x) => x !== id) : [...who, id]);
  const apply = (setId: string, name: string) =>
    act('applyQuestSet', { setId, memberIds: who, date: scope }).then(() => toast(`«${name}» применён`)).catch(() => {});

  return (
    <Section title="📦 Наборы квестов">
      <p className="muted small">Готовый набор заменяет квесты выбранным героям. Минуты тренировки и учёбы подстраиваются под норму каждого.</p>
      <div className="row wrapRow">
        {s.members.map((m) => <button key={m.id} className={`btn ${who.includes(m.id) ? '' : 'ghost'}`} onClick={() => toggle(m.id)}>{who.includes(m.id) ? '✔ ' : ''}{m.emoji} {m.name}</button>)}
      </div>
      <div className="row wrapRow">
        <button className={`btn ${scope === 'today' ? '' : 'ghost'}`} onClick={() => setScope('today')}>На сегодня</button>
        <button className={`btn ${scope === 'default' ? '' : 'ghost'}`} onClick={() => setScope('default')}>На каждый день</button>
      </div>
      <div className="sets">
        {all.map((x) => (
          <div key={x.id} className="card set">
            <div className="row between"><b>{x.emoji} {x.name}</b>{x.custom && <button className="x" aria-label="Удалить набор" onClick={() => act('deleteQuestSet', { id: x.id }).then(() => toast('Набор удалён')).catch(() => {})}>✕</button>}</div>
            <small className="muted">{x.note}</small>
            <ul className="list small">{x.items.map((q, i) => <li key={i}>{q.t} <span className="muted">+{q.xp}</span></li>)}</ul>
            <button className="btn" disabled={!who.length} onClick={() => apply(x.id, x.name)}>Применить</button>
          </div>
        ))}
      </div>
      <p className="muted small">Свой набор сохраняется в редакторе квестов ниже: соберите квесты и нажмите «Сохранить как набор».</p>
    </Section>
  );
}
