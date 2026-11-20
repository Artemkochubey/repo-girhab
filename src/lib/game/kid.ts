/** Режим «Малыш»: очки показываются звёздочками, тексты короткие и читаются вслух. */
export const STARS = 5;
export const BONUS_STARS = 3;

export interface KidStars { filled: number; bonus: number; toNext: number; reachedGoal: boolean; toGoal: number; percent: number }

/** Пять звёздочек = дневная норма (каждая 20%), три золотые сверх нормы до супер-нормы. */
export function starsFor(points: number, goal: number, superGoal: number): KidStars {
  const g = Math.max(1, goal), p = Math.max(0, points);
  const filled = Math.min(STARS, Math.floor((p / g) * STARS + 1e-9));
  const reachedGoal = p >= g;
  const span = Math.max(1, superGoal - g);
  const bonus = reachedGoal ? Math.min(BONUS_STARS, Math.floor(((p - g) / span) * BONUS_STARS + 1e-9)) : 0;
  const nextAt = reachedGoal ? (bonus >= BONUS_STARS ? Infinity : g + ((bonus + 1) * span) / BONUS_STARS) : ((filled + 1) * g) / STARS;
  return { filled, bonus, toNext: nextAt === Infinity ? 0 : Math.max(0, Math.ceil(nextAt - p)), reachedGoal, toGoal: Math.max(0, Math.ceil(g - p)), percent: Math.min(100, Math.round((p / g) * 100)) };
}

const starWord = (n: number) => { const a = n % 100, b = a % 10; return a > 10 && a < 20 ? 'звёзд' : b === 1 ? 'звезда' : b >= 2 && b <= 4 ? 'звезды' : 'звёзд'; };
export const starsText = (n: number) => `${n} ${starWord(n)}`;

/** Короткая фраза для малыша (её же читает голос). */
export function kidSay(name: string, st: KidStars, minutes: number): string {
  if (st.bonus >= BONUS_STARS) return `${name}, ты супергерой! Сегодня все звёздочки твои.`;
  if (st.reachedGoal) return `Ура, ${name}! Ты заработал награду: ${minutes} минут игр. Можно получить ещё золотые звёзды!`;
  if (st.filled === 0) return `Привет, ${name}! Давай соберём звёздочки. Нажми на большую кнопку.`;
  return `Молодец, ${name}! У тебя уже ${starsText(st.filled)}. Ещё ${st.toGoal > 0 ? 'чуть-чуть' : 'немного'} до награды.`;
}
