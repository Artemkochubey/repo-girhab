'use client';
import { useGame } from './Shell';
import { Bar, Section } from './ui';

/** Общие квесты семьи: опыт получают все участники. */
export function FamilyQuests() {
  const { s, act } = useGame();
  if (!s.familyQuests.length) return null;
  return (
    <Section title="👨‍👩‍👧‍👦 Семейные квесты">
      <div className="fqs">
        {s.familyQuests.map((q) => (
          <div key={q.id} className={`fq ${q.done ? 'done' : q.pending ? 'wait' : ''}`}>
            <div className="row between wrapRow">
              <b>{q.title}</b>
              <span className="muted small">{q.period === 'week' ? 'на неделю' : 'на сегодня'} · <b className="gold">+{q.xp} каждому</b></span>
            </div>
            {q.description && <span className="desc">{q.description}</span>}
            {q.kind === 'points' ? (
              <>
                <Bar value={Math.min(q.progress, q.target)} max={q.target} color="var(--ok)" label={`${Math.round(q.progress)} / ${q.target}`} />
                <span className="muted small">Вся семья вместе набирает очки активности (тренировки, учёба, привычки, книги). {q.done ? '✔ Цель достигнута!' : ''}</span>
              </>
            ) : q.done ? (
              <span className="st done">✔ Выполнено: опыт получили все</span>
            ) : q.pending ? (
              <div className="row wrapRow">
                <span className="st pending">⏳ Ждёт подтверждения родителя</span>
                {s.parent
                  ? <><button className="btn" onClick={() => act('completeFamilyQuest', { id: q.id })}>Подтвердить</button><button className="btn ghost" onClick={() => act('markFamilyQuest', { id: q.id })}>Вернуть</button></>
                  : <button className="btn ghost" onClick={() => act('markFamilyQuest', { id: q.id })}>Отозвать</button>}
              </div>
            ) : (
              <div className="row wrapRow">
                <button className="btn" onClick={() => act('markFamilyQuest', { id: q.id })}>✔ Мы сделали!</button>
                {s.parent && <button className="btn ghost" onClick={() => act('completeFamilyQuest', { id: q.id })}>Засчитать сразу</button>}
              </div>
            )}
          </div>
        ))}
      </div>
    </Section>
  );
}
