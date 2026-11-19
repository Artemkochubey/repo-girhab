'use client';
import { useState } from 'react';
import { questHint, questProgress, type QuestItem } from '@/lib/game/quests';
import { QuestEditor } from './QuestEditor';
import { useGame } from './Shell';
import { Section } from './ui';

export function Quests() {
  const { s, act } = useGame();
  const d = s.detail!;
  return (
    <ul className="quests">
      {d.day.quests.map((q, i) => {
        const manual = q.k === 'manual';
        const state = q.completed ? 'done' : q.pending ? 'wait' : 'open';
        const pr = questProgress(q as QuestItem, d.day.stats);
        return (
          <li key={i} className={state}>
            <button className="mark" disabled={!manual} onClick={() => act('markQuest', { index: i })}
              aria-label={manual ? 'Отметить' : 'Засчитывается автоматически'}>
              {q.completed ? '✔' : q.pending ? '⏳' : manual ? '○' : '⚙'}
            </button>
            <span className="qt">
              {q.t}
              {q.d && <small className="desc">{q.d}</small>}
              <small className="hint">
                {q.completed ? 'Выполнено' : q.pending ? 'Ждёт подтверждения родителя' : questHint(q as QuestItem)}
                {pr && !q.completed ? ` · сейчас ${Math.min(pr.have, pr.need)}/${pr.need}${pr.unit ? ' ' + pr.unit : ''}` : ''}
              </small>
            </span>
            <b className="xp">+{q.xp}</b>
            {q.pending && s.parent && (
              <span className="row">
                <button className="btn" onClick={() => act('confirmQuest', { index: i })}>Подтвердить</button>
                <button className="btn ghost" onClick={() => act('confirmQuest', { index: i, approve: false })}>Отклонить</button>
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

/** Секция «Квесты дня» с кнопкой редактирования (редактор — за PIN родителя). */
export function QuestsBlock() {
  const { s, askPin } = useGame();
  const [edit, setEdit] = useState(false);
  return (
    <Section title="⚔️ Квесты дня" right={
      <button className="btn ghost" onClick={() => (s.parent ? setEdit(!edit) : askPin())}>
        {edit ? 'Готово' : s.parent ? '✏️ Изменить' : '🔒 Изменить'}
      </button>}>
      <Quests />
      {edit && s.parent && s.admin && s.me && <QuestEditor key={s.me} memberId={s.me} onSaved={() => setEdit(false)} />}
      <p className="muted small">⚙ — засчитывается само, когда вы записали нужное. ○ — отметьте вручную, родитель подтвердит.</p>
    </Section>
  );
}
