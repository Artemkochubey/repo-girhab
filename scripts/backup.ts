import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';

// Консистентная копия БД (работает при запущенном сайте). Хранит последние KEEP копий.
const KEEP = Number(process.env.BACKUP_KEEP ?? 14);
const src = process.env.DB_PATH ?? './data/app.db';
const dir = process.env.BACKUP_DIR ?? path.join(path.dirname(src), 'backups');
fs.mkdirSync(dir, { recursive: true });

const stamp = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
const dest = path.join(dir, `app-${stamp}.db`);

const db = new Database(src, { readonly: true });
db.backup(dest).then(() => {
  db.close();
  const old = fs.readdirSync(dir).filter((f) => /^app-.*\.db$/.test(f)).sort().slice(0, -KEEP);
  for (const f of old) fs.unlinkSync(path.join(dir, f));
  console.log(`Копия: ${dest} (удалено старых: ${old.length})`);
}).catch((e) => { console.error('Ошибка бэкапа:', e); process.exit(1); });
