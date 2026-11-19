import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { PARENT_TTL_MS, sign, unsign } from './auth';
import { db } from './db/client';
import { HttpError, type Ctx } from './services/actions';

export const MEMBER_COOKIE = 'mr_member';
export const PARENT_COOKIE = 'mr_parent';

export async function getCtx(): Promise<Ctx> {
  const jar = await cookies();
  const m = unsign(jar.get(MEMBER_COOKIE)?.value);
  const p = unsign(jar.get(PARENT_COOKIE)?.value);
  return { memberId: m ? Number(m) : null, parent: !!p && Number(p) > Date.now() };
}

export const cookieOpts = { httpOnly: true, sameSite: 'lax' as const, path: '/', maxAge: 60 * 60 * 24 * 365 };
export const parentCookie = () => ({ name: PARENT_COOKIE, value: sign(String(Date.now() + PARENT_TTL_MS)), options: { ...cookieOpts, maxAge: PARENT_TTL_MS / 1000 } });

export function handle(fn: () => Promise<unknown> | unknown) {
  return Promise.resolve().then(fn).then(
    (r) => NextResponse.json(r ?? { ok: true }),
    (e) => {
      if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
      console.error(e);
      return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 });
    },
  );
}
export { db };
