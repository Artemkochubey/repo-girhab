export interface MvpCandidate { id: number; points: number; goal: number }
export interface MvpResult { id: number; points: number; ratio: number }

/**
 * MVP дня: больше всех очков относительно своей нормы (так у 7-летнего те же шансы, что у остальных).
 * Нужно выполнить норму (ratio ≥ 1), иначе в этот день MVP нет.
 * Ничья: у кого больше очков, затем меньший id.
 */
export function pickDayMvp(c: MvpCandidate[]): MvpResult | null {
  let best: MvpResult | null = null;
  for (const m of [...c].sort((a, b) => a.id - b.id)) {
    if (m.goal <= 0) continue;
    const r: MvpResult = { id: m.id, points: m.points, ratio: m.points / m.goal };
    if (r.ratio < 1) continue;
    if (!best || r.ratio > best.ratio + 1e-9 || (Math.abs(r.ratio - best.ratio) <= 1e-9 && r.points > best.points)) best = r;
  }
  return best;
}

/** Сундуков за MVP дня: по одному за каждый выигранный день. */
export const MVP_CHEST_PER_DAY = 1;
