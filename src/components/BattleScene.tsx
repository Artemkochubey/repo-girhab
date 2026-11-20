'use client';
import { useId } from 'react';
import { DOMAIN_INFO } from '@/lib/game/gear';
import type { LiveBattleDto } from '@/lib/client';
import { Defs, HeroGroup, RARITY_COLOR, type Look } from './HeroFigure';
import { useHits } from './useHits';
import { abilityById } from '@/lib/game/classBattle';
import { useEffect, useRef, useState } from 'react';

interface Props { look: Look; color: string; emoji: string; name: string; live: LiveBattleDto; cls?: string | null; active?: string[] }

/** Бой героя с ордой: герой со своим снаряжением слева, три волны врагов справа, у каждой слабость и полоска здоровья. */
export function BattleScene({ look, color, emoji, name, live, cls = null, active = [] }: Props) {
  const uid = useId().replace(/:/g, '');
  const { fight, horde } = live;
  // удары: когда урон волны вырос с прошлого обновления, герой атакует, враги вздрагивают, над ними всплывает число
  const hits = useHits(Object.fromEntries(fight.waves.map((w, i) => [`w${i}`, { n: Math.min(w.damage, w.hp), flag: w.cleared }])));
  const hit = hits.length > 0;
  // применённые способности: при новой показываем вспышку и название над героем, действующие остаются значками
  const seen = useRef<string[] | null>(null);
  const [casts, setCasts] = useState<{ id: string; n: number }[]>([]);
  const activeSig = active.join(',');
  useEffect(() => {
    const prev = seen.current;
    seen.current = active;
    if (!prev) return;
    const fresh = active.filter((a) => !prev.includes(a)).map((id, k) => ({ id, n: Date.now() + k }));
    if (!fresh.length) return;
    setCasts((c) => [...c, ...fresh]);
    const t = setTimeout(() => setCasts((c) => c.filter((x) => !fresh.includes(x))), 1800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeSig]);
  // группы врагов: 3 мелких, 2 средних, 1 крупный
  const groups = [
    { x: 150, pts: [[0, 22], [28, 8], [14, 40]] as [number, number][], size: 26 },
    { x: 222, pts: [[0, 14], [34, 30]] as [number, number][], size: 36 },
    { x: 292, pts: [[8, 10]] as [number, number][], size: 62 },
  ];
  const hpPct = live.hp / live.maxHp;
  return (
    <svg viewBox="0 0 360 200" className="scene" role="img" aria-label={`${name} сражается с ордой: ${horde.name}`}>
      <Defs uid={uid} />
      <defs>
        <linearGradient id={`sky-${uid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#1b1238" /><stop offset="1" stopColor="#3a2456" /></linearGradient>
        <linearGradient id={`gr-${uid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2a1f3f" /><stop offset="1" stopColor="#120d22" /></linearGradient>
      </defs>
      <rect width="360" height="200" fill={`url(#sky-${uid})`} />
      <circle cx="318" cy="30" r="14" fill="#f2e8ff" opacity="0.8" /><circle cx="324" cy="26" r="12" fill="#2a1a4a" opacity="0.55" />
      <g fill="#fff" opacity="0.5">{[[30, 20], [80, 40], [140, 14], [200, 30], [260, 18], [60, 70]].map(([x, y], i) => <circle key={i} cx={x} cy={y} r="1" />)}</g>
      <path d="M0 150 Q60 130 120 148 T240 146 T360 150 V200 H0 Z" fill={`url(#gr-${uid})`} />

      {/* герой */}
      <g transform="translate(6 20)"><g className={hit ? 'scene-hero hit' : 'scene-hero'}>
        <HeroGroup look={look} color={color} emoji={emoji} cls={cls} attack={hit} uid={uid} transform="scale(0.98)" />
      </g></g>
      <text x="56" y="14" textAnchor="middle" fontSize="9" fill="#e9e1ff" fontWeight="700">{name}</text>
      <g>{active.map((id, i) => <text key={id} x={14 + i * 14} y="28" fontSize="11">{abilityById(id)?.ability.emoji}</text>)}</g>
      {casts.map((c, i) => { const a = abilityById(c.id)?.ability; return a && (
        <g key={c.n}>
          <circle cx="56" cy="100" r="30" className="cast-ring" />
          <circle cx="56" cy="100" r="30" className="cast-ring r2" />
          <text x="56" y={44 - i * 12} textAnchor="middle" className="cast-text">{a.emoji} {a.name}!</text>
        </g>
      ); })}
      <rect x="14" y="170" width="82" height="7" rx="3.5" fill="#120d22" /><rect x="14" y="170" width={82 * hpPct} height="7" rx="3.5" fill={live.weakened ? '#c0392b' : '#d84a6a'} />
      <text x="55" y="187" textAnchor="middle" fontSize="8.5" fill="#cfc4f5">❤️ {live.hp}/{live.maxHp}{live.streak ? `  🔥${live.streak}` : ''}</text>

      {/* волны врагов */}
      {fight.waves.map((w, i) => {
        const g = groups[i]!;
        const now = !w.cleared && fight.waves.findIndex((x) => !x.cleared) === i;
        const left = Math.max(0, 1 - w.damage / w.hp);
        return (
          <g key={i}>
            {now && <ellipse cx={g.x + 24} cy="146" rx="44" ry="9" fill="#ffb74d" opacity="0.18" />}
            <g opacity={w.cleared ? 0.28 : 1}>
              {g.pts.map(([dx, dy], k) => (
                <text key={k} x={g.x + dx} y={100 + dy + g.size * 0.5} fontSize={g.size} className={w.cleared ? '' : `${now ? 'enemy now' : 'enemy'}${hits.some((h) => h.key === `w${i}`) ? ' hurt' : ''}`} style={{ animationDelay: `${k * 0.3}s` }}>{w.cleared ? '💨' : horde.emoji}</text>
              ))}
            </g>
            <text x={g.x + 24} y="86" textAnchor="middle" fontSize="11">{DOMAIN_INFO[w.weak].emoji}</text>
            <rect x={g.x} y="168" width="52" height="6" rx="3" fill="#120d22" />
            <rect x={g.x} y="168" width={52 * left} height="6" rx="3" fill={w.cleared ? '#4cae6a' : '#e0453a'} />
            <text x={g.x + 26} y="186" textAnchor="middle" fontSize="8" fill={w.cleared ? '#8be3a3' : '#cfc4f5'}>{w.cleared ? '✔ убиты' : `${Math.round(Math.min(w.damage, w.hp))}/${w.hp}`}</text>
          </g>
        );
      })}
      {/* вспышки ударов и цифры урона */}
      {hits.map((h) => {
        const i = Number(h.key.slice(1));
        const g = groups[i]!;
        const w = fight.waves[i]!;
        const big = h.delta >= w.hp * 0.25;
        return (
          <g key={h.id}>
            <path d={`M${g.x - 14} ${96} L${g.x + 56} ${150}`} className="slash" />
            <path d={`M${g.x + 52} ${92} L${g.x - 8} ${146}`} className="slash s2" />
            <text x={g.x + 24} y="84" textAnchor="middle" className={`dmg-float${big ? ' big' : ''}`}>−{h.delta}</text>
            {h.kill && (
              <g className="kill-burst">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((k) => <line key={k} x1={g.x + 24} y1="120" x2={g.x + 24 + Math.cos((k * Math.PI) / 4) * 26} y2={120 + Math.sin((k * Math.PI) / 4) * 26} />)}
                <text x={g.x + 24} y="52" textAnchor="middle" className="kill-text">✔ РАЗБИТЫ!</text>
              </g>
            )}
          </g>
        );
      })}
      {fight.outcome === 'victory' && <text x="200" y="60" textAnchor="middle" fontSize="22" fontWeight="800" fill="#ffd24a" stroke="#1b1405" strokeWidth="0.6" className="victory-pop">🏆 ПОБЕДА!</text>}
      {/* значки снаряжения */}
      <g>{(['weapon', 'armor', 'helm', 'boots', 'amulet'] as const).map((s, i) => look[s] && <circle key={s} cx={118 + i * 7} cy="8" r="2.6" fill={RARITY_COLOR[(look[s] as string).split('-')[1] as keyof typeof RARITY_COLOR] ?? '#999'} />)}</g>
    </svg>
  );
}
