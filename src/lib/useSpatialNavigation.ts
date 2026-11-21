'use client';
import { useEffect, useRef } from 'react';
import { pickFirst, pickNext, type Cand, type Dir } from './spatialNav';

// Управление пультом: стрелки двигают фокус по геометрии, OK/Enter и пробел нажимают, Escape/Backspace/«Назад» закрывают или возвращают.
// Ничего не знает о страницах: ищет на экране всё, что можно нажать, и работает внутри самого верхнего окна (модалки ловят фокус).
const SEL = 'a[href],button,input:not([type=hidden]),select,textarea,summary,[tabindex]:not([tabindex="-1"]),[data-tv-focusable],[role=tab],[role=button]';
const NATIVE = new Set(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'SUMMARY']);
const reduced = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
const smooth = (): ScrollBehavior => (reduced() ? 'auto' : 'smooth');

const visible = (el: HTMLElement) => {
  if (el.classList.contains('skip-link')) return false;
  if ((el as HTMLButtonElement).disabled) return false;
  if (el.closest('[inert],[hidden],[aria-hidden="true"]')) return false;
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return false;
  const st = getComputedStyle(el);
  return st.visibility !== 'hidden' && st.display !== 'none';
};
/** Самое верхнее открытое окно (модалка): фокус не должен выходить за его пределы. */
export const topLayer = (): HTMLElement | null => [...document.querySelectorAll<HTMLElement>('.modal, [role="dialog"][aria-modal="true"]')].filter(visible).pop() ?? null;
export const candidatesIn = (root: ParentNode): HTMLElement[] => [...root.querySelectorAll<HTMLElement>(SEL)].filter(visible);
/** Основное содержимое экрана (на экране выбора героя у <main> нет id). */
const mainEl = (): HTMLElement | null => document.getElementById('main') ?? document.querySelector<HTMLElement>('main');
const box = (el: HTMLElement) => { const r = el.getBoundingClientRect(); return { left: r.left, top: r.top, right: r.right, bottom: r.bottom }; };

const isEditable = (t: EventTarget | null): t is HTMLInputElement | HTMLTextAreaElement => {
  if (!(t instanceof HTMLElement)) return false;
  if (t.isContentEditable || t instanceof HTMLTextAreaElement) return true;
  return t instanceof HTMLInputElement && !['checkbox', 'radio', 'button', 'submit', 'reset', 'range', 'color', 'file'].includes(t.type);
};
/** Поле ввода уступает стрелку навигации только на краю текста, чтобы курсор можно было двигать. */
function inputYields(t: HTMLInputElement | HTMLTextAreaElement | HTMLElement, dir: Dir): boolean {
  if (!(t instanceof HTMLInputElement || t instanceof HTMLTextAreaElement)) return true;
  if (t instanceof HTMLInputElement && ['number', 'email', 'date', 'time'].includes(t.type)) return dir === 'up' || dir === 'down';
  const a = t.selectionStart ?? 0, b = t.selectionEnd ?? 0;
  if (a !== b) return false;
  if (dir === 'left') return a === 0;
  if (dir === 'right') return a === t.value.length;
  if (t instanceof HTMLTextAreaElement) return dir === 'up' ? !t.value.slice(0, a).includes('\n') : !t.value.slice(a).includes('\n');
  return true;
}

function scrollerOf(el: HTMLElement, axis: 'x' | 'y'): HTMLElement | null {
  for (let p = el.parentElement; p && p !== document.body; p = p.parentElement) {
    const st = getComputedStyle(p);
    const ov = axis === 'x' ? st.overflowX : st.overflowY;
    if ((ov === 'auto' || ov === 'scroll') && (axis === 'x' ? p.scrollWidth > p.clientWidth + 2 : p.scrollHeight > p.clientHeight + 2)) return p;
  }
  return null;
}

/** Ставит фокус и плавно подводит элемент к центру экрана. */
export function focusEl(el: HTMLElement, scroll = true) {
  el.focus({ preventScroll: true });
  if (scroll) el.scrollIntoView({ behavior: smooth(), block: 'center', inline: 'nearest' });
}

function firstCandidate(root: ParentNode): HTMLElement | null {
  const marked = root.querySelector<HTMLElement>('[data-tv-autofocus]');
  if (marked && visible(marked)) return marked;
  const list = candidatesIn(root);
  const inView = list.filter((e) => { const r = e.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight; });
  const pool = inView.length ? inView : list;
  const id = pickFirst<HTMLElement>(pool.map((e) => ({ id: e, box: box(e) })));
  return id;
}

/** Переход фокуса в направлении стрелки; на краю прокручивает горизонтальный список или страницу. */
export function move(dir: Dir): boolean {
  const root: ParentNode = topLayer() ?? document;
  const all = candidatesIn(root);
  const cur = document.activeElement as HTMLElement | null;
  if (!cur || !all.includes(cur)) {
    const first = firstCandidate(root);
    if (first) focusEl(first);
    return !!first;
  }
  const cands: Cand<HTMLElement>[] = all.filter((e) => e !== cur && !e.contains(cur) && !cur.contains(e)).map((e) => ({ id: e, box: box(e) }));
  const next = pickNext(box(cur), cands, dir);
  if (next) { focusEl(next); return true; }
  // края: сначала горизонтальный список (карусель), потом страница
  if (dir === 'left' || dir === 'right') {
    const sc = scrollerOf(cur, 'x');
    if (sc) { sc.scrollBy({ left: (dir === 'right' ? 1 : -1) * sc.clientWidth * 0.8, behavior: smooth() }); return true; }
  } else {
    const sc = scrollerOf(cur, 'y');
    const target: HTMLElement | Window = sc ?? window;
    const dy = (dir === 'down' ? 1 : -1) * (sc ? sc.clientHeight : innerHeight) * 0.6;
    target.scrollBy({ top: dy, behavior: smooth() });
    return true;
  }
  return false;
}

interface Opts { enabled: boolean; pathname: string; back: () => void }

/** Подключает управление пультом. enabled=false (мышиный режим) полностью отключает перехват клавиш. */
export function useSpatialNavigation({ enabled, pathname, back }: Opts) {
  const backRef = useRef(back);
  backRef.current = back;
  const depth = useRef(0);
  const lastPath = useRef(pathname);
  // сколько экранов мы прошли внутри сайта: по «Назад» возвращаемся туда же, а если прошли ноль, идём на главную
  useEffect(() => { if (lastPath.current !== pathname) { depth.current += 1; lastPath.current = pathname; } }, [pathname]);

  // клавиши
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.altKey || e.metaKey) return;
      const t = e.target;
      const dirs: Record<string, Dir> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
      const dir = dirs[e.key];
      const modal = topLayer();
      if (dir) {
        if (isEditable(t) && !inputYields(t, dir)) return;
        if (t instanceof HTMLSelectElement && (dir === 'up' || dir === 'down')) return;     // список выбирается стрелками сам
        if (t instanceof HTMLInputElement && t.type === 'range' && (dir === 'left' || dir === 'right')) return;
        e.preventDefault();
        move(dir);
        return;
      }
      // OK / пробел на «ненастоящих» кнопках (карточки с tabindex) нажимают их
      if ((e.key === 'Enter' || e.key === ' ') && t instanceof HTMLElement && !NATIVE.has(t.tagName) && !t.isContentEditable
        && (t.hasAttribute('data-tv-focusable') || t.getAttribute('role') === 'button' || t.getAttribute('role') === 'tab')) { e.preventDefault(); t.click(); return; }
      const isBack = e.key === 'Escape' || e.key === 'GoBack' || e.key === 'BrowserBack' || e.key === 'XF86Back' || e.keyCode === 461 || e.keyCode === 10009;
      if (isBack && isEditable(t)) { (t as HTMLElement).blur(); return; }          // из поля ввода выходим, второй Escape уже вернёт назад
      if (e.key === 'Backspace' && isEditable(t)) return;
      if (e.key === 'Backspace' || (isBack && e.key !== 'Escape')) {
        e.preventDefault();
        if (modal) modal.click(); else backRef.current();
        return;
      }
      // Escape в окнах закрывает Shell, а на обычном экране возвращает назад
      if (e.key === 'Escape' && !modal) { e.preventDefault(); backRef.current(); }
    };
    document.addEventListener('keydown', onKey, true);
    return () => document.removeEventListener('keydown', onKey, true);
  }, [enabled]);

  // видимая рамка на элементе в фокусе (кроме :focus-visible, чтобы она была и при фокусе из кода)
  useEffect(() => {
    if (!enabled) return;
    const add = (e: FocusEvent) => { if (e.target instanceof HTMLElement) e.target.classList.add('is-focused'); };
    const del = (e: FocusEvent) => { if (e.target instanceof HTMLElement) e.target.classList.remove('is-focused'); };
    document.addEventListener('focusin', add); document.addEventListener('focusout', del);
    return () => { document.removeEventListener('focusin', add); document.removeEventListener('focusout', del); document.querySelectorAll('.is-focused').forEach((n) => n.classList.remove('is-focused')); };
  }, [enabled]);

  // фокус на первый элемент при загрузке и при смене экрана (ждём, пока страница получит данные)
  useEffect(() => {
    if (!enabled) return;
    let done = false;
    let mo: MutationObserver | null = null;
    const attempt = () => {
      if (done) return true;
      const main = mainEl();
      const root: ParentNode | null = topLayer() ?? main;
      if (!root) return false;
      const active = document.activeElement;
      if (active && active !== document.body && active !== main && root instanceof HTMLElement && root.contains(active) && candidatesIn(root).includes(active as HTMLElement)) { done = true; return true; }
      const el = firstCandidate(root);
      if (!el) return false;
      focusEl(el, false);
      done = true;
      return true;
    };
    const t0 = setTimeout(() => {
      if (attempt()) return;
      mo = new MutationObserver(() => { if (attempt()) { mo?.disconnect(); mo = null; } });
      mo.observe(document.body, { childList: true, subtree: true });
    }, 60);
    const t1 = setTimeout(() => { mo?.disconnect(); mo = null; }, 6000);
    return () => { clearTimeout(t0); clearTimeout(t1); mo?.disconnect(); };
  }, [enabled, pathname]);

  // окна: при открытии фокус внутрь, при закрытии возврат на то, откуда открыли
  useEffect(() => {
    if (!enabled) return;
    let prevFocus: HTMLElement | null = null;
    let wasOpen = false;
    let raf = 0;
    const check = () => {
      raf = 0;
      const m = topLayer();
      if (m && !m.contains(document.activeElement)) {
        if (!wasOpen) prevFocus = document.activeElement instanceof HTMLElement && document.activeElement !== document.body ? document.activeElement : null;
        const el = firstCandidate(m);
        if (el) focusEl(el, false);
      }
      if (!m && wasOpen) {
        if (prevFocus && prevFocus.isConnected) focusEl(prevFocus, false);
        else { const main = mainEl(); const el = main && firstCandidate(main); if (el) focusEl(el, false); }
        prevFocus = null;
      }
      wasOpen = !!m;
    };
    const mo = new MutationObserver(() => { if (!raf) raf = requestAnimationFrame(check); });
    mo.observe(document.body, { childList: true, subtree: true });
    check();
    return () => { mo.disconnect(); if (raf) cancelAnimationFrame(raf); };
  }, [enabled]);

  return { depth };
}
