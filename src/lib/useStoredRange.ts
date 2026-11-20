'use client';
import { useCallback, useEffect, useState } from 'react';

/** Выбранный период запоминается в этом браузере (localStorage); если хранилище недоступно, работает как обычное состояние. */
export function useStoredRange<T extends string>(key: string, initial: T, allowed: readonly T[]): [T, (v: T) => void] {
  const [value, setValue] = useState<T>(initial);
  useEffect(() => {
    try {
      const v = localStorage.getItem(key);
      if (v && (allowed as readonly string[]).includes(v)) setValue(v as T);
    } catch { /* приватный режим или заблокированное хранилище: остаётся значение по умолчанию */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  const set = useCallback((v: T) => {
    setValue(v);
    try { localStorage.setItem(key, v); } catch { /* не страшно */ }
  }, [key]);
  return [value, set];
}
