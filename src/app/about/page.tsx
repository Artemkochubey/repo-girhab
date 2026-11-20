'use client';
import { useEffect } from 'react';
import { APP_VERSION } from '@/lib/brand';
import { RELEASES } from '@/lib/changelogData';

export const SEEN_KEY = 'mr_seen_version';

/** «Что нового»: последние изменения для всей семьи, старые версии свёрнуты. */
export default function About() {
  const current = RELEASES[0];
  useEffect(() => { try { localStorage.setItem(SEEN_KEY, current?.version ?? ''); } catch { /* без хранилища просто не запомним */ } }, [current]);
  return (
    <>
      <h1 className="title">✨ Что нового</h1>
      <p className="muted">Версия сайта: <b>{APP_VERSION || current?.version}</b>. Здесь короткий список того, что появилось в игре. Подробные правила лежат на странице «Правила».</p>
      {RELEASES.map((r, i) => (
        <details key={r.version} className="card fold" open={i === 0}>
          <summary><h2>Версия {r.version}</h2><span className="fold-r muted">{r.items.length} {r.items.length === 1 ? 'изменение' : 'изменений'}</span></summary>
          <ul className="fold-body list about-list">
            {r.items.map((t, k) => <li key={k}>{t}</li>)}
          </ul>
        </details>
      ))}
    </>
  );
}
