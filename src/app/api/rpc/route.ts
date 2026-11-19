import { runAction } from '@/lib/services/actions';
import { db, getCtx, handle } from '@/lib/server';

export const dynamic = 'force-dynamic';

export const POST = (req: Request) =>
  handle(async () => {
    const { action, ...args } = await req.json();
    return runAction(db(), await getCtx(), String(action), args);
  });
