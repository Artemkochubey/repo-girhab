'use client';
import { useState } from 'react';
import { Quests } from '@/components/Quests';
import { useGame } from '@/components/Shell';
import { Bar, Radar, Section } from '@/components/ui';
import { CLASS_NAMES, SUBCLASS_NAMES, canChangeClass, subBonus, type Cls } from '@/lib/game/classes';
import { TALENTS, canBuyTalent, talentCost } from '@/lib/game/talents';

const CLS: Cls[] = ['w', 'm', 'b', 'p'];
const SPHERE = { w: 'Тело', m: 'Ум', b: 'Творчество', p: 'Дисциплина' } as const;

export default function Hero() {
  const { s, act, toast } = useGame();
  const d = s.detail!;
  const me = s.members.find((m) => m.id === s.me)!;
  const h = d.hero;
  const [chest, setChest] = useState<{ rarity: string; reward: string } | null>(null);
  const [picking, setPicking] = useState<Cls | null>(null);
  const change = canChangeClass(Date.parse(h.clsChangedAt), Date.now());
  const subName = h.sub ? SUBCLASS_NAMES[h.cls][h.sub] : null;
  const RAR: Record<string, string> = { common: 'Обычный', rare: '✨ Редкий', legend: '🌟 Легендарный' };

  return (
    <>
      <section className="card hero" style={{ borderColor: me.color }}>
        <div className="big">{me.emoji}</div>
        <div className="grow">
          <h1 className="title">{me.name} · ур. {d.level}</h1>
          <p>{CLASS_NAMES[h.cls]}{subName ? ` · ${subName}` : ''}</p>
          <Bar value={d.into} max={d.span} label={`${d.into} / ${d.span} XP`} />
        </div>
      </section>

      <Section title="Характеристики (30 дней)"><Radar data={d.radar} /></Section>

      <Section title="Класс">
        <div className="grid">
          {CLS.map((c) => (
            <button key={c} className={`card pick ${h.cls === c ? 'sel' : ''}`} disabled={h.cls === c} onClick={() => setPicking(c)}>
              <b>{CLASS_NAMES[c]}</b><span className="muted">{SPHERE[c]} +20%</span>
            </button>
          ))}
        </div>
        <p className="muted small">{change.ok ? 'Смена класса сейчас доступна.' : `Смена класса откроется ${new Date(change.availableAtMs!).toLocaleDateString('ru')}.`} Бонусы пересчитываются за всю историю.</p>
        {picking && (
          <div className="confirm">
            Сменить класс на {CLASS_NAMES[picking]}? Это изменит очки за всю историю.
            <div className="row">
              <button className="btn" onClick={async () => { await act('setClass', { cls: picking, confirm: true }); setPicking(null); }}>Да, сменить</button>
              <button className="btn ghost" onClick={() => setPicking(null)}>Отмена</button>
            </div>
          </div>
        )}
        <h3>Подкласс</h3>
        {d.level < 5 ? <p className="muted">Откроется на 5 уровне (+10% второй сферы).</p> : (
          <div className="row wrapRow">
            {CLS.filter((c) => c !== h.cls).map((c) => (
              <button key={c} className={`btn ${h.sub === c ? '' : 'ghost'}`} onClick={() => act('setSub', { sub: h.sub === c ? null : c })}>
                {SUBCLASS_NAMES[h.cls][c]} ({SPHERE[c]} +{Math.round(subBonus(d.level) * 100)}%){d.recommendedSub === c ? ' ★' : ''}
              </button>
            ))}
          </div>
        )}
      </Section>

      <Section title="⚔️ Квесты дня"><Quests /></Section>

      <Section title="🎁 Сундуки" right={<b>{d.chests.available} доступно</b>}>
        <button className="btn" disabled={!d.chests.available} onClick={async () => setChest((await act('openChest')) as never)}>Открыть сундук</button>
        <p className="muted small">Всего заработано {d.chests.earned}, открыто {d.chests.opened}. За уровни, дни со всеми квестами и победы над боссами.</p>
        {chest && <div className={`reward ${chest.rarity}`} onClick={() => setChest(null)}><small>{RAR[chest.rarity]}</small><b>{chest.reward}</b></div>}
      </Section>

      <Section title="🌳 Таланты" right={<b>очков: {d.talentPointsFree}</b>}>
        {CLS.map((br) => (
          <div key={br} className="branch">
            <h3>{CLASS_NAMES[br]}{h.cls === br ? ' · ваш класс' : ''}</h3>
            {[1, 2, 3].map((tier) => (
              <div key={tier} className="row tier">
                {TALENTS.filter((t) => t.branch === br && t.tier === tier).map((t) => {
                  const owned = h.talents.includes(t.id);
                  const ok = canBuyTalent(t.id, h.talents, h.cls, d.level);
                  return (
                    <button key={t.id} className={`talent ${owned ? 'owned' : ''}`} disabled={owned || !ok.ok}
                      title={ok.reason} onClick={() => act('buyTalent', { id: t.id }).catch(() => toast('Не получилось'))}>
                      <b>{t.name}</b><small>{t.text}</small><em>{owned ? '✔' : `${talentCost(t, h.cls)} оч.`}</em>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        ))}
        {s.parent && <button className="btn ghost" onClick={() => act('resetTalents')}>Сбросить таланты (родитель)</button>}
      </Section>

      <Section title={`${s.boss.boss.emoji} ${s.boss.boss.name}`}>
        <Bar value={Math.max(0, s.boss.hp - s.boss.damage)} max={s.boss.hp} color="var(--danger)" label={`${Math.max(0, s.boss.hp - s.boss.damage)} / ${s.boss.hp}`} />
        <ul className="list">
          {s.members.map((m) => <li key={m.id}>{m.emoji} {m.name}: <b>{s.boss.byMember[m.id] ?? 0}</b></li>)}
        </ul>
      </Section>
    </>
  );
}
