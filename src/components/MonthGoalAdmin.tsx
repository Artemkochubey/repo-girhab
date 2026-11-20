'use client';
import { useEffect, useState } from 'react';
import { MONTH_GOAL_INFO, MONTH_GOAL_KINDS, type MonthGoalKind } from '@/lib/game/monthGoal';
import { MonthGoalCard } from './MonthGoalCard';
import { useGame } from './Shell';
import { Section } from './ui';

const EMOJI = ['🏕', '🎬', '🎢', '🍕', '🏊', '🚗', '🎁', '🎳'];

/** Настройки родителя: цель семьи на месяц и отметка «награда получена». */
export function MonthGoalAdmin() {
  const { s, act, toast } = useGame();
  const mg = s.monthGoal;
  const cur = mg.current;
  const [f, setF] = useState({ title: '', emoji: '🏕', kind: 'points' as MonthGoalKind, target: '', reward: '' });
  useEffect(() => { if (cur) setF({ title: cur.title, emoji: cur.emoji, kind: cur.kind, target: String(cur.target), reward: cur.reward }); }, [cur?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const suggest = mg.suggest[f.kind];
  const save = () => act('saveMonthGoal', { title: f.title, emoji: f.emoji, kind: f.kind, target: Number(f.target), reward: f.reward }).then(() => toast('Цель семьи сохранена')).catch(() => {});
  return (
    <Section title="🏕 Цель семьи на месяц">
      <p className="muted small">Общая цель для всех героев и общая награда: поход, кино, поездка. Прогресс считается сам. Цель можно поменять в любой момент, награду родитель отмечает выданной.</p>
      {cur && <MonthGoalCard g={cur} />}
      {mg.previous && mg.previous.done && (
        <div className="confirm"><b>Прошлый месяц: «{mg.previous.title}» достигнута.</b> {mg.previous.reward && <span>Награда: {mg.previous.reward}</span>}
          <button className="btn" onClick={() => act('giveMonthGoal', { id: mg.previous!.id }).then(() => toast('Награда отмечена выданной')).catch(() => {})}>✔ Награда выдана</button></div>
      )}
      <div className="grid2">
        <label>Название<input value={f.title} maxLength={60} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Поход в кино" /></label>
        <label>Награда<input value={f.reward} maxLength={80} onChange={(e) => setF({ ...f, reward: e.target.value })} placeholder="Всей семьёй в кино" /></label>
        <label>Вид цели<select value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value as MonthGoalKind, target: '' })}>{MONTH_GOAL_KINDS.map((k) => <option key={k} value={k}>{MONTH_GOAL_INFO[k].emoji} {MONTH_GOAL_INFO[k].name}</option>)}</select></label>
        <label>Сколько ({MONTH_GOAL_INFO[f.kind].unit})<span className="row"><input className="num" inputMode="numeric" value={f.target} onChange={(e) => setF({ ...f, target: e.target.value.replace(/\D/g, '') })} placeholder={String(suggest)} /><button type="button" className="btn ghost sm" onClick={() => setF({ ...f, target: String(suggest) })}>Подсказка: {suggest}</button></span></label>
      </div>
      <div className="row wrapRow">{EMOJI.map((e) => <button key={e} className={`btn sm ${f.emoji === e ? '' : 'ghost'}`} onClick={() => setF({ ...f, emoji: e })}>{e}</button>)}</div>
      <div className="row wrapRow">
        <button className="btn" disabled={!f.title.trim() || !Number(f.target)} onClick={save}>{cur ? '💾 Обновить цель' : '➕ Поставить цель'}</button>
        {cur && cur.done && <button className="btn ghost" onClick={() => act('giveMonthGoal', { id: cur.id, undo: cur.given }).then(() => toast(cur.given ? 'Отметка снята' : 'Награда отмечена выданной')).catch(() => {})}>{cur.given ? '↩ Награда ещё не выдана' : '✔ Награда выдана'}</button>}
        {cur && <button className="btn ghost" onClick={() => act('deleteMonthGoal', { id: cur.id }).then(() => { setF({ title: '', emoji: '🏕', kind: 'points', target: '', reward: '' }); toast('Цель удалена'); }).catch(() => {})}>🗑 Удалить</button>}
      </div>
    </Section>
  );
}
