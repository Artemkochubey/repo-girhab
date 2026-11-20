'use client';
import { useEffect, useRef, useState } from 'react';

export interface Hit { id: number; key: string; delta: number; kill: boolean }
type Snap = Record<string, { n: number; flag?: boolean }>;

/** Что изменилось между двумя снимками: рост урона (не меньше 0,5) и новые «убийства». Чистая функция для проверки в тестах. */
export function diffHits(prev: Snap | null, next: Snap): { key: string; delta: number; kill: boolean }[] {
  if (!prev) return [];
  const out: { key: string; delta: number; kill: boolean }[] = [];
  for (const [key, v] of Object.entries(next)) {
    const was = prev[key];
    if (!was) continue;
    const delta = v.n - was.n;
    const kill = !!v.flag && !was.flag;
    if (delta >= 0.5 || kill) out.push({ key, delta: Math.max(1, Math.round(delta)), kill });
  }
  return out;
}

/**
 * Замечает, что урон вырос с прошлого обновления данных, и на время ms выдаёт «удары» для анимации.
 * snap: ключ → { n: накопленный урон, flag: убито ли }. При первой загрузке удары не показываются (иначе всё бы «повторялось» при входе).
 */
export function useHits(snap: Record<string, { n: number; flag?: boolean }>, ms = 1500): Hit[] {
  const prev = useRef<Record<string, { n: number; flag?: boolean }> | null>(null);
  const seq = useRef(0);
  const [hits, setHits] = useState<Hit[]>([]);
  const sig = JSON.stringify(snap);
  useEffect(() => {
    const fresh: Hit[] = diffHits(prev.current, snap).map((h) => ({ ...h, id: ++seq.current }));
    prev.current = snap;
    if (!fresh.length) return;
    setHits((h) => [...h, ...fresh]);
    const t = setTimeout(() => setHits((h) => h.filter((x) => !fresh.includes(x))), ms);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig]);
  return hits;
}
