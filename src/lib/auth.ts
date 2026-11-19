import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

let secret: Buffer | null = null;
function getSecret(): Buffer {
  if (secret) return secret;
  if (process.env.SESSION_SECRET) return (secret = Buffer.from(process.env.SESSION_SECRET));
  const file = path.resolve(path.dirname(process.env.DB_PATH ?? './data/app.db'), '.secret');
  try { secret = fs.readFileSync(file); } catch {
    secret = crypto.randomBytes(32);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, secret, { mode: 0o600 });
  }
  return secret;
}

const mac = (v: string) => crypto.createHmac('sha256', getSecret()).update(v).digest('base64url');
export const sign = (v: string) => `${v}.${mac(v)}`;
export function unsign(s: string | undefined): string | null {
  if (!s) return null;
  const i = s.lastIndexOf('.');
  if (i < 0) return null;
  const v = s.slice(0, i), m = s.slice(i + 1);
  const a = Buffer.from(m), b = Buffer.from(mac(v));
  return a.length === b.length && crypto.timingSafeEqual(a, b) ? v : null;
}

export function hashPin(pin: string): string {
  const salt = crypto.randomBytes(16);
  return `${salt.toString('hex')}:${crypto.scryptSync(pin, salt, 32).toString('hex')}`;
}
export function verifyPin(pin: string, stored: string | null): boolean {
  if (!stored) return false;
  const [s, h] = stored.split(':');
  const calc = crypto.scryptSync(pin, Buffer.from(s, 'hex'), 32);
  const want = Buffer.from(h, 'hex');
  return calc.length === want.length && crypto.timingSafeEqual(calc, want);
}
export const validPin = (p: unknown): p is string => typeof p === 'string' && /^\d{4,8}$/.test(p);

// Режим родителя: 30 минут, продлевается при каждом действии родителя (см. api/rpc)
export const PARENT_TTL_MS = 30 * 60_000;
const fails = new Map<string, { n: number; until: number }>();
/** 5 неверных попыток подряд — блокировка на 5 минут. */
export function pinLocked(key: string, now = Date.now()): number {
  const f = fails.get(key);
  return f && f.until > now ? f.until - now : 0;
}
export function pinFailed(key: string, now = Date.now()) {
  const f = fails.get(key) ?? { n: 0, until: 0 };
  f.n++;
  if (f.n >= 5) { f.until = now + 5 * 60_000; f.n = 0; }
  fails.set(key, f);
}
export const pinOk = (key: string) => fails.delete(key);
