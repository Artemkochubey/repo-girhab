'use client';
import { useState } from 'react';
import { QuestsBlock } from '@/components/Quests';
import { useGame } from '@/components/Shell';
import { Achievements } from '@/components/Achievements';
import { ClimbRoster } from '@/components/ClimbRoster';
import { MountainClimb } from '@/components/MountainClimb';
import { rankFor } from '@/lib/game/ranks';
import { AvatarPicker } from '@/components/AvatarPicker';
import { Bar, Radar, Section } from '@/components/ui';
import { CLASS_INFO, CLASS_NAMES, SUBCLASS_NAMES, canChangeClass, subBonus, type Cls } from '@/lib/game/classes';
import { DIRECTIONS, FAMILY_NAME, FAMILY_NOTE, MAX_RANK, PEAK_DIR, PEAK_LEVEL, PEAK_NAME, PEAK_NEED, TALENTS, canBuyTalent, directionPoints, rankOf, tierNeed, type Talent } from '@/lib/game/talents';

const CLS: Cls[] = ['w', 'm', 'b', 'p'];
const SPHERE = { w: 'Тело', m: 'Ум', b: 'Творчество', p: 'Дисциплина' } as const;

export default function Hero() {
  const { s, act, toast, askClass } = useGame();
  const d = s.detail!;
  const me = s.members.find((m) => m.id === s.me)!;
  const h = d.hero;
  const [chest, setChest] = useState<{ rarity: string; reward: string } | null>(null);
  const [picking, setPicking] = useState<Cls | null>(null);
  const [pickAvatar, setPickAvatar] = useState(false);
  const change = h.cls ? canChangeClass(Date.parse(h.clsChangedAt), Date.now()) : { ok: true as const };
  const subName = h.cls && h.sub ? SUBCLASS_NAMES[h.cls][h.sub] : null;
  const RAR: Record<string, string> = { common: 'Обычный', rare: '✨ Редкий', legend: '🌟 Легендарный' };

  return (
    <>
      {pickAvatar && <AvatarPicker memberId={me.id} onClose={() => setPickAvatar(false)} />}
      <section className="card hero" style={{ borderColor: me.color }}>
        <button className="big avatar-btn" onClick={() => setPickAvatar(true)} aria-label="Сменить аватар" title="Сменить аватар">
          {me.emoji}<span className="edit">✏️</span>
        </button>
        <div className="grow">
          <h1 className="title">{me.name} · ур. {d.level} <small className="gold">🏅 {d.achievements.filter((a) => a.earnedOn).length}</small></h1>
          <p className="rank">{rankFor(d.level, d.xp).rank.emoji} {rankFor(d.level, d.xp).rank.name}</p>
          <p>{h.cls ? CLASS_NAMES[h.cls] : 'Класс не выбран'}{subName ? ` · ${subName}` : ''}{!h.cls && <> <button className="btn" onClick={askClass}>Выбрать класс</button></>}</p>
          <Bar value={d.into} max={d.span} label={`${d.into} / ${d.span} XP`} />
        </div>
      </section>

      <Section title="⛰ Восхождение">
        {(() => {
          const climbers = s.members.map((m) => ({ id: m.id, name: m.name, emoji: m.emoji, color: m.color, level: m.id === me.id ? d.level : m.level, xp: m.id === me.id ? d.xp : m.xp, me: m.id === me.id }));
          return <><MountainClimb climbers={climbers} /><ClimbRoster climbers={climbers} /></>;
        })()}
        {(() => {
          const r = rankFor(d.level, d.xp);
          return (
            <div className="climb-info">
              <p><b>{r.rank.emoji} {r.rank.name}</b> · {r.rank.text}</p>
              {r.next
                ? <><Bar value={Math.round(r.progress * 100)} max={100} label={`до «${r.next.name}» (ур. ${r.next.level}): ещё ${r.xpToNext} опыта`} /></>
                : <p className="gold">Выше только небо: пройдены все этапы восхождения!</p>}
              <p className="muted small">Каждый этап — новое звание. У каждого героя плашка с именем и выноской к его точке на тропе, ★ — это вы.</p>
            </div>
          );
        })()}
      </Section>

      <Section title="Характеристики (30 дней)"><Radar data={d.radar} /></Section>

      <Section title="Класс">
        <div className="grid">
          {CLS.map((c) => (
            <button key={c} className={`card pick ${h.cls === c ? 'sel' : ''}`} disabled={h.cls === c} onClick={() => setPicking(c)}>
              <b>{CLASS_NAMES[c]}</b><span className="muted">{CLASS_INFO[c].bonus}</span><small className="muted">{CLASS_INFO[c].pitch}</small>
            </button>
          ))}
        </div>
        <p className="muted small">{!h.cls ? 'Выберите класс — он усилит одну из сфер на 20%.' : change.ok ? 'Смена класса сейчас доступна.' : `Смена класса откроется ${new Date(change.availableAtMs!).toLocaleDateString('ru')}.`} Бонусы пересчитываются за всю историю.</p>
        {picking && (
          <div className="confirm">
            {h.cls ? 'Сменить класс' : 'Выбрать класс'}: {CLASS_NAMES[picking]}? {CLASS_INFO[picking].bonus}.{h.cls ? ' Очки пересчитаются за всю историю.' : ''}
            <div className="row">
              <button className="btn" onClick={async () => { await act('setClass', { cls: picking, confirm: true }); setPicking(null); }}>{h.cls ? 'Да, сменить' : 'Да, выбрать'}</button>
              <button className="btn ghost" onClick={() => setPicking(null)}>Отмена</button>
            </div>
          </div>
        )}
        <h3>Подкласс</h3>
        <p className="muted small">Вторая сфера усиливается дополнительно: с 5 уровня +10%, с 8 — +15%, с 12 — +20%. Сейчас у вас уровень {d.level}{d.level >= 5 ? `, бонус +${Math.round(subBonus(d.level) * 100)}%` : ''}.</p>
        {!h.cls ? <p className="muted">Выберите класс, чтобы увидеть его подклассы.</p> : (
          <div className="grid">
            {CLS.filter((c) => c !== h.cls).map((c) => {
              const locked = d.level < 5;
              const chosen = h.sub === c;
              return (
                <button key={c} className={`card pick sub ${chosen ? 'sel' : ''} ${locked ? 'locked' : ''}`} disabled={locked}
                  onClick={() => act('setSub', { sub: chosen ? null : c })}>
                  <b>{locked ? '🔒 ' : ''}{SUBCLASS_NAMES[h.cls!][c]}{!locked && d.recommendedSub === c ? ' ★' : ''}</b>
                  <span className="muted">{CLASS_NAMES[h.cls!]} + {SPHERE[c]}</span>
                  <small className="muted">{CLASS_INFO[c].bonus.replace('+20%', locked ? '+10%…' : `+${Math.round(subBonus(d.level) * 100)}%`)}</small>
                  {locked && <small className="gold">Откроется на 5 уровне</small>}
                </button>
              );
            })}
          </div>
        )}
        <details>
          <summary>Все подклассы всех классов</summary>
          <table className="subtable">
            <tbody>
              {CLS.map((main) => (
                <tr key={main}><th>{CLASS_NAMES[main]}</th><td>{CLS.filter((c) => c !== main).map((c) => `${SUBCLASS_NAMES[main][c]} (+${SPHERE[c]})`).join(' · ')}</td></tr>
              ))}
            </tbody>
          </table>
        </details>
      </Section>

      <QuestsBlock />

      <Section title="🎁 Сундуки" right={<b>{d.chests.available} доступно</b>}>
        <button className="btn" disabled={!d.chests.available} onClick={async () => setChest((await act('openChest')) as never)}>Открыть сундук</button>
        <p className="muted small">Всего заработано {d.chests.earned}, открыто {d.chests.opened}. За уровни, дни со всеми квестами, победы над боссами и звание MVP дня (сейчас побед: {d.mvpWins}).</p>
        {chest && <div className={`reward ${chest.rarity}`} onClick={() => setChest(null)}><small>{RAR[chest.rarity]}</small><b>{chest.reward}</b></div>}
      </Section>

      <Section title="🌳 Таланты" right={<b>очков: {d.talentPointsFree}</b>}>
        {!h.cls ? <p className="muted">Выберите класс, чтобы увидеть его таланты.</p> : (() => {
          const cls = h.cls!;
          const Card = ({ t }: { t: Talent }) => {
            const rank = rankOf(h.talents, t.id);
            const ok = canBuyTalent(t.id, h.talents, cls, d.level);
            const locked = d.level < t.unlock;
            const dirPts = directionPoints(h.talents, cls, t.dir, t.cls);
            const lack = !locked && t.tier < 5 && dirPts < tierNeed(t.tier);
            const hint = locked ? ` · ур. ${t.unlock}` : rank >= t.maxRank ? ' · макс.' : ok.ok ? ` · +1 ранг (${t.cost} оч.)` : lack ? ` · ${tierNeed(t.tier)} оч. в ветке` : ` · ${ok.reason ?? ''}`;
            return (
              <button className={`talent ${rank ? 'owned' : ''} ${locked || (!ok.ok && !rank) ? 'locked' : ''}`} disabled={!ok.ok}
                title={ok.reason} onClick={() => act('buyTalent', { id: t.id }).catch(() => toast('Не получилось'))}>
                <b>{locked ? '🔒 ' : ''}{t.name}</b><small>{t.text}</small>
                <em>{'●'.repeat(rank)}{'○'.repeat(t.maxRank - rank)}{hint}</em>
              </button>
            );
          };
          // ярусы направления: ряд = ярус; на развилке две подветки рядом
          const Tree = ({ group, dir }: { group: Talent['cls']; dir: number }) => {
            const list = TALENTS.filter((t) => t.cls === group && t.dir === dir);
            const tiers = [...new Set(list.map((t) => t.tier))].sort();
            return (
              <div className="tiers">
                {tiers.map((tier) => (
                  <div key={tier} className="tierrow">{list.filter((t) => t.tier === tier).map((t) => <Card key={t.id} t={t} />)}</div>
                ))}
              </div>
            );
          };
          return (
            <>
              <p className="muted small">У каждого направления есть развилка: на ярусах 2–3 выбирается одна из двух подветок, вторая закрывается. Новый талант открывается с каждым уровнем, каждый качается до {MAX_RANK} рангов, ранг даёт небольшой бонус. Ярусы 2, 3 и 4 требуют 2, 4 и 6 очков в направлении. Очко таланта даётся за каждый уровень. Таланты другого класса не действуют, очки за них возвращаются.</p>
              {DIRECTIONS[cls].map((dir, di) => (
                <div key={di} className="branch">
                  <h3>{dir.name} <small className="muted">· {directionPoints(h.talents, cls, di)} оч.</small></h3>
                  <p className="muted small">{dir.note}</p>
                  <Tree group={cls} dir={di} />
                </div>
              ))}
              <div className="branch">
                <h3>{PEAK_NAME} <small className="muted">· с {PEAK_LEVEL} уровня</small></h3>
                <p className="muted small">Вершина класса: ранг стоит 3 очка. Нужно {PEAK_NEED} очков в любом одном направлении.</p>
                <Tree group={cls} dir={PEAK_DIR} />
              </div>
              <div className="branch">
                <h3>{FAMILY_NAME} <small className="muted">· {directionPoints(h.talents, cls, 0, 'f')} оч.</small></h3>
                <p className="muted small">{FAMILY_NOTE}.</p>
                <Tree group="f" dir={0} />
              </div>
            </>
          );
        })()}
        {s.parent && <button className="btn ghost" onClick={() => act('resetTalents')}>Сбросить таланты (родитель)</button>}
      </Section>

      <Section title={`${s.boss.boss.emoji} ${s.boss.boss.name}`}>
        <Bar value={Math.max(0, s.boss.hp - s.boss.damage)} max={s.boss.hp} color="var(--danger)" label={`${Math.max(0, s.boss.hp - s.boss.damage)} / ${s.boss.hp}`} />
        <ul className="list">
          {s.members.map((m) => <li key={m.id}>{m.emoji} {m.name}: <b>{s.boss.byMember[m.id] ?? 0}</b></li>)}
        </ul>
      </Section>

      <Achievements items={d.achievements} />
    </>
  );
}
