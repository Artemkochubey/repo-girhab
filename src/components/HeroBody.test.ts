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
    expect(draw('m', { weapon: 'staff-rare' }, { attack: true })).toContain('hf-flare');
    expect(draw('b', { weapon: 'lyre-rare' }, { attack: true })).toContain('hf-note');
    expect(draw('b', { weapon: 'sword-rare' }, { attack: true })).not.toContain('hf-note');
  });
  it('выбранное лицо рисуется вместо простого', () => {
    expect(draw('w', {}, { face: defaultFace('m') })).not.toBe(draw('w', {}));
  });
  it('цвета частей берутся из редкости предмета', () => {
    expect(draw('w', { armor: 'armor-legend' })).toContain('--ar2:#e0a73a');
    expect(draw('w', { armor: 'armor-rare' })).toContain('--ar2:#5f8fff');
  });
  it('доспех у каждого класса свой, а фасон меняется с редкостью', () => {
    const sig = (c: 'w' | 'm' | 'b' | 'p', r: string) => draw(c, { armor: `armor-${r}` });
    for (const r of ['common', 'rare', 'epic', 'legend']) {
      const set = new Set((['w', 'm', 'b', 'p'] as const).map((c) => sig(c, r).replace(/<ellipse[^>]*hf-aura[^>]*>/g, '')));
      expect(set.size).toBe(4);
    }
    for (const c of ['w', 'm', 'b', 'p'] as const) {
      const set = new Set(['common', 'rare', 'epic', 'legend'].map((r) => sig(c, r).replace(/--[a-z0-9]+:#[0-9a-f]{6}/gi, '').replace(/fill="#[0-9a-f]{6}"/gi, '')));
      expect(set.size, `фасоны ${c}`).toBe(4);
    }
  });
  it('у мага видны ноги и сапоги под мантией', () => {
    const m = draw('m', {});
    expect(m).toContain('M96 250 H118 L116 338 H94Z');
    expect(m).toContain('hf-bt1');
  });
  it('шлем и оружие у каждого класса свои, а вид меняется с редкостью', () => {
    const strip = (x: string) => x.replace(/--[a-z0-9]+:#[0-9a-f]{6}/gi, '').replace(/fill="#[0-9a-f]{6}"/gi, '');
    for (const c of ['w', 'm', 'b', 'p'] as const) {
      const helms = new Set(['common', 'rare', 'epic', 'legend'].map((r) => strip(draw(c, { helm: `helm-${r}` }))));
      expect(helms.size, `шлем ${c}`).toBe(4);
      const weapons = new Set(['common', 'rare', 'epic', 'legend'].map((r) => strip(draw(c, { weapon: `sword-${r}` }))));
      expect(weapons.size, `оружие ${c}`).toBe(4);
    }
    for (const r of ['common', 'legend']) {
      expect(new Set((['w', 'm', 'b', 'p'] as const).map((c) => draw(c, { weapon: `sword-${r}` }))).size).toBe(4);
    }
  });
});
