'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { speak } from '@/lib/speak';
import { voiceOn } from './KidHome';
import { STUDY_KINDS } from '@/lib/db/schema';
import { WALK } from '@/lib/game/muscles';
import { CUSTOM_DEED, CUSTOM_NOTE_MAX, DEEDS, DEED_CATEGORIES, deedById, deedStatus } from '@/lib/game/deeds';
import { useGame } from './Shell';
import { Chips } from './ui';

type Tab = 'body' | 'mind' | 'kind';
const TABS: { id: Tab; emoji: string; name: string }[] = [{ id: 'body', emoji: '💪', name: 'Тело и здоровье' }, { id: 'mind', emoji: '🧠', name: 'Ум' }, { id: 'kind', emoji: '💛', name: 'Добрые дела' }];

/** Открыть окно записи из любого места: openQuickLog('kind'). */
export const openQuickLog = (tab: Tab = 'body') => window.dispatchEvent(new CustomEvent('quicklog:open', { detail: tab }));

/** Кнопка «Отметить действие» и окно с тремя разделами: тело, ум и добрые дела. */
export function QuickLog() {
  const { s, date } = useGame();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('body');
  // другие страницы открывают окно событием (кнопка «Отметить действие» на «Сегодня»)
  useEffect(() => { const h = (e: Event) => { setTab(((e as CustomEvent).detail as Tab) || 'body'); setOpen(true); }; window.addEventListener('quicklog:open', h); return () => window.removeEventListener('quicklog:open', h); }, []);
  if (!s.detail) return null;
  const d = s.detail;
  const dayLabel = date === s.today ? 'сегодня' : date;
  return (
    <>
      <button className="quick-fab" onClick={() => setOpen(true)} aria-label="Отметить действие"><span aria-hidden>✍️</span><b>Отметить</b></button>
      {open && (
        <div className="modal sheet" onClick={() => setOpen(false)}>
          <div className="card quick" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Отметить действие">
            <div className="row between"><h3>✍️ Отметить действие <small className="muted">за {dayLabel}</small></h3><button className="btn ghost sm" onClick={() => setOpen(false)}>Закрыть</button></div>
            {!s.members.find((m) => m.id === s.me)?.simple && <div className="seg" role="tablist">
              {TABS.map((t) => <button key={t.id} role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}>{t.emoji} {t.name}</button>)}
            </div>}
            {s.members.find((m) => m.id === s.me)?.simple ? <KidSheet tab={tab} setTab={setTab} /> : <>
            <p className="muted small">Сегодня очков: <b>{d.day.points}</b>{d.deeds.day.length ? ` · добрых дел: ${d.deeds.day.filter((x) => x.counted).length}` : ''}</p>
            {tab === 'body' && <BodyTab close={() => setOpen(false)} />}
            {tab === 'mind' && <MindTab close={() => setOpen(false)} />}
            {tab === 'kind' && <KindTab close={() => setOpen(false)} />}
            </>}
          </div>
        </div>
      )}
    </>
  );
}

function BodyTab({ close }: { close: () => void }) {
  const { s, act, toast } = useGame();
  const d = s.detail!;
  const warm = d.day.stats.warmups > 0;
  const walked = d.entries.workouts.filter((w) => w.exercise === WALK.id).reduce((a, w) => a + w.minutes, 0);
  return (
    <div className="quick-body">
      <div className="quick-row">
        <b>🔥 Зарядка</b>
        <button className={`btn ${warm ? '' : 'ghost'}`} disabled={warm} onClick={() => act('recordWarmup').then(() => toast('🔥 Зарядка записана (+10)')).catch(() => {})}>{warm ? '✔ Сделана' : 'Сделал(а) зарядку +10'}</button>
      </div>
      <div className="quick-row col">
        <b>🏃 Тренировка <small className="muted">сегодня: {Math.round(d.day.stats.workoutMinutes)} мин</small></b>
        <Chips values={[10, 15, 30, 45, 60]} onPick={(n) => act('addWorkout', { minutes: n }).then(() => toast(`🏃 Тренировка +${n} мин`)).catch(() => {})} />
      </div>
      <div className="quick-row col">
        <b>🌳 Прогулка <small className="muted">1 очко за 2 мин, до {WALK.dayCap} мин в день{walked ? ` · сегодня ${walked} мин` : ''}</small></b>
        <Chips values={[15, 30, 45, 60, 90]} onPick={(n) => act('addWorkout', { exercise: WALK.id, minutes: n }).then(() => { const pts = Math.round(Math.max(0, Math.min(n, WALK.dayCap - walked)) * WALK.rate); toast(pts > 0 ? `🌳 Прогулка ${n} мин: +${pts} очков` : `🌳 Прогулка записана, но дневной лимит (${WALK.dayCap} мин) уже набран`); }).catch(() => {})} />
      </div>
      <Link className="btn ghost" href="/body" onClick={close}>💪 Упражнения по повторам и мышцы</Link>
    </div>
  );
}

function MindTab({ close }: { close: () => void }) {
  const { s, act, toast } = useGame();
  const d = s.detail!;
  const [kind, setKind] = useState<string>(STUDY_KINDS[0]);
  const [book, setBook] = useState('');
  return (
    <div className="quick-body">
      <div className="quick-row col">
        <b>📚 Учёба</b>
        <div className="row wrapRow">
          {STUDY_KINDS.map((k) => <button key={k} className={`btn sm ${k === kind ? '' : 'ghost'}`} onClick={() => setKind(k)}>{k}{d.day.stats.study[k] ? ` · ${d.day.stats.study[k]}` : ''}</button>)}
        </div>
        <Chips values={[10, 15, 20, 30, 45]} onPick={(n) => act('addStudy', { kind, minutes: n }).then(() => toast(`📚 ${kind} +${n} мин`)).catch(() => {})} />
      </div>
      {d.habits.length > 0 && (
        <div className="quick-row col">
          <b>✅ Привычки <small className="muted">{d.habits.filter((h) => h.checked).length}/{d.habits.length}</small></b>
          <div className="row wrapRow">
            {d.habits.map((h) => <button key={h.id} className={`btn sm ${h.checked ? '' : 'ghost'}`} onClick={() => act('toggleHabit', { habitId: h.id }).catch(() => {})}>{h.checked ? '✔ ' : ''}{h.name}</button>)}
          </div>
        </div>
      )}
      <form className="quick-row col" onSubmit={(e) => { e.preventDefault(); if (book.trim()) act('addBook', { title: book }).then(() => { setBook(''); toast('📖 Книга прочитана (+50)'); }).catch(() => {}); }}>
        <b>📖 Прочитал(а) книгу</b>
        <div className="row"><input className="grow" placeholder="Название книги" value={book} maxLength={80} onChange={(e) => setBook(e.target.value)} /><button className="btn" disabled={!book.trim()}>+50</button></div>
      </form>
      <Link className="btn ghost" href="/mind" onClick={close}>🧠 Схема мозга и привычки</Link>
    </div>
  );
}

function KindTab({ close }: { close: () => void }) {
  const { s, act, toast } = useGame();
  const d = s.detail!;
  const [note, setNote] = useState('');
  const rows = d.deeds.day.map((x) => ({ kind: x.kind }));
  const counted = d.deeds.day.filter((x) => x.counted).length;
  const send = (kind: string, text?: string) => act('addDeed', { kind, note: text }).then((r) => {
    const x = r as { counted: boolean; points: number };
    toast(x.counted ? `💛 Доброе дело! +${x.points} очков` : '💛 Записано, но очков уже не будет: дневной лимит');
    if (kind === CUSTOM_DEED) setNote('');
  }).catch(() => {});
  return (
    <div className="quick-body">
      <p className="muted small">Добрых дел засчитано: <b>{counted} из {d.deeds.cap}</b>. Одно и то же дело приносит очки один раз в день. Родитель может проверить журнал.</p>
      {DEED_CATEGORIES.map((c) => (
        <div key={c.id} className="quick-row col">
          <b>{c.emoji} {c.name}</b>
          <div className="deed-grid">
            {DEEDS.filter((x) => x.cat === c.id && x.id !== CUSTOM_DEED).map((x) => {
              const st = deedStatus(rows, x.id);
              const done = d.deeds.day.some((j) => j.kind === x.id && j.counted);
              return (
                <button key={x.id} className={`deed ${done ? 'done' : ''}`} disabled={st !== 'ok'} onClick={() => send(x.id)} title={x.text}>
                  <span className="de">{x.emoji}</span><b>{x.name}</b><small>{done ? '✔ сегодня' : st === 'cap' ? 'лимит дня' : `+${x.points}`}</small>
                </button>
              );
            })}
          </div>
        </div>
      ))}
      <form className="quick-row col" onSubmit={(e) => { e.preventDefault(); if (note.trim().length >= 3) send(CUSTOM_DEED, note); }}>
        <b>{deedById(CUSTOM_DEED)!.emoji} Своё доброе дело</b>
        <div className="row"><input className="grow" placeholder="Что вы сделали?" value={note} maxLength={CUSTOM_NOTE_MAX} onChange={(e) => setNote(e.target.value)} /><button className="btn" disabled={note.trim().length < 3 || deedStatus(rows, CUSTOM_DEED) !== 'ok'}>+8</button></div>
      </form>
      <Link className="btn ghost" href="/deeds" onClick={close}>💛 Моя доброта: журнал и успехи</Link>
    </div>
  );
}

/** Окно записи для режима «Малыш»: крупные картинки-кнопки, один шаг на действие, похвала голосом. */
function KidSheet({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const { s, act, toast } = useGame();
  const d = s.detail!;
  const praise = (text: string) => { toast(`🌟 Молодец! ${text}`); try { if (voiceOn()) speak('Молодец!'); } catch { /* голос не обязателен */ } };
  const run = (action: string, args: Record<string, unknown>, text: string) => act(action, args).then(() => praise(text)).catch(() => {});
  const warm = d.day.stats.warmups > 0;
  const rows = d.deeds.day.map((x) => ({ kind: x.kind }));
  const study = (kind: string, minutes: number) => run('addStudy', { kind, minutes }, `${kind} ${minutes} минут`);
  const KID_DEEDS = ['tidy', 'dishes', 'table', 'sibling', 'hug', 'share', 'pet', 'plant', 'thanks'];
  const tabs: { id: Tab; emoji: string; name: string }[] = [{ id: 'body', emoji: '💪', name: 'Тело' }, { id: 'mind', emoji: '🧠', name: 'Ум' }, { id: 'kind', emoji: '💛', name: 'Добро' }];
  return (
    <div className="kid-sheet">
      <div className="kid-tabs">{tabs.map((t) => <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)}><span>{t.emoji}</span>{t.name}</button>)}</div>
      {tab === 'body' && (
        <div className="kid-pick">
          <button disabled={warm} className={warm ? 'done' : ''} onClick={() => run('recordWarmup', {}, 'Зарядка!')}><span>🔥</span>{warm ? '✔ Зарядка' : 'Зарядка'}</button>
          <button onClick={() => run('addWorkout', { exercise: WALK.id, minutes: 30 }, 'Прогулка 30 минут')}><span>🌳</span>Прогулка<small>30 минут</small></button>
          <button onClick={() => run('addWorkout', { exercise: WALK.id, minutes: 60 }, 'Прогулка час')}><span>🚶</span>Долгая прогулка<small>1 час</small></button>
          <button onClick={() => run('addWorkout', { minutes: 15 }, 'Побегал 15 минут')}><span>🏃</span>Побегал<small>15 минут</small></button>
          <button onClick={() => run('addWorkout', { minutes: 30 }, 'Тренировка 30 минут')}><span>💪</span>Тренировка<small>30 минут</small></button>
        </div>
      )}
      {tab === 'mind' && (
        <div className="kid-pick">
          <button onClick={() => study('Книги', 15)}><span>📖</span>Читал<small>15 минут</small></button>
          <button onClick={() => study('Учёба', 15)}><span>🎓</span>Учился<small>15 минут</small></button>
          <button onClick={() => study('Творчество', 15)}><span>🎨</span>Рисовал, лепил<small>15 минут</small></button>
          <button onClick={() => study('Мышление', 15)}><span>🧩</span>Головоломки<small>15 минут</small></button>
          <button onClick={() => study('Языки', 15)}><span>🗣</span>Слова на языке<small>15 минут</small></button>
          {d.habits.map((h) => <button key={h.id} className={h.checked ? 'done' : ''} onClick={() => act('toggleHabit', { habitId: h.id }).then(() => !h.checked && praise(h.name)).catch(() => {})}><span>{h.checked ? '✅' : '⬜'}</span>{h.name}</button>)}
        </div>
      )}
      {tab === 'kind' && (
        <div className="kid-pick">
          {KID_DEEDS.map((id) => {
            const def = deedById(id)!;
            const st = deedStatus(rows, id);
            const done = d.deeds.day.some((j) => j.kind === id && j.counted);
            return <button key={id} disabled={st !== 'ok'} className={done ? 'done' : ''} onClick={() => run('addDeed', { kind: id }, def.name)}><span>{def.emoji}</span>{def.name}<small>{done ? '✔ сегодня' : st === 'cap' ? 'на сегодня хватит' : `+${def.points}`}</small></button>;
          })}
        </div>
      )}
    </div>
  );
}
