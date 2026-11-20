'use client';
import { BattleScene } from '@/components/BattleScene';
import { BossScene } from '@/components/BossScene';
import { ClimbRoster } from '@/components/ClimbRoster';
import { HeroFigure } from '@/components/HeroFigure';
import { MountainClimb } from '@/components/MountainClimb';
import { RatingTable } from '@/components/RatingTable';
import { WeekRatingTable } from '@/components/WeekRatingTable';
import { STUDY_KINDS } from '@/lib/db/schema';
import { DEEDS, DEED_DAY_CAP, deedStatus } from '@/lib/game/deeds';
import { CLASS_NAMES, type Cls } from '@/lib/game/classes';
import { rankFor } from '@/lib/game/ranks';
import { seasonName } from '@/lib/game/seasons';
import type { Tv, TvMember } from '@/lib/tvTypes';

const climbers = (d: Tv) => d.members.map((m) => ({ id: m.id, name: m.name, emoji: m.emoji, color: m.color, level: m.level, xp: m.xp }));
const party = (d: Tv) => d.members.map((m) => ({ id: m.id, name: m.name, emoji: m.emoji, face: m.face, color: m.color, look: m.look, cls: m.cls, damage: d.boss.byMember[m.id] ?? 0 }));
const mName = (d: Tv, id: number | undefined) => d.members.find((m) => m.id === id);
/** Сколько колонок для карточек героев: 1–2 героя в ряд, 3–4 по два, больше по три. */
const cols = (n: number) => (n <= 2 ? Math.max(1, n) : n <= 4 ? 2 : 3);
const MEDALS = ['🥇', '🥈', '🥉', '4️⃣'];

function GoalLine({ d, m }: { d: Tv; m: TvMember }) {
  const g = d.goals[m.id];
  if (!g) return <div className="tv-goal muted">🎯 цель недели не выбрана</div>;
  return (
    <div className={`tv-goal ${g.done ? 'done' : ''}`}>
      <span>{g.emoji} {g.title}</span>
      {g.manual ? <b>{g.done ? '✔' : '…'}</b> : <><div className="tv-pts"><div style={{ width: `${Math.min(100, (g.progress / g.target) * 100)}%`, background: g.done ? '#4cae6a' : m.color }} /></div><b>{g.progress}/{g.target}{g.done ? ' ✔' : ''}</b></>}
    </div>
  );
}

/** Обзор: очки героев, MVP, семейные квесты, короткая строка про босса. */
export function OverviewSlide({ d }: { d: Tv }) {
  const left = Math.max(0, d.boss.hp - d.boss.damage);
  return (
    <div className="tv-col">
      <section className="tv-heroes">
        {d.members.map((m) => {
          const pct = Math.min(100, (m.pointsToday / m.superGoal) * 100);
          const bt = d.battles[m.id];
          return (
            <div key={m.id} className="tv-hero" style={{ borderColor: m.color }}>
              <div className="tv-hero-top"><span className="tv-av">{m.emoji}</span><div><b>{m.name}</b><small>уровень {m.level} · {rankFor(m.level, m.xp).rank.emoji} {rankFor(m.level, m.xp).rank.name} · 🏅 {m.badges}</small></div></div>
              <div className="tv-pts"><div style={{ width: `${pct}%`, background: m.color }} /></div>
              <div className="tv-pts-label">{m.pointsToday} / {m.superGoal}{m.pointsToday >= m.goal ? ' ✓' : ''}</div>
              {bt && (
                <div className={`tv-goal ${bt.outcome === 'victory' ? 'done' : ''}`}>
                  <span>{bt.emoji} {bt.horde}: волн {bt.cleared}/3{bt.outcome === 'victory' ? ' 🏆' : ''} · ❤️ {bt.hp}</span>
                  <div className="tv-pts"><div style={{ width: `${(bt.cleared / 3) * 100}%`, background: bt.outcome === 'victory' ? '#4cae6a' : '#c0392b' }} /></div>
                </div>
              )}
              <GoalLine d={d} m={m} />
            </div>
          );
        })}
      </section>
      <MvpRow d={d} />
      {d.familyQuests.length > 0 && (
        <section className="tv-fq">
          {d.familyQuests.map((q) => (
            <div key={q.id} className={`tv-fqi ${q.done ? 'done' : ''}`}>
              <div className="tv-fqt"><span>👨‍👩‍👧‍👦</span><div><b>{q.title}</b>{q.description && <small>{q.description}</small>}</div><em>+{q.xp} каждому</em></div>
              {q.kind === 'points'
                ? <div className="tv-pts"><div style={{ width: `${Math.min(100, (q.progress / q.target) * 100)}%`, background: '#4cae6a' }} /></div>
                : <div className="tv-fqs">{q.done ? '✔ Выполнено!' : q.pending ? '⏳ Ждём подтверждения родителей' : 'Сделайте вместе и скажите родителям'}</div>}
              {q.kind === 'points' && <div className="tv-pts-label">{Math.round(q.progress)} / {q.target}{q.done ? ' ✔' : ''}</div>}
            </div>
          ))}
        </section>
      )}
      <div className="tv-mini-boss">{d.boss.boss.emoji} {d.boss.defeated ? `${d.boss.boss.name} повержен!` : `${d.boss.boss.name}: осталось ${left} из ${d.boss.hp} HP`}
        <div className="tv-hp slim"><div style={{ width: `${d.boss.hp ? (left / d.boss.hp) * 100 : 0}%` }} /></div></div>
    </div>
  );
}

function MvpRow({ d }: { d: Tv }) {
  const y = mName(d, d.mvp.yesterday?.memberId);
  const lead = mName(d, d.mvp.leader?.memberId);
  const top = d.season.top.filter((r) => r.points > 0).slice(0, 3);
  return (
    <section className="tv-mvp-row">
      <div className="tv-mvpi"><span>🏆</span><div><small>MVP вчера</small><b>{y ? `${y.emoji} ${y.name} +1 🎁` : 'не было'}</b></div></div>
      <div className="tv-mvpi"><span>🏆</span><div><small>Сезон {seasonName(d.season.id)} · осталось {d.season.daysLeft} дн.</small><b>{top.length ? top.map((r, i) => { const m = mName(d, r.memberId); return m ? `${MEDALS[i]} ${m.emoji} ${Math.round(r.ratio * 100)}%` : ''; }).join('  ') : 'пока никого'}</b></div></div>
      <div className="tv-mvpi"><span>⚡</span><div><small>Сегодня лидирует</small><b>{lead ? `${lead.emoji} ${lead.name} · ${Math.round(d.mvp.leader!.ratio * 100)}%` : 'пока никого'}</b></div></div>
    </section>
  );
}

/** Герои: крупные портреты в снаряжении и кольцо очков дня. */
export function HeroesSlide({ d }: { d: Tv }) {
  return (
    <div className="tv-col">
      <h1>🧙 Наши герои</h1>
      <section className="tv-portraits">
        {d.members.map((m) => {
          const pct = Math.min(100, (m.pointsToday / m.superGoal) * 100);
          const r = rankFor(m.level, m.xp);
          const done = m.pointsToday >= m.goal;
          return (
            <div key={m.id} className="tv-portrait" style={{ borderColor: m.color }}>
              <div className="tv-fig"><HeroFigure look={m.look} color={m.color} emoji={m.emoji} face={m.face} cls={m.cls} size={190} /></div>
              <b className="tv-pname">{m.name}</b>
              <small>{m.cls ? CLASS_NAMES[m.cls as Cls] : 'класс не выбран'} · уровень {m.level}</small>
              <small>{r.rank.emoji} {r.rank.name}</small>
              <div className="tv-ring" style={{ background: `conic-gradient(${m.color} ${pct * 3.6}deg, #000 0)` }}><span>{m.pointsToday}<small>из {m.superGoal}</small></span></div>
              <small className={done ? 'ok' : ''}>{m.pointsToday >= m.superGoal ? '🌟 максимум дня' : done ? '✅ цель дня выполнена' : `до цели ещё ${m.goal - m.pointsToday}`}</small>
              <GoalLine d={d} m={m} />
            </div>
          );
        })}
      </section>
    </div>
  );
}

/** Босс недели во весь экран и таблица урона героев. */
export function BossSlide({ d }: { d: Tv }) {
  const { boss } = d;
  const hpLeft = Math.max(0, boss.hp - boss.damage);
  const pct = boss.hp ? (hpLeft / boss.hp) * 100 : 0;
  const rows = [...d.members].sort((a, b) => (boss.byMember[b.id] ?? 0) - (boss.byMember[a.id] ?? 0));
  const max = Math.max(1, ...rows.map((m) => boss.byMember[m.id] ?? 0));
  const mvp = d.members.find((m) => m.id === boss.mvp);
  return (
    <div className="tv-bossslide">
      <section className="tv-boss">
        <div className="tv-boss-main">
          <h1>{boss.defeated ? `${boss.boss.name} повержен!` : `Босс недели: ${boss.boss.name}`}</h1>
          <div className="tv-hp" role="progressbar" aria-valuenow={hpLeft} aria-valuemax={boss.hp}><div style={{ width: `${pct}%` }} /><span>{hpLeft} / {boss.hp} HP</span></div>
          <BossScene tv boss={boss.boss} hp={boss.hp} damage={boss.damage} defeated={boss.defeated} party={party(d)} />
          {boss.defeated && mvp && <p className="tv-mvp">⭐ MVP недели: {mvp.emoji} {mvp.name}</p>}
        </div>
      </section>
      <aside className="tv-dmgboard">
        <h2>⚔️ Урон героев</h2>
        {rows.map((m, i) => {
          const v = boss.byMember[m.id] ?? 0;
          return (
            <div key={m.id} className="tv-dmgrow">
              <span>{i === 0 && v > 0 ? '👑' : m.emoji}</span><b>{m.name}</b>
              <div className="tv-pts"><div style={{ width: `${(v / max) * 100}%`, background: m.color }} /></div><em>{v}</em>
            </div>
          );
        })}
        <small className="tv-weak">Слабость босса: {boss.boss.weak.join(', ') || '—'}</small>
      </aside>
    </div>
  );
}

/** Личные бои с ордой: сцена каждого героя. */
export function BattlesSlide({ d }: { d: Tv }) {
  return (
    <div className="tv-col">
      <h1>⚔️ Бои с ордой</h1>
      <section className="tv-battles" style={{ gridTemplateColumns: `repeat(${cols(d.members.length)}, minmax(0, 1fr))` }}>
        {d.members.map((m) => {
          const b = d.battles[m.id];
          if (!b) return null;
          return (
            <div key={m.id} className="tv-battle" style={{ borderColor: m.color }}>
              <BattleScene look={m.look} color={m.color} emoji={m.emoji} face={m.face} name={m.name} live={b.live} cls={m.cls} active={b.active} />
              <div className="tv-battle-info"><b>{m.emoji} {m.name}</b><span>{b.emoji} {b.horde}: волн {b.cleared} из 3{b.outcome === 'victory' ? ' 🏆' : ''}</span><span>❤️ {b.hp}/{b.maxHp}{b.live.streak ? ` · 🔥 ${b.live.streak}` : ''}</span></div>
            </div>
          );
        })}
      </section>
    </div>
  );
}

export function MountainSlide({ d }: { d: Tv }) {
  return (
    <div className="tv-mtn-slide">
      <section className="tv-mountain"><h2>⛰ Восхождение семьи</h2><div className="tv-mountain-box"><MountainClimb tv climbers={climbers(d)} /></div></section>
      <section className="tv-mountain"><h2>🧭 Кто где</h2><ClimbRoster climbers={climbers(d)} /></section>
    </div>
  );
}

/** Рейтинг дня на ТВ: места и из чего набраны очки. */
export function RatingSlide({ d }: { d: Tv }) {
  return (
    <div className="tv-col">
      <h1>📊 Рейтинг дня</h1>
      {d.rating ? <section className="tv-ratingbox"><RatingTable rows={d.rating.rows} tv /></section> : <p className="tv-hint">Нет данных</p>}
      <p className="tv-hint">Место зависит от выполнения личной нормы: очки ÷ норма (не больше двух норм). Первый, выполнивший норму, получает 🏆 MVP дня.</p>
    </div>
  );
}

/** Рейтинг недели на ТВ: места, средняя доля нормы, очки по источникам и по дням. */
export function WeekSlide({ d }: { d: Tv }) {
  return (
    <div className="tv-col">
      <h1>🗓 Рейтинг недели</h1>
      {d.ratingWeek ? <section className="tv-ratingbox"><WeekRatingTable w={d.ratingWeek} tv /></section> : <p className="tv-hint">Нет данных</p>}
    </div>
  );
}

/** Сезон: рейтинг, дни до конца, MVP. */
export function SeasonSlide({ d }: { d: Tv }) {
  const rows = d.season.top.filter((r) => r.points > 0);
  return (
    <div className="tv-col">
      <h1>🏆 Сезон {seasonName(d.season.id)}</h1>
      <div className="tv-season">
        <section className="tv-board">
          {rows.length === 0 && <p className="tv-hint">Пока никто не набрал очков в этом сезоне.</p>}
          {rows.map((r, i) => {
            const m = mName(d, r.memberId);
            if (!m) return null;
            return (
              <div key={r.memberId} className="tv-boardrow" style={{ borderColor: m.color }}>
                <span className="tv-medal">{MEDALS[i]}</span><span className="tv-av">{m.emoji}</span><b>{m.name}</b>
                <div className="tv-pts"><div style={{ width: `${Math.min(100, r.ratio * 100)}%`, background: m.color }} /></div><em>{Math.round(r.ratio * 100)}%</em>
              </div>
            );
          })}
          <small className="tv-hint">Рейтинг считается по выполнению личной нормы: так честно и для старшего, и для младшего.</small>
        </section>
        <div className="tv-days"><span>⏳</span><b>{d.season.daysLeft}</b><small>дн. до конца сезона</small></div>
      </div>
      <MvpRow d={d} />
    </div>
  );
}

/** Квесты дня: нажать на ТВ, родитель подтвердит. */
export function QuestsSlide({ d, mark }: { d: Tv; mark: (memberId: number, index: number) => void }) {
  return (
    <section className="tv-quests" style={{ gridTemplateColumns: `repeat(${Math.min(4, d.members.length)}, minmax(0, 1fr))` }}>
      {d.members.map((m) => {
        const q = d.quests.find((x) => x.memberId === m.id)?.items ?? [];
        return (
          <div key={m.id} className="tv-qcol">
            <h2 style={{ color: m.color }}>{m.emoji} {m.name}</h2>
            {q.map((it) => (
              <button key={it.index} data-tv className={`tv-q ${it.done ? 'done' : it.pending ? 'wait' : ''}`} disabled={!it.manual || it.done} onClick={() => mark(m.id, it.index)}>
                <span className="tv-mark">{it.done ? '✔' : it.pending ? '⏳' : it.manual ? '○' : '⚙'}</span>
                <span className="tv-qt">{it.t}{d.members.length <= 2 && it.desc && <small className="tv-desc">{it.desc}</small>}<small>{it.done ? 'Выполнено' : it.pending ? 'Ждёт родителя' : it.progress ?? it.hint}</small></span><b>+{it.xp}</b>
              </button>
            ))}
          </div>
        );
      })}
      <p className="tv-hint tv-wide">⚙ засчитывается само · ○ нажмите, родитель подтвердит</p>
    </section>
  );
}

/** Запись сделанного прямо с ТВ. */
export function RecordSlide({ d, who, setWho, note, record }: { d: Tv; who: number | null; setWho: (id: number | null) => void; note: string; record: (body: Record<string, unknown>, ok: string) => void }) {
  return (
    <section className="tv-rec">
      <h2>✍️ Записать сделанное</h2>
      <div className="tv-rec-who">
        {d.members.map((m) => (
          <button key={m.id} data-tv className={`tv-who ${who === m.id ? 'on' : ''}`} style={{ borderColor: m.color }} onClick={() => setWho(who === m.id ? null : m.id)}>
            <span>{m.emoji}</span><b>{m.name}</b>
          </button>
        ))}
      </div>
      {note && <div className="tv-note" role="status">{note}</div>}
      {who === null && <p className="tv-hint">Выберите героя, чтобы записать, что он сделал сегодня.</p>}
      {who !== null && (() => {
        const m = d.members.find((x) => x.id === who)!;
        const r = d.record[who]!;
        const mins = [15, 30, 45, 60];
        return (
          <div className="tv-rec-grid">
            <div className="tv-rec-sum">{m.emoji} {m.name} сегодня: <b>{r.points}</b> очков · тренировка {r.workoutMinutes} мин · учёба {r.studyMinutes} мин · зарядка {r.warmup ? '✔' : '—'} · привычки {r.habits.filter((h) => h.checked).length}/{r.habits.length} · добрые дела {r.deeds.filter((x) => x.counted).length}</div>
            <div className="tv-rec-row"><span>🔥 Зарядка</span>
              <button data-tv className={`tv-b ${r.warmup ? 'done' : ''}`} disabled={r.warmup} onClick={() => record({ kind: 'warmup' }, 'Зарядка записана')}>{r.warmup ? '✔ Сделана' : 'Сделал(а) зарядку'}</button></div>
            <div className="tv-rec-row"><span>🏃 Тренировка</span>
              {mins.map((n) => <button key={n} data-tv className="tv-b" onClick={() => record({ kind: 'workout', minutes: n }, `Тренировка +${n} мин`)}>+{n} мин</button>)}</div>
            {STUDY_KINDS.map((k) => (
              <div key={k} className="tv-rec-row"><span>📚 {k}{r.studyByKind[k] ? ` · ${r.studyByKind[k]}` : ''}</span>
                {[15, 30, 45].map((n) => <button key={n} data-tv className="tv-b" onClick={() => record({ kind: 'study', studyKind: k, minutes: n }, `${k} +${n} мин`)}>+{n} мин</button>)}</div>
            ))}
            <div className="tv-rec-row wrap"><span>💛 Добрые дела · {r.deeds.filter((x) => x.counted).length}/{DEED_DAY_CAP}</span>
              {DEEDS.filter((x) => x.id !== 'custom').map((x) => {
                const st = deedStatus(r.deeds, x.id);
                const done = r.deeds.some((j) => j.kind === x.id && j.counted);
                return <button key={x.id} data-tv className={`tv-b ${done ? 'done' : ''}`} disabled={st !== 'ok'} onClick={() => record({ kind: 'deed', deedKind: x.id }, `Доброе дело: ${x.name} (+${x.points})`)}>{done ? '✔ ' : `${x.emoji} `}{x.name}</button>;
              })}
            </div>
            <div className="tv-rec-row"><span>📖 Книга</span>
              <button data-tv className="tv-b" onClick={() => record({ kind: 'book' }, 'Книга прочитана (+50)')}>Прочитал(а) книгу</button></div>
            {r.habits.length > 0 && (
              <div className="tv-rec-row wrap"><span>✅ Привычки</span>
                {r.habits.map((h) => (
                  <button key={h.id} data-tv className={`tv-b ${h.checked ? 'done' : ''}`} disabled={h.checked} onClick={() => record({ kind: 'habit', habitId: h.id }, 'Привычка отмечена')}>{h.checked ? '✔ ' : ''}{h.name}</button>
                ))}</div>
            )}
            <p className="tv-hint">Записи на ТВ нельзя отменить: если ошиблись, скажите родителям.</p>
          </div>
        );
      })()}
    </section>
  );
}
