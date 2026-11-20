'use client';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useGame } from './Shell';

/** С какого уровня подсказки для новичков скрываются сами. */
export const HINT_UNTIL_LEVEL = 5;
const PREFIX = 'mr_hint:';

const read = (k: string) => { try { return localStorage.getItem(PREFIX + k) === '1'; } catch { return false; } };
const write = (k: string, on: boolean) => { try { if (on) localStorage.setItem(PREFIX + k, '1'); else localStorage.removeItem(PREFIX + k); } catch { /* без хранилища подсказка просто покажется снова */ } };

/** Вернуть все скрытые подсказки (кнопка на странице «Ещё»). */
export function resetHints() {
  try { Object.keys(localStorage).filter((k) => k.startsWith(PREFIX)).forEach((k) => localStorage.removeItem(k)); } catch { /* ignore */ }
}

/** Скрыта ли подсказка этим героем на этом устройстве. */
function useDismissed(id: string): [boolean, () => void] {
  const { s } = useGame();
  const key = `${s.me}:${id}`;
  const [hidden, setHidden] = useState(true); // до чтения хранилища не показываем, чтобы не мигало
  useEffect(() => { setHidden(read(key)); }, [key]);
  const hide = useCallback(() => { write(key, true); setHidden(true); }, [key]);
  return [hidden, hide];
}

/** Короткая подсказка для новичка: исчезает по кнопке «Понятно» и сама после 5 уровня. */
export function Hint({ id, children, more }: { id: string; children: React.ReactNode; more?: string }) {
  const { s } = useGame();
  const [hidden, hide] = useDismissed(id);
  const level = s.detail?.level ?? 1;
  if (hidden || level >= HINT_UNTIL_LEVEL || s.parent) return null;
  return (
    <aside className="hint-card" role="note">
      <span className="hint-ico" aria-hidden>💡</span>
      <div className="hint-text">
        {children}
        {more && <> <Link href={more}>Подробнее в правилах</Link></>}
      </div>
      <button className="btn ghost sm" onClick={hide}>Понятно</button>
    </aside>
  );
}

/** «Первые шаги»: список из четырёх дел, галочки ставятся сами по состоянию игры. */
export function FirstSteps() {
  const { s } = useGame();
  const [hidden, hide] = useDismissed('steps');
  const d = s.detail!;
  const steps = [
    { done: d.xp > 0, text: 'Запишите первое занятие', hint: 'кнопка «✍️ Отметить» справа внизу: тело, ум или доброе дело' },
    { done: !!d.hero.cls, text: 'Выберите класс', hint: 'вкладка «Герой»' },
    { done: d.hero.talents.length > 0, text: 'Возьмите первый талант', hint: 'очко таланта даётся за новый уровень' },
    { done: d.chests.opened > 0, text: 'Откройте первый сундук', hint: 'вкладка «Добыча»' },
  ];
  const left = steps.filter((x) => !x.done).length;
  if (hidden || s.parent || d.level >= HINT_UNTIL_LEVEL || left === 0) return null;
  return (
    <section className="card steps">
      <div className="row between"><h2>🧭 Первые шаги</h2><span className="muted">{steps.length - left} из {steps.length}</span></div>
      <ul className="list">
        {steps.map((x) => (
          <li key={x.text} className={x.done ? 'step-done' : ''}>
            <span className="step-mark">{x.done ? '✔' : '○'}</span> <b>{x.text}</b> <small className="muted">({x.hint})</small>
          </li>
        ))}
      </ul>
      <p className="muted small">Очки за занятия дают минуты развлечений, опыт героя и урон врагам. <Link href="/rules">Все правила</Link></p>
      <button className="btn ghost sm" onClick={hide}>Скрыть</button>
    </section>
  );
}
