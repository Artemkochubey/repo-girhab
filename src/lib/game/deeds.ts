/** Добрые дела: каталог, очки и дневные ограничения. Это третий раздел отметок рядом с «Телом» и «Умом». */

export type DeedCategory = 'home' | 'family' | 'people' | 'nature' | 'words';
export const DEED_CATEGORIES: { id: DeedCategory; name: string; emoji: string }[] = [
  { id: 'home', name: 'Дома', emoji: '🏠' }, { id: 'family', name: 'Семье', emoji: '👨‍👩‍👧' }, { id: 'people', name: 'Друзьям и людям', emoji: '🤝' },
  { id: 'nature', name: 'Животным и природе', emoji: '🌱' }, { id: 'words', name: 'Добрым словом', emoji: '💬' },
];

export interface DeedDef { id: string; cat: DeedCategory; emoji: string; name: string; text: string; points: number }

export const DEEDS: DeedDef[] = [
  { id: 'dishes', cat: 'home', emoji: '🍽', name: 'Помыл посуду', text: 'Помог с посудой после еды', points: 8 },
  { id: 'trash', cat: 'home', emoji: '🗑', name: 'Вынес мусор', text: 'Вынес мусор без напоминания', points: 6 },
  { id: 'tidy', cat: 'home', emoji: '🧹', name: 'Навёл порядок', text: 'Убрал в комнате или в общей зоне', points: 8 },
  { id: 'cook', cat: 'home', emoji: '🍳', name: 'Помог готовить', text: 'Помог приготовить еду', points: 10 },
  { id: 'laundry', cat: 'home', emoji: '👕', name: 'Помог со стиркой', text: 'Развесил, сложил или убрал бельё', points: 8 },
  { id: 'table', cat: 'home', emoji: '🪑', name: 'Накрыл на стол', text: 'Накрыл или убрал со стола', points: 6 },
  { id: 'sibling', cat: 'family', emoji: '🧸', name: 'Помог брату или сестре', text: 'Выручил, поиграл, объяснил', points: 10 },
  { id: 'hug', cat: 'family', emoji: '🤗', name: 'Поддержал', text: 'Обнял или успокоил того, кому грустно', points: 8 },
  { id: 'call', cat: 'family', emoji: '📞', name: 'Позвонил родным', text: 'Позвонил бабушке, дедушке или родным', points: 8 },
  { id: 'gift', cat: 'family', emoji: '🎁', name: 'Сделал подарок', text: 'Нарисовал открытку или сделал сюрприз', points: 12 },
  { id: 'friend', cat: 'people', emoji: '🤝', name: 'Помог другу', text: 'Помог другу или однокласснику', points: 10 },
  { id: 'share', cat: 'people', emoji: '🍎', name: 'Поделился', text: 'Поделился едой, игрушкой, временем', points: 8 },
  { id: 'seat', cat: 'people', emoji: '🚌', name: 'Уступил или помог', text: 'Уступил место, придержал дверь, помог незнакомому', points: 8 },
  { id: 'pet', cat: 'nature', emoji: '🐶', name: 'Позаботился о питомце', text: 'Покормил, выгулял, почистил', points: 8 },
  { id: 'plant', cat: 'nature', emoji: '🌱', name: 'Позаботился о растениях', text: 'Полил или посадил растение', points: 8 },
  { id: 'clean', cat: 'nature', emoji: '🧺', name: 'Убрал мусор на улице', text: 'Собрал мусор во дворе, в парке, на природе', points: 12 },
  { id: 'birds', cat: 'nature', emoji: '🐦', name: 'Покормил птиц', text: 'Покормил птиц или зверей', points: 6 },
  { id: 'thanks', cat: 'words', emoji: '🙏', name: 'Сказал «спасибо»', text: 'Поблагодарил от души', points: 5 },
  { id: 'compliment', cat: 'words', emoji: '💬', name: 'Сказал доброе слово', text: 'Похвалил, подбодрил, сделал комплимент', points: 5 },
  { id: 'peace', cat: 'words', emoji: '🕊', name: 'Помирился', text: 'Попросил прощения или помог помириться другим', points: 10 },
  { id: 'custom', cat: 'people', emoji: '✨', name: 'Своё доброе дело', text: 'Опишите, что вы сделали', points: 8 },
];
export const deedById = (id: string): DeedDef | undefined => DEEDS.find((d) => d.id === id);
export const CUSTOM_DEED = 'custom';
export const CUSTOM_NOTE_MAX = 80;

/** Сколько добрых дел в день приносит очки (остальные записываются, но очков не дают). */
export const DEED_DAY_CAP = 5;
/** Сколько раз за день один и тот же вид дела приносит очки. «Своё» можно дважды. */
export const deedKindLimit = (kind: string) => (kind === CUSTOM_DEED ? 2 : 1);

export interface DeedRow { id?: number; kind: string }
export interface ScoredDeed<T extends DeedRow> { row: T; counted: boolean; points: number }

/** Какие дела дня засчитываются. Порядок — как записано; лишние сверх лимитов остаются в журнале без очков. */
export function scoreDeeds<T extends DeedRow>(rows: T[]): { items: ScoredDeed<T>[]; points: number; counted: number } {
  const perKind = new Map<string, number>();
  let counted = 0, points = 0;
  const items = rows.map((row) => {
    const def = deedById(row.kind);
    const used = perKind.get(row.kind) ?? 0;
    const ok = !!def && counted < DEED_DAY_CAP && used < deedKindLimit(row.kind);
    perKind.set(row.kind, used + 1);
    if (ok) { counted++; points += def!.points; }
    return { row, counted: ok, points: ok ? def!.points : 0 };
  });
  return { items, points, counted };
}

/** Можно ли ещё записать такое дело с очками (для подсказки на кнопке). */
export function deedStatus(rows: DeedRow[], kind: string): 'ok' | 'kind' | 'cap' {
  const { counted } = scoreDeeds(rows);
  if (counted >= DEED_DAY_CAP) return 'cap';
  if (rows.filter((r) => r.kind === kind).length >= deedKindLimit(kind)) return 'kind';
  return 'ok';
}

export interface DeedLogRow { id?: number; date: string; kind: string; note?: string | null }
export interface DeedJournalItem { id: number | null; date: string; kind: string; note: string | null; counted: boolean; points: number }

const dayBefore = (d: string) => { const x = new Date(d + 'T00:00:00Z'); x.setUTCDate(x.getUTCDate() - 1); return x.toISOString().slice(0, 10); };

/** Журнал дел с отметкой «засчитано»: внутри дня по порядку записи, дни от новых к старым. */
export function deedJournal(rows: DeedLogRow[]): DeedJournalItem[] {
  const byDate = new Map<string, DeedLogRow[]>();
  for (const r of rows) byDate.set(r.date, [...(byDate.get(r.date) ?? []), r]);
  const out: DeedJournalItem[] = [];
  for (const date of [...byDate.keys()].sort().reverse()) {
    const sc = scoreDeeds([...byDate.get(date)!].sort((a, b) => (a.id ?? 0) - (b.id ?? 0)));
    for (const x of sc.items.slice().reverse()) out.push({ id: x.row.id ?? null, date, kind: x.row.kind, note: x.row.note ?? null, counted: x.counted, points: x.points });
  }
  return out;
}

export interface DeedSummary { total: number; week: number; today: number; streak: number; bestStreak: number; days: number; points: number; byCat: Record<DeedCategory, number> }

/** Сводка доброты: сколько дел засчитано всего, за 7 дней, серия дней подряд с добрым делом. */
export function deedSummary(rows: DeedLogRow[], today: string): DeedSummary {
  const byCat: Record<DeedCategory, number> = { home: 0, family: 0, people: 0, nature: 0, words: 0 };
  const counted = new Map<string, number>();
  let total = 0, points = 0;
  for (const it of deedJournal(rows)) {
    if (!it.counted) continue;
    total++; points += it.points;
    counted.set(it.date, (counted.get(it.date) ?? 0) + 1);
    const def = deedById(it.kind); if (def) byCat[def.cat]++;
  }
  let week = 0; let d = today;
  for (let i = 0; i < 7; i++) { week += counted.get(d) ?? 0; d = dayBefore(d); }
  // серия: сегодняшний день без дела серию не обрывает, он ещё идёт
  let streak = 0; d = (counted.get(today) ?? 0) > 0 ? today : dayBefore(today);
  while ((counted.get(d) ?? 0) > 0) { streak++; d = dayBefore(d); }
  let best = 0, run = 0, prev: string | null = null;
  for (const date of [...counted.keys()].sort()) { run = prev && dayBefore(date) === prev ? run + 1 : 1; best = Math.max(best, run); prev = date; }
  return { total, week, today: counted.get(today) ?? 0, streak, bestStreak: best, days: counted.size, points, byCat };
}

/** Звания доброты по числу засчитанных дел. */
export const KIND_RANKS: { from: number; name: string; emoji: string }[] = [
  { from: 0, name: 'Росток добра', emoji: '🌱' }, { from: 5, name: 'Помощник', emoji: '🤝' }, { from: 15, name: 'Добрый друг', emoji: '🤗' },
  { from: 40, name: 'Добрый рыцарь', emoji: '🛡' }, { from: 100, name: 'Хранитель добра', emoji: '🌈' }, { from: 200, name: 'Сердце семьи', emoji: '💖' },
];
export function kindRank(total: number): { rank: (typeof KIND_RANKS)[number]; next: (typeof KIND_RANKS)[number] | null; left: number; progress: number } {
  let i = 0;
  for (let k = 0; k < KIND_RANKS.length; k++) if (total >= KIND_RANKS[k]!.from) i = k;
  const rank = KIND_RANKS[i]!, next = KIND_RANKS[i + 1] ?? null;
  return { rank, next, left: next ? next.from - total : 0, progress: next ? (total - rank.from) / (next.from - rank.from) : 1 };
}
