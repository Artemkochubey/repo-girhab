import { describe, expect, it } from 'vitest';
import { kidSay, starsFor, starsText } from './kid';

describe('режим «Малыш»: звёздочки', () => {
  it('пять звёзд до нормы, каждая 20% нормы', () => {
    expect(starsFor(0, 40, 70)).toMatchObject({ filled: 0, bonus: 0, reachedGoal: false, toGoal: 40, toNext: 8 });
    expect(starsFor(8, 40, 70).filled).toBe(1);
    expect(starsFor(23, 40, 70)).toMatchObject({ filled: 2, toNext: 1 });
    expect(starsFor(39, 40, 70)).toMatchObject({ filled: 4, reachedGoal: false, toGoal: 1 });
    expect(starsFor(40, 40, 70)).toMatchObject({ filled: 5, reachedGoal: true, toGoal: 0, bonus: 0 });
  });
  it('золотые звёзды сверх нормы до супер-нормы', () => {
    expect(starsFor(50, 40, 70).bonus).toBe(1);   // (50-40)/30*3 = 1
    expect(starsFor(60, 40, 70).bonus).toBe(2);
    expect(starsFor(70, 40, 70).bonus).toBe(3);
    expect(starsFor(500, 40, 70)).toMatchObject({ bonus: 3, toNext: 0, percent: 100 });
  });
  it('крайние случаи: норма 0, отрицательные очки', () => {
    expect(starsFor(-5, 0, 0)).toMatchObject({ filled: 0, reachedGoal: false });
    expect(starsFor(10, 0, 0).filled).toBe(5);
  });
  it('склонение и фразы', () => {
    expect([1, 2, 5, 11, 21].map(starsText)).toEqual(['1 звезда', '2 звезды', '5 звёзд', '11 звёзд', '21 звезда']);
    expect(kidSay('Миша', starsFor(0, 40, 70), 30)).toContain('Привет, Миша');
    expect(kidSay('Миша', starsFor(20, 40, 70), 30)).toContain('2 звезды');
    expect(kidSay('Миша', starsFor(45, 40, 70), 30)).toContain('30 минут игр');
    expect(kidSay('Миша', starsFor(70, 40, 70), 30)).toContain('супергерой');
  });
});
