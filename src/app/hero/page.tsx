'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useGame } from '@/components/Shell';
import { Achievements } from '@/components/Achievements';
import { ClimbRoster } from '@/components/ClimbRoster';
import { MountainClimb } from '@/components/MountainClimb';
import { rankFor } from '@/lib/game/ranks';
import { xpNeed } from '@/lib/game/level';
import { AvatarPicker } from '@/components/AvatarPicker';
import { FacePicker } from '@/components/FacePicker';
import { HeroFigure } from '@/components/HeroFigure';
import { lookOf } from '@/lib/client';
import { Bar, Fold, Radar } from '@/components/ui';
import { Hint } from '@/components/Hints';
import { CLASS_INFO, CLASS_NAMES, SUBCLASS_NAMES, canChangeClass, subBonus, type Cls } from '@/lib/game/classes';
import { TalentTree } from '@/components/TalentTree';

const CLS: Cls[] = ['w', 'm', 'b', 'p'];
const SPHERE = { w: 'Тело', m: 'Ум', b: 'Творчество', p: 'Дисциплина' } as const;

export default function Hero() {
  const { s, act, toast, askClass } = useGame();
  const d = s.detail!;
  const me = s.members.find((m) => m.id === s.me)!;
  const h = d.hero;
  const [picking, setPicking] = useState<Cls | null>(null);
  const [pickAvatar, setPickAvatar] = useState(false);
  const [pickFace, setPickFace] = useState(false);
  // подкласс: сразу показываем выбор (не дожидаясь ответа сервера) и играем эффект
  const [optSub, setOptSub] = useState<Cls | null | undefined>(undefined);
  const [burst, setBurst] = useState<Cls | null>(null);
  const curSub = optSub !== undefined ? optSub : h.sub;
  const [pickingSub, setPickingSub] = useState<Cls | 'none' | null>(null);
  const applySub = async (next: Cls | null) => {
    setPickingSub(null);
    setOptSub(next);
    if (next) { setBurst(next); setTimeout(() => setBurst(null), 1600); }
    try {
      await act('setSub', { sub: next });
      toast(next ? `🎉 Подкласс выбран: ${SUBCLASS_NAMES[h.cls!][next]}. Сфера «${SPHERE[next]}» усилена на +${Math.round(subBonus(d.level) * 100)}%` : 'Подкласс снят');
    } catch { /* act уже показал сообщение об ошибке */ }
    finally { setOptSub(undefined); }
  };
  const change = h.cls ? canChangeClass(Date.parse(h.clsChangedAt), Date.now()) : { ok: true as const };
  const subName = h.cls && h.sub ? SUBCLASS_NAMES[h.cls][h.sub] : null;

  return (
    <>
      {pickAvatar && <AvatarPicker memberId={me.id} onClose={() => setPickAvatar(false)} />}
      {pickFace && <FacePicker memberId={me.id} onClose={() => setPickFace(false)} />}
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

      <section className="card herolook" style={{ borderColor: me.color }}>
        <HeroFigure look={lookOf(d.gear)} color={me.color} emoji={me.emoji} face={me.face} cls={h.cls} size={104} />
        <div className="grow">
          <b>Мой герой в бою</b>
          <p className="muted small">{me.face ? 'Лицо и снаряжение видны в боях и на ТВ.' : 'Создайте лицо героя: пол, причёску, глаза. Оно видно в боях и на ТВ.'} Аватар профиля (смайлик вверху) меняется отдельно.</p>
          <button className="btn" onClick={() => setPickFace(true)}>🎭 {me.face ? 'Изменить лицо' : 'Создать лицо'}</button>
        </div>
      </section>

      <Hint id="hero" more="/rules">Опыт повышает уровень героя. За каждый уровень даётся очко таланта. Класс усиливает одну сферу, подкласс (с 5 уровня) — вторую. Начните с выбора класса.</Hint>

      <Fold title="🌳 Таланты" open={d.talentPointsFree > 0} right={<b>очков: {d.talentPointsFree}</b>}>
        {!h.cls ? <p className="muted">Выберите класс, чтобы увидеть его таланты.</p>
          : <TalentTree cls={h.cls} talents={h.talents} level={d.level} onBuy={(id) => act('buyTalent', { id }).catch(() => toast('Не получилось'))} />}
        {s.parent && <button className="btn ghost" onClick={() => act('resetTalents')}>Сбросить таланты (родитель)</button>}
      </Fold>

      <Link className="card more-card" href="/bag"><span className="mi">🎁</span><b>Сундуки: {d.chests.available} доступно</b><small>Открывать сундуки, призы и артефакты теперь во вкладке «🎒 Добыча».</small></Link>

      <Fold title="📊 Характеристики (30 дней)"><Radar data={d.radar} /></Fold>

      <Fold title="🎭 Класс и подкласс" open={!h.cls} right={<span className="muted">{h.cls ? `${CLASS_NAMES[h.cls]}${subName ? ` · ${subName}` : ''}` : 'не выбран'}</span>}>
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
        {h.cls && d.level >= 5 && <p className="sub-now">{curSub ? <>Ваш подкласс: <b className="gold">{SUBCLASS_NAMES[h.cls][curSub]}</b>. Нажмите на другую карточку, чтобы сменить, или на эту же, чтобы снять (потребуется подтверждение).</> : 'Подкласс не выбран: нажмите на карточку ниже и подтвердите выбор.'}</p>}
        {!h.cls ? <p className="muted">Выберите класс, чтобы увидеть его подклассы.</p> : (
          <div className="grid">
            {CLS.filter((c) => c !== h.cls).map((c) => {
              const locked = d.level < 5;
              const chosen = curSub === c;
              return (
                <button key={c} className={`card pick sub ${chosen ? 'sel' : ''} ${burst === c ? 'burst' : ''} ${locked ? 'locked' : ''}`} disabled={locked} aria-pressed={chosen}
                  onClick={() => setPickingSub(chosen ? 'none' : c)}>
                  {chosen && <span className="sub-badge">✔ Ваш подкласс</span>}
                  <b>{locked ? '🔒 ' : ''}{SUBCLASS_NAMES[h.cls!][c]}{!locked && d.recommendedSub === c ? ' ★' : ''}</b>
                  <span className="muted">{CLASS_NAMES[h.cls!]} + {SPHERE[c]}</span>
                  <small className="muted">{CLASS_INFO[c].bonus.replace('+20%', locked ? '+10%…' : `+${Math.round(subBonus(d.level) * 100)}%`)}</small>
                  {locked && <small className="gold">Откроется на 5 уровне: ещё {Math.max(0, xpNeed(5) - d.xp)} опыта</small>}
                </button>
              );
            })}
          </div>
        )}
        {pickingSub && h.cls && (
          <div className="confirm">
            {pickingSub === 'none'
              ? <>Снять подкласс «{SUBCLASS_NAMES[h.cls][curSub!]}»? Очки пересчитаются за всю историю.</>
              : <>{curSub ? 'Сменить подкласс' : 'Выбрать подкласс'}: {SUBCLASS_NAMES[h.cls][pickingSub]}? {CLASS_INFO[pickingSub].bonus.replace('+20%', `+${Math.round(subBonus(d.level) * 100)}%`)}. {CLASS_INFO[pickingSub].pitch}{curSub ? ' Очки пересчитаются за всю историю.' : ''}</>}
            <div className="row">
              <button className="btn" onClick={() => applySub(pickingSub === 'none' ? null : pickingSub)}>{pickingSub === 'none' ? 'Да, снять' : curSub ? 'Да, сменить' : 'Да, выбрать'}</button>
              <button className="btn ghost" onClick={() => setPickingSub(null)}>Отмена</button>
            </div>
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
      </Fold>

      <Fold title="⛰ Восхождение" right={<span className="muted">{rankFor(d.level, d.xp).rank.emoji} {rankFor(d.level, d.xp).rank.name}</span>}>
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
      </Fold>

      <Achievements items={d.achievements} />
    </>
  );
}
