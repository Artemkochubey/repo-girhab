import { addDays } from '../date';
import { BATTLE_DROP, GEAR_RARITIES, RARITY_NAMES } from './gear';
import { ELITE_DROP, ELITE_FACTOR, HP_FACTOR, WEEKDAY_FACTOR, fight, hordeOfDay, wavesFor, DROP_CHANCE } from './battle';
import { BASE_CHANCE, PITY, rollChest, type Rarity } from './chests';
import { levelFromXp, xpNeed } from './level';
import { seededRandom } from './quests';
import { NO_GEAR } from './gear';

/** Разбор баланса игры: сколько дней до уровней, как часто выпадают сундуки и снаряжение, как идут бои. Только расчёты, ничего не меняет. */
export const LEVELS = [2, 5, 8, 10, 12, 15, 20] as const;
export const DAILY = [40, 60, 90, 120] as const;

export interface LevelRow { level: number; xp: number; days: number[] }
/** Сколько дней до уровня при ровных очках в день (опыт = очки; бонусы квестов, боёв и целей недели ускоряют). */
export function levelTable(levels: readonly number[] = LEVELS, daily: readonly number[] = DAILY): LevelRow[] {
  return levels.map((level) => ({ level, xp: xpNeed(level), days: daily.map((d) => Math.ceil(xpNeed(level) / d)) }));
}

export interface ChestStats { chests: number; rare: number; legend: number; avgBetweenRare: number; avgBetweenLegend: number; maxGapRare: number; maxGapLegend: number }
/** Распределение сундуков при гарантиях 10/35 (без удачи и боссов): моделируем много открытий с заданным зерном. */
export function chestStats(n = 50000, seed = 'balance'): ChestStats {
  const r = seededRandom(seed);
  let sinceRare = 0, sinceLegend = 0, rare = 0, legend = 0, gapR = 0, gapL = 0, maxR = 0, maxL = 0;
  for (let i = 0; i < n; i++) {
    const res = rollChest(r(), { sinceRare, sinceLegend, boss: false });
    const x: Rarity = res.rarity;
    sinceRare = x === 'common' ? sinceRare + 1 : 0;
    sinceLegend = x === 'legend' ? 0 : sinceLegend + 1;
    gapR++; gapL++;
    if (x !== 'common') { rare++; maxR = Math.max(maxR, gapR); gapR = 0; }
    if (x === 'legend') { legend++; maxL = Math.max(maxL, gapL); gapL = 0; }
  }
  return { chests: n, rare, legend, avgBetweenRare: n / Math.max(1, rare), avgBetweenLegend: n / Math.max(1, legend), maxGapRare: maxR, maxGapLegend: maxL };
}

export interface BossRow { participation: number; mult: number; days: number; weekEnough: boolean }
/** Через сколько дней падает босс, если каждый герой набирает долю нормы, а урон усилен множителем (класс, снаряжение, таланты). HP босса = Σнорм × 7 × 0,7. */
export function bossTable(participation: readonly number[] = [0.5, 0.7, 1, 1.3], mults: readonly number[] = [1, 1.2, 1.4]): BossRow[] {
  return participation.flatMap((p) => mults.map((m) => { const days = (7 * 0.7) / (p * m); return { participation: p, mult: m, days: Math.round(days * 10) / 10, weekEnough: days <= 7 }; }));
}

export interface HordeRow { ratio: number; kind: 'weekday' | 'elite'; cleared: number; outcome: string }
/** Исход боя с ордой при очках в долях нормы (очки поровну по четырём сферам, без снаряжения): будни и элитная орда выходного дня. */
export function hordeTable(goal = 60, ratios: readonly number[] = [0.6, 0.8, 1, 1.2, 1.5]): HordeRow[] {
  const base = hordeOfDay('2026-11-17');                         // вторник: слабости волн для примера
  const factorOf = (kind: HordeRow['kind']) => (kind === 'weekday' ? WEEKDAY_FACTOR[2] : WEEKDAY_FACTOR[6] * ELITE_FACTOR);
  return (['weekday', 'elite'] as const).flatMap((kind) => ratios.map((ratio) => {
    const hd = { ...base, factor: factorOf(kind) };
    const { waves } = wavesFor(hd, goal, NO_GEAR, false);
    const total = goal * ratio;
    const f = fight({ body: total / 4, mind: total / 4, art: total / 4, will: total / 4, gen: 0 }, waves, NO_GEAR, 0, 100);
    return { ratio, kind, cleared: f.cleared, outcome: f.outcome === 'victory' ? 'победа' : f.outcome === 'held' ? 'отбились (2 волны)' : 'поражение' };
  }));
}

/** Добыча снаряжения: доли редкостей за 100 побед и сколько побед нужно до легендарной. */
export function dropTable() {
  const share = (w: Record<string, number>) => { const t = Object.values(w).reduce((a, b) => a + b, 0); return GEAR_RARITIES.map((r) => ({ rarity: r, pct: Math.round(((w[r] ?? 0) / t) * 1000) / 10 })); };
  const chance = DROP_CHANCE;
  return {
    normal: { chance: chance.weekday, shares: share(BATTLE_DROP), winsPerLegend: Math.round(1 / (chance.weekday * ((BATTLE_DROP.legend ?? 0) / Object.values(BATTLE_DROP).reduce((a, b) => a + b, 0)))) },
    elite: { chance: chance.elite, shares: share(ELITE_DROP), winsPerLegend: Math.round(1 / (chance.elite * ((ELITE_DROP.legend ?? 0) / Object.values(ELITE_DROP).reduce((a, b) => a + b, 0)))) },
  };
}

const f1 = (x: number) => (Math.round(x * 10) / 10).toString().replace('.', ',');
const pctS = (x: number) => `${Math.round(x * 100)}%`;
const daysText = (d: number) => (d >= 365 ? `${f1(d / 365)} г.` : `${d} дн.`);

/** BALANCE.md: расчётные таблицы баланса (без данных семьи). Собирается командой `npm run balance`, тест следит за актуальностью. */
export function balanceMarkdown(): string {
  const L: string[] = [];
  const row = (...c: (string | number)[]) => `| ${c.join(' | ')} |`;
  L.push('# Разбор баланса «Семьи Легенд»', '', 'Этот файл собирается из кода игры командой `npm run balance` (расчёты без данных вашей семьи). Для разбора вашей семьи запустите ту же команду на сервере: она дополнительно напечатает таблицу по реальным записям.', '');
  L.push('## Сколько дней до уровня', '', 'Опыт равен очкам дня (с бонусами). Таблица для ровных очков в день; квесты, победы над ордой и цели недели добавляют опыт сверху, так что реально быстрее на 20–60%.', '');
  L.push(row('Уровень', 'Опыт всего', ...DAILY.map((d) => `${d} оч./день`)), row('---', '---', ...DAILY.map(() => '---')));
  for (const r of levelTable()) L.push(row(r.level, r.xp, ...r.days.map(daysText)));
  L.push('', `Кривая: переход 1→2 стоит 50 опыта, каждый следующий уровень в 1,5 раза дороже. Уровни выше 15 при ежедневных нормах 60 очков занимают годы: «Вершина» (15) достижима, а высшие звания горы задуманы как дальняя цель.`, '');
  const cs = chestStats();
  L.push('## Сундуки и гарантии', '', `Модель на ${cs.chests} открытий без удачи и боссов (шансы ${pctS(BASE_CHANCE.legend)} легендарный, ${pctS(BASE_CHANCE.rare)} редкий, гарантии ${PITY.rare}/${PITY.legend}):`, '');
  L.push(row('Показатель', 'Значение'), row('---', '---'), row('Редкий или лучше: каждый N-й сундук в среднем', f1(cs.avgBetweenRare)), row('Легендарный: каждый N-й сундук в среднем', f1(cs.avgBetweenLegend)), row('Самая длинная серия без редкого', cs.maxGapRare), row('Самая длинная серия без легендарного', cs.maxGapLegend), '');
  L.push('## Босс недели', '', 'HP босса = сумма норм × 7 × 0,7. Строка показывает, за сколько дней семья его победит, если каждый герой набирает долю своей нормы, а урон усилен множителем (класс, снаряжение, таланты, способности).', '');
  L.push(row('Доля нормы в день', 'Множитель урона', 'Дней до победы', 'Успеем за неделю?'), row('---', '---', '---', '---'));
  for (const r of bossTable()) L.push(row(pctS(r.participation), `×${f1(r.mult)}`, f1(r.days), r.weekEnough ? 'да' : 'нет'));
  L.push('', 'Если семья в среднем набирает 70% нормы без усиления, босс падает ровно за неделю: это задуманная граница.', '');
  L.push('## Бой с ордой', '', 'Норма 60. Очки поровну по четырём сферам, снаряжения нет. По выходным приходит элитная орда (здоровье +15%, опыт за победу ×1,5, добыча не ниже редкой).', '');
  L.push(row('Очки от нормы', 'День', 'Волн убито', 'Итог'), row('---', '---', '---', '---'));
  for (const r of hordeTable()) L.push(row(pctS(r.ratio), r.kind === 'weekday' ? 'будни' : 'выходные (элитная)', r.cleared, r.outcome));
  L.push('', `Здоровье орды = норма × ${HP_FACTOR} × коэффициент дня; победа обычно требует 90–110% нормы, по выходным больше.`, '');
  const dt = dropTable();
  L.push('## Добыча снаряжения', '', row('Орда', 'Шанс при победе', ...GEAR_RARITIES.map((r) => RARITY_NAMES[r]), 'Побед до легендарного предмета'), row('---', '---', ...GEAR_RARITIES.map(() => '---'), '---'));
  L.push(row('Обычная', pctS(dt.normal.chance), ...dt.normal.shares.map((s) => `${s.pct}%`), dt.normal.winsPerLegend));
  L.push(row('Элитная', pctS(dt.elite.chance), ...dt.elite.shares.map((s) => `${s.pct}%`), dt.elite.winsPerLegend));
  L.push('', 'Лишние одинаковые предметы можно сливать: три одинаковых дают один следующей редкости.', '');
  return L.join('\n');
}

export interface RealMember { name: string; level: number; xp: number; avg14: number; avg30: number; days: number; daysToNext: number | null; battleWins: number; battles: number }
/** Реальная статистика семьи по истории (для команды `npm run balance` на сервере). */
export function realStats(members: { name: string; level: number; xp: number; days: Map<string, { total: number }>; battleRows: { win: boolean }[] }[], today: string): RealMember[] {
  return members.map((m) => {
    const avg = (n: number) => { let s = 0, c = 0; for (let i = 0; i < n; i++) { const d = m.days.get(addDays(today, -i)); if (d) { s += d.total; c++; } } return c ? s / c : 0; };
    const a14 = avg(14);
    const need = xpNeed(m.level + 1) - m.xp;
    return { name: m.name, level: m.level, xp: Math.round(m.xp), avg14: Math.round(a14), avg30: Math.round(avg(30)), days: m.days.size, daysToNext: a14 > 0 ? Math.ceil(need / a14) : null, battleWins: m.battleRows.filter((r) => r.win).length, battles: m.battleRows.length };
  });
}
export { levelFromXp };
