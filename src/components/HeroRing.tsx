'use client';
import { useId } from 'react';
import type { FaceConfig } from '@/lib/game/faces';
import { FaceBadge } from './Face';

/** Герой в кольце опыта: вращающийся золотой пунктир, светящаяся дуга прогресса и значок уровня. */
export function HeroRing({ emoji, face, level, percent, size = 120 }: { emoji: string; face: FaceConfig | null; level: number; percent: number; size?: number }) {
  const gid = useId();
  const r = 50, c = 2 * Math.PI * r, p = Math.max(0, Math.min(100, percent));
  const inner = Math.round(size * 0.7);
  return (
    <div className="hero-ring" style={{ width: size, height: size }}>
      <svg className="ring orbit" aria-hidden="true" width={size} height={size} viewBox="0 0 120 120" style={{ position: 'absolute', inset: 0 }}>
        <circle cx="60" cy="60" r="58" fill="none" stroke="#f2c46b" strokeWidth="1.5" strokeDasharray="2 9" strokeLinecap="round" opacity=".8" />
      </svg>
      <svg className="ring" role="img" aria-label={`Опыт: ${Math.round(p)}% до следующего уровня`} width={size} height={size} viewBox="0 0 120 120" style={{ position: 'absolute', inset: 0 }}>
        <defs><linearGradient id={gid} x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#5be3c4" /><stop offset="1" stopColor="#f2c46b" /></linearGradient></defs>
        <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="7" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={`url(#${gid})`} strokeWidth="7" strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - p / 100)} transform="rotate(-90 60 60)" style={{ filter: 'drop-shadow(0 0 6px rgba(91,227,196,.8))', transition: 'stroke-dashoffset .6s' }} />
      </svg>
      <div className="face-disc" aria-hidden="true" style={{ width: inner, height: inner, left: (size - inner) / 2, top: (size - inner) / 2, fontSize: inner * 0.58 }}>
        {face ? <FaceBadge face={face} size={inner} /> : emoji}
      </div>
      <div className="lvl" style={{ fontSize: size * 0.011 + 'rem' }}>{level}</div>
    </div>
  );
}
