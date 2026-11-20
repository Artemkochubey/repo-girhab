import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import path from 'node:path';
import fs from 'node:fs';
import * as schema from './schema';

export function openDb(file = process.env.DB_PATH ?? './data/app.db') {
  fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  const sqlite = new Database(file);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  return drizzle(sqlite, { schema });
}

const g = globalThis as unknown as { __db?: ReturnType<typeof openDb> };
export const db = () => (g.__db ??= openDb());
export type Db = ReturnType<typeof openDb>;

/** Закрывает текущее соединение: следующий вызов db() откроет файл заново (после восстановления из копии). */
export function resetDb() {
  const d = g.__db;
  g.__db = undefined;
  try { d?.$client.close(); } catch { /* уже закрыто */ }
}
