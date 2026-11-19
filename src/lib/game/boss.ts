export const BOSSES = [
  { id: 1, name: 'Лавовый голем', emoji: '🌋', weak: ['workout', 'warmup'] },
  { id: 2, name: 'Туманный змей', emoji: '🐍', weak: ['Книги', 'book'] },
  { id: 3, name: 'Король гоблинов Хаос', emoji: '👹', weak: ['habits'] },
  { id: 4, name: 'Тень Безмолвия', emoji: '🧙', weak: ['Творчество', 'Навыки'] },
  { id: 5, name: 'Болотный полиглот', emoji: '🐸', weak: ['Языки'] },
  { id: 6, name: 'Древний лич', emoji: '💀', weak: ['Учёба', 'Мышление'] },
] as const;

export const WEAK_BONUS = 0.25;

/** Номер ISO-недели для 'YYYY-MM-DD'. */
export function isoWeekNumber(date: string): number {
  const d = new Date(date + 'T00:00:00Z');
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - day);
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  return Math.ceil(((d.getTime() - yearStart) / 86_400_000 + 1) / 7);
}

/** Понедельник недели для 'YYYY-MM-DD'. */
export function weekStart(date: string): string {
  const d = new Date(date + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

export const bossForDate = (date: string) => BOSSES[isoWeekNumber(date) % BOSSES.length];

/** HP = round(Σнорм × 7 × 0.7 / 10) × 10. */
export const bossHp = (goals: number[]): number =>
  Math.round((goals.reduce((a, b) => a + b, 0) * 7 * 0.7) / 10) * 10;

/** Урон = очки семьи + 25% очков слабой сферы. */
export function bossDamage(total: number, weakPoints: number): number {
  return Math.round(total + weakPoints * WEAK_BONUS);
}

/** Награды за победу: сундук каждому с вкладом ≥10%, MVP +1. */
export function bossRewards(damageByMember: Record<number, number>): { chests: Record<number, number>; mvp: number | null } {
  const total = Object.values(damageByMember).reduce((a, b) => a + b, 0);
  const chests: Record<number, number> = {};
  let mvp: number | null = null;
  let max = 0;
  for (const [id, dmg] of Object.entries(damageByMember)) {
    if (total > 0 && dmg / total >= 0.1) chests[+id] = 1;
    if (dmg > max) { max = dmg; mvp = +id; }
  }
  if (mvp !== null) chests[mvp] = (chests[mvp] ?? 0) + 1;
  return { chests, mvp };
}
