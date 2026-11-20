/** Ошибка обращения к серверу с понятным текстом. status 0 — сервер не ответил. */
export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); this.name = 'ApiError'; }
}
export const MSG_OFFLINE = 'Нет связи с сервером. Проверьте, что сайт запущен и телефон в домашней сети, потом повторите.';
export const MSG_SERVER = 'Сервер не смог выполнить действие. Подождите минуту и повторите. Если не проходит, откройте logs.bat на компьютере с сайтом.';
export const MSG_UNREADABLE = 'Сервер ответил непонятно. Обновите страницу и повторите.';

/** Запрос к серверу: сеть, не-JSON и ошибки сервера превращаются в понятные сообщения, текст от сервера (PIN, лимиты) сохраняется. */
async function call(url: string, init: RequestInit): Promise<unknown> {
  let r: Response;
  try { r = await fetch(url, init); } catch { throw new ApiError(MSG_OFFLINE, 0); }
  let j: unknown = null;
  try { j = await r.json(); } catch { if (!r.ok) throw new ApiError(r.status >= 500 ? MSG_SERVER : MSG_UNREADABLE, r.status); throw new ApiError(MSG_UNREADABLE, r.status); }
  if (!r.ok) {
    const msg = (j as { error?: string } | null)?.error;
    throw new ApiError(msg ?? (r.status >= 500 ? MSG_SERVER : 'Не получилось'), r.status);
  }
  return j;
}

export async function rpc<T = unknown>(action: string, args: Record<string, unknown> = {}): Promise<T> {
  return (await call('/api/rpc', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action, ...args }) })) as T;
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function post(url: string, body: unknown = {}, method = 'POST'): Promise<any> {
  return call(url, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
}

export interface QuestDto { t: string; d?: string; xp: number; k: string; m?: number; kind?: string; done?: boolean; pending?: boolean }

export interface ShopItemDto { id: number; name: string; emoji: string; description: string; price: number; currency: 'points' | 'chests'; active: boolean }
export interface PurchaseDto { id: number; memberId: number; name: string; emoji: string; price: number; currency: 'points' | 'chests'; status: 'pending' | 'done' | 'cancelled'; date: string }

export interface FamilyQuestDto {
  id: number; title: string; description: string; xp: number; kind: 'manual' | 'points'; target: number; period: 'day' | 'week'; date: string;
  status: 'open' | 'pending' | 'done'; done: boolean; doneDate: string | null; pending: boolean; progress: number; participants: number;
}
export interface AchievementDto { id: string; group: string; name: string; emoji: string; text: string; target: number; value: number; earnedOn: string | null }

export interface MvpDto { yesterday: { date: string; memberId: number; points: number } | null; leader: { memberId: number; points: number; ratio: number; qualified: boolean } | null }

export interface SeasonRowDto { memberId: number; points: number; ratio: number; days: number; normDays: number; bestDay: number; eligible: boolean; rank: number; chests: number }
export interface SeasonDto { id: string; start: string; end: string; daysLeft: number; finished: boolean; awardable: boolean; rows: SeasonRowDto[]; winner: number | null; second: number | null }

export interface GoalStateDto {
  weekStart: string; kind: string; tier: 'easy' | 'mid' | 'hard'; target: number; title: string | null; manual: boolean; confirmed: boolean;
  progress: number; done: boolean; finished: boolean; daysLeft: number; rewardXp: number; rewardChests: number; rewardArtifact: boolean;
}
export interface GoalOptionDto { kind: string; name: string; emoji: string; unit: string; tiers: { tier: 'easy' | 'mid' | 'hard'; target: number | null; xp: number; chests: number; artifact: boolean }[]; texts: string[] }
export interface ArtifactDto { key: string; kind: 'shield' | 'doubler' | 'key' | 'luck'; source: 'chest' | 'boss' | 'season' | 'mvp' | 'goal'; date: string; status: 'bag' | 'active' | 'used'; activeFor: string | null; usedOn: string | null }

export type DomainId = 'body' | 'mind' | 'art' | 'will';
import type { FaceConfig } from './game/faces';
import type { DeedSummary } from './game/deeds';
export interface DeedItemDto { id: number | null; date: string; kind: string; note: string | null; counted: boolean; points: number }
export interface MonthGoalDto {
  id: number; month: string; title: string; emoji: string; kind: 'points' | 'deeds' | 'normDays'; target: number; reward: string; given: boolean; text: string; unit: string;
  progress: number; percent: number; done: boolean; doneDate: string | null; daysLeft: number; daysTotal: number; expected: number; onTrack: boolean; need: number;
}
export interface MonthGoalViewDto { month: string; current: MonthGoalDto | null; previous: MonthGoalDto | null; suggest: Record<'points' | 'deeds' | 'normDays', number> }
export interface RatingRowDto {
  id: number; place: number; points: number; goal: number; superGoal: number; percent: number; ratio: number; qualified: boolean; mvp: boolean;
  parts: { id: import('./game/rating').SourceId; points: number }[]; top: import('./game/rating').SourceId | null; name: string; emoji: string; color: string; exists: boolean; seen: number[];
}
export interface RatingWeekRowDto {
  id: number; place: number; points: number; percent: number; ratio: number; normDays: number; days: number; best: { date: string; points: number } | null;
  parts: { id: import('./game/rating').SourceId; points: number }[]; top: import('./game/rating').SourceId | null; mvpDays: number;
  daily: { date: string; points: number; percent: number; place: number; qualified: boolean; mvp: boolean; counted: boolean }[];
  name: string; emoji: string; color: string; goal: number;
}
export interface RatingWeekDto { weekStart: string; weekEnd: string; today: string; isCurrent: boolean; dates: string[]; rows: RatingWeekRowDto[] }
export interface RatingDto { date: string; today: string; isToday: boolean; rows: RatingRowDto[] }
export interface WaveDto { unit: string; weak: DomainId; hp: number; damage: number; cleared: boolean }
export interface LiveBattleDto {
  date: string; horde: { id: string; name: string; emoji: string; units: string[] }; factor: number; weakened: boolean;
  hp: number; maxHp: number; streak: number; totalHp: number; weakDomains: DomainId[]; winChance: number; xp: number; weekend: boolean;
  fight: { waves: WaveDto[]; cleared: number; damage: number; outcome: 'victory' | 'held' | 'defeat' };
}
export interface GearItemDto { effect: { type: string; domain?: DomainId }; id: string; slot: 'weapon' | 'armor' | 'helm' | 'boots' | 'amulet'; rarity: 'common' | 'rare' | 'epic' | 'legend'; family: string; name: string; emoji: string; text: string }
export interface GearBonusDto { rage: number; comeback: number; lossMult: number; dmg: number; dmgDomain: Record<DomainId, number>; guard: number; hordeHp: number; weak: number; heal: number; streakPer: number; streakMax: number; wave1: number; loot: number; winHeal: number }

/** Что надето на герое (id предмета по слотам) по данным экрана героя. */
export const lookOf = (g: { items: { key: string; itemId: string }[]; slots: Record<string, string | null> }): Record<string, string | null> =>
  Object.fromEntries(Object.entries(g.slots).map(([sl, k]) => [sl, g.items.find((x) => x.key === k)?.itemId ?? null]));

export interface State {
  monthGoal: MonthGoalViewDto;
  season: { current: SeasonDto; history: SeasonDto[]; prizes: readonly number[]; wins: Record<number, number> };
  familyQuests: FamilyQuestDto[];
  mvp: MvpDto;
  shop: { items: ShopItemDto[]; allItems: ShopItemDto[]; purchases: PurchaseDto[] };
  today: string; pinSet: boolean; parent: boolean; me: number | null;
  config: { minutes: number; superMinutes: number; timezone: string; reminderHour: number };
  members: { id: number; name: string; emoji: string; simple: boolean; gender: 'm' | 'f' | null; face: FaceConfig | null; color: string; isParent: boolean; goal: number; superGoal: number; badges: number; xp: number; level: number; cls: string | null; sub: string | null; pointsToday: number; damageThisWeek: number; look: Record<string, string> }[];
  boss: { weekStart: string; hp: number; damage: number; defeated: boolean; finished: boolean; byMember: Record<number, number>; mvp: number | null; boss: { id: number; name: string; emoji: string; weak: readonly string[] } };
  admin: null | {
    pending: { memberId: number; date: string; index: number; t: string; xp: number }[];
    familyQuestsAll: FamilyQuestDto[];
    quests: Record<number, { items: QuestDto[]; hasDefault: boolean }>;
    loot: string[]; lootRare: string[]; lootLegend: string[];
    manualGoals: { memberId: number; weekStart: string; title: string; tier: 'easy' | 'mid' | 'hard'; confirmed: boolean; finished: boolean }[];
    prizesRequested: { memberId: number; from: number; n: number; date: string; rarity: string; reward: string }[];
    review: { memberId: number; date: string; points: number; reasons: string[]; entries: { id: number; minutes: number; reps: number | null; exercise: string | null; eq: number }[] }[];
    questSets: { id: string; name: string; emoji: string; items: QuestDto[] }[];
  };
  detail: null | {
    id: number; date: string; xp: number; level: number; into: number; span: number; streak: number; talentPointsFree: number; shopDiscount: number; reviewDates: string[]; recommendedSub: string | null;
    hero: { cls: 'w' | 'm' | 'b' | 'p' | null; sub: 'w' | 'm' | 'b' | 'p' | null; clsChangedAt: string; talents: string[] };
    wallet: { balance: number; spent: number };
    chests: { earned: number; opened: number; available: number };
    battle: { abilities: { list: { id: string; emoji: string; name: string; text: string; cost: 1 | 2; cd: number; usedToday: boolean; readyIn: number; ready: boolean }[]; focusLeft: number; focusMax: number; activeToday: string[] }; cls: 'w' | 'm' | 'b' | 'p' | null; classInfo: { role: string; roleEmoji: string; armor: string; summary: string; abilities: { emoji: string; name: string; text: string }[]; boss: { dmg: number; weak: number; party: number } } | null; live: LiveBattleDto; hp: number; streak: number; xp: number; recent: { date: string; hordeId: string; cleared: number; win: boolean; hpDelta: number; xp: number; drop: string | null }[] };
    gear: { items: { key: string; itemId: string; source: 'battle' | 'boss' | 'chest'; date: string; equipped: boolean; item: GearItemDto }[]; slots: Record<string, string | null>; bonus: GearBonusDto; classBonus: GearBonusDto };
    pity: { untilRare: number; untilLegend: number; bossWaiting: number };
    goal: { weekStart: string; weekEnd: string; canChoose: boolean; current: GoalStateDto | null; last: GoalStateDto | null; options: GoalOptionDto[] };
    artifacts: ArtifactDto[];
    artifactDates: { shield: string[]; doubler: string[] };
    chestLog: { from: number; holder: number; n: number; date: string; rarity: string; reward: string; artifact: string | null; gear: string | null; status: 'bag' | 'requested' | 'delivered'; deliveredOn: string | null }[];
    radar: { key: string; value: number }[];
    deeds: { cap: number; day: DeedItemDto[]; summary: DeedSummary; recent: DeedItemDto[] };
    achievements: AchievementDto[];
    mindLog: { date: string; study: Record<string, number>; habits: number; books: number }[];
    mvpWins: number;
    day: { points: number; stats: { workoutMinutes: number; walk: number; warmups: number; study: Record<string, number>; habits: number; books: number; deeds: number; deedPoints: number; questXp: number };
      bySphere: Record<string, number>;
      quests: { t: string; d?: string; xp: number; k: string; m?: number; kind?: string; done?: boolean; pending?: boolean; completed: boolean }[] };
    workoutLog: { id: number; date: string; minutes: number; reps: number | null; eq: number; exercise: string | null; muscles: string[] | null }[];
    entries: { workouts: { id: number; minutes: number; reps: number | null; eq: number; exercise: string | null; muscles: string[] | null }[]; study: { id: number; kind: string; minutes: number }[]; warmups: { id: number }[]; books: { id: number; title: string }[] };
    habits: { id: number; name: string; checked: boolean }[];
    history: [string, number][];
    bodyHistory: [string, number][];
  };
}
