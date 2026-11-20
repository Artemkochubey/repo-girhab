'use client';
import { memo, useId } from 'react';
import type { GearRarity, Slot } from '@/lib/game/gear';
import { HeroBody } from './HeroBody';
import type { FaceConfig } from '@/lib/game/faces';
import type { Cls } from '@/lib/game/classes';

/** Что надето: id предмета по слотам (null — пусто). */
export type Look = Partial<Record<Slot, string | null>>;
export type ClsKey = Cls | string | null | undefined;

export const RARITY_COLOR: Record<GearRarity, string> = { common: '#9a97b5', rare: '#5f9dff', epic: '#b46bff', legend: '#ffd24a' };
export const CLASS_COLOR: Record<Cls, string> = { w: '#d9534f', m: '#5b8cff', b: '#3fcf9a', p: '#ffd24a' };

interface Props { look: Look; color: string; emoji: string; face?: FaceConfig | null; attack?: boolean; uid: string; cls?: ClsKey }
const isCls = (c: ClsKey): c is Cls => c === 'w' || c === 'm' || c === 'b' || c === 'p';

/** Герой в полный рост (0..100 × 0..150): рисунок класса, снаряжение меняет цвета и добавляет детали (см. HeroBody). */
function Body({ look, face, attack, cls }: Props) {
  return <HeroBody look={look} cls={isCls(cls) ? cls : null} face={face} attack={attack} />;
}

/** Область фигуры для витрины снаряжения (viewBox): целиком или крупно один предмет. */
export const FOCUS_BOX: Record<'full' | Slot, string> = {
  full: '0 0 115 152', weapon: '66 4 48 112', armor: '2 50 96 96', helm: '20 0 64 56', boots: '22 104 60 46', amulet: '28 54 44 40',
};

/** Одиночная фигура героя (для карточек и списков). */
export const HeroFigure = memo(function HeroFigure({ look, color, emoji, face = null, cls = null, size = 120, attack = false, className = '', focus = 'full' }: { look: Look; color: string; emoji: string; face?: FaceConfig | null; cls?: ClsKey; size?: number; attack?: boolean; className?: string; focus?: 'full' | Slot }) {
  const uid = useId().replace(/:/g, '');
  const box = FOCUS_BOX[focus];
  const [, , w, h] = box.split(' ').map(Number) as [number, number, number, number];
  return (
    <svg viewBox={box} width={size} height={size * (h / w)} className={`hero-fig ${className}`} role="img" aria-label="Герой">
      <Defs uid={uid} />
      <Body look={look} color={color} emoji={emoji} face={face} attack={attack} uid={uid} cls={cls} />
    </svg>
  );
});

export function Defs({ uid }: { uid: string }) {
  return <defs><filter id={`glow-${uid}`} x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="1.6" result="b" /><feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge></filter></defs>;
}
/** Фигура внутри чужого SVG (сцены боёв). */
export function HeroGroup(p: Omit<Props, 'uid'> & { uid: string; transform?: string }) {
  const { transform, ...rest } = p;
  return <g transform={transform} className="hero-fig"><Body {...rest} /></g>;
}
