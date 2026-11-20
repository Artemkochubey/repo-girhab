import { describe, it, expect, beforeEach } from 'vitest';
import Database from 'better-sqlite3';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { backupDue, createBackup, health, listBackups, replaceDbFile, validateDbFile } from './backup';

let dir: string;
const mk = (file: string, rows = 1) => {
  const d = new Database(file);
  d.exec('create table config(id integer primary key, v text); create table member(id integer primary key, name text); create table hero(id integer); create table workout_entry(id integer);');
  d.prepare('insert into config(id, v) values (1, ?)').run('x');
  for (let i = 0; i < rows; i++) d.prepare('insert into member(name) values (?)').run('Лев' + i);
  return d;
};
beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bk-')); });

describe('резервные копии', () => {
  it('создаёт согласованную копию, которую можно открыть и проверить', () => {
    const src = mk(path.join(dir, 'app.db'), 3);
    const b = createBackup(src, path.join(dir, 'backups'), 'auto', new Date('2026-11-20T10:00:00Z'));
    expect(b.name).toBe('app-2026-11-20-10-00-00-auto.db');
    const copy = new Database(path.join(dir, 'backups', b.name), { readonly: true });
    expect((copy.prepare('select count(*) c from member').get() as { c: number }).c).toBe(3);
    copy.close();
    expect(validateDbFile(path.join(dir, 'backups', b.name))).toBeNull();
    expect(listBackups(path.join(dir, 'backups'))[0]).toMatchObject({ name: b.name, label: 'auto' });
  });
  it('две копии в одну секунду не затирают друг друга', () => {
    const src = mk(path.join(dir, 'app.db'));
    const t = new Date('2026-11-20T10:00:00Z');
    const a = createBackup(src, path.join(dir, 'b'), '', t), b = createBackup(src, path.join(dir, 'b'), '', t);
    expect(a.name).not.toBe(b.name);
    expect(listBackups(path.join(dir, 'b'))).toHaveLength(2);
  });
  it('хранит последние N автокопий и обычных, страховочные «before» не удаляет', () => {
    const src = mk(path.join(dir, 'app.db'));
    const d = path.join(dir, 'b');
    for (let i = 0; i < 5; i++) createBackup(src, d, 'auto', new Date(Date.UTC(2026, 10, 1 + i)), 3);
    createBackup(src, d, 'before', new Date(Date.UTC(2026, 9, 1)), 3);
    const names = listBackups(d).map((x) => x.name);
    expect(names.filter((n) => n.endsWith('-auto.db'))).toHaveLength(3);
    expect(names.some((n) => n.endsWith('-before.db'))).toBe(true);
  });
  it('автокопия нужна, если последней нет или ей больше суток', () => {
    const src = mk(path.join(dir, 'app.db'));
    const d = path.join(dir, 'b');
    expect(backupDue(d)).toBe(true);
    createBackup(src, d, 'auto');
    expect(backupDue(d)).toBe(false);
    expect(backupDue(d, Date.now() + 25 * 3_600_000)).toBe(true);
  });
  it('проверка файла отсекает мусор, чужую базу и пустой файл', () => {
    fs.writeFileSync(path.join(dir, 'a.db'), 'просто текст, не база данных');
    expect(validateDbFile(path.join(dir, 'a.db'))).toMatch(/не файл базы/);
    const other = new Database(path.join(dir, 'o.db')); other.exec('create table t(x)'); other.close();
    expect(validateDbFile(path.join(dir, 'o.db'))).toMatch(/нет таблиц/);
    fs.writeFileSync(path.join(dir, 'e.db'), '');
    expect(validateDbFile(path.join(dir, 'e.db'))).toBeTruthy();
    expect(validateDbFile(path.join(dir, 'нет.db'))).toBeTruthy();
  });
  it('восстановление заменяет файл базы и убирает хвосты WAL', () => {
    const live = mk(path.join(dir, 'app.db'), 1);
    const snap = createBackup(live, path.join(dir, 'b'), '').name;
    live.prepare('insert into member(name) values (?)').run('Лишний'); // изменение после копии
    live.close();
    fs.writeFileSync(path.join(dir, 'app.db-wal'), 'x');
    replaceDbFile(path.join(dir, 'b', snap), path.join(dir, 'app.db'));
    expect(fs.existsSync(path.join(dir, 'app.db-wal'))).toBe(false);
    const back = new Database(path.join(dir, 'app.db'), { readonly: true });
    expect((back.prepare('select count(*) c from member').get() as { c: number }).c).toBe(1);
    back.close();
  });
  it('сводка здоровья: размер базы, число копий, время последней', () => {
    const src = mk(path.join(dir, 'app.db'));
    createBackup(src, path.join(dir, 'backups'), '');
    const h = health(path.join(dir, 'app.db'), path.join(dir, 'backups'));
    expect(h.dbSize).toBeGreaterThan(0);
    expect(h.backups).toBe(1);
    expect(h.lastBackup).toBeGreaterThan(0);
  });
});

import { mirrorStatus } from './backup';
describe('вторая папка для копий', () => {
  it('каждая копия ложится и в основную, и во вторую папку, файлы совпадают', () => {
    const src = mk(path.join(dir, 'app.db'), 2);
    const mirror = path.join(dir, 'disk2', 'copies');
    const b = createBackup(src, path.join(dir, 'backups'), 'auto', new Date('2026-11-20T10:00:00Z'), 14, mirror);
    expect(fs.existsSync(path.join(mirror, b.name))).toBe(true);
    expect(fs.readFileSync(path.join(mirror, b.name)).equals(fs.readFileSync(path.join(dir, 'backups', b.name)))).toBe(true);
    expect(validateDbFile(path.join(mirror, b.name))).toBeNull();
    const st = mirrorStatus(mirror)!;
    expect(st).toMatchObject({ dir: mirror, ok: true, files: 1, error: null });
  });
  it('во второй папке тоже хранятся только последние копии', () => {
    const src = mk(path.join(dir, 'app.db'));
    const mirror = path.join(dir, 'm');
    for (let i = 0; i < 4; i++) createBackup(src, path.join(dir, 'b'), 'auto', new Date(`2026-11-0${i + 1}T10:00:00Z`), 2, mirror);
    expect(listBackups(mirror)).toHaveLength(2);
  });
  it('если вторая папка недоступна, основная копия всё равно создаётся, а ошибка видна в статусе', () => {
    const src = mk(path.join(dir, 'app.db'));
    const blocked = path.join(dir, 'file-not-dir');
    fs.writeFileSync(blocked, 'x');                                   // вместо папки обычный файл
    const b = createBackup(src, path.join(dir, 'b'), '', new Date('2026-11-20T10:00:00Z'), 14, path.join(blocked, 'inside'));
    expect(fs.existsSync(path.join(dir, 'b', b.name))).toBe(true);
    const st = mirrorStatus(path.join(blocked, 'inside'))!;
    expect(st.ok).toBe(false);
    expect(st.error).toBeTruthy();
  });
  it('не настроена: статус пустой', () => { expect(mirrorStatus(null)).toBeNull(); });
});
