'use client';
import { useState } from 'react';
import { useGame } from '@/components/Shell';
import { Chips, Section } from '@/components/ui';
import { STUDY_KINDS } from '@/lib/db/schema';
import { HABIT_CATALOG } from '@/lib/game/habits';

export default function Mind() {
  const { s, act, date } = useGame();
  const d = s.detail!;
  const [kind, setKind] = useState<string>(STUDY_KINDS[0]);
  const [habit, setHabit] = useState('');
  const [book, setBook] = useState('');
  const have = new Set(d.habits.map((h) => h.name));

  return (
    <>
      <h1 className="title">🧠 Ум</h1>
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
        <details><summary>Каталог привычек</summary>
          <div className="row wrapRow">
            {HABIT_CATALOG.filter((h) => !have.has(h)).map((h) => <button key={h} className="btn ghost" onClick={() => act('addHabit', { name: h })}>＋ {h}</button>)}
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
