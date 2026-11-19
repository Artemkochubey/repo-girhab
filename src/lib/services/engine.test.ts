import { describe, it, expect } from 'vitest';
import { buildFamily, type Raw } from './engine';

const base = (): Raw => ({
  timezone: 'UTC',
  members: [
    { id: 1, name: 'A', emoji: '', color: '', isParent: true, goal: 60, superGoal: 100, createdAt: '2026-11-01T00:00:00Z' },
    { id: 2, name: 'B', emoji: '', color: '', isParent: false, goal: 40, superGoal: 70, createdAt: '2026-11-01T00:00:00Z' },
  ],
  heroes: [
    { memberId: 1, cls: 'w', clsChosen: true, sub: null, clsChangedAt: '', talents: [] },
    { memberId: 2, cls: 'm', clsChosen: true, sub: null, clsChangedAt: '', talents: [] },
  ],
  workouts: [], warmups: [], study: [], habits: [], habitChecks: [], books: [], quests: [], chestsOpened: [], familyQuests: [], dayMvps: [], mvpSince: null, shopItems: [], purchases: [],
});

describe('движок семьи', () => {
  it('XP = очки за всё время, уровень по формуле', () => {
    const raw = base();
    raw.quests.push({ memberId: 1, date: 'default', items: [{ t: 'x', xp: 1, k: 'manual' }] });
    raw.workouts.push({ memberId: 1, date: '2026-11-18', minutes: 50 }, { memberId: 1, date: '2026-11-19', minutes: 50 });
    const f = buildFamily(raw, '2026-11-19');
    const m = f.members.get(1)!;
    expect(m.xp).toBe(120); // воин: 50*1.2 дважды
    expect(m.level).toBe(2);
    expect(m.chestsAvailable).toBe(1); // (уровень-1)
  });
  it('смена класса пересчитывает историю', () => {
    const raw = base();
    raw.quests.push({ memberId: 2, date: 'default', items: [{ t: 'x', xp: 1, k: 'manual' }] });
    raw.workouts.push({ memberId: 2, date: '2026-11-19', minutes: 100 });
    expect(buildFamily(raw, '2026-11-19').members.get(2)!.xp).toBe(100 + 0);
    raw.heroes[1].cls = 'w';
    expect(buildFamily(raw, '2026-11-19').members.get(2)!.xp).toBe(120);
  });
  it('квест за день даёт сундук и опыт', () => {
    const raw = base();
    raw.quests.push({ memberId: 1, date: '2026-11-19', items: [{ t: 'z', xp: 30, k: 'warmup' }] });
    raw.warmups.push({ memberId: 1, date: '2026-11-19' });
    const m = buildFamily(raw, '2026-11-19').members.get(1)!;
    expect(m.questDays).toBe(1);
    expect(m.xp).toBe(12 + 30);
  });
  it('босс: HP 600 для 60+40, урон копится', () => {
    const raw = base();
    raw.workouts.push({ memberId: 1, date: '2026-11-19', minutes: 100 });
    const b = buildFamily(raw, '2026-11-19').boss;
    expect(b.hp).toBe(Math.round((100 * 4.9) / 10) * 10);
    expect(b.weekStart).toBe('2026-11-16');
    expect(b.damage).toBeGreaterThanOrEqual(120);
    expect(b.defeated).toBe(false);
  });
  it('таланты охотника увеличивают урон по боссу', () => {
    const raw = base();
    raw.quests.push({ memberId: 1, date: 'default', items: [{ t: 'x', xp: 1, k: 'manual' }] });
    raw.workouts.push({ memberId: 1, date: '2026-11-19', minutes: 100 });
    const plain = buildFamily(raw, '2026-11-19').boss.damage;
    raw.heroes[0].talents = ['wc1', 'wc1', 'wc1'];
    expect(buildFamily(raw, '2026-11-19').boss.damage).toBeGreaterThan(plain);
  });
  it('победа над боссом прошлой недели даёт сундуки', () => {
    const raw = base();
    for (const d of ['2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13']) raw.workouts.push({ memberId: 1, date: d, minutes: 200 });
    const f = buildFamily(raw, '2026-11-19');
    const past = f.bossHistory.find((w) => w.weekStart === '2026-11-09')!;
    expect(past.defeated).toBe(true);
    expect(past.mvp).toBe(1);
    expect(f.members.get(1)!.chestsEarned).toBeGreaterThanOrEqual(2);
  });

  it('кошелёк: траты не снижают уровень, отмена возвращает цену', () => {
    const raw = base();
    raw.quests.push({ memberId: 1, date: 'default', items: [{ t: 'x', xp: 1, k: 'manual' }] });
    raw.workouts.push({ memberId: 1, date: '2026-11-19', minutes: 100 });
    const mk = (status: 'pending' | 'cancelled', cur: 'points' | 'chests', price: number) =>
      ({ id: 1, memberId: 1, itemId: 1, name: 'x', emoji: '', price, currency: cur, status, date: '2026-11-19' });
    const before = buildFamily(raw, '2026-11-19').members.get(1)!;
    expect(before.balance).toBe(120);
    raw.purchases.push(mk('pending', 'points', 50), { ...mk('cancelled', 'points', 30), id: 2 }, { ...mk('pending', 'chests', 1), id: 3 });
    const after = buildFamily(raw, '2026-11-19').members.get(1)!;
    expect(after.xp).toBe(before.xp);
    expect(after.level).toBe(before.level);
    expect(after.balance).toBe(70);
    expect(after.chestsAvailable).toBe(before.chestsAvailable - 1);
  });

  const fq = (o: Partial<Raw['familyQuests'][number]> = {}) => ({ id: 1, title: 'Прогулка', description: '', xp: 30, kind: 'manual' as const, target: 0, period: 'day' as const, date: '2026-11-19', status: 'done' as const, doneDate: '2026-11-19', ...o });
  const quiet = (raw: Raw) => { for (const id of [1, 2]) raw.quests.push({ memberId: id, date: 'default', items: [{ t: 'x', xp: 1, k: 'manual' }] }); };

  it('семейный квест: опыт получают все участники в день выполнения', () => {
    const raw = base(); quiet(raw);
    raw.familyQuests.push(fq());
    const f = buildFamily(raw, '2026-11-19');
    expect(f.members.get(1)!.xp).toBe(30);
    expect(f.members.get(2)!.xp).toBe(30);
    expect(f.familyQuests[0]).toMatchObject({ done: true, participants: [1, 2] });
    expect(f.members.get(1)!.days.get('2026-11-19')!.total).toBe(30);
  });
  it('семейный квест: не выполнен — опыта нет; созданные позже не получают', () => {
    const raw = base(); quiet(raw);
    raw.familyQuests.push(fq({ status: 'pending', doneDate: null }));
    expect(buildFamily(raw, '2026-11-19').members.get(1)!.xp).toBe(0);
    const raw2 = base(); quiet(raw2);
    raw2.members[1].createdAt = '2026-11-10T00:00:00Z';
    raw2.familyQuests.push(fq({ date: '2026-11-05', doneDate: '2026-11-05' }));
    const f = buildFamily(raw2, '2026-11-19');
    expect(f.members.get(1)!.xp).toBe(30);
    expect(f.members.get(2)!.xp).toBe(0);
  });
  it('семейный квест по очкам: выполняется сам, когда семья набрала цель', () => {
    const raw = base(); quiet(raw);
    raw.workouts.push({ memberId: 1, date: '2026-11-19', minutes: 20 }, { memberId: 2, date: '2026-11-19', minutes: 20 });
    raw.familyQuests.push(fq({ kind: 'points', target: 60, status: 'open', doneDate: null }));
    expect(buildFamily(raw, '2026-11-19').familyQuests[0].done).toBe(false);   // 40 < 60
    raw.workouts.push({ memberId: 1, date: '2026-11-19', minutes: 30 });
    const f = buildFamily(raw, '2026-11-19');
    expect(f.familyQuests[0]).toMatchObject({ done: true, doneDate: '2026-11-19', progress: 70 });
    expect(f.members.get(2)!.days.get('2026-11-19')!.total).toBeGreaterThanOrEqual(30 + 20);
  });
  it('достижения считаются в движке: первая книга', () => {
    const raw = base(); quiet(raw);
    raw.books.push({ memberId: 1, finishedAt: '2026-11-12' });
    const a = buildFamily(raw, '2026-11-19').members.get(1)!.achievements;
    expect(a.find((x) => x.id === 'book1')).toMatchObject({ earnedOn: '2026-11-12', value: 1 });
    expect(a.find((x) => x.id === 'book5')!.earnedOn).toBeNull();
  });

  it('MVP дня: лучший относительно нормы получает сундук; без нормы или без даты старта — нет', () => {
    const mk = (since: string | null, stored: { date: string; memberId: number }[] = []) => {
      const raw = base(); quiet(raw);
      raw.mvpSince = since; raw.dayMvps = stored;
      raw.workouts.push({ memberId: 1, date: '2026-11-12', minutes: 70 }, { memberId: 2, date: '2026-11-12', minutes: 40 },   // m1: 84/60=1,4  m2: 40/40=1,0
        { memberId: 2, date: '2026-11-13', minutes: 100 },                                                                    // m2 побеждает
        { memberId: 1, date: '2026-11-14', minutes: 20 });                                                                    // норма не выполнена — MVP нет
      return buildFamily(raw, '2026-11-19');
    };
    const none = mk(null);
    expect(none.mvp.pending).toHaveLength(0);
    const f = mk('2026-11-10');
    expect(f.mvp.wins).toEqual({ 1: 1, 2: 1 });
    expect(f.mvp.pending.find((p) => p.date === '2026-11-14')).toMatchObject({ memberId: 0 });
    expect(f.members.get(1)!.chestsEarned - none.members.get(1)!.chestsEarned).toBe(1);
    expect(f.members.get(2)!.chestsEarned - none.members.get(2)!.chestsEarned).toBe(1);
    expect(f.members.get(1)!.achievements.find((a) => a.id === 'mvpd1')!.earnedOn).toBe('2026-11-12');
    // сохранённый итог не пересчитывается: 12-е записано за вторым участником
    const frozen = mk('2026-11-10', [{ date: '2026-11-12', memberId: 2 }]);
    expect(frozen.mvp.wins[1] ?? 0).toBe(0);
    expect(frozen.mvp.wins[2]).toBe(2);
  });
  it('MVP дня: вчерашний победитель и сегодняшний лидер', () => {
    const raw = base(); quiet(raw); raw.mvpSince = '2026-11-15';
    raw.workouts.push({ memberId: 2, date: '2026-11-18', minutes: 60 }, { memberId: 1, date: '2026-11-19', minutes: 30 }, { memberId: 2, date: '2026-11-19', minutes: 10 });
    const f = buildFamily(raw, '2026-11-19');
    expect(f.mvp.yesterday).toMatchObject({ date: '2026-11-18', memberId: 2 });
    expect(f.mvp.leader).toMatchObject({ memberId: 1, qualified: false });                 // 36/60 против 10/40
    expect(f.mvp.wins[2]).toBe(1);                                                          // сегодняшний день ещё не засчитан
  });
});
