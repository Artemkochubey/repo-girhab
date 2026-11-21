// ТВ-режим сайта: по умолчанию включён (курсор скрыт, управление пультом). Выход в «мышиный» режим: кнопка в шапке, клавиша M
// или адрес с ?tv=0 (выбор запоминается в браузере; ?tv=1 включает ТВ обратно). Полный экран только усиливает режим и не включает его.
export interface TVSnapshot { tv: boolean; fs: boolean }
const KEY = 'mr_tv_mode';
const SERVER: TVSnapshot = { tv: true, fs: false };
let snap: TVSnapshot = SERVER;
const subs = new Set<() => void>();

export const getTVSnapshot = (): TVSnapshot => snap;
export const getTVServerSnapshot = (): TVSnapshot => SERVER;
export const subscribeTV = (fn: () => void) => { subs.add(fn); return () => { subs.delete(fn); }; };

/** Кладёт состояние в атрибуты <html>, на которые опираются стили (data-tv, data-fs). */
function apply() {
  if (typeof document === 'undefined') return;
  const h = document.documentElement;
  h.dataset.tv = snap.tv ? 'on' : 'off';
  if (snap.fs) h.dataset.fs = 'on'; else delete h.dataset.fs;
}
function set(next: Partial<TVSnapshot>) {
  const n = { ...snap, ...next };
  if (n.tv === snap.tv && n.fs === snap.fs) return;
  snap = n; apply(); subs.forEach((f) => f());
}

/** Режим из адреса и из памяти браузера. Без записей — ТВ. */
export function readTVPreference(search: string, stored: string | null): boolean {
  const q = new URLSearchParams(search).get('tv');
  if (q === '0' || q === 'off' || q === 'mouse') return false;
  if (q === '1' || q === 'on') return true;
  return stored !== '0';
}

export function initTVMode() {
  let stored: string | null = null;
  try { stored = localStorage.getItem(KEY); } catch { /* без хранилища остаёмся в ТВ-режиме */ }
  const q = new URLSearchParams(location.search).get('tv');
  const tv = readTVPreference(location.search, stored);
  if (q !== null) { try { if (tv) localStorage.removeItem(KEY); else localStorage.setItem(KEY, '0'); } catch { /* ignore */ } }
  set({ tv, fs: !!document.fullscreenElement });
}
export function setTVMode(on: boolean) {
  try { if (on) localStorage.removeItem(KEY); else localStorage.setItem(KEY, '0'); } catch { /* ignore */ }
  set({ tv: on });
}
export const toggleTVMode = () => setTVMode(!snap.tv);
export const syncFullscreen = () => set({ fs: !!document.fullscreenElement });
export function toggleFullscreen() {
  if (document.fullscreenElement) void document.exitFullscreen?.();
  else void document.documentElement.requestFullscreen?.().catch(() => { /* браузер не разрешил: ничего страшного */ });
}
