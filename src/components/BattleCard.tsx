'use client';
import Link from 'next/link';
import { DOMAIN_INFO } from '@/lib/game/gear';
import { Bar, Section } from './ui';
import { useGame } from './Shell';

/** «Сражение дня» на экране «Сегодня»: орда, три волны, здоровье героя и подсказка, куда бить. */
export function BattleCard() {
  const { s, date } = useGame();
  const b = s.detail!.battle;
  const l = b.live;
  if (date !== s.today) return null;
  const f = l.fight;
  const nextWave = f.waves.find((w) => !w.cleared);
  const verdict = f.outcome === 'victory' ? '🏆 Орда разбита!' : f.outcome === 'held' ? '🛡 Отбились: ещё одна волна' : `⚔️ Волн отбито: ${f.cleared} из 3`;
  return (
    <Section title={`${l.horde.emoji} ${l.horde.name}`} right={<Link className="btn ghost sm" href="/battle">Подробнее</Link>}>
      <div className="waves">
        {f.waves.map((w, i) => (
          <div key={i} className={`wave ${w.cleared ? 'done' : w === nextWave ? 'now' : ''}`}>
            <span className="wv-n">{w.cleared ? '✔' : i + 1}</span>
            <span className="wv-t"><b>{w.unit}</b><small className="muted">слабы к: {DOMAIN_INFO[w.weak].emoji} {DOMAIN_INFO[w.weak].name}</small></span>
            <span className="wv-b"><i style={{ width: `${Math.min(100, (w.damage / w.hp) * 100)}%` }} /></span>
          </div>
        ))}
      </div>
      <p className="muted small">{verdict} · ❤️ {b.hp}/{l.maxHp}{l.weakened ? ' (ослаблен: орда крепче)' : ''}{b.streak ? ` · 🔥 побед подряд: ${b.streak}` : ''}</p>
      {nextWave && <p className="small">Бейте по слабости: {DOMAIN_INFO[nextWave.weak].emoji} <b>{DOMAIN_INFO[nextWave.weak].name}</b> наносит ×1,5 урона.</p>}
      <Bar value={Math.round(f.waves.reduce((a, w) => a + Math.min(w.damage, w.hp), 0))} max={l.totalHp} color="var(--danger)" label={`урон ${Math.round(f.damage)} / ${l.totalHp}`} />
    </Section>
  );
}
