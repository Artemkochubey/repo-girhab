export type RegionId = 'frontal' | 'parietal' | 'temporal' | 'occipital' | 'cerebellum' | 'limbic' | 'stem';

export interface BrainRegion {
  id: RegionId; name: string; sphere: string; text: string;
  /** Цвет доли, когда сфера развита (как на учебных 3D-схемах). */
  color: string;
  /** Вид учёбы, который «качает» эту область (для привычек — null). */
  kind: 'Мышление' | 'Учёба' | 'Языки' | 'Книги' | 'Навыки' | 'Творчество' | null;
}

/** Упрощённая учебная схема: какая область мозга связана с какой сферой развития. */
export const BRAIN_REGIONS: BrainRegion[] = [
  { id: 'frontal', color: '#ff3d3d', name: 'Лобная доля', sphere: 'Мышление', text: 'планирование, логика, решения', kind: 'Мышление' },
  { id: 'parietal', color: '#ffd84a', name: 'Теменная доля', sphere: 'Учёба', text: 'счёт, пространство, усвоение знаний', kind: 'Учёба' },
  { id: 'temporal', color: '#4cdc6a', name: 'Височная доля', sphere: 'Языки', text: 'речь, слух, память на слова', kind: 'Языки' },
  { id: 'occipital', color: '#3fe3d4', name: 'Затылочная доля', sphere: 'Книги', text: 'зрение и чтение', kind: 'Книги' },
  { id: 'cerebellum', color: '#cfe8ff', name: 'Мозжечок', sphere: 'Навыки', text: 'координация, ловкость, умения', kind: 'Навыки' },
  { id: 'limbic', color: '#ff5a6e', name: 'Лимбическая система', sphere: 'Творчество', text: 'воображение и эмоции', kind: 'Творчество' },
  { id: 'stem', color: '#e05ad8', name: 'Ствол и базальные ганглии', sphere: 'Привычки', text: 'автоматические действия, режим дня', kind: null },
];

export interface MindDay { date: string; study: Record<string, number>; habits: number; books: number }

/** 1 законченная книга = 30 «минут» чтения; 1 привычка = 5. */
export const BOOK_EQ = 30;
export const HABIT_EQ = 5;

/** Нагрузка на области мозга (взвешенные минуты) за период [from, to]. */
export function brainLoads(log: MindDay[], from: string, to: string): Record<RegionId, number> {
  const out: Record<RegionId, number> = { frontal: 0, parietal: 0, temporal: 0, occipital: 0, cerebellum: 0, limbic: 0, stem: 0 };
  for (const d of log) {
    if (d.date < from || d.date > to) continue;
    for (const r of BRAIN_REGIONS) if (r.kind) out[r.id] += d.study[r.kind] ?? 0;
    out.occipital += d.books * BOOK_EQ;
    out.stem += d.habits * HABIT_EQ;
  }
  return out;
}

/** Яркость области 0..1: относительно самой «прокачанной», но с планкой, чтобы одна запись не зажигала всё. */
export function brainIntensity(loads: Record<RegionId, number>, days: number): Record<RegionId, number> {
  const floor = 8 * days;
  const max = Math.max(floor, ...Object.values(loads));
  const out = {} as Record<RegionId, number>;
  for (const r of BRAIN_REGIONS) out[r.id] = loads[r.id] > 0 ? Math.min(1, Math.pow(loads[r.id] / max, 0.85)) : 0;
  return out;
}

/** Общая «яркость мозга» 0..1: 45 минут развития в день = полная яркость. */
export function brainOverall(loads: Record<RegionId, number>, days: number): number {
  const total = Object.values(loads).reduce((a, b) => a + b, 0);
  return Math.min(1, total / (days * 45));
}
