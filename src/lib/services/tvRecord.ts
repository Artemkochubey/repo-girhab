import { eq } from 'drizzle-orm';
import type { Db } from '../db/client';
import * as s from '../db/schema';
import { HttpError, runAction } from './actions';

export const TV_MINUTES = [15, 30, 45, 60] as const;
export type TvRecordInput = { memberId: unknown; kind: unknown; minutes?: unknown; studyKind?: unknown; habitId?: unknown };

/**
 * Запись сделанного с ТВ (без входа). Права как у ребёнка: только себе, только за сегодня, без отмены записей.
 * Допускаются лишь готовые значения (15/30/45/60 минут), чтобы нельзя было нажать «600 минут».
 */
export function tvRecord(db: Db, input: TvRecordInput, now = new Date()): unknown {
  const memberId = input.memberId;
  if (typeof memberId !== 'number' || !db.select().from(s.member).where(eq(s.member.id, memberId)).get()) throw new HttpError(404, 'Нет такого участника');
  const ctx = { memberId, parent: false, now };
  const minutes = (): number => {
    if (!(TV_MINUTES as readonly unknown[]).includes(input.minutes)) throw new HttpError(400, 'Минуты: 15, 30, 45 или 60');
    return input.minutes as number;
  };
  switch (input.kind) {
    case 'warmup': return runAction(db, ctx, 'recordWarmup', {});
    case 'workout': return runAction(db, ctx, 'addWorkout', { minutes: minutes() });
    case 'study': return runAction(db, ctx, 'addStudy', { kind: input.studyKind, minutes: minutes() });
    case 'habit': return runAction(db, ctx, 'recordHabit', { habitId: input.habitId });
    case 'book': {
      // у книги нужно название: на ТВ печатать неудобно, поэтому нумеруем «Прочитанная книга №N»
      const n = db.select().from(s.book).where(eq(s.book.memberId, memberId)).all().length;
      for (let i = 1; i <= 5; i++) {
        try { return runAction(db, ctx, 'addBook', { title: `Прочитанная книга №${n + i}` }); }
        catch (e) { if (!(e instanceof HttpError && e.status === 409)) throw e; }
      }
      throw new HttpError(409, 'Не удалось записать книгу');
    }
    default: throw new HttpError(400, 'Неизвестное действие');
  }
}
