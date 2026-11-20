import { seededRandom } from './quests';

/**
 * Артефакты: одноразовые предметы с эффектом внутри игры (в отличие от призов сундуков, которые вручают в жизни).
 * Откуда: из сундуков (шанс зависит от редкости сундука) и за победы: босс, сезон, MVP дня, тяжёлая недельная цель.
 * Все артефакты выводятся из истории по ключу (key), в базе хранится только использование.
 */
export type ArtifactKind = 'shield' | 'doubler' | 'key' | 'luck';
export const ARTIFACT_KINDS: ArtifactKind[] = ['shield', 'doubler', 'key', 'luck'];

export const ARTIFACTS: Record<ArtifactKind, { name: string; emoji: string; text: string; how: string }> = {
  shield: { name: 'Щит дня', emoji: '🛡', text: 'Один пропущенный день за последнюю неделю не обрывает серию.', how: 'Выберите пропущенный день: серия продолжится, как будто он был.' },
  doubler: { name: 'Удвоитель', emoji: '✨', text: 'Двойные очки за выбранный день: бонус равен очкам дня, но не больше супер-нормы.', how: 'Выберите день (сегодня или до 7 дней назад).' },
  key: { name: 'Ключ сундука', emoji: '🔑', text: 'Даёт +1 сундук сразу.', how: 'Нажмите «Использовать»: сундук появится на экране «Герой».' },
  luck: { name: 'Талисман удачи', emoji: '🍀', text: 'Следующий открытый сундук точно будет редким или легендарным.', how: 'Активируйте, затем откройте сундук.' },
};

export type ArtifactSource = 'chest' | 'boss' | 'season' | 'mvp' | 'goal';
export const SOURCE_NAMES: Record<ArtifactSource, string> = { chest: 'из сундука', boss: 'за победу над боссом', season: 'за победу в сезоне', mvp: 'за MVP дня', goal: 'за сложную цель недели' };

/** Шанс найти артефакт при открытии сундука по редкости. */
export const CHEST_CHANCE = { common: 0.08, rare: 0.2, legend: 0.4 } as const;
/** Шанс артефакта за звание MVP дня (по детерминированному «жребию» от даты). */
export const MVP_CHANCE = 0.25;
const WEIGHTS: [ArtifactKind, number][] = [['shield', 3], ['doubler', 2], ['key', 2], ['luck', 3]];

function pick(r: number): ArtifactKind {
  const total = WEIGHTS.reduce((a, [, w]) => a + w, 0);
  let x = r * total;
  for (const [k, w] of WEIGHTS) { if (x < w) return k; x -= w; }
  return 'shield';
}
/** Вид артефакта по ключу: один и тот же ключ всегда даёт один и тот же вид. */
export const kindFromKey = (key: string): ArtifactKind => pick(seededRandom('kind:' + key)());

/** Выпал ли артефакт из сундука: r1 — на шанс, r2 — на вид. */
export function rollChestArtifact(rarity: 'common' | 'rare' | 'legend', r1: number, r2: number): ArtifactKind | null {
  return r1 < CHEST_CHANCE[rarity] ? pick(r2) : null;
}

export interface ArtifactItem { key: string; kind: ArtifactKind; source: ArtifactSource; date: string }
export interface ArtifactUse { key: string; kind: string; status: 'active' | 'used'; activeFor: string | null; usedOn: string | null }
export interface ArtifactState extends ArtifactItem { status: 'bag' | 'active' | 'used'; activeFor: string | null; usedOn: string | null }

export interface ArtifactInput {
  since: string | null;                                        // за победы выдаются с этой даты, задним числом ничего не начисляется
  chests: { n: number; date: string; artifact: string | null }[];
  bossWins: string[];                                          // конец недели (воскресенье) побед над боссом
  seasonWins: { id: string; date: string }[];
  mvpDates: string[];
  goalWeeks: string[];                                         // начало недели выполненных сложных целей
  uses: ArtifactUse[];
}

export function deriveArtifacts(i: ArtifactInput): ArtifactState[] {
  const items: ArtifactItem[] = [];
  for (const c of i.chests) if (c.artifact && (ARTIFACT_KINDS as string[]).includes(c.artifact)) items.push({ key: `chest:${c.n}`, kind: c.artifact as ArtifactKind, source: 'chest', date: c.date });
  const ok = (d: string) => !!i.since && d >= i.since;
  for (const d of i.bossWins) if (ok(d)) items.push({ key: `boss:${d}`, kind: kindFromKey(`boss:${d}`), source: 'boss', date: d });
  for (const s of i.seasonWins) if (ok(s.date)) items.push({ key: `season:${s.id}`, kind: kindFromKey(`season:${s.id}`), source: 'season', date: s.date });
  for (const d of i.mvpDates) if (ok(d) && seededRandom('mvp:' + d)() < MVP_CHANCE) items.push({ key: `mvp:${d}`, kind: kindFromKey(`mvp:${d}`), source: 'mvp', date: d });
  for (const w of i.goalWeeks) items.push({ key: `goal:${w}`, kind: kindFromKey(`goal:${w}`), source: 'goal', date: w });
  const use = new Map(i.uses.map((u) => [u.key, u]));
  return items.sort((a, b) => (a.date === b.date ? (a.key < b.key ? -1 : 1) : a.date < b.date ? -1 : 1)).map((it) => {
    const u = use.get(it.key);
    return { ...it, status: u ? u.status : 'bag', activeFor: u?.activeFor ?? null, usedOn: u?.usedOn ?? null };
  });
}
