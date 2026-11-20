'use client';
import Link from 'next/link';
import type { CSSProperties } from 'react';
import { GEAR_RARITIES, RARITY_NAMES, SET_BONUS, SET_NAMES, SLOTS, SLOT_INFO, activeSets, bonusText, gearDisplay, gearIconFamily, type Slot } from '@/lib/game/gear';
import { lookOf } from '@/lib/client';
import { GearIcon } from './GearIcon';
import { HeroFigure } from './HeroFigure';
import { useGame } from './Shell';

// куда ставить слоты вокруг героя (сверху, px от верха сцены)
const POS: Record<Slot, { side: 'l' | 'r'; top: number }> = {
  helm: { side: 'l', top: 64 }, armor: { side: 'l', top: 170 }, boots: { side: 'l', top: 276 },
  weapon: { side: 'r', top: 116 }, amulet: { side: 'r', top: 224 },
};

/** Экран снаряжения: герой в центре, пять слотов вокруг, под ним бонусы комплекта. */
export function LoadoutStage() {
  const { s } = useGame();
  const d = s.detail!;
  const me = s.members.find((m) => m.id === s.me)!;
  const g = d.gear;
  const cls = d.hero.cls;
  const slotItem = (sl: Slot) => g.items.find((x) => x.key === g.slots[sl])?.item ?? null;
  const worn = SLOTS.map(slotItem).filter((x): x is NonNullable<typeof x> => !!x);
  const sets = activeSets(worn);
  const best = [...sets].sort((a, b) => b.pieces - a.pieces || GEAR_RARITIES.indexOf(b.rarity) - GEAR_RARITIES.indexOf(a.rarity))[0];
  const legend = worn.length === 5 && worn.every((x) => x.rarity === 'legend');

  return (
    <>
      <section className={`loadout ${legend ? 'legend' : ''}`} aria-label="Снаряжение героя">
        <div className="loadout-fig"><HeroFigure look={lookOf(g)} color={me.color} emoji={me.emoji} face={me.face} cls={cls} size={200} /></div>
        {SLOTS.map((sl) => {
          const it = slotItem(sl);
          const p = POS[sl];
          const nm = it ? gearDisplay(it, cls).name : null;
          return (
            <Link key={sl} href="/battle" className={`lslot ${p.side} ${it ? `lr-${it.rarity} full` : 'empty'}`} style={{ top: p.top } as CSSProperties} aria-label={it ? `${SLOT_INFO[sl].name}: ${nm}` : `${SLOT_INFO[sl].name}: пусто, надеть`} title={nm ?? 'Надеть предмет'}>
              <span className="lslot-box">{it ? <GearIcon family={gearIconFamily(it, cls)} rarity={it.rarity} size={54} /> : <span className="plus" aria-hidden="true">+</span>}</span>
              <small>{SLOT_INFO[sl].name}</small>
            </Link>
          );
        })}
        <div className="loadout-title">
          <b>{best && best.pieces >= 3 ? `Комплект «${SET_NAMES[best.rarity]}»` : 'Снаряжение'}</b>
          <small>{worn.length} из 5 слотов{legend ? ' · все предметы легендарные' : ''}</small>
        </div>
      </section>

      <section className="card setcard">
        <div className="row between">
          <h2>Бонусы комплекта</h2>
          <span className="pips" role="img" aria-label={`Надето ${worn.length} из 5`}>{SLOTS.map((sl) => <i key={sl} className={slotItem(sl) ? 'on' : ''} />)}</span>
        </div>
        {sets.length === 0 && <p className="muted small">Наденьте 3 предмета одной редкости: это даёт бонус комплекта, 5 предметов дают ещё больший. Предметы надеваются на странице «Бой».</p>}
        {sets.map((st) => (
          <div key={st.rarity} className={`setrow gr-${st.rarity}`}>
            <b>«{SET_NAMES[st.rarity]}»: {st.pieces} из 5 <small className="muted">({RARITY_NAMES[st.rarity].toLowerCase()})</small></b>
            <div className={`setline ${st.threeOn ? 'on' : ''}`}><span className="ck" aria-hidden="true">{st.threeOn ? '✔' : '○'}</span><span><b>Три предмета</b><small>{bonusText(SET_BONUS[st.rarity].three)}</small></span></div>
            <div className={`setline ${st.fiveOn ? 'on' : ''}`}><span className="ck" aria-hidden="true">{st.fiveOn ? '✔' : '○'}</span><span><b>Пять предметов</b><small>{bonusText(SET_BONUS[st.rarity].five)}</small></span></div>
          </div>
        ))}
        <Link className="btn" href="/arsenal">Открыть Арсенал</Link>
      </section>
    </>
  );
}
