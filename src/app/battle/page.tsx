'use client';
import { GearIcon } from '@/components/GearIcon';
import { Hint } from '@/components/Hints';
import Link from 'next/link';
import { useGame } from '@/components/Shell';
import { BattleScene } from '@/components/BattleScene';
import { AbilityBar } from '@/components/AbilityBar';
import { BossScene } from '@/components/BossScene';
import { lookOf } from '@/lib/client';
import { Bar, Section, Fold } from '@/components/ui';
import { DOMAIN_INFO, GEAR_RARITIES, MERGE_COUNT, RARITY_NAMES, SET_BONUS, SET_NAMES, SLOTS, SLOT_INFO, activeSets, bonusText, gearById, gearDisplay, gearIconFamily, nextRarity, type Slot } from '@/lib/game/gear';
import { hordeById, DROP_CHANCE, EVENTS, LOSS_HP, MAX_HP, REGEN, WEAKENED_BELOW, WIN_HP, WEAK_MULT } from '@/lib/game/battle';

const hordeName = (id: string) => hordeById(id);
const SRC = { battle: 'за победу над ордой', boss: 'за босса', chest: 'из сундука', merge: 'слияние' } as const;
const pct = (x: number) => `${Math.round(x * 100)}%`;

export default function Battle() {
  const { s, act, toast } = useGame();
  const d = s.detail!;
  const b = d.battle, l = b.live, f = l.fight, g = d.gear;
  const me = s.members.find((m) => m.id === s.me)!;
  const ok = (m: string) => () => toast(m);
  const mult = (w: { weak: keyof typeof DOMAIN_INFO }) => (1 + WEAK_MULT + g.bonus.weak) * (1 + g.bonus.dmg + g.bonus.dmgDomain[w.weak]);
  const slotItem = (sl: Slot) => g.items.find((x) => x.key === g.slots[sl]);
  const cls = b.cls;
  const nm = (it: (typeof g.items)[number]['item']) => gearDisplay(it, cls);
  const ci = b.classInfo;
  const cb = g.classBonus, tb = g.bonus;
  const fx = (x: number) => (Math.round(x * 100) / 100).toString().replace('.', ',');
  const rows: [string, string, string][] = [
    ['⚔️ Урон всеми очками', `+${Math.round(tb.dmg * 100)}%`, cb.dmg ? `класс +${Math.round(cb.dmg * 100)}%` : ''],
    ['🎯 Удар по слабости', `×${fx(1 + WEAK_MULT + tb.weak)}`, cb.weak ? `класс +${fx(cb.weak)}` : ''],
    ['😡 Ярость за убитую волну', tb.rage ? `+${Math.round(tb.rage * 100)}% урона` : '—', tb.rage ? 'класс' : ''],
    ['✨ Возмездие (здоровье < 50)', tb.comeback ? `+${Math.round(tb.comeback * 100)}% урона` : '—', tb.comeback ? 'класс' : ''],
    ['🛡 Защита от потерь', `−${Math.round(Math.min(0.9, tb.guard) * 100)}%${tb.lossMult ? `, но +${Math.round(tb.lossMult * 100)}% потерь` : ''}`, cb.guard || cb.lossMult ? 'класс' : ''],
    ['❤️ Лечение в день', `+${REGEN + tb.heal}`, cb.heal ? `класс +${cb.heal}` : ''],
    ['🏆 Здоровье за победу', `+${WIN_HP + tb.winHeal}`, cb.winHeal ? `класс +${cb.winHeal}` : ''],
    ['🎁 Шанс снаряжения за победу', `${Math.round((DROP_CHANCE.weekday + tb.loot) * 100)}%`, cb.loot ? `класс +${Math.round(cb.loot * 100)}%` : ''],
    ['🏃 Первая волна слабее', tb.wave1 ? `−${Math.round(tb.wave1 * 100)}%` : '—', cb.wave1 ? 'класс' : ''],
  ];

  return (
    <>
      <h1 className="title">⚔️ Бой: {me.emoji} {me.name}</h1>
      <Hint id="battle" more="/rules">Каждый день приходит новая орда из трёх волн. Бьют ваши дневные очки, а очки слабой сферы волны бьют в 1,5 раза сильнее. Победа даёт опыт и снаряжение. Босс недели общий: бьёт вся семья.</Hint>

      <Section title={`${l.horde.emoji} ${l.horde.name}`} right={<span className={l.elite || l.event ? 'gold' : 'muted'}>{l.event ? `${EVENTS.find((e) => e.id === l.event)?.emoji ?? '🎉'} ${EVENTS.find((e) => e.id === l.event)?.name ?? 'праздник'}` : l.elite ? '⭐ элитная орда' : l.weekend ? 'выходной: орда крепче' : 'сегодня'}</span>}>
        <BattleScene look={lookOf(g)} color={me.color} emoji={me.emoji} face={me.face} name={me.name} live={l} cls={me.cls} active={b.abilities.activeToday} />
        <AbilityBar />
        <p className="muted small">Каждый день приходит новая орда из трёх волн. Урон наносят очки, которые вы и так зарабатываете. Очки слабой сферы волны бьют ×1,5. Убейте все три волны за день, чтобы победить.</p>
        <div className="waves">
          {f.waves.map((w, i) => {
            const left = Math.max(0, w.hp - w.damage);
            return (
              <div key={i} className={`wave ${w.cleared ? 'done' : ''}`}>
                <span className="wv-n">{w.cleared ? '✔' : i + 1}</span>
                <span className="wv-t"><b>{w.unit}</b><small className="muted">слабы к: {DOMAIN_INFO[w.weak].emoji} {DOMAIN_INFO[w.weak].name}</small>
                  {!w.cleared && left > 0 && <small className="gold">ещё ~{Math.ceil(left / mult(w))} оч. «{DOMAIN_INFO[w.weak].name}» или ~{Math.ceil(left)} любых</small>}</span>
                <span className="wv-b"><i style={{ width: `${Math.min(100, (w.damage / w.hp) * 100)}%` }} /></span>
                <small className="muted wv-h">{Math.round(Math.min(w.damage, w.hp))}/{w.hp}</small>
              </div>
            );
          })}
        </div>
        <p><b>{f.outcome === 'victory' ? '🏆 Победа!' : f.outcome === 'held' ? '🛡 Отбились (2 волны)' : `⚔️ Убито волн: ${f.cleared} из 3`}</b></p>
        <p className="muted small">Победа: +{l.xp} опыта, шанс снаряжения {pct(l.winChance)}{l.elite ? ' (элитная орда: добыча не ниже редкой, опыт ×1,5)' : l.event ? ' (праздничная орда: опыт ×1,25)' : l.weekend ? ' (по выходным выше)' : ''}, +{WIN_HP + g.bonus.winHeal} здоровья. Поражение (0–1 волна): −{Math.round(LOSS_HP * (1 - Math.min(0.9, g.bonus.guard)) * (1 + g.bonus.lossMult))} здоровья. Итог подводится в конце дня.</p>
      </Section>

      {ci && (
        <Fold title={`${ci.roleEmoji} Класс в бою: ${ci.role}`} right={<span className="muted">{ci.armor}</span>}>
          <p>{ci.summary}</p>
          <ul className="abil">
            {ci.abilities.map((a) => <li key={a.name}><span className="ai">{a.emoji}</span><span><b>{a.name}</b><small className="muted">{a.text}</small></span></li>)}
          </ul>
          <h3>📊 Характеристики героя</h3>
          <table className="rules-table"><tbody>
            {rows.map(([k, v, note]) => <tr key={k}><td>{k}</td><td><b>{v}</b></td><td className="muted">{note}</td></tr>)}
          </tbody></table>
          <p className="muted small">Характеристики складываются из способностей класса и надетого снаряжения. В бою с боссом класс тоже помогает{ci.boss.party ? ': бард поёт для всей семьи, +3% урона каждому герою.' : ci.boss.weak ? ': сильнее удар по слабому месту.' : ci.boss.dmg ? `: +${Math.round(ci.boss.dmg * 100)}% урона.` : '.'}</p>
        </Fold>
      )}

      <Fold title={`${s.boss.boss.emoji} Босс недели: все герои вместе`}>
        <BossScene boss={s.boss.boss} hp={s.boss.hp} damage={s.boss.damage} defeated={s.boss.defeated}
          party={s.members.map((m) => ({ id: m.id, name: m.name, emoji: m.emoji, face: m.face, color: m.color, look: m.look, cls: m.cls, damage: s.boss.byMember[m.id] ?? 0 }))} meId={s.me} />
        <p className="muted small">Снаряжение усиливает удар по боссу: оружие и «слабость» от шлема добавляют урон, молот и подобное усиливают свою сферу. Предмет работает на недели после того дня, когда он получен.</p>
      </Fold>

      <Fold title="❤️ Здоровье героя" right={<b>🔥 побед подряд: {b.streak}</b>}>
        <Bar value={l.hp} max={MAX_HP} color={l.weakened ? 'var(--danger)' : '#d84a6a'} label={`${l.hp} / ${MAX_HP}`} />
        <p className="muted small">Каждый день герой восстанавливает {REGEN + g.bonus.heal} здоровья. Если оно ниже {WEAKENED_BELOW}, орда на 15% крепче{l.weakened ? ': сейчас герой ослаблен.' : '.'} Броня уменьшает потери.</p>
        {b.recent.length > 0 && (
          <ul className="list small">
            {b.recent.map((r) => (
              <li key={r.date}>{r.win ? '🏆' : r.cleared === 2 ? '🛡' : '💀'} {r.date} · {hordeName(r.hordeId)?.emoji} {hordeName(r.hordeId)?.name}: волн {r.cleared}/3{r.xp ? ` · +${r.xp} опыта` : ''} · здоровье {r.hpDelta > 0 ? '+' : ''}{r.hpDelta}{r.drop ? ' · 🎁 снаряжение' : ''}</li>
            ))}
          </ul>
        )}
      </Fold>

      <Section title="🛡 Снаряжение">
        <div className="slots">
          {SLOTS.map((sl) => {
            const it = slotItem(sl);
            return (
              <div key={sl} className={`slot ${it ? `gr-${it.item.rarity}` : 'empty'}`}>
                <small className="muted">{SLOT_INFO[sl].emoji} {SLOT_INFO[sl].name}</small>
                {it ? <><span className="slot-ico"><GearIcon family={gearIconFamily(it.item, cls)} rarity={it.item.rarity} size={56} /></span><b>{nm(it.item).name}</b><small>{it.item.text}</small>
                  <button className="btn ghost sm" onClick={() => act('unequipGear', { slot: sl }).then(ok('Снято')).catch(() => {})}>Снять</button></> : <span className="muted">пусто</span>}
              </div>
            );
          })}
        </div>
        {(() => {
          const equippedItems = SLOTS.map((sl) => slotItem(sl)?.item).filter((x): x is NonNullable<typeof x> => !!x);
          const sets = activeSets(equippedItems);
          return (
            <div className="setbox">
              <h3>🧩 Комплекты</h3>
              {sets.length === 0 && <p className="muted small">Наденьте 3 предмета одной редкости: это даёт бонус комплекта, 5 предметов дают ещё больший. Комплекты: {GEAR_RARITIES.map((r) => `«${SET_NAMES[r]}» (${RARITY_NAMES[r].toLowerCase()})`).join(', ')}.</p>}
              {sets.map((st) => (
                <div key={st.rarity} className={`set gr-${st.rarity}`}>
                  <b>«{SET_NAMES[st.rarity]}»: {st.pieces} из 5 ({RARITY_NAMES[st.rarity].toLowerCase()})</b>
                  <small className={st.threeOn ? 'gold' : 'muted'}>{st.threeOn ? '✔' : '○'} 3 предмета: {bonusText(SET_BONUS[st.rarity].three)}</small>
                  <small className={st.fiveOn ? 'gold' : 'muted'}>{st.fiveOn ? '✔' : '○'} 5 предметов: {bonusText(SET_BONUS[st.rarity].five)}</small>
                </div>
              ))}
            </div>
          );
        })()}
        {(() => {
          // слияние: три одинаковых предмета (не легендарных) в один следующей редкости
          const groups = new Map<string, typeof g.items>();
          for (const x of g.items) groups.set(x.itemId, [...(groups.get(x.itemId) ?? []), x]);
          const mergeable = [...groups.values()].filter((list) => list.length >= MERGE_COUNT && nextRarity(list[0]!.item.rarity));
          if (!mergeable.length) return null;
          return (
            <div className="setbox">
              <h3>🔨 Слияние</h3>
              <p className="muted small">Три одинаковых предмета превращаются в один следующей редкости. Лишнюю добычу не жалко.</p>
              {mergeable.map((list) => {
                const first = list[0]!;
                const next = nextRarity(first.item.rarity)!;
                const keys = [...list].sort((a, b) => (a.equipped ? 1 : 0) - (b.equipped ? 1 : 0)).slice(0, MERGE_COUNT).map((x) => x.key);   // сначала ненадетые
                return (
                  <div key={first.itemId} className="mergerow">
                    <span className="grow"><GearIcon family={gearIconFamily(first.item, cls)} rarity={first.item.rarity} size={28} /> <b>{nm(first.item).name}</b> ×{list.length} → <b>{RARITY_NAMES[next].toLowerCase()}</b></span>
                    <button className="btn sm" onClick={() => act('mergeGear', { keys }).then(ok(`Слито: ${nm(gearById(`${first.item.family}-${next}`)!).name}`)).catch(() => {})}>Слить три</button>
                  </div>
                );
              })}
            </div>
          );
        })()}
        <h3>Все предметы ({g.items.length})</h3>
        {g.items.length === 0 && <p className="muted">Снаряжения пока нет. Оно выпадает за победы над ордой (по выходным чаще), над боссом (всегда) и иногда из сундуков.</p>}
        <ul className="gearlist">
          {[...g.items].sort((x, y) => (x.equipped ? 0 : 1) - (y.equipped ? 0 : 1) || (x.date < y.date ? 1 : -1)).map((x) => (
            <li key={x.key} className={`gr-${x.item.rarity} ${x.equipped ? 'on' : ''}`}>
              <span className="gi"><GearIcon family={gearIconFamily(x.item, cls)} rarity={x.item.rarity} size={40} /></span>
              <span className="grow"><b>{nm(x.item).name}</b> <small className="muted">· {SLOT_INFO[x.item.slot].name}, {RARITY_NAMES[x.item.rarity]}, {SRC[x.source]} {x.date}</small><div className="small">{x.item.text}</div></span>
              {x.equipped ? <small className="gold">✔ надето</small> : <button className="btn sm" onClick={() => act('equipGear', { key: x.key }).then(ok(`Надето: ${nm(x.item).name}`)).catch(() => {})}>Надеть</button>}
            </li>
          ))}
        </ul>
        <p className="muted small">В каждом слоте один предмет. Бонусы действуют в личных сражениях и не меняют очки и уровень. <Link href="/arsenal">🗡 Посмотреть всё снаряжение игры</Link></p>
      </Section>
    </>
  );
}
