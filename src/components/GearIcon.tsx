import type { CSSProperties } from 'react';
import { GEAR_SYMBOLS } from './gearSymbols';

type Rarity = 'common' | 'rare' | 'epic' | 'legend';

// Цвета редкости: металл светлеет, затем появляются камень, крылья и сияние (слои r1..r3 в значке включаются переменными).
const VARS: Record<Rarity, Record<string, string>> = {
  common: { '--m1': '#c3cde6', '--m2': '#8392b8', '--gm': '#9fb0d8', '--gl': '#8aa0d8', '--r1': '0', '--r2': '0', '--r3': '0' },
  rare: { '--m1': '#d9e6ff', '--m2': '#5f8fff', '--gm': '#8ff0d9', '--gl': '#5f8fff', '--r1': '1', '--r2': '0', '--r3': '0' },
  epic: { '--m1': '#ecdcff', '--m2': '#9a63ff', '--gm': '#ff7ad9', '--gl': '#b07bff', '--r1': '1', '--r2': '1', '--r3': '0' },
  legend: { '--m1': '#fff1c2', '--m2': '#e0a73a', '--gm': '#ff9a4a', '--gl': '#ffcf5a', '--r1': '1', '--r2': '1', '--r3': '1' },
};
const FAMILIES = new Set(['sword', 'hammer', 'staff', 'brush', 'banner', 'armor', 'shield', 'helm', 'crown', 'boots', 'sandals', 'amulet', 'medal', 'lute']);

/** Один раз на странице: набор значков, на которые ссылаются все GearIcon. */
export function GearSymbols() {
  return <svg width="0" height="0" style={{ position: 'absolute' }} aria-hidden="true" focusable="false" dangerouslySetInnerHTML={{ __html: `<defs>${GEAR_SYMBOLS}</defs>` }} />;
}

/** Значок предмета снаряжения: семейство (меч, посох, шлем...) и редкость. Подпись нужна только если значок один, без названия рядом. */
export function GearIcon({ family, rarity, size = 32, label }: { family: string; rarity: Rarity; size?: number; label?: string }) {
  if (!FAMILIES.has(family)) return null;
  const style = { overflow: 'visible', ...VARS[rarity] } as CSSProperties;
  return (
    <svg className="gear-icon" width={size} height={size} viewBox="0 0 100 100" style={style} {...(label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true })}>
      <use href={`#gx-${family}`} />
    </svg>
  );
}
