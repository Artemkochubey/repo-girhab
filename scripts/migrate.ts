import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { openDb } from '../src/lib/db/client';

migrate(openDb(), { migrationsFolder: './drizzle' });
console.log('Миграции применены');
