'use client';
import { useEffect, useState } from 'react';
import { HeroFigure } from '@/components/HeroFigure';
import { APP_EMOJI, APP_NAME } from '@/lib/brand';
import type { FaceConfig } from '@/lib/game/faces';
import { CLASS_NAMES, SUBCLASS_NAMES, type Cls } from '@/lib/game/classes';

interface BookMember {
  id: number; name: string; emoji: string; color: string; face: FaceConfig | null; cls: Cls | null; sub: Cls | null; level: number; xp: number;
  rank: { emoji: string; name: string }; since: string; look: Record<string, string>;
  counts: { bossWins: number; dayMvps: number; deeds: number; books: number; chests: number; seasonWins: number; workoutDays: number; streak: number };
  achievements: { id: string; group: string; name: string; emoji: string; text: string; earnedOn: string }[]; achievementsTotal: number;
}
interface Book { today: string; members: BookMember[]; family: { xp: number; bossesDefeated: number; bossWeeks: number; familyQuestsDone: number; deeds: number } }

const fmt = (d: string) => new Date(d + 'T00:00:00').toLocaleDateString('ru', { day: 'numeric', month: 'long', year: 'numeric' });

/** «Книга достижений»: печатная страница с итогами семьи и каждого героя. */
export default function BookPage() {
  const [b, setB] = useState<Book | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => { fetch('/api/book', { cache: 'no-store' }).then((r) => r.json()).then((j) => { if (j.error) throw new Error(j.error); setB(j); }).catch(() => setErr('Не удалось загрузить книгу. Проверьте связь и обновите страницу.')); }, []);
  if (err) return <p className="bk-warn">{err}</p>;
  if (!b) return <p className="muted">Загрузка…</p>;
  return (
    <div className="book">
      <div className="row between noprint">
        <h1 className="title">📖 Книга достижений</h1>
        <button className="btn" onClick={() => window.print()}>🖨 Распечатать</button>
      </div>
      <p className="muted small noprint">Страница для печати: на каждого героя отдельный лист. В окне печати можно выбрать «Сохранить как PDF».</p>

      <section className="card book-cover">
        <div className="book-brand">{APP_EMOJI}</div>
        <h1 className="book-title">{APP_NAME}</h1>
        <h2>Книга достижений нашей семьи</h2>
        <p className="muted">по состоянию на {fmt(b.today)}</p>
        <ul className="book-family">
          <li><b>{b.members.length}</b><small>героя</small></li>
          <li><b>{b.family.xp}</b><small>очков опыта вместе</small></li>
          <li><b>{b.family.bossesDefeated}</b><small>боссов повержено из {b.family.bossWeeks}</small></li>
          <li><b>{b.family.familyQuestsDone}</b><small>семейных квестов</small></li>
          <li><b>{b.family.deeds}</b><small>добрых дел</small></li>
        </ul>
      </section>

      {b.members.map((m) => (
        <section key={m.id} className="card book-page" style={{ borderColor: m.color }}>
          <div className="book-head">
            <HeroFigure look={m.look} color={m.color} emoji={m.emoji} face={m.face} cls={m.cls} size={120} />
            <div>
              <h2 className="book-name">{m.emoji} {m.name}</h2>
              <p><b>Уровень {m.level}</b> · {m.rank.emoji} {m.rank.name}</p>
              <p>{m.cls ? `${CLASS_NAMES[m.cls]}${m.sub ? ` · ${SUBCLASS_NAMES[m.cls][m.sub]}` : ''}` : 'Класс не выбран'} · опыта {m.xp}</p>
              <p className="muted small">В игре с {fmt(m.since)}</p>
            </div>
          </div>
          <ul className="book-counts">
            <li><b>{m.counts.workoutDays}</b><small>дней с тренировкой</small></li>
            <li><b>{m.counts.books}</b><small>книг прочитано</small></li>
            <li><b>{m.counts.deeds}</b><small>добрых дел</small></li>
            <li><b>{m.counts.streak}</b><small>дней подряд (рекорд)</small></li>
            <li><b>{m.counts.dayMvps}</b><small>раз MVP дня</small></li>
            <li><b>{m.counts.bossWins}</b><small>побед над боссами</small></li>
            <li><b>{m.counts.seasonWins}</b><small>сезонов выиграно</small></li>
            <li><b>{m.counts.chests}</b><small>сундуков открыто</small></li>
          </ul>
          <h3>🏅 Значки: {m.achievements.length} из {m.achievementsTotal}</h3>
          {m.achievements.length === 0 ? <p className="muted">Пока значков нет, всё впереди!</p> : (
            <ul className="book-ach">
              {m.achievements.map((a) => <li key={a.id}><span className="b-ico">{a.emoji}</span><span><b>{a.name}</b><small>{a.text}</small><small className="muted">{fmt(a.earnedOn)}</small></span></li>)}
            </ul>
          )}
        </section>
      ))}
    </div>
  );
}
