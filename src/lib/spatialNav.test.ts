import { describe, it, expect } from 'vitest';
import { pickFirst, pickNext, type Box } from './spatialNav';

const b = (l: number, t: number, w = 100, h = 60): Box => ({ left: l, top: t, right: l + w, bottom: t + h });
// сетка 3 × 3: 0 1 2 / 3 4 5 / 6 7 8
const grid = Array.from({ length: 9 }, (_, i) => ({ id: i, box: b((i % 3) * 140, Math.floor(i / 3) * 100) }));
const go = (from: number, dir: 'up' | 'down' | 'left' | 'right', cands = grid) => pickNext(cands.find((c) => c.id === from)!.box, cands.filter((c) => c.id !== from), dir);

describe('пространственная навигация', () => {
  it('в сетке стрелки идут к соседям', () => {
    expect(go(4, 'right')).toBe(5); expect(go(4, 'left')).toBe(3); expect(go(4, 'up')).toBe(1); expect(go(4, 'down')).toBe(7);
    expect(go(0, 'right')).toBe(1); expect(go(8, 'up')).toBe(5);
  });
  it('на краю идти некуда', () => {
    expect(go(0, 'left')).toBeNull(); expect(go(0, 'up')).toBeNull(); expect(go(8, 'right')).toBeNull(); expect(go(8, 'down')).toBeNull();
  });
  it('выбирает по геометрии, а не по порядку в разметке', () => {
    // в разметке справа сначала идёт далёкий элемент, а потом близкий
    const cands = [{ id: 'far', box: b(600, 0) }, { id: 'near', box: b(160, 0) }, { id: 'me', box: b(0, 0) }];
    expect(pickNext(b(0, 0), cands.filter((c) => c.id !== 'me'), 'right')).toBe('near');
  });
  it('на одной линии лучше, чем ближе, но сбоку', () => {
    const cands = [{ id: 'aligned', box: b(300, 0) }, { id: 'diag', box: b(150, 200) }];
    expect(pickNext(b(0, 0), cands, 'right')).toBe('aligned');
  });
  it('если на линии никого нет, берёт ближайшего по диагонали', () => {
    expect(pickNext(b(0, 0), [{ id: 'diag', box: b(150, 200) }], 'right')).toBe('diag');
  });
  it('вниз выбирает ближайшую карточку в своём столбце, а не соседнего', () => {
    const cands = [{ id: 'left', box: b(0, 100) }, { id: 'under', box: b(150, 100) }, { id: 'under2', box: b(150, 300) }];
    expect(pickNext(b(150, 0), cands, 'down')).toBe('under');
  });
  it('разные по размеру карточки: широкая кнопка под двумя маленькими', () => {
    const cands = [{ id: 'wide', box: b(0, 100, 300, 60) }, { id: 'a', box: b(0, 0, 100) }];
    expect(pickNext(b(0, 0, 100), [cands[0]!], 'down')).toBe('wide');
    expect(pickNext(b(200, 0, 100), [cands[0]!], 'down')).toBe('wide');
  });
  it('первый элемент: верхний левый', () => {
    expect(pickFirst(grid)).toBe(0);
    expect(pickFirst([])).toBeNull();
  });
});
