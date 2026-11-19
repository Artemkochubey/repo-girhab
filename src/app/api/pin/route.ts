import { NextResponse } from 'next/server';
import { hashPin, pinFailed, pinLocked, pinOk, validPin, verifyPin } from '@/lib/auth';
import * as s from '@/lib/db/schema';
import { getConfig } from '@/lib/services/load';
import { db, parentCookie, PARENT_COOKIE } from '@/lib/server';

export const dynamic = 'force-dynamic';

/** POST { pin } — войти как родитель; если PIN ещё не задан, он устанавливается. DELETE — выйти. */
export async function POST(req: Request) {
  const { pin } = await req.json();
  if (!validPin(pin)) return NextResponse.json({ error: 'PIN: 4–8 цифр' }, { status: 400 });
  const key = req.headers.get('x-forwarded-for') ?? 'local';
  const wait = pinLocked(key);
  if (wait) return NextResponse.json({ error: `Слишком много попыток, подождите ${Math.ceil(wait / 60000)} мин.` }, { status: 429 });

  const cfg = getConfig(db());
  if (!cfg.pinHash) db().update(s.config).set({ pinHash: hashPin(pin) }).run();
  else if (!verifyPin(pin, cfg.pinHash)) { pinFailed(key); return NextResponse.json({ error: 'Неверный PIN' }, { status: 403 }); }
  pinOk(key);
  const c = parentCookie();
  const res = NextResponse.json({ ok: true, created: !cfg.pinHash });
  res.cookies.set(c.name, c.value, c.options);
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.delete(PARENT_COOKIE);
  return res;
}
