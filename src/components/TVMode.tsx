'use client';
import { usePathname, useRouter } from 'next/navigation';
import { createElement, useCallback, useEffect, useState, useSyncExternalStore, type HTMLAttributes, type ReactNode } from 'react';
import { getTVServerSnapshot, getTVSnapshot, initTVMode, subscribeTV, syncFullscreen, toggleFullscreen, toggleTVMode } from '@/lib/tvMode';
import { useSpatialNavigation } from '@/lib/useSpatialNavigation';

export const useTVMode = () => useSyncExternalStore(subscribeTV, getTVSnapshot, getTVServerSnapshot);

/** Включает ТВ-режим сайта: стрелки и OK на пульте, скрытый курсор, подсказка. На странице /tv своё управление, поэтому там не вмешиваемся. */
export function TVMode() {
  const path = usePathname();
  const router = useRouter();
  const { tv } = useTVMode();
  const own = path.startsWith('/tv');
  const enabled = tv && !own;
  const [navDepth, setNavDepth] = useState(0);
  const back = useCallback(() => {
    if (path === '/') return;
    if (navDepth > 0 && history.length > 1) router.back(); else router.push('/');
  }, [path, navDepth, router]);
  const { depth } = useSpatialNavigation({ enabled, pathname: path, back });
  useEffect(() => { setNavDepth(depth.current); }, [path, depth]);

  useEffect(() => {
    initTVMode();
    const fs = () => syncFullscreen();
    document.addEventListener('fullscreenchange', fs);
    return () => document.removeEventListener('fullscreenchange', fs);
  }, []);

  // горячие клавиши режима: M — выйти в «мышиный» режим и вернуться, F — полный экран (только усиливает ТВ-режим)
  useEffect(() => {
    if (own) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.altKey || e.metaKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName))) return;
      if (e.key === 'm' || e.key === 'M' || e.key === 'ь' || e.key === 'Ь') { toggleTVMode(); e.preventDefault(); }
      else if ((e.key === 'f' || e.key === 'F' || e.key === 'а' || e.key === 'А') && tv) { toggleFullscreen(); e.preventDefault(); }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [own, tv]);

  // подсказка при загрузке: пара секунд, потом исчезает
  const [hint, setHint] = useState(true);
  useEffect(() => { const t = setTimeout(() => setHint(false), 9000); return () => clearTimeout(t); }, []);
  if (!enabled || !hint) return null;
  return (
    <div className="tv-hint-bar" role="status" aria-live="polite">
      <span>Пульт: <kbd>←</kbd><kbd>↑</kbd><kbd>↓</kbd><kbd>→</kbd> выбор, <kbd>OK</kbd> нажать, <kbd>Назад</kbd> закрыть</span>
      <span>Мышь: клавиша <kbd>M</kbd></span>
    </div>
  );
}

/** Кнопка в шапке: выйти в «мышиный» режим и вернуться в ТВ-режим. */
export function TVToggle() {
  const { tv } = useTVMode();
  return (
    <button className="chip tv-toggle" onClick={toggleTVMode} aria-pressed={tv} title="Клавиша M">
      {tv ? '🖱 Мышь' : '📺 ТВ'} <small className="muted">(M)</small>
    </button>
  );
}

interface FocusableProps extends HTMLAttributes<HTMLElement> { as?: string; onSelect?: () => void; autoFocus?: boolean; children?: ReactNode }
/** Делает любой блок (карточку, плитку) доступным для пульта: попадает в навигацию стрелками, OK нажимает его как кнопку. */
export function TVFocusable({ as = 'div', onSelect, autoFocus, children, onClick, ...rest }: FocusableProps) {
  return createElement(as, {
    ...rest, tabIndex: 0, role: rest.role ?? 'button', 'data-tv-focusable': '', 'data-tv-autofocus': autoFocus ? '' : undefined,
    onClick: (e: React.MouseEvent<HTMLElement>) => { onClick?.(e); onSelect?.(); },
  }, children);
}
