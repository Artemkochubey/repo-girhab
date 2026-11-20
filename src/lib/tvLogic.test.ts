import { describe, it, expect } from 'vitest';
import { TV_AUTO, TV_SLIDES, dayPhase, stepSlide, tvEvents, tvHighlights } from './tvLogic';
import type { Tv } from './tvTypes';

const live = { outcome: 'held', cleared: 0 } as never;
const base = (): Tv => ({
  familyQuests: [{ id: 1, title: 'Прогулка', description: '', xp: 20, kind: 'manual', target: 1, period: 'day', done: false, pending: false, progress: 0 }],
  mvp: { yesterday: null, leader: { memberId: 1, ratio: 0.8, qualified: true } },
  today: '2026-11-20', timezone: 'Asia/Novosibirsk', reminderHour: 19,
  battles: { 1: { horde: 'Воришки', emoji: '🥷', cleared: 0, hp: 100, maxHp: 100, outcome: 'held', live, active: [] }, 2: { horde: 'Воришки', emoji: '🥷', cleared: 0, hp: 100, maxHp: 100, outcome: 'held', live, active: [] } },
  goals: { 1: { title: 'Бег', emoji: '🏃', progress: 1, target: 3, done: false, manual: false, tier: 'easy' }, 2: null },
  season: { id: '2026-11', daysLeft: 10, top: [] },
  members: [
    { id: 1, name: 'Старший', emoji: '🧑', color: '#fff', goal: 60, superGoal: 100, badges: 0, xp: 40, level: 2, pointsToday: 20, look: {}, cls: 'w' },
    { id: 2, name: 'Младший', emoji: '👦', color: '#fff', goal: 40, superGoal: 70, badges: 0, xp: 5, level: 1, pointsToday: 50, look: {}, cls: null },
  ],
  boss: { hp: 1000, damage: 300, defeated: false, byMember: { 1: 200, 2: 100 }, mvp: null, boss: { name: 'Лич', emoji: '💀', weak: [] } },
  record: {},
  quests: [{ memberId: 1, items: [{ t: 'Загадка', xp: 20, manual: false, done: false, pending: false, index: 0, desc: null, hint: '', progress: null }] }, { memberId: 2, items: [] }],
});
const clone = (d: Tv): Tv => JSON.parse(JSON.stringify(d));

describe('ТВ: смена экранов', () => {
  it('«Запись» не входит в автосмену, остальные экраны входят', () => {
    expect(TV_AUTO).not.toContain('record');
    expect(TV_AUTO).toHaveLength(TV_SLIDES.length - 1);
  });
  it('следующий и предыдущий экран ходят по кругу', () => {
    expect(stepSlide('overview', 1)).toBe('heroes');
    expect(stepSlide('overview', -1)).toBe('record');
    expect(stepSlide('record', 1)).toBe('overview');
    expect(stepSlide('quests', 1, TV_AUTO)).toBe('overview');
    expect(stepSlide('record', 1, TV_AUTO)).toBe('overview');
  });
  it('время суток', () => {
    expect([6, 12, 19, 2].map(dayPhase)).toEqual(['morning', 'day', 'evening', 'night']);
  });
});

describe('ТВ: поздравления', () => {
  it('первое обновление и смена дня ничего не поздравляют', () => {
    expect(tvEvents(null, base())).toEqual([]);
    const n = base(); n.today = '2026-11-21'; n.members[0]!.level = 9;
    expect(tvEvents(base(), n)).toEqual([]);
  });
  it('новый уровень, цель дня и максимум дня', () => {
    const n = clone(base());
    n.members[0]!.level = 3; n.members[0]!.pointsToday = 65;      // выше цели 60
    n.members[1]!.pointsToday = 75;                                // выше максимума 70 (цель уже была)
    const ev = tvEvents(base(), n).map((e) => e.id);
    expect(ev).toContain('lvl:1:3');
    expect(ev).toContain('g:1');
    expect(ev).toContain('sg:2');
    expect(ev).not.toContain('g:2');
  });
  it('орда, волна, квест, цель недели, босс и семейный квест', () => {
    const n = clone(base());
    n.battles[1]!.outcome = 'victory'; n.battles[1]!.cleared = 3;
    n.battles[2]!.cleared = 1;
    n.quests[0]!.items[0]!.done = true;
    n.goals[1]!.done = true;
    n.boss.defeated = true;
    n.familyQuests[0]!.done = true;
    const ev = tvEvents(base(), n);
    const ids = ev.map((e) => e.id);
    expect(ids).toEqual(expect.arrayContaining(['bv:1', 'bw:2:1', 'q:1:0', 'wg:1', 'boss', 'fq:1']));
    expect(ev.find((e) => e.id === 'bw:2:1')!.big).toBe(false);
    expect(ev.find((e) => e.id === 'boss')!.big).toBe(true);
  });
  it('без изменений тихо', () => { expect(tvEvents(base(), clone(base()))).toEqual([]); });
});

describe('ТВ: бегущая строка', () => {
  it('до напоминания показывает очки, после него напоминает о цели', () => {
    expect(tvHighlights(base(), 10).some((t) => t.includes('Старший: 20 очков из 60'))).toBe(true);
    expect(tvHighlights(base(), 20).some((t) => t.includes('до цели дня ещё 40'))).toBe(true);
  });
  it('выполненная цель, босс, лидер, сезон и совет есть всегда', () => {
    const t = tvHighlights(base(), 10);
    expect(t.some((x) => x.includes('цель дня выполнена') && x.includes('Младший'))).toBe(true);
    expect(t.some((x) => x.includes('Лич: осталось 700 из 1000 HP') && x.includes('Старший'))).toBe(true);
    expect(t.some((x) => x.includes('лидирует'))).toBe(true);
    expect(t.some((x) => x.includes('До конца сезона 10'))).toBe(true);
    expect(t.some((x) => x.startsWith('Совет:'))).toBe(true);
  });
  it('совет зависит от даты', () => {
    const a = base(), b = base(); b.today = '2026-11-21';
    const tip = (d: Tv) => tvHighlights(d, 10).find((x) => x.startsWith('Совет:'));
    expect(tip(a)).not.toBe(tip(b));
  });
});
