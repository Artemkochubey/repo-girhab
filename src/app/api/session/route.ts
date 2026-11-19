import { NextResponse } from 'next/server';
import { sign } from '@/lib/auth';
import { cookieOpts, db, MEMBER_COOKIE } from '@/lib/server';
import * as s from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export const dynamic = 'force-dynamic';

/** Выбор профиля: { memberId } или { memberId: null } для выхода. */
export async function POST(req: Request) {
  const { memberId } = await req.json();
  const res = NextResponse.json({ ok: true });
  if (memberId === null) { res.cookies.delete(MEMBER_COOKIE); return res; }
  if (typeof memberId !== 'number' || !db().select().from(s.member).where(eq(s.member.id, memberId)).get())
    return NextResponse.json({ error: 'Нет такого участника' }, { status: 404 });
  res.cookies.set(MEMBER_COOKIE, sign(String(memberId)), cookieOpts);
  return res;
}
