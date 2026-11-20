export async function rpc<T = unknown>(action: string, args: Record<string, unknown> = {}): Promise<T> {
  const r = await fetch('/api/rpc', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action, ...args }) });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error ?? 'Ошибка');
  return j as T;
}
export async function post(url: string, body: unknown = {}, method = 'POST') {
  const r = await fetch(url, { method, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error ?? 'Ошибка');
  return j;
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

export interface State {
  season: { current: SeasonDto; history: SeasonDto[]; prizes: readonly number[]; wins: Record<number, number> };
  familyQuests: FamilyQuestDto[];
  mvp: MvpDto;
  shop: { items: ShopItemDto[]; allItems: ShopItemDto[]; purchases: PurchaseDto[] };
  today: string; pinSet: boolean; parent: boolean; me: number | null;
  config: { minutes: number; superMinutes: number; timezone: string; reminderHour: number };
  members: { id: number; name: string; emoji: string; color: string; isParent: boolean; goal: number; superGoal: number; badges: number; xp: number; level: number; cls: string | null; sub: string | null; pointsToday: number; damageThisWeek: number }[];
  boss: { weekStart: string; hp: number; damage: number; defeated: boolean; finished: boolean; byMember: Record<number, number>; mvp: number | null; boss: { id: number; name: string; emoji: string; weak: readonly string[] } };
  admin: null | {
    pending: { memberId: number; date: string; index: number; t: string; xp: number }[];
    familyQuestsAll: FamilyQuestDto[];
    quests: Record<number, { items: QuestDto[]; hasDefault: boolean }>;
    loot: string[]; lootRare: string[]; lootLegend: string[];
    manualGoals: { memberId: number; weekStart: string; title: string; tier: 'easy' | 'mid' | 'hard'; confirmed: boolean; finished: boolean }[];
    prizesRequested: { memberId: number; n: number; date: string; rarity: string; reward: string }[];
    review: { memberId: number; date: string; points: number; reasons: string[]; entries: { id: number; minutes: number; reps: number | null; exercise: string | null; eq: number }[] }[];
    questSets: { id: string; name: string; emoji: string; items: QuestDto[] }[];
  };
  detail: null | {
    id: number; date: string; xp: number; level: number; into: number; span: number; streak: number; talentPointsFree: number; shopDiscount: number; reviewDates: string[]; recommendedSub: string | null;
    hero: { cls: 'w' | 'm' | 'b' | 'p' | null; sub: 'w' | 'm' | 'b' | 'p' | null; clsChangedAt: string; talents: string[] };
    wallet: { balance: number; spent: number };
    chests: { earned: number; opened: number; available: number };
    goal: { weekStart: string; weekEnd: string; canChoose: boolean; current: GoalStateDto | null; last: GoalStateDto | null; options: GoalOptionDto[] };
    artifacts: ArtifactDto[];
    artifactDates: { shield: string[]; doubler: string[] };
    chestLog: { n: number; date: string; rarity: string; reward: string; artifact: string | null; status: 'bag' | 'requested' | 'delivered'; deliveredOn: string | null }[];
    radar: { key: string; value: number }[];
    achievements: AchievementDto[];
    mindLog: { date: string; study: Record<string, number>; habits: number; books: number }[];
    mvpWins: number;
    day: { points: number; stats: { workoutMinutes: number; warmups: number; study: Record<string, number>; habits: number; books: number; questXp: number };
      bySphere: Record<string, number>;
      quests: { t: string; d?: string; xp: number; k: string; m?: number; kind?: string; done?: boolean; pending?: boolean; completed: boolean }[] };
    workoutLog: { id: number; date: string; minutes: number; reps: number | null; eq: number; exercise: string | null; muscles: string[] | null }[];
    entries: { workouts: { id: number; minutes: number; reps: number | null; eq: number; exercise: string | null; muscles: string[] | null }[]; study: { id: number; kind: string; minutes: number }[]; warmups: { id: number }[]; books: { id: number; title: string }[] };
    habits: { id: number; name: string; checked: boolean }[];
    history: [string, number][];
    bodyHistory: [string, number][];
  };
}
