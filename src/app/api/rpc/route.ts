import { NextResponse } from 'next/server';
import { HttpError, runAction } from '@/lib/services/actions';
import { db, getCtx, parentCookie } from '@/lib/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const { action, ...args } = await req.json();
    const ctx = await getCtx();
    const result = runAction(db(), ctx, String(action), args);
    const res = NextResponse.json(result ?? { ok: true });
    // Скользящая сессия: каждое успешное действие родителя продлевает режим родителя.
    if (ctx.parent) { const c = parentCookie(); res.cookies.set(c.name, c.value, c.options); }
    return res;
  } catch (e) {
    if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e);
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 });
  }
}
