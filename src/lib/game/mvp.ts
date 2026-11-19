/** Вклад одного дня в MVP и в рейтинг сезона ограничен этим числом норм: накрутка одного дня победу не даёт. Очки и уровень не ограничиваются. */
export const DAY_RATIO_CAP = 2;
export const dayRatio = (points: number, goal: number): number => (goal > 0 ? Math.min(DAY_RATIO_CAP, points / goal) : 0);

export interface MvpCandidate { id: number; points: number; goal: number }
export interface MvpResult { id: number; points: number; ratio: number }

/**
 * MVP дня: больше всех очков относительно своей нормы (так у 7-летнего те же шансы, что у остальных),
 * но не более DAY_RATIO_CAP норм. Нужно выполнить норму (ratio ≥ 1), иначе в этот день MVP нет.
 * Ничья: у кого больше очков (тоже в пределах потолка), затем меньший id.
 */
export function pickDayMvp(c: MvpCandidate[]): MvpResult | null {
  let best: MvpResult | null = null;
  for (const m of [...c].sort((a, b) => a.id - b.id)) {
    if (m.goal <= 0) continue;
    const r: MvpResult = { id: m.id, points: m.points, ratio: dayRatio(m.points, m.goal) };
    if (r.ratio < 1) continue;
    // при равных (в пределах потолка) результатах решает меньший id, а не накрученные очки
    if (!best || r.ratio > best.ratio + 1e-9) best = r;
    else if (Math.abs(r.ratio - best.ratio) <= 1e-9 && Math.min(r.points, m.goal * DAY_RATIO_CAP) > Math.min(best.points, c.find((x) => x.id === best!.id)!.goal * DAY_RATIO_CAP)) best = r;
  }
  return best;
}

/** Сундуков за MVP дня: по одному за каждый выигранный день. */
export const MVP_CHEST_PER_DAY = 1;
