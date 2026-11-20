'use client';
import { useId } from 'react';

const PALETTE: Record<string, { beam: string; aura: string; gem: string; gemDark: string }> = {
  common: { beam: '#d6e0ff', aura: '#8aa0ff', gem: '#e2e9ff', gemDark: '#8aa0d8' },
  rare: { beam: '#cfe0ff', aura: '#6f9bff', gem: '#9fc0ff', gemDark: '#4a72d8' },
  legend: { beam: '#fff1c2', aura: '#ffcf5a', gem: '#ffe39a', gemDark: '#e0a73a' },
};

/** Сцена открытия сундука: лучи света, вращающиеся руны, парящий самоцвет цвета редкости. */
export function ChestScene({ rarity }: { rarity: string }) {
  const id = useId().replace(/:/g, '');
  const c = PALETTE[rarity] ?? PALETTE.common;
  return (
    <svg className="chest-scene" role="img" aria-label="Открытый сундук, из которого поднимается свет" viewBox="0 0 330 300">
      <defs>
        <linearGradient id={`${id}b`} x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor={c.beam} stopOpacity=".85" /><stop offset="1" stopColor={c.beam} stopOpacity="0" /></linearGradient>
        <radialGradient id={`${id}a`} cx="50%" cy="50%" r="50%"><stop offset="0" stopColor={c.aura} stopOpacity=".9" /><stop offset=".5" stopColor={c.aura} stopOpacity=".3" /><stop offset="1" stopColor={c.aura} stopOpacity="0" /></radialGradient>
        <linearGradient id={`${id}w`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#8a4b2a" /><stop offset="1" stopColor="#4b2412" /></linearGradient>
        <linearGradient id={`${id}g`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffe39a" /><stop offset="1" stopColor="#c98a1d" /></linearGradient>
        <linearGradient id={`${id}m`} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor={c.gem} /><stop offset="1" stopColor={c.gemDark} /></linearGradient>
      </defs>
      <g className="m-beams" aria-hidden="true">
        <polygon points="165,190 30,0 100,0" fill={`url(#${id}b)`} opacity=".45" />
        <polygon points="165,190 130,0 200,0" fill={`url(#${id}b)`} opacity=".7" />
        <polygon points="165,190 230,0 300,0" fill={`url(#${id}b)`} opacity=".45" />
      </g>
      <g aria-hidden="true" fill="none">
        <g className="m-spin"><ellipse cx="165" cy="250" rx="150" ry="30" stroke="#f2c46b" strokeWidth="1.5" strokeDasharray="3 10" strokeLinecap="round" /></g>
        <g className="m-spinr"><ellipse cx="165" cy="250" rx="112" ry="22" stroke={c.gem} strokeWidth="1.3" strokeDasharray="14 8" /></g>
      </g>
      <circle cx="165" cy="105" r="95" fill={`url(#${id}a)`} aria-hidden="true" />
      <g className="m-gem">
        <path d="M165 55 L196 92 L165 150 L134 92 Z" fill={`url(#${id}m)`} stroke="#fff" strokeOpacity=".6" strokeWidth="1.5" />
        <path d="M134 92 L196 92 M165 55 L150 92 L165 150 L180 92 Z" fill="none" stroke="#fff" strokeOpacity=".45" strokeWidth="1" />
      </g>
      <g aria-hidden="true" fill="#fff4cf">
        <path className="m-spark" d="M52 90l3 8 8 3-8 3-3 8-3-8-8-3 8-3z" />
        <path className="m-spark b" d="M278 70l2.5 7 7 2.5-7 2.5-2.5 7-2.5-7-7-2.5 7-2.5z" fill={c.gem} />
        <path className="m-spark c" d="M262 168l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" />
        <path className="m-spark b" d="M72 180l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="#d9b8ff" />
      </g>
      <g>
        <rect x="107" y="182" width="116" height="62" rx="9" fill="#34180c" stroke={`url(#${id}g)`} strokeWidth="3" />
        <rect x="95" y="214" width="140" height="70" rx="11" fill={`url(#${id}w)`} stroke={`url(#${id}g)`} strokeWidth="3" />
        <rect x="95" y="214" width="140" height="18" rx="8" fill="#fff3b8" opacity=".55" />
        <rect x="124" y="214" width="11" height="70" fill={`url(#${id}g)`} opacity=".9" />
        <rect x="195" y="214" width="11" height="70" fill={`url(#${id}g)`} opacity=".9" />
        <rect x="152" y="232" width="26" height="30" rx="6" fill={`url(#${id}g)`} />
        <circle cx="165" cy="245" r="4.5" fill="#4b2412" /><rect x="163" y="247" width="4" height="9" rx="2" fill="#4b2412" />
      </g>
    </svg>
  );
}
