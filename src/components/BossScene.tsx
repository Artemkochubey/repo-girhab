'use client';
import { useId } from 'react';
import { DOMAIN_INFO, domainOf } from '@/lib/game/gear';
import { Defs, HeroGroup, type Look } from './HeroFigure';
import { useHits } from './useHits';

export interface PartyMember { id: number; name: string; emoji: string; color: string; look: Look; damage: number }
interface Props {
  boss: { name: string; emoji: string; weak: readonly string[] };
  hp: number; damage: number; defeated: boolean; party: PartyMember[]; tv?: boolean; meId?: number | null;
}

/** Бой с боссом недели: босс наверху, герои внизу с экипировкой, лучи урона к боссу (толще у того, кто бьёт сильнее). */
export function BossScene({ boss, hp, damage, defeated, party, tv = false, meId = null }: Props) {
  const uid = useId().replace(/:/g, '');
  const n = Math.max(1, party.length);
  const left = Math.max(0, hp - damage);
  const maxD = Math.max(1, ...party.map((p) => p.damage));
  const slot = 360 / n;
  const sc = Math.min(0.62, (slot - 6) / 115);
  const weakDomains = [...new Set(boss.weak.map((s) => domainOf(s)).filter((d): d is NonNullable<typeof d> => !!d))];
  const attack = !defeated;
  // удары: у кого урон вырос с прошлого обновления, тот атакует, босс вздрагивает, всплывает число
  const hits = useHits(Object.fromEntries(party.map((p) => [`p${p.id}`, { n: p.damage }])));
  const hitIds = new Set(hits.map((h) => h.key));
  return (
    <svg viewBox="0 0 360 270" className={`scene boss-scene ${tv ? 'scene-tv' : ''}`} role="img" aria-label={`Босс недели ${boss.name}: все герои вместе`}>
      <Defs uid={uid} />
      <defs>
        <radialGradient id={`bg-${uid}`} cx="0.5" cy="0.15" r="0.9"><stop offset="0" stopColor="#4a2a5e" /><stop offset="0.6" stopColor="#1d1236" /><stop offset="1" stopColor="#0f0b1a" /></radialGradient>
        <filter id={`bossglow-${uid}`} x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="5" /></filter>
      </defs>
      <rect width="360" height="270" fill={`url(#bg-${uid})`} />
      <path d="M0 232 Q90 218 180 232 T360 230 V270 H0 Z" fill="#150f26" />

      {/* босс */}
      <g>
        <text x="180" y="130" textAnchor="middle" fontSize="76" opacity="0.55" filter={`url(#bossglow-${uid})`} fill="#ff5a5a">{defeated ? '💥' : boss.emoji}</text>
        <text x="180" y="126" textAnchor="middle" fontSize="72" className={defeated ? '' : hits.length ? 'boss-idle boss-hurt' : 'boss-idle'}>{defeated ? '💀' : boss.emoji}</text>
      </g>
      {!tv && (
        <>
          <text x="180" y="18" textAnchor="middle" fontSize="13" fontWeight="800" fill="#f2eaff">{boss.name}</text>
          <rect x="70" y="24" width="220" height="10" rx="5" fill="#120d22" stroke="#4a3d7a" strokeWidth="0.8" />
          <rect x="70" y="24" width={220 * (hp ? left / hp : 0)} height="10" rx="5" fill={defeated ? '#4cae6a' : '#e0453a'} />
          <text x="180" y="32.5" textAnchor="middle" fontSize="7.5" fontWeight="700" fill="#fff">{defeated ? 'ПОВЕРЖЕН' : `${left} / ${hp} HP`}</text>
        </>
      )}
      <text x="300" y="20" fontSize="9" fill="#e9e1ff">слабость: {weakDomains.map((d) => DOMAIN_INFO[d].emoji).join(' ')}</text>

      {/* цифры урона над боссом */}
      {hits.map((h) => { const i = party.findIndex((p) => `p${p.id}` === h.key); const cx = slot * i + slot / 2; const x = 180 + (cx - 180) * 0.45; return <text key={h.id} x={x} y="150" textAnchor="middle" className={`dmg-float boss${h.delta >= 40 ? ' big' : ''}`}>−{h.delta}</text>; })}

      {/* лучи урона и герои */}
      {party.map((p, i) => {
        const cx = slot * i + slot / 2;
        const w = 0.6 + (p.damage / maxD) * 3;
        return (
          <g key={p.id}>
            {attack && p.damage > 0 && <line x1={cx} y1="170" x2="180" y2="132" stroke={hitIds.has(`p${p.id}`) ? '#fff6c8' : '#ffb74d'} strokeWidth={hitIds.has(`p${p.id}`) ? w + 2 : w} strokeOpacity={hitIds.has(`p${p.id}`) ? 0.95 : 0.55} strokeLinecap="round" strokeDasharray="6 6" className="beam" />}
            <g transform={`translate(${cx - 57.5 * sc} ${232 - 146 * sc})`}><g className={hitIds.has(`p${p.id}`) ? 'lunge-up' : ''}><HeroGroup look={p.look} color={p.color} emoji={p.emoji} attack={hitIds.has(`p${p.id}`)} uid={uid} transform={`scale(${sc})`} /></g></g>
            <text x={cx} y="246" textAnchor="middle" fontSize="9" fontWeight="700" fill={p.id === meId ? '#ffd24a' : '#e9e1ff'}>{p.name}{p.id === meId ? ' ★' : ''}</text>
            <text x={cx} y="259" textAnchor="middle" fontSize="9.5" fill="#ff9d7a">⚔ {p.damage}</text>
          </g>
        );
      })}
    </svg>
  );
}
