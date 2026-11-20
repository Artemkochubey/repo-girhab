'use client';
import { useMemo, useState } from 'react';
import { useGame } from '@/components/Shell';
import { HeroFigure, RARITY_COLOR, CLASS_COLOR } from '@/components/HeroFigure';
import { GEAR, GEAR_RARITIES, RARITY_NAMES, SLOTS, SLOT_INFO, gearDisplay, type Slot } from '@/lib/game/gear';
import { CLASS_NAMES, type Cls } from '@/lib/game/classes';
import { Section } from '@/components/ui';

const CLS: Cls[] = ['w', 'm', 'b', 'p'];
/** Короткое название вида предмета (для заголовка ряда). */
const FAMILY_TITLE: Record<string, string> = {
  sword: 'Универсальное оружие', hammer: 'Оружие силы (Тело)', staff: 'Оружие мудрости (Ум)', brush: 'Оружие вдохновения (Творчество)', banner: 'Оружие воли (Дисциплина)',
  armor: 'Доспех (защита от потерь)', shield: 'Щит (орда слабее)', helm: 'Шлем (удар по слабости)', crown: 'Корона (лечение)',
  boots: 'Сапоги (серия побед)', sandals: 'Башмаки (первая волна слабее)', amulet: 'Амулет (шанс снаряжения)', medal: 'Медальон (здоровье за победу)',
};

/** «Арсенал»: всё снаряжение игры, как оно выглядит у каждого класса и в каждой редкости. */
export default function Arsenal() {
  const { s } = useGame();
  const d = s.detail!;
  const me = s.members.find((m) => m.id === s.me)!;
  const [cls, setCls] = useState<Cls>(((me.cls as Cls | null) ?? 'w'));
  const [slot, setSlot] = useState<Slot>('weapon');
  const owned = useMemo(() => new Set(d.gear.items.map((x) => x.itemId)), [d.gear.items]);
  const equipped = useMemo(() => new Set(d.gear.items.filter((x) => x.equipped).map((x) => x.itemId)), [d.gear.items]);
  const families = useMemo(() => {
    const m = new Map<string, typeof GEAR>();
    for (const g of GEAR.filter((x) => x.slot === slot)) m.set(g.family, [...(m.get(g.family) ?? []), g]);
    return [...m.entries()].map(([f, list]) => [f, [...list].sort((a, b) => GEAR_RARITIES.indexOf(a.rarity) - GEAR_RARITIES.indexOf(b.rarity))] as const);
  }, [slot]);
  const have = GEAR.filter((g) => owned.has(g.id)).length;

  return (
    <>
      <h1 className="title">🗡 Арсенал</h1>
      <p className="muted">Всё снаряжение игры: пять видов оружия, доспехи, шлемы, сапоги и амулеты в четырёх редкостях. Внешний вид зависит от класса героя и от редкости: чем выше редкость, тем богаче предмет. У вас есть предметов: <b>{have} из {GEAR.length}</b>.</p>

      <div className="seg" role="tablist" aria-label="Класс">
        {CLS.map((c) => <button key={c} role="tab" aria-selected={cls === c} className={cls === c ? 'on' : ''} onClick={() => setCls(c)} style={cls === c ? { borderColor: CLASS_COLOR[c] } : undefined}>{CLASS_NAMES[c]}</button>)}
      </div>
      <div className="seg" role="tablist" aria-label="Тип предмета">
        {SLOTS.map((sl) => <button key={sl} role="tab" aria-selected={slot === sl} className={slot === sl ? 'on' : ''} onClick={() => setSlot(sl)}>{SLOT_INFO[sl].emoji} {SLOT_INFO[sl].name}</button>)}
      </div>

      {families.map(([fam, list]) => (
        <Section key={fam} title={FAMILY_TITLE[fam] ?? fam}>
          <div className="arsenal-row">
            {list.map((g) => {
              const nm = gearDisplay(g, cls);
              return (
                <div key={g.id} className={`arsenal-cell gr-${g.rarity} ${owned.has(g.id) ? 'have' : ''}`}>
                  <div className="arsenal-art"><HeroFigure look={{ [slot]: g.id }} color={me.color} emoji={me.emoji} face={me.face} cls={cls} focus={slot} size={slot === 'weapon' ? 80 : 104} /></div>
                  <small style={{ color: RARITY_COLOR[g.rarity] }}>{RARITY_NAMES[g.rarity]}</small>
                  <b>{nm.name}</b>
                  <small className="muted">{g.text}</small>
                  {equipped.has(g.id) ? <small className="gold">✔ надето</small> : owned.has(g.id) ? <small className="gold">✔ есть у вас</small> : null}
                </div>
              );
            })}
          </div>
        </Section>
      ))}
      <p className="muted small">Снаряжение выпадает за победы над ордой (по выходным чаще), над боссом и иногда из сундуков. Надевать его можно на вкладке «⚔️ Бой». Эффект предмета у всех классов одинаковый, различается только вид и название.</p>
    </>
  );
}
