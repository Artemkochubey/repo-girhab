import { rankFor } from './game/ranks';
import type { Tv } from './tvTypes';

/** Экраны ТВ. «Запись» интерактивная и в автосмену не входит. */
export const TV_SLIDES = [
  { id: 'overview', emoji: '🏠', label: 'Обзор' },
  { id: 'heroes', emoji: '🧙', label: 'Герои' },
  { id: 'boss', emoji: '🐉', label: 'Босс' },
  { id: 'battles', emoji: '⚔️', label: 'Бои' },
  { id: 'mountain', emoji: '⛰', label: 'Гора' },
  { id: 'season', emoji: '🏆', label: 'Сезон' },
  { id: 'quests', emoji: '📜', label: 'Квесты' },
  { id: 'record', emoji: '✍️', label: 'Запись' },
] as const;
export type TvSlideId = (typeof TV_SLIDES)[number]['id'];
export const TV_AUTO: TvSlideId[] = ['overview', 'heroes', 'boss', 'battles', 'mountain', 'season', 'quests'];
export const TV_INTERVALS = [10, 20, 30, 60] as const;
export const isSlide = (x: unknown): x is TvSlideId => TV_SLIDES.some((s) => s.id === x);

/** Следующий (dir = 1) или предыдущий (dir = −1) экран в списке. */
export function stepSlide(cur: TvSlideId, dir: 1 | -1, list: readonly TvSlideId[] = TV_SLIDES.map((s) => s.id)): TvSlideId {
  const i = list.indexOf(cur);
  if (i < 0) return list[0]!;
  return list[(i + dir + list.length) % list.length]!;
}

export interface TvEvent { id: string; emoji: string; text: string; big: boolean }

/** Что изменилось между двумя обновлениями: повод для поздравления на весь экран. Первое обновление ничего не поздравляет. */
export function tvEvents(prev: Tv | null, next: Tv): TvEvent[] {
  if (!prev || prev.today !== next.today) return [];
  const out: TvEvent[] = [];
  const add = (id: string, emoji: string, text: string, big = true) => out.push({ id, emoji, text, big });
  for (const m of next.members) {
    const p = prev.members.find((x) => x.id === m.id);
    if (!p) continue;
    if (m.level > p.level) add(`lvl:${m.id}:${m.level}`, '🎉', `${m.emoji} ${m.name}: новый уровень ${m.level}!`);
    if (p.pointsToday < m.superGoal && m.pointsToday >= m.superGoal) add(`sg:${m.id}`, '🌟', `${m.emoji} ${m.name}: максимум дня!`);
    else if (p.pointsToday < m.goal && m.pointsToday >= m.goal) add(`g:${m.id}`, '✅', `${m.emoji} ${m.name}: цель дня выполнена!`);
    const b = next.battles[m.id], pb = prev.battles[m.id];
    if (b && pb) {
      if (b.outcome === 'victory' && pb.outcome !== 'victory') add(`bv:${m.id}`, '🏆', `${m.emoji} ${m.name}: орда разбита!`);
      else if (b.cleared > pb.cleared) add(`bw:${m.id}:${b.cleared}`, '⚔️', `${m.emoji} ${m.name}: волна отбита (${b.cleared} из 3)`, false);
    }
    const g = next.goals[m.id], pg = prev.goals[m.id];
    if (g?.done && pg && !pg.done) add(`wg:${m.id}`, '🎯', `${m.emoji} ${m.name}: цель недели выполнена!`);
    const q = next.quests.find((x) => x.memberId === m.id)?.items ?? [], pq = prev.quests.find((x) => x.memberId === m.id)?.items ?? [];
    for (const it of q) if (it.done && pq.find((x) => x.index === it.index && !x.done)) add(`q:${m.id}:${it.index}`, '📜', `${m.emoji} ${m.name}: квест «${it.t}» выполнен`, false);
  }
  if (next.boss.defeated && !prev.boss.defeated) add('boss', '🐉', `${next.boss.boss.emoji} ${next.boss.boss.name} повержен! Вся семья молодцы!`);
  for (const f of next.familyQuests) if (f.done && prev.familyQuests.find((x) => x.id === f.id && !x.done)) add(`fq:${f.id}`, '👨‍👩‍👧‍👦', `Семейный квест «${f.title}» выполнен!`);
  return out;
}

/** Советы дня: показываются в нижней строке и меняются от даты к дате. */
export const TV_TIPS = [
  'Совет: волна слаба к одной сфере. Очки этой сферы бьют её в 1,5 раза сильнее.',
  'Совет: зарядка даёт 10 очков, а занимает пару минут.',
  'Совет: привычки дают очки каждый день, но не больше шести за день.',
  'Совет: сундуки дают призы, снаряжение и артефакты. Загляните во вкладку «Добыча» на телефоне.',
  'Совет: в «Арсенале» можно посмотреть всё снаряжение игры.',
  'Совет: с 5 уровня можно выбрать подкласс, он усиливает вторую сферу.',
  'Совет: босс недели общий. Чем больше очков у каждого, тем быстрее он падает.',
  'Совет: свой квест можно отметить кнопкой на телефоне или прямо здесь, на экране.',
];

/** Короткие факты для бегущей строки: кто близок к цели, сколько осталось боссу, кто лидирует. */
export function tvHighlights(d: Tv, hour: number): string[] {
  const out: string[] = [];
  const after = hour >= d.reminderHour;
  for (const m of d.members) {
    if (m.pointsToday >= m.superGoal) out.push(`🌟 ${m.emoji} ${m.name}: максимум дня, ${m.pointsToday} очков!`);
    else if (m.pointsToday >= m.goal) out.push(`✅ ${m.emoji} ${m.name}: цель дня выполнена, до максимума ${m.superGoal - m.pointsToday}`);
    else if (after) out.push(`⏰ ${m.emoji} ${m.name}: до цели дня ещё ${m.goal - m.pointsToday} очков`);
    else out.push(`${m.emoji} ${m.name}: ${m.pointsToday} очков из ${m.goal}`);
  }
  const left = Math.max(0, d.boss.hp - d.boss.damage);
  const top = Object.entries(d.boss.byMember).sort((a, b) => b[1] - a[1])[0];
  const topM = top ? d.members.find((m) => m.id === Number(top[0])) : null;
  if (d.boss.defeated) out.push(`🐉 ${d.boss.boss.name} повержен!`);
  else out.push(`🐉 ${d.boss.boss.name}: осталось ${left} из ${d.boss.hp} HP${topM && top![1] > 0 ? `, больше всех бьёт ${topM.emoji} ${topM.name}` : ''}`);
  const lead = d.mvp.leader ? d.members.find((m) => m.id === d.mvp.leader!.memberId) : null;
  if (lead) out.push(`⚡ Сегодня лидирует ${lead.emoji} ${lead.name}: ${Math.round(d.mvp.leader!.ratio * 100)}% от нормы`);
  out.push(`🏆 До конца сезона ${d.season.daysLeft} дн.`);
  for (const m of d.members) {
    const r = rankFor(m.level, m.xp);
    if (r.next && r.xpToNext <= 60) out.push(`⛰ ${m.emoji} ${m.name}: до звания «${r.next.name}» ещё ${r.xpToNext} опыта`);
  }
  const open = d.members.filter((m) => d.battles[m.id] && d.battles[m.id]!.outcome !== 'victory');
  if (open.length) out.push(`⚔️ Орда ещё не разбита у: ${open.map((m) => `${m.emoji} ${m.name}`).join(', ')}`);
  const day = Number(d.today.slice(8, 10)) || 0;
  out.push(TV_TIPS[day % TV_TIPS.length]!);
  return out;
}

/** Время суток для оформления фона: утро, день, вечер, ночь. */
export const dayPhase = (hour: number): 'morning' | 'day' | 'evening' | 'night' => (hour >= 5 && hour < 11 ? 'morning' : hour >= 11 && hour < 17 ? 'day' : hour >= 17 && hour < 22 ? 'evening' : 'night');
