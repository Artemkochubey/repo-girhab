import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { GEAR } from '@/lib/game/gear';
import { GearPic } from './GearPic';

const draw = (id: string, cls: string | null) => renderToStaticMarkup(createElement(GearPic, { item: GEAR.find((g) => g.id === id)!, cls }));

describe('картинки предметов в списках', () => {
  it('каждый предмет рисуется для каждого класса', () => {
    for (const cls of ['w', 'm', 'b', 'p', null]) for (const g of GEAR) expect(draw(g.id, cls).length, `${g.id} ${cls}`).toBeGreaterThan(200);
  });
  it('оружие, доспех и шлем отличаются по классу и по редкости', () => {
    const strip = (x: string) => x.replace(/--[a-z0-9]+:#[0-9a-f]{6}/gi, '').replace(/fill="#[0-9a-f]{6}"/gi, '');
    for (const fam of ['sword', 'armor', 'helm']) {
      expect(new Set(['w', 'm', 'b', 'p'].map((c) => draw(`${fam}-rare`, c))).size, fam).toBe(4);
      for (const c of ['w', 'm', 'b', 'p']) expect(new Set(['common', 'rare', 'epic', 'legend'].map((r) => strip(draw(`${fam}-${r}`, c)))).size, `${fam} ${c}`).toBe(4);
    }
  });
});
