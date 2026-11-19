'use client';
import { useEffect, useMemo, useState } from 'react';
import { BodyFigure, LoadLegend } from '@/components/BodyFigure';
import { useGame } from '@/components/Shell';
import { Chips, Heatmap, Section } from '@/components/ui';
import { addDays } from '@/lib/date';
import {
  CATEGORIES, CUSTOM_EXERCISE, EXERCISES, MUSCLES, exerciseById, intensityFloor, muscleIntensity, muscleLoads, muscleName,
  type ExerciseCategory, type MuscleId,
} from '@/lib/game/muscles';

const RANGES = [{ id: 'day', label: 'Сегодня', days: 1 }, { id: 'week', label: '7 дней', days: 7 }, { id: 'month', label: '30 дней', days: 30 }] as const;
type View = 'front' | 'back' | 'both';

export default function Body() {
  const { s, act, toast } = useGame();
  const d = s.detail!;
  const [range, setRange] = useState<(typeof RANGES)[number]['id']>('week');
  const [view, setView] = useState<View>('front');
  const [cat, setCat] = useState<ExerciseCategory>('Силовые');
  const [exercise, setExercise] = useState<string | null>(null);
  const [custom, setCustom] = useState<MuscleId[]>([]);
  const [hover, setHover] = useState<MuscleId | null>(null);

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
  const addWorkout = (minutes: number) => {
    if (exercise === CUSTOM_EXERCISE && !custom.length) { toast('Выберите мышцы на силуэте или тренировку из списка'); return; }
    return act('addWorkout', { minutes, exercise: exercise ?? undefined, muscles: exercise === CUSTOM_EXERCISE ? custom : undefined });
  };
  const info = hover ?? (exercise === CUSTOM_EXERCISE ? custom[custom.length - 1] : null) ?? null;
  const label = (e: { exercise: string | null; muscles: string[] | null }) => {
    const x = exerciseById(e.exercise);
    return x ? `${x.emoji} ${x.name}` : e.exercise === CUSTOM_EXERCISE ? `🎯 Свой набор: ${(e.muscles ?? []).map(muscleName).join(', ')}` : '🏃 Тренировка';
  };

  const figs = (['front', 'back'] as const).filter((v) => view === 'both' || view === v);
  const total = d.history.reduce((a, [, v]) => a + v, 0);
  const active = d.history.filter(([, v]) => v > 0).length;

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

      <Section title="Тренировка" right={<span className="muted">за день: {d.day.stats.workoutMinutes} мин</span>}>
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
        <Chips values={[15, 30, 45, 60, 90]} onPick={(n) => addWorkout(n)} />
        <ul className="list">
          {d.entries.workouts.map((w) => (
            <li key={w.id}>{label(w)} · {w.minutes} мин {s.parent && <button className="x" onClick={() => act('deleteEntry', { type: 'workout', id: w.id })}>✕</button>}</li>
          ))}
        </ul>
      </Section>

      <Section title="Зарядка">
        <button className={`btn ${d.day.stats.warmups ? '' : 'ghost'}`} onClick={() => act('toggleWarmup')}>
          {d.day.stats.warmups ? '✔ Сделана (снять — родитель)' : '○ Отметить зарядку (+10)'}
        </button>
      </Section>

      <Section title="Год по дням" right={<span className="muted">{active} активных дней · {total} очков</span>}>
        <Heatmap data={d.history as [string, number][]} />
      </Section>
    </>
  );
}
