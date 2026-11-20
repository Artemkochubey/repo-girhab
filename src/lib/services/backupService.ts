import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import fs from 'node:fs';
import path from 'node:path';
import { BACKUP_RE, backupDirFor, backupDue, createBackup, replaceDbFile, validateDbFile } from '../backup';
import { db, resetDb } from '../db/client';
import { HttpError } from './actions';

export const dbPath = () => process.env.DB_PATH ?? './data/app.db';
export const backupDir = () => backupDirFor(dbPath());

let lastCheck = 0;
/** Автокопия раз в сутки: проверяется при обращении к сайту (не чаще раза в 10 минут), отдельный планировщик не нужен. */
export function maybeAutoBackup(): void {
  if (Date.now() - lastCheck < 10 * 60_000) return;
  lastCheck = Date.now();
  try { if (backupDue(backupDir())) createBackup(db().$client, backupDir(), 'auto'); }
  catch (e) { console.error('Автокопия не удалась:', e); }
}

export const backupFile = (name: string): string => {
  if (!BACKUP_RE.test(name)) throw new HttpError(400, 'Неверное имя файла');
  const f = path.join(backupDir(), name);
  if (!fs.existsSync(f)) throw new HttpError(404, 'Копия не найдена');
  return f;
};

/** Восстановление из копии из списка: перед заменой данных делается страховочная копия «before». */
export function restoreBackup(name: string): { safety: string } {
  const src = backupFile(name);
  const err = validateDbFile(src);
  if (err) throw new HttpError(400, err);
  const safety = createBackup(db().$client, backupDir(), 'before');
  resetDb();
  replaceDbFile(src, dbPath());
  migrate(db(), { migrationsFolder: path.resolve('./drizzle') });   // копию из старой версии подтягиваем до текущей схемы
  return { safety: safety.name };
}

/** Загруженный файл проверяется и кладётся в список копий. */
export function saveUploaded(bytes: Uint8Array, now = new Date()): string {
  fs.mkdirSync(backupDir(), { recursive: true });
  const tmp = path.join(backupDir(), `upload-${now.getTime()}.tmp`);
  fs.writeFileSync(tmp, bytes);
  const err = validateDbFile(tmp);
  if (err) { fs.unlinkSync(tmp); throw new HttpError(400, err); }
  const stamp = now.toISOString().replace(/[:T]/g, '-').slice(0, 19);
  let name = `app-${stamp}.db`;
  for (let n = 2; fs.existsSync(path.join(backupDir(), name)); n++) name = `app-${stamp}-${n}.db`;
  fs.renameSync(tmp, path.join(backupDir(), name));
  return name;
}
