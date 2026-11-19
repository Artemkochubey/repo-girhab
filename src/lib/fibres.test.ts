import { describe, it, expect } from 'vitest';
import { ANATOMY } from './anatomy-data';
import { muscleFibres } from './fibres';

describe('мышечные волокна', () => {
  it('для каждой мышцы на силуэте есть волокна, числа конечные, результат стабилен', () => {
    for (const view of ['front', 'back'] as const) {
      for (const s of ANATOMY[view]) {
        if (!s.m) continue;
        const a = muscleFibres(s.p, s.m);
        expect(a.fibres.length).toBeGreaterThan(20);
        expect(a.fibres + a.tendons).not.toMatch(/NaN|Infinity/);
        expect(muscleFibres(s.p, s.m)).toEqual(a);
      }
    }
  });
  it('пресс получает поперечные сухожильные перемычки, остальные нет', () => {
    const abs = ANATOMY.front.find((s) => s.m === 'abs')!;
    expect(muscleFibres(abs.p, 'abs').tendons.split('M').length - 1).toBe(3);
    const q = ANATOMY.front.find((s) => s.m === 'quads')!;
    expect(muscleFibres(q.p, 'quads').tendons).toBe('');
  });
  it('вырожденный контур не ломает расчёт', () => {
    expect(muscleFibres('1 1 2 2', 'chest')).toEqual({ fibres: '', tendons: '' });
  });
});
