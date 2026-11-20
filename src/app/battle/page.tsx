'use client';
import { useGame } from '@/components/Shell';
import { BattleScene } from '@/components/BattleScene';
import { BossScene } from '@/components/BossScene';
import { lookOf } from '@/lib/client';
import { Bar, Section } from '@/components/ui';
import { DOMAIN_INFO, RARITY_NAMES, SLOTS, SLOT_INFO, type Slot } from '@/lib/game/gear';
import { HORDES, LOSS_HP, MAX_HP, REGEN, WEAKENED_BELOW, WIN_HP, WEAK_MULT } from '@/lib/game/battle';

const hordeName = (id: string) => HORDES.find((h) => h.id === id);
const SRC = { battle: 'за победу над ордой', boss: 'за босса', chest: 'из сундука' } as const;
const pct = (x: number) => `${Math.round(x * 100)}%`;

export default function Battle() {
  const { s, act, toast } = useGame();
  const d = s.detail!;
  const b = d.battle, l = b.live, f = l.fight, g = d.gear;
  const me = s.members.find((m) => m.id === s.me)!;
  const ok = (m: string) => () => toast(m);
  const mult = (w: { weak: keyof typeof DOMAIN_INFO }) => (1 + WEAK_MULT + g.bonus.weak) * (1 + g.bonus.dmg + g.bonus.dmgDomain[w.weak]);
  const slotItem = (sl: Slot) => g.items.find((x) => x.key === g.slots[sl]);

  return (
    <>
      <h1 className="title">⚔️ Бой: {me.emoji} {me.name}</h1>

      <Section title={`${l.horde.emoji} ${l.horde.name}`} right={<span className="muted">{l.weekend ? 'выходной: орда крепче' : 'сегодня'}</span>}>
        <BattleScene look={lookOf(g)} color={me.color} emoji={me.emoji} name={me.name} live={l} />
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
        <p className="muted small">Победа: +{l.xp} опыта, шанс снаряжения {pct(l.winChance)}{l.weekend ? ' (по выходным выше)' : ''}, +{WIN_HP + g.bonus.winHeal} здоровья. Поражение (0–1 волна): −{Math.round(LOSS_HP * (1 - Math.min(0.9, g.bonus.guard)))} здоровья. Итог подводится в конце дня.</p>
      </Section>

      <Section title={`${s.boss.boss.emoji} Босс недели: все герои вместе`}>
        <BossScene boss={s.boss.boss} hp={s.boss.hp} damage={s.boss.damage} defeated={s.boss.defeated}
          party={s.members.map((m) => ({ id: m.id, name: m.name, emoji: m.emoji, color: m.color, look: m.look, damage: s.boss.byMember[m.id] ?? 0 }))} meId={s.me} />
        <p className="muted small">Снаряжение усиливает удар по боссу: оружие и «слабость» от шлема добавляют урон, молот и подобное усиливают свою сферу. Предмет работает на недели после того дня, когда он получен.</p>
      </Section>

      <Section title="❤️ Здоровье героя" right={<b>🔥 побед подряд: {b.streak}</b>}>
        <Bar value={l.hp} max={MAX_HP} color={l.weakened ? 'var(--danger)' : '#d84a6a'} label={`${l.hp} / ${MAX_HP}`} />
        <p className="muted small">Каждый день герой восстанавливает {REGEN + g.bonus.heal} здоровья. Если оно ниже {WEAKENED_BELOW}, орда на 15% крепче{l.weakened ? ': сейчас герой ослаблен.' : '.'} Броня уменьшает потери.</p>
        {b.recent.length > 0 && (
          <ul className="list small">
            {b.recent.map((r) => (
              <li key={r.date}>{r.win ? '🏆' : r.cleared === 2 ? '🛡' : '💀'} {r.date} · {hordeName(r.hordeId)?.emoji} {hordeName(r.hordeId)?.name}: волн {r.cleared}/3{r.xp ? ` · +${r.xp} опыта` : ''} · здоровье {r.hpDelta > 0 ? '+' : ''}{r.hpDelta}{r.drop ? ' · 🎁 снаряжение' : ''}</li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="🛡 Снаряжение">
        <div className="slots">
          {SLOTS.map((sl) => {
            const it = slotItem(sl);
            return (
              <div key={sl} className={`slot ${it ? `gr-${it.item.rarity}` : 'empty'}`}>
                <small className="muted">{SLOT_INFO[sl].emoji} {SLOT_INFO[sl].name}</small>
                {it ? <><b>{it.item.emoji} {it.item.name}</b><small>{it.item.text}</small>
                  <button className="btn ghost sm" onClick={() => act('unequipGear', { slot: sl }).then(ok('Снято')).catch(() => {})}>Снять</button></> : <span className="muted">пусто</span>}
              </div>
            );
          })}
        </div>
        <h3>Все предметы ({g.items.length})</h3>
        {g.items.length === 0 && <p className="muted">Снаряжения пока нет. Оно выпадает за победы над ордой (по выходным чаще), над боссом (всегда) и иногда из сундуков.</p>}
        <ul className="gearlist">
          {[...g.items].sort((x, y) => (x.equipped ? 0 : 1) - (y.equipped ? 0 : 1) || (x.date < y.date ? 1 : -1)).map((x) => (
            <li key={x.key} className={`gr-${x.item.rarity} ${x.equipped ? 'on' : ''}`}>
              <span className="gi">{x.item.emoji}</span>
              <span className="grow"><b>{x.item.name}</b> <small className="muted">· {SLOT_INFO[x.item.slot].name}, {RARITY_NAMES[x.item.rarity]}, {SRC[x.source]} {x.date}</small><div className="small">{x.item.text}</div></span>
              {x.equipped ? <small className="gold">✔ надето</small> : <button className="btn sm" onClick={() => act('equipGear', { key: x.key }).then(ok(`Надето: ${x.item.name}`)).catch(() => {})}>Надеть</button>}
            </li>
          ))}
        </ul>
        <p className="muted small">В каждом слоте один предмет. Бонусы действуют в личных сражениях и не меняют очки и уровень.</p>
      </Section>
    </>
  );
}
