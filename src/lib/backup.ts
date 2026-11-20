import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

/** Файлы копий называются app-YYYY-MM-DD-HH-MM-SS[-метка].db (так же, как у scripts/backup.ts). */
export const BACKUP_RE = /^app-[0-9-]+(-(auto|before))?\.db$/;
export const KEEP_AUTO = 14;

export interface BackupInfo { name: string; size: number; time: number; label: string }

/** Вторая папка для копий (другой диск, облачная папка): BACKUP_MIRROR_DIR. Пусто — не используется. */
export const mirrorDirFromEnv = (): string | null => process.env.BACKUP_MIRROR_DIR?.trim() || null;

export const backupDirFor = (dbPath: string) => process.env.BACKUP_DIR ?? path.join(path.dirname(path.resolve(dbPath)), 'backups');

export function listBackups(dir: string): BackupInfo[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => BACKUP_RE.test(f)).map((name) => {
    const st = fs.statSync(path.join(dir, name));
    const label = /-(auto|before)\.db$/.exec(name)?.[1] ?? '';
    return { name, size: st.size, time: st.mtimeMs, label };
  }).sort((a, b) => b.time - a.time || (a.name < b.name ? 1 : -1));
}

const stamp = (d: Date) => d.toISOString().replace(/[:T]/g, '-').slice(0, 19);

/**
 * Консистентная копия работающей базы (VACUUM INTO не мешает записи).
 * label: '' — обычная, 'auto' — автоматическая, 'before' — перед восстановлением. Лишние автокопии удаляются, остальные нет.
 */
export function createBackup(sqlite: Database.Database, dir: string, label: '' | 'auto' | 'before' = '', now = new Date(), keep = KEEP_AUTO, mirror: string | null = mirrorDirFromEnv()): BackupInfo {
  fs.mkdirSync(dir, { recursive: true });
  const base = `app-${stamp(now)}`, tail = label ? `-${label}` : '';
  let name = `${base}${tail}.db`;
  for (let n = 2; fs.existsSync(path.join(dir, name)); n++) name = `${base}-${n}${tail}.db`;
  const dest = path.join(dir, name);
  sqlite.exec(`VACUUM INTO '${dest.replace(/'/g, "''")}'`);
  const rotate = listBackups(dir).filter((b) => b.label === 'auto' || b.label === '').slice(keep);
  for (const b of rotate) { try { fs.unlinkSync(path.join(dir, b.name)); } catch { /* уже удалён */ } }
  const st = fs.statSync(dest);
  if (mirror) mirrorCopy(dest, name, mirror, keep);
  return { name, size: st.size, time: st.mtimeMs, label };
}

let lastMirrorError: string | null = null;
/** Кладёт копию во вторую папку и подчищает старые. Ошибка не мешает основной копии: она запоминается и видна в «Настройках». */
export function mirrorCopy(src: string, name: string, mirror: string, keep = KEEP_AUTO): boolean {
  try {
    fs.mkdirSync(mirror, { recursive: true });
    fs.copyFileSync(src, path.join(mirror, name));
    for (const b of listBackups(mirror).filter((x) => x.label === 'auto' || x.label === '').slice(keep)) { try { fs.unlinkSync(path.join(mirror, b.name)); } catch { /* уже удалён */ } }
    lastMirrorError = null;
    return true;
  } catch (e) {
    lastMirrorError = e instanceof Error ? e.message : String(e);
    console.error('Не удалось скопировать во вторую папку:', lastMirrorError);
    return false;
  }
}

export interface MirrorStatus { dir: string; ok: boolean; files: number; last: number | null; error: string | null }
/** Состояние второй папки для «Настроек»: настроена ли, пишется ли в неё, когда была последняя копия. */
export function mirrorStatus(mirror: string | null = mirrorDirFromEnv()): MirrorStatus | null {
  if (!mirror) return null;
  let error = lastMirrorError;
  if (!error) {
    try { fs.mkdirSync(mirror, { recursive: true }); fs.accessSync(mirror, fs.constants.W_OK); } catch { error = 'Папка недоступна для записи'; }
  }
  const list = fs.existsSync(mirror) ? listBackups(mirror) : [];
  return { dir: mirror, ok: !error, files: list.length, last: list[0]?.time ?? null, error };
}

/** Пора ли делать автокопию: последней копии (любой) нет или ей больше hours часов. */
export function backupDue(dir: string, now = Date.now(), hours = 24): boolean {
  const last = listBackups(dir)[0];
  return !last || now - last.time > hours * 3_600_000;
}

const REQUIRED = ['config', 'member', 'hero', 'workout_entry'];

/** Проверка файла перед восстановлением: настоящая база SQLite нашей программы. Возвращает текст ошибки или null. */
export function validateDbFile(file: string): string | null {
  try {
    const head = Buffer.alloc(16);
    const fd = fs.openSync(file, 'r');
    fs.readSync(fd, head, 0, 16, 0);
    fs.closeSync(fd);
    if (head.toString('latin1') !== 'SQLite format 3\0') return 'Это не файл базы данных (нужен app.db или копия из папки backups)';
  } catch { return 'Не удалось прочитать файл'; }
  let db: Database.Database | null = null;
  try {
    db = new Database(file, { readonly: true });
    if (db.pragma('integrity_check', { simple: true }) !== 'ok') return 'Файл повреждён';
    const tables = new Set((db.prepare("select name from sqlite_master where type = 'table'").all() as { name: string }[]).map((t) => t.name));
    const missing = REQUIRED.filter((t) => !tables.has(t));
    if (missing.length) return `Это не база «Семьи Легенд» (нет таблиц: ${missing.join(', ')})`;
    if (!db.prepare('select count(*) c from member').get() || (db.prepare('select count(*) c from config').get() as { c: number }).c < 1) return 'В файле нет данных семьи';
    return null;
  } catch { return 'Файл не открывается как база данных'; }
  finally { db?.close(); }
}

/** Заменяет файл базы копией. Соединение с базой должно быть закрыто до вызова. */
export function replaceDbFile(src: string, dbPath: string): void {
  const dest = path.resolve(dbPath);
  fs.copyFileSync(src, dest);
  for (const ext of ['-wal', '-shm']) { try { fs.unlinkSync(dest + ext); } catch { /* файла нет */ } }
}

/** Сводка для панели «Здоровье»: размеры и место на диске. */
export function health(dbPath: string, dir: string) {
  const file = path.resolve(dbPath);
  const size = fs.existsSync(file) ? fs.statSync(file).size : 0;
  let free: number | null = null;
  try { const s = fs.statfsSync(path.dirname(file)); free = Number(s.bavail) * Number(s.bsize); } catch { /* платформа без statfs */ }
  const list = listBackups(dir);
  return { dbSize: size, freeBytes: free, backups: list.length, lastBackup: list[0]?.time ?? null, mirror: mirrorStatus() };
}
