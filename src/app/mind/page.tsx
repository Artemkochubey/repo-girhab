'use client';
import { useMemo, useState } from 'react';
import { BrainFigure, BrainLegend } from '@/components/BrainFigure';
import { useGame } from '@/components/Shell';
import { Chips, Section } from '@/components/ui';
import { STUDY_KINDS } from '@/lib/db/schema';
import { addDays } from '@/lib/date';
import { BRAIN_REGIONS, brainIntensity, brainLoads, brainOverall, type RegionId } from '@/lib/game/brain';
import { HABIT_CATALOG, HABIT_GROUPS } from '@/lib/game/habits';

const RANGES = [{ id: 'day', label: 'Сегодня', days: 1 }, { id: 'week', label: '7 дней', days: 7 }, { id: 'month', label: '30 дней', days: 30 }] as const;

export default function Mind() {
  const { s, act, date } = useGame();
  const d = s.detail!;
  const [kind, setKind] = useState<string>(STUDY_KINDS[0]);
  const [range, setRange] = useState<(typeof RANGES)[number]['id']>('week');
  const [hover, setHover] = useState<RegionId | null>(null);
  const [picked, setPicked] = useState<RegionId | null>(null);
  const days = RANGES.find((r) => r.id === range)!.days;
  const loads = useMemo(() => brainLoads(d.mindLog, addDays(s.today, -(days - 1)), s.today), [d.mindLog, s.today, days]);
  const intensity = useMemo(() => brainIntensity(loads, days), [loads, days]);
  const overall = brainOverall(loads, days);
  const topRegions = BRAIN_REGIONS.map((r) => ({ ...r, load: loads[r.id], t: intensity[r.id] })).filter((r) => r.load > 0).sort((a, b) => b.load - a.load);
  const info = BRAIN_REGIONS.find((r) => r.id === (hover ?? picked));
  const pick = (id: RegionId) => { setPicked(id); const k = BRAIN_REGIONS.find((r) => r.id === id)!.kind; if (k) setKind(k); };
  const [habit, setHabit] = useState('');
  const [book, setBook] = useState('');
  const have = new Set(d.habits.map((h) => h.name));
  const [q, setQ] = useState('');
  const [group, setGroup] = useState<string>(HABIT_GROUPS[0].title);
  const [catOpen, setCatOpen] = useState(false);
  const catalogShown = (q.trim() ? HABIT_CATALOG.filter((h) => h.toLowerCase().includes(q.trim().toLowerCase())) : HABIT_GROUPS.find((g) => g.title === group)!.items).filter((h) => !have.has(h));

  return (
    <>
      <h1 className="title">🧠 Ум</h1>
      <Section title="🧠 Развитие ума" right={<div className="row">{RANGES.map((r) => <button key={r.id} className={`btn ${range === r.id ? '' : 'ghost'} sm`} onClick={() => setRange(r.id)}>{r.label}</button>)}</div>}>
        <div className="brain-wrap">
          <BrainFigure intensity={intensity} overall={overall} hover={hover} onHover={setHover} onPick={pick} />
          <BrainLegend />
          <div className="brain-stat">Яркость мозга: <b>{Math.round(overall * 100)}%</b></div>
          <p className="muscle-info" aria-live="polite">
            {info ? <><b>{info.name}</b> · {info.sphere}: {info.text}{loads[info.id] > 0 ? ` · развитие за период: ${Math.round(loads[info.id])}` : ''}{info.kind ? ' · выбрано для записи ниже' : ''}</> : 'Нажмите на область мозга, чтобы выбрать, что развиваете'}
          </p>
        </div>
        {topRegions.length > 0
          ? <ul className="regions">{topRegions.map((r) => <li key={r.id}><span>{r.name} <small className="muted">· {r.sphere}</small></span><i style={{ width: `${Math.max(6, Math.round(r.t * 100))}%` }} /></li>)}</ul>
          : <p className="muted small">За этот период развития нет. Запишите учёбу, книгу или привычки, и области мозга начнут светиться голубым.</p>}
        <p className="muted small">Упрощённая схема: каждая область связана со своей сферой (мышление, учёба, языки, книги, навыки, творчество, привычки). Чем больше вы занимаетесь, тем ярче она светится.</p>
      </Section>

      <Section title="Учёба">
        <div className="row wrapRow">
          {STUDY_KINDS.map((k) => (
            <button key={k} className={`btn ${k === kind ? '' : 'ghost'}`} onClick={() => setKind(k)}>{k}{d.day.stats.study[k] ? ` · ${d.day.stats.study[k]}` : ''}</button>
          ))}
        </div>
        <Chips values={[10, 15, 20, 30, 45]} onPick={(n) => act('addStudy', { kind, minutes: n })} />
        <ul className="list">
          {d.entries.study.map((e) => (
            <li key={e.id}>📚 {e.kind}: {e.minutes} мин {s.parent && <button className="x" onClick={() => act('deleteEntry', { type: 'study', id: e.id })}>✕</button>}</li>
          ))}
        </ul>
      </Section>

      <Section title="Привычки" right={<span className="muted">до 6 в день засчитываются</span>}>
        <ul className="list">
          {d.habits.map((h) => (
            <li key={h.id}>
              <button className={`mark ${h.checked ? 'on' : ''}`} onClick={() => act('toggleHabit', { habitId: h.id })}>{h.checked ? '✔' : '○'}</button> {h.name}
              <button className="x" onClick={() => act('archiveHabit', { habitId: h.id })} title="Убрать привычку">✕</button>
            </li>
          ))}
        </ul>
        <details open={catOpen} onToggle={(e) => setCatOpen((e.target as HTMLDetailsElement).open)}>
          <summary>Каталог привычек ({HABIT_CATALOG.filter((h) => !have.has(h)).length} можно добавить)</summary>
          <input className="catsearch" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Найти привычку…" aria-label="Поиск по каталогу привычек" />
          {!q.trim() && (
            <div className="row wrapRow" role="tablist">
              {HABIT_GROUPS.map((g) => <button key={g.title} role="tab" aria-selected={g.title === group} className={`btn ${g.title === group ? '' : 'ghost'} sm`} onClick={() => setGroup(g.title)}>{g.title}</button>)}
            </div>
          )}
          <div className="row wrapRow">
            {catalogShown.length === 0 && <p className="muted small">{q.trim() ? 'Ничего не найдено: добавьте свою привычку ниже.' : 'Все привычки этой группы уже добавлены.'}</p>}
            {catalogShown.map((h) => <button key={h} className="btn ghost" onClick={() => act('addHabit', { name: h })}>＋ {h}</button>)}
          </div>
        </details>
        <form className="row" onSubmit={(e) => { e.preventDefault(); if (habit.trim()) { act('addHabit', { name: habit }); setHabit(''); } }}>
          <input value={habit} onChange={(e) => setHabit(e.target.value)} placeholder="Своя привычка" maxLength={60} />
          <button className="btn">Добавить</button>
        </form>
      </Section>

      <Section title="Книги (+50 за прочитанную)">
        <form className="row" onSubmit={(e) => { e.preventDefault(); if (book.trim()) { act('addBook', { title: book, date }).then(() => setBook('')).catch(() => {}); } }}>
          <input value={book} onChange={(e) => setBook(e.target.value)} placeholder="Название книги" maxLength={120} />
          <button className="btn">Прочитал(а)</button>
        </form>
        <ul className="list">
          {d.entries.books.map((b) => (
            <li key={b.id}>📖 {b.title} {s.parent && <button className="x" onClick={() => act('deleteEntry', { type: 'book', id: b.id })}>✕</button>}</li>
          ))}
        </ul>
      </Section>
    </>
  );
}
