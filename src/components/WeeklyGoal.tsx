'use client';
import { useState } from 'react';
import { GOAL_INFO, TIER_NAMES, type GoalKind, type GoalTier } from '@/lib/game/goals';
import type { GoalStateDto } from '@/lib/client';
import { Bar, Section } from './ui';
import { useGame } from './Shell';

const reward = (g: { rewardXp: number; rewardChests: number; rewardArtifact: boolean }) =>
  `+${g.rewardXp} опыта${g.rewardChests ? ` · 🎁 ${g.rewardChests}` : ''}${g.rewardArtifact ? ' · 🔮 артефакт' : ''}`;
const goalText = (g: GoalStateDto) => g.title ?? GOAL_INFO[g.kind as GoalKind]?.text(g.target) ?? '';
const goalEmoji = (g: GoalStateDto) => (g.manual ? '📝' : GOAL_INFO[g.kind as GoalKind]?.emoji ?? '🎯');

/** «Цель недели» на экране «Сегодня»: выбор цели (пн–ср), прогресс, награда, итог прошлой недели. */
export function WeeklyGoal() {
  const { s, act, toast } = useGame();
  const g = s.detail!.goal;
  const [kind, setKind] = useState<GoalKind | null>(null);
  const [pick, setPick] = useState<GoalTier | null>(null);
  const opt = g.options.find((o) => o.kind === kind);

  const choose = async () => {
    if (!kind || !pick) return;
    try { await act('chooseGoal', { kind, tier: pick }); toast('🎯 Цель недели выбрана. Удачи!'); setKind(null); setPick(null); } catch { /* act уже показал ошибку */ }
  };

  const cur = g.current;
  const last = g.last;
  return (
    <Section title="🎯 Цель недели" right={cur && !cur.finished ? <span className="muted">осталось {cur.daysLeft} дн.</span> : undefined}>
      {cur ? (
        <>
          <p><b>{goalEmoji(cur)} {TIER_NAMES[cur.tier]}:</b> {goalText(cur)}</p>
          {cur.manual
            ? <p className="muted">{cur.confirmed ? '✅ Родитель отметил цель выполненной.' : '⏳ Родитель отметит выполнение, когда увидит результат.'}</p>
            : <Bar value={Math.min(cur.progress, cur.target)} max={cur.target} label={`${cur.progress} / ${cur.target} ${GOAL_INFO[cur.kind as GoalKind]?.unit ?? ''}`} />}
          <p className="muted small">Награда: {reward(cur)}{cur.done ? ' · цель выполнена! Награда придёт в понедельник.' : ''}</p>
        </>
      ) : g.canChoose ? (
        <>
          <p className="muted">Выбери цель на эту неделю (до среды): за выполнение получишь опыт, сундук, а за сложную ещё артефакт.</p>
          <div className="row wrapRow">
            {g.options.map((o) => (
              <button key={o.kind} className={`btn ${kind === o.kind ? '' : 'ghost'} sm`} disabled={o.tiers.every((t) => t.target === null)} onClick={() => { setKind(o.kind as GoalKind); setPick(null); }}>{o.emoji} {o.name}</button>
            ))}
          </div>
          {opt && (
            <div className="tiers3">
              {opt.tiers.map((t, i) => t.target !== null && (
                <button key={t.tier} className={`card pick ${pick === t.tier ? 'sel' : ''}`} onClick={() => setPick(t.tier)} aria-pressed={pick === t.tier}>
                  <b>{TIER_NAMES[t.tier]}</b>
                  <span>{opt.texts[i]}</span>
                  <small className="gold">{`+${t.xp} опыта${t.chests ? ` · 🎁 ${t.chests}` : ''}${t.artifact ? ' · 🔮' : ''}`}</small>
                </button>
              ))}
            </div>
          )}
          {kind && pick && (
            <div className="confirm">
              Взять цель: {opt!.emoji} {opt!.texts[['easy', 'mid', 'hard'].indexOf(pick)]}? Передумать потом нельзя, только родитель может поменять.
              <div className="row">
                <button className="btn" onClick={choose}>Да, беру</button>
                <button className="btn ghost" onClick={() => setPick(null)}>Отмена</button>
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="muted">На этой неделе цель не выбрана. Новую можно выбрать в понедельник, вторник или среду.</p>
      )}
      {last && (
        <p className="muted small">Прошлая неделя: {last.done ? `✅ ${goalText(last)}: выполнена (${reward(last)})` : `❌ ${goalText(last)}: не выполнена${last.manual ? '' : ` (${last.progress}/${last.target})`}`}</p>
      )}
    </Section>
  );
}
