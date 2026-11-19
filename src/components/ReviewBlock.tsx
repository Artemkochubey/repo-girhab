'use client';
import { exerciseById } from '@/lib/game/muscles';
import { useGame } from './Shell';
import { Section } from './ui';

/** Настройки: дни с меткой «🔎 проверить». Ничего не блокируется, родитель решает: всё в порядке или удалить запись. */
export function ReviewBlock() {
  const { s, act, toast } = useGame();
  const list = s.admin!.review;
  const who = (id: number) => s.members.find((m) => m.id === id);
  const label = (e: { exercise: string | null; reps: number | null; minutes: number; eq: number }) => {
    const x = exerciseById(e.exercise);
    return `${x ? `${x.emoji} ${x.name}` : '🏃 Тренировка'} · ${e.reps ? `${e.reps} раз · +${Math.round(e.eq * 10) / 10} оч.` : `${e.minutes} мин`}`;
  };
  return (
    <Section title={`🔎 Проверить (${list.length})`}>
      {list.length === 0 && <p className="muted">Необычных дней за последнюю неделю нет.</p>}
      {list.map((f) => {
        const m = who(f.memberId);
        return (
          <div key={`${f.memberId}-${f.date}`} className="card review">
            <div className="row between wrapRow"><b>{m?.emoji} {m?.name} · {f.date}</b><span className="muted">{f.points} оч. за день</span></div>
            <ul className="list">{f.reasons.map((r) => <li key={r}>🔎 {r}</li>)}</ul>
            {f.entries.length > 0 && (
              <ul className="list small">
                {f.entries.map((e) => (
                  <li key={e.id}>{label(e)} <button className="x" aria-label="Удалить запись" onClick={() => act('deleteEntry', { type: 'workout', id: e.id }).then(() => toast('Запись удалена')).catch(() => {})}>✕</button></li>
                ))}
              </ul>
            )}
            <button className="btn" onClick={() => act('reviewOk', { memberId: f.memberId, date: f.date }).then(() => toast('Отмечено: всё в порядке')).catch(() => {})}>✔ Всё в порядке</button>
          </div>
        );
      })}
      <p className="muted small">Метка ничего не блокирует и очки не режет: она только подсказывает, на какие дни стоит посмотреть (день сильно выше обычного, подход близок к максимуму, очень много подходов, очень длинная тренировка). После «Всё в порядке» метка исчезает, пока очки дня заметно не вырастут. Дети видят у такого дня значок 🔎 в истории тренировок.</p>
    </Section>
  );
}
