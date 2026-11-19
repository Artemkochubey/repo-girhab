'use client';
import { useEffect, useMemo, useRef } from 'react';

const MONTHS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
/** Уровни по очкам за тело (тренировка = минуты, зарядка = 10). */
export const heatLevel = (v: number) => (v <= 0 ? 0 : v < 20 ? 1 : v < 45 ? 2 : v < 90 ? 3 : 4);

interface Props { data: [string, number][]; today: string; selected: string | null; onSelect: (date: string) => void }

/** Календарь-тепловая карта за год: столбцы — недели, строки — дни недели (Пн сверху). */
export function YearHeat({ data, today, selected, onSelect }: Props) {
  const scroller = useRef<HTMLDivElement>(null);
  const { cells, weeks, months } = useMemo(() => {
    const first = new Date(data[0][0] + 'T00:00:00Z');
    const pad = (first.getUTCDay() + 6) % 7;
    const cells: ([string, number] | null)[] = [...Array(pad).fill(null), ...data];
    const weeks = Math.ceil(cells.length / 7);
    const months: { col: number; label: string }[] = [];
    let prev = -1;
    for (let w = 0; w < weeks; w++) {
      const c = cells.slice(w * 7, w * 7 + 7).find(Boolean);
      if (!c) continue;
      const m = new Date(c[0] + 'T00:00:00Z').getUTCMonth();
      if (m !== prev) { months.push({ col: w + 1, label: MONTHS[m] }); prev = m; }
    }
    return { cells, weeks, months };
  }, [data]);

  useEffect(() => { const e = scroller.current; if (e) e.scrollLeft = e.scrollWidth; }, [weeks]);

  return (
    <div className="yh">
      <div className="yh-days" aria-hidden><span>Пн</span><span /><span>Ср</span><span /><span>Пт</span><span /><span>Вс</span></div>
      <div className="yh-scroll" ref={scroller}>
        <div className="yh-months" style={{ gridTemplateColumns: `repeat(${weeks}, 13px)` }} aria-hidden>
          {months.map((m) => <span key={m.col} style={{ gridColumn: `${m.col} / span 3` }}>{m.label}</span>)}
        </div>
        <div className="yh-grid" style={{ gridTemplateColumns: `repeat(${weeks}, 13px)` }}>
          {cells.map((c, i) => c ? (
            <button key={i} className={`yh-cell l${heatLevel(c[1])} ${c[0] === selected ? 'sel' : ''} ${c[0] === today ? 'today' : ''}`}
              title={`${c[0]}: ${c[1] ? c[1] + ' очков за тело' : 'нет тренировок'}`} aria-label={`${c[0]}: ${c[1]} очков`} onClick={() => onSelect(c[0])} />
          ) : <i key={i} className="yh-cell blank" />)}
        </div>
      </div>
    </div>
  );
}

export function HeatLegend() {
  return (
    <div className="legend heat-legend" aria-hidden>
      <span>меньше</span>{[0, 1, 2, 3, 4].map((l) => <i key={l} className={`yh-cell l${l}`} />)}<span>больше</span>
    </div>
  );
}
