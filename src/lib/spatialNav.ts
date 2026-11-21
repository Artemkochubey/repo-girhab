// Пространственная навигация пультом: выбор ближайшего элемента в направлении стрелки по геометрии (а не по порядку в разметке).
// Чистая функция без DOM: на вход прямоугольники, на выход номер выбранного. Так её можно проверять тестами.
export type Dir = 'up' | 'down' | 'left' | 'right';
export interface Box { left: number; top: number; right: number; bottom: number }
export interface Cand<T> { id: T; box: Box }

const cx = (b: Box) => (b.left + b.right) / 2;
const cy = (b: Box) => (b.top + b.bottom) / 2;
const overlap = (a0: number, a1: number, b0: number, b1: number) => Math.max(0, Math.min(a1, b1) - Math.max(a0, b0));

/**
 * Следующий элемент в направлении dir. Кандидат подходит, если его центр лежит дальше по ходу движения.
 * Оценка: расстояние по ходу + удвоенное смещение поперёк; те, что перекрываются с текущим по поперечной оси (стоят «на одной линии»),
 * всегда лучше тех, что нет. Меньше оценка лучше. Если подходящих нет, возвращается null (вызывающий код прокрутит список или страницу).
 */
export function pickNext<T>(from: Box, cands: Cand<T>[], dir: Dir): T | null {
  const horiz = dir === 'left' || dir === 'right';
  const sign = dir === 'right' || dir === 'down' ? 1 : -1;
  let best: { id: T; score: number } | null = null;
  for (const c of cands) {
    const d = horiz ? cx(c.box) - cx(from) : cy(c.box) - cy(from);
    if (d * sign <= 1) continue;   // не в ту сторону (или тот же элемент)
    // зазор по ходу движения (0, если прямоугольники наезжают друг на друга)
    const gap = horiz
      ? (sign > 0 ? Math.max(0, c.box.left - from.right) : Math.max(0, from.left - c.box.right))
      : (sign > 0 ? Math.max(0, c.box.top - from.bottom) : Math.max(0, from.top - c.box.bottom));
    const cross = horiz ? Math.abs(cy(c.box) - cy(from)) : Math.abs(cx(c.box) - cx(from));
    const ov = horiz ? overlap(from.top, from.bottom, c.box.top, c.box.bottom) : overlap(from.left, from.right, c.box.left, c.box.right);
    const crossGap = horiz
      ? Math.max(0, Math.max(c.box.top - from.bottom, from.top - c.box.bottom))
      : Math.max(0, Math.max(c.box.left - from.right, from.left - c.box.right));
    const score = gap + Math.abs(d) * 0.25 + cross * 2 + (ov > 0 ? 0 : 10000 + crossGap * 3);
    if (!best || score < best.score) best = { id: c.id, score };
  }
  return best ? best.id : null;
}

/** С чего начать, когда фокуса ещё нет: ближайший к левому верхнему углу области (сначала верхние, потом левые). */
export function pickFirst<T>(cands: Cand<T>[]): T | null {
  let best: { id: T; score: number } | null = null;
  for (const c of cands) {
    const score = c.box.top * 4 + c.box.left;
    if (!best || score < best.score) best = { id: c.id, score };
  }
  return best ? best.id : null;
}
