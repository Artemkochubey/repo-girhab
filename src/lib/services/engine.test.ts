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
  workouts: [], warmups: [], study: [], habits: [], habitChecks: [], books: [], quests: [], chestsOpened: [], shopItems: [], purchases: [],
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
    raw.heroes[0].talents = ['h1a'];
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
});
