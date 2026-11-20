import { describe, it, expect } from 'vitest';
import { EXTRAS, HAIR_STYLES, defaultFace, extrasFor, hairFor, parseFace, randomFace, validateFace } from './faces';

describe('лица героев', () => {
  it('причёски и особенности зависят от пола', () => {
    expect(hairFor('m').map((h) => h.id)).toContain('spiky');
    expect(hairFor('m').map((h) => h.id)).not.toContain('braids');
    expect(hairFor('f').map((h) => h.id)).toContain('braids');
    expect(hairFor('f').map((h) => h.id)).not.toContain('bald');
    expect(extrasFor('f').map((e) => e.id)).not.toContain('beard');
    expect(extrasFor('m').map((e) => e.id)).toContain('beard');
    expect(HAIR_STYLES.every((h) => h.for.length > 0)).toBe(true);
    expect(EXTRAS.every((e) => e.for.length > 0)).toBe(true);
  });
  it('лицо по умолчанию проходит проверку для своего пола', () => {
    expect(validateFace(defaultFace('m'), 'm')).toEqual(defaultFace('m'));
    expect(validateFace(defaultFace('f'), 'f')).toEqual(defaultFace('f'));
  });
  it('проверка отклоняет чужие значения', () => {
    const f = defaultFace('m');
    expect(typeof validateFace({ ...f, skin: 99 }, 'm')).toBe('string');
    expect(typeof validateFace({ ...f, hair: 'braids' }, 'm')).toBe('string');
    expect(typeof validateFace({ ...f, extras: ['beard'] }, 'f')).toBe('string');
    expect(typeof validateFace({ ...f, mouth: '<script>' }, 'm')).toBe('string');
    expect(typeof validateFace({ ...f, eyes: 'x' }, 'm')).toBe('string');
    expect(typeof validateFace(null, 'm')).toBe('string');
  });
  it('лишние особенности убираются, повторы тоже', () => {
    const r = validateFace({ ...defaultFace('m'), extras: ['glasses', 'glasses', 'beard'] }, 'm');
    expect(typeof r === 'string' ? r : r.extras).toEqual(['glasses', 'beard']);
  });
  it('случайное лицо всегда допустимо', () => {
    let s = 7; const r = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let i = 0; i < 200; i++) for (const g of ['m', 'f'] as const) expect(typeof validateFace(randomFace(g, r), g)).not.toBe('string');
  });
  it('битый JSON даёт null', () => {
    expect(parseFace(null, 'm')).toBeNull();
    expect(parseFace('{', 'm')).toBeNull();
    expect(parseFace(JSON.stringify({ skin: 1 }), 'm')).toBeNull();
    expect(parseFace(JSON.stringify(defaultFace('f')), 'f')).toEqual({ ...defaultFace('f'), gender: 'f' });
  });
});
