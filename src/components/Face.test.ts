import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { FaceArt } from './Face';
import { HAIR_COLORS, HAIR_STYLES, defaultFace, hairFor } from '@/lib/game/faces';

const svg = (hair: string, hairColor = 1) => renderToStaticMarkup(createElement('svg', null, createElement(FaceArt, { face: { ...defaultFace('f'), gender: 'f', hair, hairColor } })));

describe('причёски и цвета волос', () => {
  it('достаточно причёсок и цветов, для каждого пола не меньше 15 причёсок', () => {
    expect(HAIR_STYLES.length).toBeGreaterThanOrEqual(25);
    expect(HAIR_COLORS.length).toBeGreaterThanOrEqual(20);
    expect(hairFor('m').length).toBeGreaterThanOrEqual(15);
    expect(hairFor('f').length).toBeGreaterThanOrEqual(15);
    expect(new Set(HAIR_STYLES.map((h) => h.id)).size).toBe(HAIR_STYLES.length);
    expect(new Set(HAIR_COLORS.map((c) => c.hex)).size).toBe(HAIR_COLORS.length);
  });
  it('первые десять цветов не поменялись (в базе хранится номер цвета)', () => {
    expect(HAIR_COLORS.slice(0, 10).map((c) => c.name)).toEqual(['Чёрный', 'Тёмно-русый', 'Каштановый', 'Светлый', 'Рыжий', 'Седой', 'Синий', 'Розовый', 'Фиолетовый', 'Зелёный']);
  });
  it('каждая причёска рисуется по-своему', () => {
    const drawn = HAIR_STYLES.map((h) => svg(h.id));
    expect(new Set(drawn).size).toBe(HAIR_STYLES.length);
  });
  it('цвет волос меняет рисунок', () => {
    for (const style of ['short', 'afro', 'curlylong']) expect(svg(style, 1)).not.toBe(svg(style, 12));
  });
});
