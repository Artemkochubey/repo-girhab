import { runAction } from '@/lib/services/actions';
import { db, handle } from '@/lib/server';

export const dynamic = 'force-dynamic';

/** ТВ без входа: можно только поставить/снять ожидающую отметку ручного квеста на сегодня (родитель потом подтвердит). */
export const POST = (req: Request) =>
  handle(async () => {
    const { memberId, index } = await req.json();
    return runAction(db(), { memberId, parent: false }, 'markQuest', { memberId, index });
  });
