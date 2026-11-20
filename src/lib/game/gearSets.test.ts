import { describe, expect, it } from 'vitest';
import { NO_GEAR, SET_BONUS, bossArmor, activeSets, gearBonus, gearById, type GearItem } from './gear';

const it_ = (id: string) => gearById(id)!;
const rareFive = ['sword-rare', 'armor-rare', 'helm-rare', 'boots-rare', 'amulet-rare'].map(it_);

describe('комплекты снаряжения', () => {
  it('комплект считается по редкости надетых предметов, один предмет в слоте', () => {
    expect(activeSets([it_('sword-rare'), it_('armor-common')])).toEqual([]);
    const two = activeSets([it_('sword-rare'), it_('armor-rare')]);
    expect(two).toEqual([{ rarity: 'rare', name: 'Страж', pieces: 2, threeOn: false, fiveOn: false }]);
    expect(activeSets(rareFive.slice(0, 3))[0]).toMatchObject({ pieces: 3, threeOn: true, fiveOn: false });
    expect(activeSets(rareFive)[0]).toMatchObject({ pieces: 5, threeOn: true, fiveOn: true });
    // два предмета одного слота считаются как один
    expect(activeSets([it_('sword-rare'), it_('hammer-rare'), it_('armor-rare')])[0]!.pieces).toBe(2);
  });
  it('3 предмета дают бонус «из трёх», 5 добавляют бонус «из пяти»', () => {
    const base = (items: GearItem[]) => gearBonus(items);
    const three = rareFive.slice(0, 3);
    const noSet = gearBonus([it_('sword-rare'), it_('armor-rare')]);    // без комплекта
    expect(base(three).dmg).toBeCloseTo(noSet.dmg + SET_BONUS.rare.three.dmg!, 5);   // меч даёт dmg 0,08, плюс комплект 0,04
    const five = base(rareFive);
    expect(five.heal).toBeGreaterThanOrEqual(SET_BONUS.rare.five.heal!);
    expect(five.weak).toBeGreaterThanOrEqual(SET_BONUS.rare.five.weak!);
  });
  it('комплект легендарных сильнее комплекта обычных', () => {
    const slots = ['sword', 'armor', 'helm', 'boots', 'amulet'];
    const set = (r: string) => gearBonus(slots.map((s) => it_(`${s}-${r}`)));
    expect(set('legend').dmg).toBeGreaterThan(set('common').dmg);
    expect(set('legend').guard).toBeGreaterThan(set('common').guard);
  });
});

describe('броня и здоровье в бою с боссом', () => {
  it('защита, слабость орды и лечение дают небольшую прибавку, но не больше +20%', () => {
    expect(bossArmor(NO_GEAR)).toBe(0);
    expect(bossArmor({ ...NO_GEAR, guard: 0.7 })).toBeCloseTo(0.07);
    expect(bossArmor({ ...NO_GEAR, hordeHp: 0.12 })).toBeCloseTo(0.06);
    expect(bossArmor({ ...NO_GEAR, heal: 10, winHeal: 12 })).toBeCloseTo(0.054);
    expect(bossArmor({ ...NO_GEAR, guard: 0.9, hordeHp: 0.5, heal: 50, winHeal: 50 })).toBe(0.2);
  });
});

import { MERGE_COUNT, deriveGear, mergeCheck, nextRarity, resolveGearKey } from './gear';
describe('слияние предметов', () => {
  it('проверка: ровно три одинаковых разных предмета, не легендарных', () => {
    const k = (n: number, id = 'sword-common') => ({ key: `chest:${n}`, itemId: id });
    expect(MERGE_COUNT).toBe(3);
    expect(mergeCheck([k(1), k(2), k(3)])).toEqual({ ok: true, resultId: 'sword-rare' });
    expect(mergeCheck([k(1, 'armor-rare'), k(2, 'armor-rare'), k(3, 'armor-rare')])).toEqual({ ok: true, resultId: 'armor-epic' });
    expect(mergeCheck([k(1), k(2)])).toMatchObject({ ok: false });
    expect(mergeCheck([k(1), k(1), k(2)])).toMatchObject({ ok: false });
    expect(mergeCheck([k(1), k(2), k(3, 'sword-rare')])).toMatchObject({ ok: false });
    expect(mergeCheck([k(1, 'sword-legend'), k(2, 'sword-legend'), k(3, 'sword-legend')])).toMatchObject({ ok: false, error: expect.stringContaining('Легендарные') });
    expect(mergeCheck([k(1, 'нет'), k(2, 'нет'), k(3, 'нет')])).toMatchObject({ ok: false });
    expect(nextRarity('common')).toBe('rare'); expect(nextRarity('legend')).toBeNull();
  });
  it('инвентарь: съеденные убираются, результат появляется, слияние слитого работает', () => {
    const base = { since: '2026-01-01', battles: [], bossWins: [], equipped: [], chests: [1, 2, 3, 4].map((n) => ({ n, date: '2026-11-10', gear: 'sword-common' })) };
    const inv = (merges: { id: number; consumed: string[]; itemId: string; date: string }[]) => deriveGear({ ...base, merges }).map((g) => `${g.key}=${g.itemId}`).sort();
    expect(inv([])).toHaveLength(4);
    expect(inv([{ id: 7, consumed: ['chest:1', 'chest:2', 'chest:3'], itemId: 'sword-rare', date: '2026-11-11' }])).toEqual(['chest:4=sword-common', 'merge:7=sword-rare']);
    expect(inv([{ id: 7, consumed: ['chest:1', 'chest:2', 'chest:3'], itemId: 'sword-rare', date: '2026-11-11' }, { id: 8, consumed: ['merge:7', 'chest:4', 'chest:9'], itemId: 'sword-epic', date: '2026-11-12' }])).toEqual(['merge:8=sword-epic']);
    expect(resolveGearKey('merge:7', { battles: [], chests: [], merges: [{ id: 7, consumed: [], itemId: 'armor-epic', date: 'd' }] })!.id).toBe('armor-epic');
    expect(resolveGearKey('merge:9', { battles: [], chests: [], merges: [] })).toBeNull();
  });
});
