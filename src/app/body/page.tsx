'use client';
import { useEffect, useMemo, useState } from 'react';
import { BodyFigure, LoadLegend } from '@/components/BodyFigure';
import { useGame } from '@/components/Shell';
import { Chips, Section } from '@/components/ui';
import { HeatLegend, YearHeat } from '@/components/YearHeat';
import { rpc } from '@/lib/client';
import { DAY_FULL, DAY_HALF, allocateWorkouts, nextRepPrice } from '@/lib/game/reps';
import { addDays } from '@/lib/date';
import {
  CATEGORIES, CUSTOM_EXERCISE, EXERCISES, MUSCLES, exerciseById, intensityFloor, muscleIntensity, muscleLoads, muscleName,
  type ExerciseCategory, type MuscleId,
} from '@/lib/game/muscles';

const RANGES = [{ id: 'day', label: 'Сегодня', days: 1 }, { id: 'week', label: '7 дней', days: 7 }, { id: 'month', label: '30 дней', days: 30 }] as const;
type View = 'front' | 'back' | 'both';
interface Row { id: number; date: string; minutes: number; reps: number | null; exercise: string | null; muscles: string[] | null; eq?: number }
const fmt = (n: number) => (Math.round(n * 10) / 10).toString().replace('.', ',');
/** «30 мин» или «40 раз · +8 оч.» */
const amount = (w: { minutes: number; reps: number | null; eq?: number }) => (w.reps ? `${w.reps} раз · +${fmt(w.eq ?? 0)} оч.` : `${w.minutes} мин`);

const dayTitle = (date: string, today: string) => {
  if (date === today) return 'Сегодня';
  if (date === addDays(today, -1)) return 'Вчера';
  return new Date(date + 'T00:00:00').toLocaleDateString('ru', { day: 'numeric', month: 'long', weekday: 'short' });
};

export default function Body() {
  const { s, act, toast } = useGame();
  const d = s.detail!;
  const [range, setRange] = useState<(typeof RANGES)[number]['id']>('day');
  const [view, setView] = useState<View>('front');
  const [cat, setCat] = useState<ExerciseCategory>('Силовые');
  const [exercise, setExerciseRaw] = useState<string | null>(null);
  const [unit, setUnit] = useState<'min' | 'reps'>('min');
  // при выборе упражнения со счётом по повторам сразу переключаемся на повторы
  const setExercise = (id: string | null) => { setExerciseRaw(id); setUnit(exerciseById(id)?.rep ? 'reps' : 'min'); };
  const [custom, setCustom] = useState<MuscleId[]>([]);
  const [hover, setHover] = useState<MuscleId | null>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [shown, setShown] = useState(10);
  const [all, setAll] = useState<{ workouts: Row[]; warmups: { id: number; date: string }[] } | null>(null);

  // Вся история тренировок: перечитываем, когда записи меняются
  useEffect(() => {
    let off = false;
    rpc<{ workouts: Row[]; warmups: { id: number; date: string }[] }>('listEntries').then((r) => { if (!off) setAll(r); }).catch(() => {});
    return () => { off = true; };
  }, [d.xp, d.workoutLog.length, d.entries.workouts.length, d.day.stats.warmups]);

  const byDate = useMemo(() => {
    const m = new Map<string, { minutes: number; items: Row[]; warmup: { id: number } | null }>();
    const get = (date: string) => { let x = m.get(date); if (!x) m.set(date, (x = { minutes: 0, items: [], warmup: null })); return x; };
    for (const w of allocateWorkouts(all?.workouts ?? [])) { const x = get(w.date); x.items.push(w); x.minutes += w.eq; }
    for (const w of all?.warmups ?? []) get(w.date).warmup = { id: w.id };
    for (const x of m.values()) x.items.sort((a, b) => b.id - a.id);
    return m;
  }, [all]);
  const historyDays = useMemo(() => [...byDate.keys()].sort().reverse(), [byDate]);

  useEffect(() => { if (window.innerWidth >= 700) setView('both'); }, []);

  const days = RANGES.find((r) => r.id === range)!.days;
  const loads = useMemo(() => muscleLoads(d.workoutLog, addDays(s.today, -(days - 1)), s.today), [d.workoutLog, s.today, days]);
  const intensity = useMemo(() => muscleIntensity(loads, intensityFloor(days)), [loads, days]);
  const top = useMemo(() => MUSCLES.map((m) => ({ ...m, load: loads[m.id] })).filter((m) => m.load > 0).sort((a, b) => b.load - a.load).slice(0, 5), [loads]);

  const ex = exerciseById(exercise);
  const selected = useMemo(() => new Set<MuscleId>(exercise === CUSTOM_EXERCISE ? custom : ex ? (Object.keys(ex.w) as MuscleId[]) : []), [exercise, custom, ex]);

  const pick = (m: MuscleId) => {
    if (exercise !== CUSTOM_EXERCISE) { setExercise(CUSTOM_EXERCISE); setCustom([m]); return; }
    setCustom((c) => (c.includes(m) ? c.filter((x) => x !== m) : [...c, m]));
  };
  const repMode = unit === 'reps' && !!ex?.rep;
  const addWorkout = (n: number) => {
    if (exercise === CUSTOM_EXERCISE && !custom.length) { toast('Выберите мышцы на силуэте или тренировку из списка'); return; }
    if (repMode && n > ex!.rep!.max) { toast(`За один подход можно записать не больше ${ex!.rep!.max} раз`); return; }
    const args = repMode ? { reps: n } : { minutes: n };
    return act('addWorkout', { ...args, exercise: exercise ?? undefined, muscles: exercise === CUSTOM_EXERCISE ? custom : undefined });
  };
  // сколько очков за повторы уже засчитано сегодня и сколько ещё можно получить
  const repsToday = d.entries.workouts.filter((w) => w.reps);
  const price = exercise ? nextRepPrice(repsToday, exercise) : null;
  const info = hover ?? (exercise === CUSTOM_EXERCISE ? custom[custom.length - 1] : null) ?? null;
  const label = (e: { exercise: string | null; muscles: string[] | null }) => {
    const x = exerciseById(e.exercise);
    return x ? `${x.emoji} ${x.name}` : e.exercise === CUSTOM_EXERCISE ? `🎯 Свой набор: ${(e.muscles ?? []).map(muscleName).join(', ')}` : '🏃 Тренировка';
  };

  const figs = (['front', 'back'] as const).filter((v) => view === 'both' || view === v);
  const active = d.bodyHistory.filter(([, v]) => v > 0).length;

  const DayBlock = ({ date, always }: { date: string; always?: boolean }) => {
    const x = byDate.get(date);
    if (!x && !always) return null;
    return (
      <div className="hday">
        <div className="hhead"><b>{dayTitle(date, s.today)}{d.reviewDates.includes(date) && <span className="flag" title="Необычно много: родитель посмотрит"> 🔎</span>}</b><span className="muted">{x ? `${fmt(x.minutes)} оч.${x.warmup ? ' · 🔥 зарядка' : ''}` : 'тренировок нет'}</span></div>
        <ul className="list">
          {x?.items.map((w) => (
            <li key={w.id}>{label(w)} · {amount(w)} {s.parent && <button className="x" onClick={() => act('deleteEntry', { type: 'workout', id: w.id })} aria-label="Удалить запись">✕</button>}</li>
          ))}
          {x?.warmup && <li>🔥 Зарядка {s.parent && <button className="x" onClick={() => act('deleteEntry', { type: 'warmup', id: x.warmup!.id })} aria-label="Удалить зарядку">✕</button>}</li>}
        </ul>
      </div>
    );
  };

  return (
    <>
      <h1 className="title">💪 Тело</h1>

      <Section title="Нагрузка на мышцы" right={<div className="row">{RANGES.map((r) => <button key={r.id} className={`btn ${range === r.id ? '' : 'ghost'} sm`} onClick={() => setRange(r.id)}>{r.label}</button>)}</div>}>
        <div className="row wrapRow">
          {([['front', 'Спереди'], ['back', 'Сзади'], ['both', 'Обе стороны']] as const).map(([v, l]) => (
            <button key={v} className={`btn ${view === v ? '' : 'ghost'} sm`} onClick={() => setView(v)}>{l}</button>
          ))}
        </div>
        <div className="figs">
          {figs.map((v) => <BodyFigure key={v} view={v} intensity={intensity} selected={selected} hover={hover} onPick={pick} onHover={setHover} />)}
        </div>
        <LoadLegend />
        <p className="muscle-info" aria-live="polite">
          {info ? <><b>{muscleName(info)}</b> · нагрузка за период: {Math.round(loads[info])}{selected.has(info) ? ' · выбрана для тренировки' : ''}</> : 'Нажмите на мышцу, чтобы выбрать её для тренировки'}
        </p>
        {top.length > 0
          ? <ul className="top-muscles">{top.map((m) => <li key={m.id}><span>{m.name}</span><i style={{ width: `${Math.round((intensity[m.id] ?? 0) * 100)}%` }} /></li>)}</ul>
          : <p className="muted small">За выбранный период нагрузки нет. Запишите тренировку с выбором упражнения — мышцы начнут краснеть.</p>}
      </Section>

      <Section title="Тренировка" right={<span className="muted">за день: {fmt(d.day.stats.workoutMinutes)} оч.</span>}>
        <div className="row wrapRow">
          {CATEGORIES.map((c) => <button key={c} className={`btn ${cat === c && exercise !== CUSTOM_EXERCISE ? '' : 'ghost'} sm`} onClick={() => { setCat(c); if (exercise === CUSTOM_EXERCISE) setExercise(null); }}>{c}</button>)}
          <button className={`btn ${exercise === CUSTOM_EXERCISE ? '' : 'ghost'} sm`} onClick={() => { setExercise(exercise === CUSTOM_EXERCISE ? null : CUSTOM_EXERCISE); setCustom([]); }}>🎯 Свои мышцы</button>
        </div>
        {exercise !== CUSTOM_EXERCISE && (
          <div className="exgrid">
            {EXERCISES.filter((e) => e.cat === cat).map((e) => (
              <button key={e.id} className={`ex ${exercise === e.id ? 'on' : ''}`} aria-pressed={exercise === e.id} onClick={() => setExercise(exercise === e.id ? null : e.id)}>
                <span>{e.emoji}</span><b>{e.name}</b>
              </button>
            ))}
          </div>
        )}
        {exercise === CUSTOM_EXERCISE && <p className="muted">Нажимайте на мышцы на силуэте выше — они подсветятся золотом. Выбрано: {custom.length ? custom.map(muscleName).join(', ') : 'ничего'}.</p>}
        {ex && <p className="muted">Работают: {Object.entries(ex.w).sort((a, b) => b[1]! - a[1]!).map(([m]) => muscleName(m)).join(', ')}.</p>}
        {!exercise && <p className="muted small">Выберите упражнение или свои мышцы, чтобы нагрузка попала на силуэт. Можно записать и просто минуты без выбора.</p>}
        {ex?.rep && (
          <div className="row wrapRow">
            <button className={`btn ${repMode ? '' : 'ghost'} sm`} onClick={() => setUnit('reps')}>🔢 Повторы</button>
            <button className={`btn ${repMode ? 'ghost' : ''} sm`} onClick={() => setUnit('min')}>⏱ Минуты</button>
          </div>
        )}
        {repMode && ex?.rep && (
          <p className="repinfo">
            <b>1 раз = {fmt(ex.rep.pts)} очка.</b> До {ex.rep.soft} раз за день по полной цене, до {ex.rep.hard} — за половину, дальше за четверть. Первые {DAY_FULL} очков за повторы за день идут по полной цене, до {DAY_HALF} — за половину, дальше за четверть. Лимита нет, но чем больше накручиваешь, тем меньше выгода.
            За подход — не больше {ex.rep.max}. Сейчас следующий повтор стоит {price ? `${price.perRep.toFixed(2).replace('.', ',')} очка (${price.percent}% цены)` : fmt(ex.rep.pts)}, за все повторы сегодня: {fmt(price?.dayPoints ?? 0)} оч.
          </p>
        )}
        {repMode
          ? <Chips key="reps" values={[10, 20, 30, 50]} unit="раз" onPick={(n) => addWorkout(n)} />
          : <Chips key="min" values={[15, 30, 45, 60, 90]} onPick={(n) => addWorkout(n)} />}
        <ul className="list">
          {d.entries.workouts.map((w) => (
            <li key={w.id}>{label(w)} · {amount(w)} {s.parent && <button className="x" onClick={() => act('deleteEntry', { type: 'workout', id: w.id })}>✕</button>}</li>
          ))}
        </ul>
      </Section>

      <Section title="Зарядка">
        <button className={`btn ${d.day.stats.warmups ? '' : 'ghost'}`} onClick={() => act('toggleWarmup')}>
          {d.day.stats.warmups ? '✔ Сделана (снять — родитель)' : '○ Отметить зарядку (+10)'}
        </button>
      </Section>

      <Section title="История тренировок" right={<span className="muted">{historyDays.length ? `${historyDays.length} дн. с занятиями` : ''}</span>}>
        {!all && <p className="muted">Загрузка…</p>}
        {all && historyDays.length === 0 && <p className="muted">Тренировок пока нет. Запишите первую выше — она появится здесь.</p>}
        {historyDays.slice(0, shown).map((date) => <DayBlock key={date} date={date} />)}
        {historyDays.length > shown && <button className="btn ghost" onClick={() => setShown(shown + 10)}>Показать ещё</button>}
      </Section>

      <Section title="Год по дням" right={<span className="muted">{active} активных дней</span>}>
        <YearHeat data={d.bodyHistory as [string, number][]} today={s.today} selected={sel} onSelect={(x) => setSel(sel === x ? null : x)} />
        <HeatLegend />
        <p className="muted small">Очки за тело: минуты тренировок и 10 за зарядку. Нажмите на день, чтобы увидеть, что было.</p>
        {sel && <DayBlock date={sel} always />}
      </Section>
    </>
  );
}
