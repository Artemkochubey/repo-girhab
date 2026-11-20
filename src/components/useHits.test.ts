import { describe, it, expect } from 'vitest';
import { diffHits } from './useHits';

describe('удары в сценах боя', () => {
  const a = { w0: { n: 10, flag: false }, w1: { n: 0, flag: false } };
  it('при первой загрузке ударов нет', () => expect(diffHits(null, a)).toEqual([]));
  it('удар появляется, когда урон вырос, с округлённой цифрой', () => {
    expect(diffHits(a, { w0: { n: 24.4, flag: false }, w1: { n: 0, flag: false } })).toEqual([{ key: 'w0', delta: 14, kill: false }]);
  });
  it('мелкий рост (меньше 0,5) и отсутствие роста ударов не дают', () => {
    expect(diffHits(a, { w0: { n: 10.3, flag: false }, w1: { n: 0, flag: false } })).toEqual([]);
    expect(diffHits(a, a)).toEqual([]);
  });
  it('волна, которую только что убили, даёт удар с пометкой kill; уже убитая — нет', () => {
    expect(diffHits(a, { w0: { n: 20, flag: true }, w1: { n: 0, flag: false } })).toEqual([{ key: 'w0', delta: 10, kill: true }]);
    expect(diffHits({ w0: { n: 20, flag: true } }, { w0: { n: 20, flag: true } })).toEqual([]);
  });
  it('урон не уменьшается в анимацию: при падении очков (удалили запись) ударов нет', () => {
    expect(diffHits(a, { w0: { n: 4, flag: false }, w1: { n: 0, flag: false } })).toEqual([]);
  });
  it('новый ключ (появился герой) не считается ударом', () => {
    expect(diffHits({ p1: { n: 5 } }, { p1: { n: 5 }, p2: { n: 30 } })).toEqual([]);
  });
});
