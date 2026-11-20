'use client';
import { useState } from 'react';
import type { TaskDefDto } from '@/lib/client';
import { GRANT_CHESTS_MAX, TASKS_ACTIVE_MAX, TASK_CHESTS_MAX, TASK_POINTS_MAX, TASK_TITLE_MAX, WEEKDAYS } from '@/lib/game/tasks';
import { useGame } from './Shell';
import { Section } from './ui';

const EMOJI = ['📚', '🎒', '🧹', '🛏', '🦷', '🐕', '🎹', '🍽', '🌱', '📌'];
const ORDER = [1, 2, 3, 4, 5, 6, 0];   // с понедельника
const empty = { id: 0, title: '', emoji: '📌', repeat: 'daily' as 'daily' | 'weekdays' | 'once', days: [1, 2, 3, 4, 5] as number[], date: '', points: '10', chests: 0, needConfirm: false };

/** Настройки родителя: задачи героев и награды за них. Только родитель создаёт и меняет задачи. */
export function TaskAdmin() {
  const { s, act, toast } = useGame();
  const a = s.admin!;
  const [who, setWho] = useState<number>(s.members[0]?.id ?? 0);
  const [f, setF] = useState(empty);
  const list: TaskDefDto[] = a.tasks[who] ?? [];
  const name = (id: number) => s.members.find((m) => m.id === id);
  const valid = f.title.trim() && (f.repeat !== 'weekdays' || f.days.length) && Number(f.points || 0) <= TASK_POINTS_MAX;
  const save = () => act('saveTask', {
    memberId: who, id: f.id || undefined, title: f.title, emoji: f.emoji, repeat: f.repeat, days: f.repeat === 'weekdays' ? f.days : undefined,
    date: f.repeat === 'once' ? f.date || s.today : undefined, points: Number(f.points || 0), chests: f.chests, needConfirm: f.needConfirm,
  }).then(() => { setF(empty); toast(f.id ? 'Задача обновлена' : 'Задача добавлена'); }).catch(() => {});
  const edit = (t: TaskDefDto) => setF({ id: t.id, title: t.title, emoji: t.emoji, repeat: t.repeat, days: t.days.length ? t.days : [1, 2, 3, 4, 5], date: t.date ?? '', points: String(t.points), chests: t.chests, needConfirm: t.needConfirm });

  return (
    <Section title="📌 Мои задачи на день">
      <p className="muted small">Личный список дел героя. Задачи и награды за них задаёте только вы, герой лишь отмечает выполнение. Награда не обязательна: можно оставить 0 очков. Задача с сундуком всегда ждёт вашего подтверждения.</p>
      <div className="row wrapRow">
        {s.members.map((m) => <button key={m.id} className={`btn sm ${who === m.id ? '' : 'ghost'}`} onClick={() => { setWho(m.id); setF(empty); }}>{m.emoji} {m.name} <small>{(a.tasks[m.id] ?? []).length}</small></button>)}
      </div>
      {list.length === 0 && <p className="muted">У героя пока нет задач.</p>}
      <ul className="list">
        {list.map((t) => (
          <li key={t.id} className="wrapRow">
            <span className="grow">{t.emoji} <b>{t.title}</b> <small className="muted">· {t.label}{t.points ? ` · +${t.points}` : ''}{t.chests ? ` · 🎁×${t.chests}` : ''}{t.confirm ? ' · с проверкой' : ''}</small></span>
            <button className="btn ghost sm" onClick={() => edit(t)}>✏️</button>
            <button className="btn ghost sm" onClick={() => act('archiveTask', { id: t.id }).then(() => toast('Задача убрана')).catch(() => {})}>🗑</button>
          </li>
        ))}
      </ul>

      <h3>{f.id ? '✏️ Изменить задачу' : '➕ Новая задача'} для {name(who)?.name}</h3>
      <div className="grid2">
        <label>Что сделать<input value={f.title} maxLength={TASK_TITLE_MAX} onChange={(e) => setF({ ...f, title: e.target.value })} placeholder="Собрать рюкзак" /></label>
        <label>Как часто
          <select value={f.repeat} onChange={(e) => setF({ ...f, repeat: e.target.value as typeof f.repeat })}>
            <option value="daily">Каждый день</option><option value="weekdays">По дням недели</option><option value="once">Один раз</option>
          </select>
        </label>
        {f.repeat === 'once' && <label>Дата<input type="date" value={f.date || s.today} onChange={(e) => setF({ ...f, date: e.target.value })} /></label>}
        <label>Очки за задачу (0–{TASK_POINTS_MAX})<input className="num" inputMode="numeric" value={f.points} onChange={(e) => setF({ ...f, points: e.target.value.replace(/\D/g, '').slice(0, 2) })} /></label>
        <label>Сундуки за задачу
          <select value={f.chests} onChange={(e) => setF({ ...f, chests: Number(e.target.value) })}>
            {Array.from({ length: TASK_CHESTS_MAX + 1 }, (_, i) => <option key={i} value={i}>{i === 0 ? 'нет' : `🎁 ${i}`}</option>)}
          </select>
        </label>
      </div>
      {f.repeat === 'weekdays' && (
        <div className="row wrapRow" role="group" aria-label="Дни недели">
          {ORDER.map((d) => <button key={d} className={`btn sm ${f.days.includes(d) ? '' : 'ghost'}`} aria-pressed={f.days.includes(d)}
            onClick={() => setF({ ...f, days: f.days.includes(d) ? f.days.filter((x) => x !== d) : [...f.days, d] })}>{WEEKDAYS[d]}</button>)}
        </div>
      )}
      <div className="row wrapRow">{EMOJI.map((e) => <button key={e} className={`btn sm ${f.emoji === e ? '' : 'ghost'}`} onClick={() => setF({ ...f, emoji: e })}>{e}</button>)}</div>
      <label className="row"><input type="checkbox" checked={f.needConfirm || f.chests > 0} disabled={f.chests > 0} onChange={(e) => setF({ ...f, needConfirm: e.target.checked })} /> Сначала проверяю я (награда после подтверждения)</label>
      <div className="row wrapRow">
        <button className="btn" disabled={!valid || (!f.id && list.length >= TASKS_ACTIVE_MAX)} onClick={save}>{f.id ? '💾 Сохранить' : '➕ Добавить'}</button>
        {f.id > 0 && <button className="btn ghost" onClick={() => setF(empty)}>Отмена</button>}
        {list.length >= TASKS_ACTIVE_MAX && !f.id && <small className="muted">Не больше {TASKS_ACTIVE_MAX} задач на героя.</small>}
      </div>
    </Section>
  );
}

/** Выдача сундуков вручную: любому герою, в том числе родителям. */
export function GrantChest() {
  const { s, act, toast } = useGame();
  const a = s.admin!;
  const [who, setWho] = useState<number>(s.members[0]?.id ?? 0);
  const [count, setCount] = useState(1);
  const [reason, setReason] = useState('');
  const name = (id: number) => s.members.find((m) => m.id === id);
  const grant = () => act('grantChest', { memberId: who, count, reason }).then(() => { setReason(''); toast(`Выдано: ${name(who)?.name} получает 🎁×${count}`); }).catch(() => {});
  return (
    <Section title="🎁 Выдать сундук">
      <p className="muted small">Награда вне игры: за помощь, хорошую оценку, подарок. Сундук сразу появится у героя на вкладке «Добыча». Выдать можно и родителю.</p>
      <div className="row wrapRow">
        {s.members.map((m) => <button key={m.id} className={`btn sm ${who === m.id ? '' : 'ghost'}`} aria-pressed={who === m.id} onClick={() => setWho(m.id)}>{m.emoji} {m.name}{m.isParent ? ' 👑' : ''}</button>)}
      </div>
      <div className="grid2">
        <label>Сколько (1–{GRANT_CHESTS_MAX})
          <select value={count} onChange={(e) => setCount(Number(e.target.value))}>{Array.from({ length: GRANT_CHESTS_MAX }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}</select>
        </label>
        <label>За что (необязательно)<input value={reason} maxLength={60} onChange={(e) => setReason(e.target.value)} placeholder="Помог с переездом" /></label>
      </div>
      <button className="btn" onClick={grant}>🎁 Выдать {name(who)?.name}</button>
      {a.grants.length > 0 && (
        <>
          <h3>Последние выдачи</h3>
          <ul className="list">
            {a.grants.map((g) => (
              <li key={g.id} className="wrapRow">
                <span className="grow">{name(g.memberId)?.emoji} {name(g.memberId)?.name}: 🎁×{g.count} <small className="muted">· {g.date}{g.reason ? ` · ${g.reason}` : ''}</small></span>
                <button className="btn ghost sm" onClick={() => act('deleteChestGrant', { id: g.id }).then(() => toast('Выдача отменена')).catch(() => {})}>Отменить</button>
              </li>
            ))}
          </ul>
          <p className="muted small">Отменить можно, пока эти сундуки не открыты.</p>
        </>
      )}
    </Section>
  );
}
