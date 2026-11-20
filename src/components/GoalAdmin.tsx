'use client';
import { useState } from 'react';
import { GOAL_INFO, TIER_NAMES, TIERS, type GoalKind, type GoalTier } from '@/lib/game/goals';
import { useGame } from './Shell';
import { Section } from './ui';

/** Настройки: своя цель недели для героя (родитель отмечает выполнение), подтверждение и сброс цели. */
export function GoalAdmin() {
  const { s, act, toast } = useGame();
  const manual = s.admin!.manualGoals;
  const [form, setForm] = useState<{ memberId: number; title: string; tier: GoalTier }>({ memberId: s.members.find((m) => !m.isParent)?.id ?? s.members[0].id, title: '', tier: 'mid' });
  const ok = (m: string) => () => toast(m);
  return (
    <Section title="🎯 Цели недели">
      <p className="muted small">Герои сами выбирают цель в понедельник–среду. Здесь можно задать свою цель (например, «прочитать 2 главы»): выполнение вы отмечаете сами. Награда за неё как за выбранную сложность.</p>
      <form className="mrow" onSubmit={(e) => { e.preventDefault(); act('setCustomGoal', form).then(() => { setForm({ ...form, title: '' }); toast('Цель задана'); }).catch(() => {}); }}>
        <select value={form.memberId} onChange={(e) => setForm({ ...form, memberId: Number(e.target.value) })} aria-label="Герой">{s.members.map((m) => <option key={m.id} value={m.id}>{m.emoji} {m.name}</option>)}</select>
        <input value={form.title} maxLength={80} placeholder="Цель на эту неделю" onChange={(e) => setForm({ ...form, title: e.target.value })} />
        <select value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value as GoalTier })} aria-label="Сложность">{TIERS.map((t) => <option key={t} value={t}>{TIER_NAMES[t]}</option>)}</select>
        <button className="btn" disabled={!form.title.trim()}>Задать</button>
      </form>
      <ul className="list">
        {manual.length === 0 && <li className="muted">Своих целей на этой и прошлой неделе нет.</li>}
        {manual.map((g) => {
          const m = s.members.find((x) => x.id === g.memberId);
          return (
            <li key={`${g.memberId}-${g.weekStart}`} className="wrapRow">
              <span className="grow">{m?.emoji} {m?.name}: <b>{g.title}</b> <small className="muted">({TIER_NAMES[g.tier]}, неделя с {g.weekStart}{g.finished ? ', закончилась' : ''})</small></span>
              {g.confirmed
                ? <button className="btn ghost sm" onClick={() => act('confirmGoal', { memberId: g.memberId, weekStart: g.weekStart, undo: true }).then(ok('Снято')).catch(() => {})}>↩ Снять отметку</button>
                : <button className="btn" onClick={() => act('confirmGoal', { memberId: g.memberId, weekStart: g.weekStart }).then(ok('Цель отмечена выполненной')).catch(() => {})}>✔ Выполнено</button>}
            </li>
          );
        })}
      </ul>
      <div className="row wrapRow">
        {s.members.map((m) => <button key={m.id} className="btn ghost sm" onClick={() => act('clearGoal', { memberId: m.id }).then(ok(`Цель ${m.name} сброшена`)).catch(() => {})}>Сбросить цель: {m.emoji} {m.name}</button>)}
      </div>
      <p className="muted small">Прогресс автоматических целей считается из записей: {Object.values(GOAL_INFO).map((i) => i.name).join(', ')}.</p>
    </Section>
  );
}
