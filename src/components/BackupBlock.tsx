'use client';
import { useCallback, useEffect, useState } from 'react';
import { post } from '@/lib/client';
import { useGame } from './Shell';
import { Section } from './ui';

interface Sum { version: string; dbSize: number; freeBytes: number | null; backups: number; lastBackup: number | null; mirror: { dir: string; ok: boolean; files: number; last: number | null; error: string | null } | null; list: { name: string; size: number; time: number; label: string }[] }

const mb = (n: number) => (n >= 1e9 ? `${(n / 1e9).toFixed(1).replace('.', ',')} ГБ` : n >= 1e6 ? `${(n / 1e6).toFixed(1).replace('.', ',')} МБ` : `${Math.max(1, Math.round(n / 1e3))} КБ`);
const when = (t: number) => new Date(t).toLocaleString('ru', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });
const KIND: Record<string, string> = { auto: 'автоматическая', before: 'страховочная (перед восстановлением)', '': 'ручная' };

/** Настройки: здоровье сайта, автокопии раз в сутки, скачивание и восстановление данных. */
export function BackupBlock() {
  const { toast, askPin } = useGame();
  const [sum, setSum] = useState<Sum | null>(null);
  const [confirm, setConfirm] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const fail = useCallback((e: unknown) => {
    const m = (e as Error).message;
    if (m.includes('PIN')) askPin(); else toast(m);
  }, [askPin, toast]);
  const load = useCallback(async () => {
    try { const r = await fetch('/api/backup', { cache: 'no-store' }); const j = await r.json(); if (!r.ok) throw new Error(j.error); setSum(j); } catch (e) { fail(e); }
  }, [fail]);
  useEffect(() => { load(); }, [load]);

  const create = async () => { setBusy(true); try { setSum(await post('/api/backup', { action: 'create' })); toast('Копия создана'); } catch (e) { fail(e); } setBusy(false); };
  const restore = async (file: string) => {
    setBusy(true);
    try { await post('/api/backup', { action: 'restore', file }); toast('Данные восстановлены. Страница обновится…'); setTimeout(() => window.location.reload(), 1200); }
    catch (e) { fail(e); setBusy(false); }
  };
  const upload = async (f: File | undefined) => {
    if (!f) return;
    setBusy(true);
    try {
      const r = await fetch('/api/backup/upload', { method: 'POST', body: f });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      await load();
      setConfirm(j.name);
      toast('Файл проверен. Подтвердите восстановление ниже');
    } catch (e) { fail(e); }
    setBusy(false);
  };

  const stale = sum && (sum.lastBackup === null || Date.now() - sum.lastBackup > 48 * 3_600_000);
  return (
    <Section title="💾 Данные и копии">
      {!sum ? <p className="muted">Загрузка…</p> : (
        <>
          <ul className="list small">
            <li>Версия сайта: <b>{sum.version || '—'}</b></li>
            <li>Размер данных: <b>{mb(sum.dbSize)}</b>{sum.freeBytes !== null && <> · свободно на диске: <b className={sum.freeBytes < 2e9 ? 'bk-warn' : ''}>{mb(sum.freeBytes)}</b></>}</li>
            <li>Копий: <b>{sum.backups}</b> · последняя: <b className={stale ? 'bk-warn' : ''}>{sum.lastBackup ? when(sum.lastBackup) : 'нет'}</b></li>
          </ul>
          {sum.mirror
            ? <p className={`small ${sum.mirror.ok ? '' : 'bk-warn'}`}>{sum.mirror.ok ? '✔' : '⚠'} Вторая папка для копий (<code>{sum.mirror.dir}</code>): {sum.mirror.ok ? `копий ${sum.mirror.files}${sum.mirror.last ? `, последняя ${when(sum.mirror.last)}` : ', пока пусто'}` : `не работает (${sum.mirror.error}). Проверьте диск и права на папку.`}</p>
            : <p className="muted small">Вторая папка для копий не настроена. Укажите её в <code>docker-compose.yml</code> (см. README, «Резервное копирование»), и каждая копия будет ложиться ещё и на другой диск.</p>}
          {stale && <p className="bk-warn small">⚠ Давно не было копий. Нажмите «Создать копию сейчас».</p>}
          {sum.freeBytes !== null && sum.freeBytes < 2e9 && <p className="bk-warn small">⚠ На диске мало места: сайт может перестать сохранять данные.</p>}
          <p className="muted small">Копия делается сама раз в сутки, когда кто-то открывает сайт, и хранится в папке <code>data\backups</code> рядом с сайтом (последние 14). Скопируйте эту папку на другой диск или в облако: при поломке диска копии рядом тоже пропадут.</p>
          <div className="row wrapRow">
            <button className="btn" disabled={busy} onClick={create}>💾 Создать копию сейчас</button>
            <a className="btn ghost" href="/api/backup?file=now" download>⬇ Скачать свежую копию</a>
          </div>

          <h3>Список копий</h3>
          <ul className="list">
            {sum.list.map((b) => (
              <li key={b.name} className="wrapRow">
                <span className="grow"><b>{when(b.time)}</b> <small className="muted">· {KIND[b.label] ?? b.label} · {mb(b.size)}</small></span>
                <a className="btn ghost sm" href={`/api/backup?file=${encodeURIComponent(b.name)}`} download>⬇ Скачать</a>
                <button className="btn ghost sm" disabled={busy} onClick={() => setConfirm(b.name)}>↩ Восстановить</button>
              </li>
            ))}
            {sum.list.length === 0 && <li className="muted">Копий пока нет.</li>}
          </ul>

          <h3>Восстановить из файла</h3>
          <p className="muted small">Выберите файл <code>app.db</code> или копию из папки <code>backups</code>. Файл сначала проверяется, текущие данные не меняются, пока вы не подтвердите.</p>
          <input type="file" accept=".db,application/octet-stream" disabled={busy} onChange={(e) => { upload(e.target.files?.[0]); e.target.value = ''; }} />

          {confirm && (
            <div className="confirm">
              <b>Заменить все данные семьи копией «{confirm}»?</b>
              <span>Всё, что записано после неё (очки, квесты, сундуки), пропадёт. Перед заменой сайт сам сохранит страховочную копию текущих данных, её можно будет вернуть.</span>
              <div className="row">
                <button className="btn" disabled={busy} onClick={() => restore(confirm)}>Да, восстановить</button>
                <button className="btn ghost" onClick={() => setConfirm(null)}>Отмена</button>
              </div>
            </div>
          )}
        </>
      )}
    </Section>
  );
}
