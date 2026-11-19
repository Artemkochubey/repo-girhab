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

export interface State {
  shop: { items: ShopItemDto[]; allItems: ShopItemDto[]; purchases: PurchaseDto[] };
  today: string; pinSet: boolean; parent: boolean; me: number | null;
  config: { minutes: number; superMinutes: number; timezone: string };
  members: { id: number; name: string; emoji: string; color: string; isParent: boolean; goal: number; superGoal: number; level: number; cls: string | null; sub: string | null; pointsToday: number; damageThisWeek: number }[];
  boss: { weekStart: string; hp: number; damage: number; defeated: boolean; finished: boolean; byMember: Record<number, number>; mvp: number | null; boss: { id: number; name: string; emoji: string; weak: readonly string[] } };
  admin: null | {
    pending: { memberId: number; date: string; index: number; t: string; xp: number }[];
    quests: Record<number, { items: QuestDto[]; hasDefault: boolean }>;
    loot: string[]; lootRare: string[]; lootLegend: string[];
  };
  detail: null | {
    id: number; date: string; xp: number; level: number; into: number; span: number; streak: number; talentPointsFree: number; recommendedSub: string | null;
    hero: { cls: 'w' | 'm' | 'b' | 'p' | null; sub: 'w' | 'm' | 'b' | 'p' | null; clsChangedAt: string; talents: string[] };
    wallet: { balance: number; spent: number };
    chests: { earned: number; opened: number; available: number };
    radar: { key: string; value: number }[];
    day: { points: number; stats: { workoutMinutes: number; warmups: number; study: Record<string, number>; habits: number; books: number; questXp: number };
      bySphere: Record<string, number>;
      quests: { t: string; d?: string; xp: number; k: string; m?: number; kind?: string; done?: boolean; pending?: boolean; completed: boolean }[] };
    workoutLog: { id: number; date: string; minutes: number; exercise: string | null; muscles: string[] | null }[];
    entries: { workouts: { id: number; minutes: number; exercise: string | null; muscles: string[] | null }[]; study: { id: number; kind: string; minutes: number }[]; warmups: { id: number }[]; books: { id: number; title: string }[] };
    habits: { id: number; name: string; checked: boolean }[];
    history: [string, number][];
  };
}
