import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { HeroBody } from './HeroBody';
import { GEAR } from '@/lib/game/gear';
import { defaultFace } from '@/lib/game/faces';

const draw = (cls: 'w' | 'm' | 'b' | 'p' | null, look: Record<string, string>, extra: Record<string, unknown> = {}) =>
  renderToStaticMarkup(createElement('svg', null, createElement(HeroBody, { look, cls, ...extra })));
const full = (r: string) => ({ weapon: `sword-${r}`, armor: `armor-${r}`, helm: `helm-${r}`, boots: `boots-${r}`, amulet: `amulet-${r}` });

describe('фигура героя в бою', () => {
  it('рисуется для каждого класса без снаряжения и с полным комплектом любой редкости', () => {
    for (const c of ['w', 'm', 'b', 'p', null] as const) {
      expect(draw(c, {}).length).toBeGreaterThan(1000);
      for (const r of ['common', 'rare', 'epic', 'legend']) expect(draw(c, full(r)).length).toBeGreaterThan(1500);
    }
  });
  it('каждый предмет игры надевается на каждый класс без ошибок', () => {
    for (const c of ['w', 'm', 'b', 'p'] as const) for (const g of GEAR) expect(() => draw(c, { [g.slot]: g.id })).not.toThrow();
  });
  it('легендарное снаряжение добавляет сияние, обычное нет', () => {
    expect(draw('m', full('legend'))).toContain('hf-aura');
    expect(draw('m', full('common'))).not.toContain('hf-aura');
  });
  it('удар включает взмах оружия, а у мага ещё вспышку у посоха', () => {
    expect(draw('w', full('rare'), { attack: true })).toContain('hf-w-atk');
    expect(draw('w', full('rare'))).not.toContain('hf-w-atk');
    expect(draw('m', full('rare'), { attack: true })).toContain('hf-flare');
    expect(draw('b', full('rare'), { attack: true })).toContain('hf-note');
  });
  it('выбранное лицо рисуется вместо простого', () => {
    expect(draw('w', {}, { face: defaultFace('m') })).not.toBe(draw('w', {}));
  });
  it('цвета частей берутся из редкости предмета', () => {
    expect(draw('w', { armor: 'armor-legend' })).toContain('--ar2:#e0a73a');
    expect(draw('w', { armor: 'armor-rare' })).toContain('--ar2:#5f8fff');
  });
});
