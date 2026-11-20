import fs from 'node:fs';
import { NextResponse } from 'next/server';
import { health, listBackups, createBackup } from '@/lib/backup';
import { APP_VERSION } from '@/lib/brand';
import { db, getCtx, handle } from '@/lib/server';
import { HttpError } from '@/lib/services/actions';
import { backupDir, backupFile, dbPath, restoreBackup } from '@/lib/services/backupService';

export const dynamic = 'force-dynamic';

const needParent = async () => { if (!(await getCtx()).parent) throw new HttpError(403, 'Нужен PIN родителя'); };
const summary = () => ({ version: APP_VERSION, ...health(dbPath(), backupDir()), list: listBackups(backupDir()).slice(0, 30) });

/** GET — сводка и список копий (родитель). GET ?file=имя — скачать копию; ?file=now — сделать свежую копию и скачать. */
export async function GET(req: Request) {
  const file = new URL(req.url).searchParams.get('file');
  if (!file) return handle(async () => { await needParent(); return summary(); });
  try {
    await needParent();
    const name = file === 'now' ? createBackup(db().$client, backupDir(), '').name : file;
    const path = backupFile(name);
    return new NextResponse(new Uint8Array(fs.readFileSync(path)), { headers: { 'content-type': 'application/octet-stream', 'content-disposition': `attachment; filename="${name}"` } });
  } catch (e) {
    if (e instanceof HttpError) return NextResponse.json({ error: e.message }, { status: e.status });
    console.error(e);
    return NextResponse.json({ error: 'Внутренняя ошибка' }, { status: 500 });
  }
}

/** POST { action: 'create' } — копия сейчас; { action: 'restore', file } — восстановить данные из копии (родитель). */
export const POST = (req: Request) => handle(async () => {
  await needParent();
  const b = await req.json().catch(() => ({}));
  if (b.action === 'create') { const c = createBackup(db().$client, backupDir(), ''); return { name: c.name, ...summary() }; }
  if (b.action === 'restore') { const r = restoreBackup(String(b.file)); return { ...r, ...summary() }; }
  throw new HttpError(400, 'Неизвестное действие');
});
