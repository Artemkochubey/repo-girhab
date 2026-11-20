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
  workouts: [], warmups: [], study: [], habits: [], habitChecks: [], books: [], quests: [], chestsOpened: [], familyQuests: [], dayMvps: [], mvpSince: null, reminderHour: 19, seasonSince: null, reviewOk: [], artifactsSince: null, artifactUse: [], battleSince: null, battleDays: [], gearEquipped: [], abilityUses: [], weeklyGoals: [], shopItems: [], purchases: [],
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
  it('«Знамя семьи» одного героя усиливает очки всех (не больше +6%)', () => {
    const raw = base();
    raw.workouts.push({ memberId: 1, date: '2026-11-19', minutes: 100 });
    const plain = buildFamily(raw, '2026-11-19').members.get(1)!.xp;
    raw.heroes[1].talents = ['fa1', 'fa1', 'fa1'];
    const boosted = buildFamily(raw, '2026-11-19').members.get(1)!.xp;
    expect(boosted).toBeGreaterThan(plain);
    expect(boosted).toBeLessThanOrEqual(Math.round(plain * 1.06) + 1);
  });
  it('сезон: победитель месяца получает 3 сундука, второй 1, только если сезон идёт после старта функции', () => {
    const mk = (since: string | null) => {
      const raw = base();
      raw.seasonSince = since;
      for (const id of [1, 2]) raw.quests.push({ memberId: id, date: 'default', items: [{ t: 'x', xp: 1, k: 'manual' }] });
      for (let d = 1; d <= 30; d++) {
        const date = `2026-11-${String(d).padStart(2, '0')}`;
        raw.workouts.push({ memberId: 1, date, minutes: 60 }, { memberId: 2, date, minutes: 40 });
      }
      return buildFamily(raw, '2026-12-03');
    };
    const none = mk(null), on = mk('2026-11-01');
    expect(on.seasons.history[0]).toMatchObject({ id: '2026-11', winner: 1, second: 2, awardable: true });
    expect(on.members.get(1)!.chestsEarned - none.members.get(1)!.chestsEarned).toBe(3);
    expect(on.members.get(2)!.chestsEarned - none.members.get(2)!.chestsEarned).toBe(1);
    expect(on.members.get(1)!.achievements.find((x) => x.id === 'seas1')!.earnedOn).toBe('2026-11-30');
    expect(on.members.get(2)!.achievements.find((x) => x.id === 'seas1')!.earnedOn).toBeNull();
  });
  const manualQ = (raw: Raw) => { for (const id of [1, 2]) raw.quests.push({ memberId: id, date: 'default', items: [{ t: 'x', xp: 1, k: 'manual' }] }); };
  it('артефакт «Щит дня» не даёт серии оборваться на пропущенном дне', () => {
    const mk = (shield: boolean) => {
      const raw = base(); manualQ(raw);
      for (const d of ['2026-11-10', '2026-11-11', '2026-11-13']) raw.workouts.push({ memberId: 1, date: d, minutes: 40 });
      if (shield) raw.artifactUse.push({ memberId: 1, key: 'chest:1', kind: 'shield', status: 'active', activeFor: '2026-11-12', usedOn: '2026-11-13' });
      return buildFamily(raw, '2026-11-13').members.get(1)!.streak;
    };
    expect(mk(false)).toBe(1);
    expect(mk(true)).toBe(3);
  });
  it('артефакт «Удвоитель»: бонус равен очкам дня, но не больше супер-нормы', () => {
    const mk = (min: number, on: boolean) => {
      const raw = base(); manualQ(raw);
      raw.workouts.push({ memberId: 1, date: '2026-11-12', minutes: min });
      if (on) raw.artifactUse.push({ memberId: 1, key: 'k', kind: 'doubler', status: 'active', activeFor: '2026-11-12', usedOn: '2026-11-12' });
      return buildFamily(raw, '2026-11-13').members.get(1)!.days.get('2026-11-12')!.total;
    };
    expect(mk(50, false)).toBe(60);
    expect(mk(50, true)).toBe(120);      // 60 + min(60, 100)
    expect(mk(100, true)).toBe(120 + 100);   // 120 очков дня, бонус не больше супер-нормы (100)
  });
  it('«Ключ сундука» даёт +1 сундук', () => {
    const raw = base(); manualQ(raw);
    const none = buildFamily(raw, '2026-11-13').members.get(1)!.chestsEarned;
    raw.artifactUse.push({ memberId: 1, key: 'chest:1', kind: 'key', status: 'used', activeFor: null, usedOn: '2026-11-13' });
    expect(buildFamily(raw, '2026-11-13').members.get(1)!.chestsEarned).toBe(none + 1);
  });
  it('недельная цель: за выполненную даёт опыт, сундук и (сложная) артефакт только после конца недели', () => {
    const mk = (tier: 'mid' | 'hard', minutes: number, today: string) => {
      const raw = base(); manualQ(raw); raw.artifactsSince = '2026-11-01';
      raw.workouts.push({ memberId: 1, date: '2026-11-10', minutes });
      raw.weeklyGoals.push({ memberId: 1, weekStart: '2026-11-09', kind: 'workout', tier, target: 100, title: null, manual: false, confirmed: false });
      return buildFamily(raw, today).members.get(1)!;
    };
    const during = mk('hard', 100, '2026-11-12');
    expect(during.goals.current).toMatchObject({ progress: 100, done: true, finished: false });
    expect(during.goals.xp).toBe(0);                                           // награда после конца недели
    const plain = mk('hard', 100, '2026-11-12').xp;
    const after = mk('hard', 100, '2026-11-17');
    expect(after.goals.xp).toBe(150);
    expect(after.xp).toBe(plain + 150);
    expect(after.goals.chests).toBe(1);
    expect(after.artifacts.map((x) => x.key)).toContain('goal:2026-11-09');
    expect(mk('mid', 100, '2026-11-17').artifacts.some((x) => x.key.startsWith('goal:'))).toBe(false);
    const failed = mk('mid', 50, '2026-11-17');                                // цель не выполнена
    expect(failed.goals.xp).toBe(0); expect(failed.goals.chests).toBe(0);
    expect(failed.goals.history[0]).toMatchObject({ done: false, finished: true });
  });
  it('ручная цель засчитывается после подтверждения родителя', () => {
    const mk = (confirmed: boolean) => {
      const raw = base(); manualQ(raw);
      raw.weeklyGoals.push({ memberId: 1, weekStart: '2026-11-09', kind: 'custom', tier: 'easy', target: 1, title: 'Прочитать 2 главы', manual: true, confirmed });
      return buildFamily(raw, '2026-11-17').members.get(1)!.goals;
    };
    expect(mk(false).xp).toBe(0);
    expect(mk(true).xp).toBe(40);
  });
  it('артефакты за победы выдаются только после даты старта функции', () => {
    const mk = (since: string | null) => {
      const raw = base(); manualQ(raw); raw.artifactsSince = since;
      for (let d = 1; d <= 30; d++) raw.workouts.push({ memberId: 1, date: `2026-11-${String(d).padStart(2, '0')}`, minutes: 60 }, { memberId: 2, date: `2026-11-${String(d).padStart(2, '0')}`, minutes: 40 });
      raw.seasonSince = '2026-11-01';
      return buildFamily(raw, '2026-12-03').members.get(1)!.artifacts.filter((x) => x.source === 'season');
    };
    expect(mk(null)).toHaveLength(0);
    expect(mk('2026-11-01')).toHaveLength(1);
  });
  it('личный бой: итоги закончившихся дней фиксируются, опыт за победы идёт в уровень, здоровье и серия считаются', () => {
    const mk = (since: string | null) => {
      const raw = base(); manualQ(raw); raw.battleSince = since;
      for (const d of ['2026-11-17', '2026-11-18']) raw.workouts.push({ memberId: 1, date: d, minutes: 200 });
      return buildFamily(raw, '2026-11-19');
    };
    const off = mk(null), on = mk('2026-11-17');
    expect(off.pendingBattles).toHaveLength(0);
    expect(on.pendingBattles.filter((r) => r.memberId === 1).map((r) => [r.date, r.win])).toEqual([['2026-11-17', true], ['2026-11-18', true]]);
    expect(on.members.get(1)!.battle.streak).toBe(2);
    expect(on.members.get(1)!.battle.hp).toBe(100);
    expect(on.members.get(1)!.xp - off.members.get(1)!.xp).toBe(50);            // 2 победы × 25 опыта (норма 60)
    // у второго героя активности нет: поражения отнимают здоровье
    expect(on.members.get(2)!.battle.rows.every((r) => !r.win)).toBe(true);
    expect(on.members.get(2)!.battle.hp).toBeLessThan(100);
    expect(on.members.get(1)!.battle.live.horde.id).toBeTruthy();
  });
  it('сохранённый итог дня не меняется от смены снаряжения; снаряжение считается в бонусах', () => {
    const raw = base(); manualQ(raw); raw.battleSince = '2026-11-17';
    raw.battleDays.push({ memberId: 1, date: '2026-11-17', hordeId: 'goblins', totalHp: 72, cleared: 0, win: false, regen: 10, hpDelta: -25, xp: 0, drop: 'sword-epic' });
    raw.workouts.push({ memberId: 1, date: '2026-11-17', minutes: 300 });
    raw.gearEquipped.push({ memberId: 1, slot: 'weapon', key: 'battle:2026-11-17' });
    const f = buildFamily(raw, '2026-11-19').members.get(1)!;
    expect(f.battle.rows[0]).toMatchObject({ win: false, cleared: 0 });          // не пересчитан, хотя очков теперь хватало бы на победу
    expect(f.gearBonus.dmg).toBeCloseTo(0.12);                                   // «Эпический меч» из добычи того дня надет
    expect(f.gear.find((g) => g.key === 'battle:2026-11-17')).toMatchObject({ itemId: 'sword-epic', equipped: true });
  });
  it('снаряжение усиливает урон по боссу, но только на недели после получения предмета', () => {
    const mk = (equip: boolean) => {
      const raw = base(); manualQ(raw); raw.battleSince = '2026-11-01';
      for (const d of ['2026-11-10', '2026-11-17']) raw.workouts.push({ memberId: 1, date: d, minutes: 100 });
      raw.chestsOpened.push({ memberId: 1, n: 1, date: '2026-11-12', rarity: 'common', reward: 'a', gear: 'sword-epic' });
      if (equip) raw.gearEquipped.push({ memberId: 1, slot: 'weapon', key: 'chest:1' });
      const f = buildFamily(raw, '2026-11-19');
      const week = (ws: string) => f.bossHistory.find((w) => w.weekStart === ws)!.byMember[1]!;
      return { before: week('2026-11-09'), after: week('2026-11-16') };
    };
    const off = mk(false), on = mk(true);
    expect(on.before).toBe(off.before);                         // предмет получен 12-го: на ту неделю не действует
    expect(on.after).toBeCloseTo(off.after * (1.17 / 1.05), 0);   // эпический меч +12% к урону (у воина свои +5% от «Боевого клича» есть в обоих случаях)
    expect(on.after).toBeGreaterThan(off.after);
  });
  it('оружие сферы и «слабость» из снаряжения усиливают удар по боссу', () => {
    const mk = (gear: string | null) => {
      const raw = base(); manualQ(raw); raw.battleSince = '2026-11-01';
      for (const d of ['2026-11-17', '2026-11-18']) raw.workouts.push({ memberId: 1, date: d, minutes: 100 });
      if (gear) { raw.chestsOpened.push({ memberId: 1, n: 1, date: '2026-11-05', rarity: 'common', reward: 'a', gear }); raw.gearEquipped.push({ memberId: 1, slot: gear.startsWith('helm') ? 'helm' : 'weapon', key: 'chest:1' }); }
      const f = buildFamily(raw, '2026-11-19');
      return f.bossHistory.find((w) => w.weekStart === '2026-11-16')!.byMember[1]!;
    };
    const base0 = mk(null);
    expect(mk('hammer-epic')).toBeGreaterThan(base0);            // молот: +24% очков Тела
    expect(mk('sword-common')).toBeGreaterThan(base0);
  });
  it('предмет за босса действует только после той победы (она должна быть настоящей) и не влияет на неё саму', () => {
    const mk = (won: boolean, equip = true) => {
      const raw = base(); manualQ(raw); raw.battleSince = '2026-11-01';
      if (won) for (const d of ['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06']) raw.workouts.push({ memberId: 1, date: d, minutes: 200 });
      raw.workouts.push({ memberId: 1, date: '2026-11-10', minutes: 100 });
      if (equip) raw.gearEquipped.push({ memberId: 1, slot: 'weapon', key: 'boss:2026-11-08' });   // «Крепкий меч» за босса недели с 2 ноября
      const f = buildFamily(raw, '2026-11-19');
      return { next: f.bossHistory.find((w) => w.weekStart === '2026-11-09')!.byMember[1]!, own: f.bossHistory.find((w) => w.weekStart === '2026-11-02')!.byMember[1]! };
    };
    const won = mk(true), noGear = mk(true, false), lost = mk(false);
    expect(won.next).toBeGreaterThan(noGear.next);              // меч за ту победу усиливает следующую неделю (+8%)
    expect(won.own).toBe(noGear.own);                           // а саму победу не меняет
    expect(lost.next).toBe(mk(false, false).next);              // победы не было: предмета нет и бонуса тоже
  });
  it('классы в бою с боссом: воин и паладин бьют сильнее, маг усиливает слабость, «Боевая песня» барда баффает всех', () => {
    const dmg = (cls1: 'w' | 'm' | 'b' | 'p', cls2: 'w' | 'm' | 'b' | 'p') => {
      const raw = base(); manualQ(raw);
      raw.heroes[0]!.cls = cls1; raw.heroes[1]!.cls = cls2;
      raw.workouts.push({ memberId: 1, date: '2026-11-17', minutes: 100 });
      return buildFamily(raw, '2026-11-19').bossHistory.find((w) => w.weekStart === '2026-11-16')!.byMember[1]!;
    };
    const plain = dmg('b', 'm');                      // у барда своего бонуса нет, но бард баффает всех (включая себя): базой берём этот случай
    expect(dmg('w', 'm')).toBeGreaterThan(0);
    const noAura = dmg('m', 'm');                     // без барда в семье
    expect(plain).toBeGreaterThan(noAura * 0.99);
    const aura = dmg('m', 'b');                       // второй герой бард: у первого +3% к урону
    expect(aura).toBeGreaterThan(noAura);
    expect(dmg('p', 'm')).toBeGreaterThan(noAura);    // «Возмездие»: у паладина +4%
  });
  it('активные способности: меняют итог закончившегося дня и сегодняшний бой, считаются из записей применений', () => {
    const mk = (uses: { memberId: number; date: string; ability: string }[]) => {
      const raw = base(); manualQ(raw); raw.battleSince = '2026-11-18'; raw.abilityUses = uses;
      return buildFamily(raw, '2026-11-19').members.get(2)!;                     // у второго героя класс «маг», активности нет
    };
    const plain = mk([]), ice = mk([{ memberId: 2, date: '2026-11-18', ability: 'm-iceblock' }]);
    expect(plain.battle.rows[0]!.hpDelta).toBe(-33);                             // поражение мага: 25 × 1,3
    expect(ice.battle.rows[0]!.hpDelta).toBe(-3);                                // «Ледяная глыба»
    expect(ice.battle.hp).toBeGreaterThan(plain.battle.hp);
    const today = mk([{ memberId: 2, date: '2026-11-19', ability: 'm-pyro' }]);
    expect(today.battle.abilities.activeToday).toEqual(['m-pyro']);
    expect(today.battle.abilities.focusLeft).toBe(1);
    expect(plain.battle.abilities.list).toHaveLength(3);
  });
  it('снаряжение за победу над боссом выдаётся по ключу и только после даты старта', () => {
    const mk = (since: string | null) => {
      const raw = base(); manualQ(raw); raw.battleSince = since;
      for (const d of ['2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13']) raw.workouts.push({ memberId: 1, date: d, minutes: 200 });
      return buildFamily(raw, '2026-11-19').members.get(1)!.gear.filter((g) => g.source === 'boss');
    };
    expect(mk('2026-11-01')).toHaveLength(1);
    expect(mk('2026-11-01')[0]!.key).toBe('boss:2026-11-15');
    expect(mk(null)).toHaveLength(0);
  });
  it('победа над боссом прошлой недели даёт сундуки', () => {
    const raw = base();
    for (const d of ['2026-11-09', '2026-11-10', '2026-11-11', '2026-11-12', '2026-11-13']) raw.workouts.push({ memberId: 1, date: d, minutes: 200 });
    const f = buildFamily(raw, '2026-11-19');
    const past = f.bossHistory.find((w) => w.weekStart === '2026-11-09')!;
    expect(past.defeated).toBe(true);
    expect(past.mvp).toBe(1);
    expect(f.members.get(1)!.chestsEarned).toBeGreaterThanOrEqual(2);
    expect(f.members.get(1)!.bossChestsEarned).toBe(2);        // 1 за урон (≥10%) и 1 за MVP недели: открываются первыми, не ниже редкого
    expect(f.members.get(2)!.bossChestsEarned).toBe(0);
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
