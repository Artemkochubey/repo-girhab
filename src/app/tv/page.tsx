'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { APP_EMOJI, APP_NAME, APP_VERSION } from '@/lib/brand';
import { hourIn } from '@/lib/clock';
import { TV_AUTO, TV_INTERVALS, TV_SLIDES, dayPhase, isSlide, stepSlide, tvEvents, tvHighlights, type TvEvent, type TvSlideId } from '@/lib/tvLogic';
import type { Tv } from '@/lib/tvTypes';
import { BattlesSlide, BossSlide, HeroesSlide, MountainSlide, OverviewSlide, QuestsSlide, RatingSlide, RecordSlide, SeasonSlide, WeekSlide } from './slides';
import { playSound, setSoundEnabled, soundEnabled } from '@/lib/sound';
import './tv.css';

const STORE = 'mr_tv';
const SCALES = [0.8, 0.9, 1, 1.15, 1.3] as const;
const PAUSE_MS = 45000;

interface Prefs { auto: boolean; slide: TvSlideId; interval: number; scale: number }
const DEFAULTS: Prefs = { auto: true, slide: 'overview', interval: 20, scale: 1 };
const readPrefs = (): Prefs => {
  try {
    const j = JSON.parse(localStorage.getItem(STORE) ?? '{}') as Partial<Prefs>;
    return {
      auto: j.auto !== false, slide: isSlide(j.slide) ? j.slide : DEFAULTS.slide,
      interval: (TV_INTERVALS as readonly number[]).includes(j.interval ?? 0) ? j.interval! : DEFAULTS.interval,
      scale: (SCALES as readonly number[]).includes(j.scale ?? 0) ? j.scale! : DEFAULTS.scale,
    };
  } catch { return DEFAULTS; }
};

export default function TvPage() {
  const [d, setD] = useState<Tv | null>(null);
  const [off, setOff] = useState(false);
  const [who, setWho] = useState<number | null>(null);
  const [note, setNote] = useState('');
  const [prefs, setPrefs] = useState<Prefs>(DEFAULTS);
  const [paused, setPaused] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [tick, setTick] = useState(0);
  const [cheer, setCheer] = useState<TvEvent | null>(null);
  const [idle, setIdle] = useState(false);
  const [sound, setSound] = useState(false);
  useEffect(() => { setSound(soundEnabled()); }, []);
  const prev = useRef<Tv | null>(null);
  const queue = useRef<TvEvent[]>([]);
  const pauseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setPrefs(readPrefs()); }, []);
  const save = (p: Partial<Prefs>) => setPrefs((cur) => { const n = { ...cur, ...p }; try { localStorage.setItem(STORE, JSON.stringify(n)); } catch { /* без хранилища настройки не запомнятся */ } return n; });

  // --- загрузка данных и поздравления ---
  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/tv', { cache: 'no-store' });
      if (!r.ok) throw 0;
      const next = (await r.json()) as Tv;
      const ev = tvEvents(prev.current, next);
      prev.current = next;
      if (ev.length) { queue.current.push(...ev); setTick((t) => t + 1); }
      setD(next); setOff(false);
    } catch { setOff(true); }
  }, []);
  useEffect(() => { load(); const t = setInterval(load, 10000); return () => clearInterval(t); }, [load]);
  useEffect(() => {
    if (cheer || !queue.current.length) return;
    const ev = queue.current.shift()!;
    setCheer(ev);
    playSound(!ev.big ? 'ok' : ev.emoji === '🏆' || ev.emoji === '🐉' ? 'win' : 'levelup');
    const t = setTimeout(() => setCheer(null), ev.big ? 6000 : 3500);
    return () => clearTimeout(t);
  }, [cheer, tick]);

  // --- часы ---
  useEffect(() => { const t = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(t); }, []);
  const tz = d?.timezone ?? 'Asia/Novosibirsk';
  const hour = hourIn(tz, now);
  const clock = useMemo(() => {
    try {
      return {
        time: new Intl.DateTimeFormat('ru', { timeZone: tz, hour: '2-digit', minute: '2-digit' }).format(now),
        date: new Intl.DateTimeFormat('ru', { timeZone: tz, weekday: 'long', day: 'numeric', month: 'long' }).format(now),
      };
    } catch { return { time: now.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' }), date: '' }; }
  }, [now, tz]);

  // --- смена экранов ---
  const list = TV_AUTO;
  const hasData = d !== null; // данные обновляются каждые 10 с, это не должно сбрасывать таймер смены экрана
  const slide: TvSlideId = prefs.auto && prefs.slide === 'record' ? 'overview' : prefs.slide;
  const stopAuto = useCallback(() => { if (pauseTimer.current) clearTimeout(pauseTimer.current); setPaused(false); }, []);
  const go = (s: TvSlideId) => { stopAuto(); save({ slide: s, auto: false }); };
  const step = (dir: 1 | -1) => { stopAuto(); save({ slide: stepSlide(slide, dir, prefs.auto ? list : TV_SLIDES.map((x) => x.id)) }); };
  useEffect(() => {
    if (!prefs.auto || paused || !hasData) return;
    const t = setTimeout(() => setPrefs((cur) => ({ ...cur, slide: stepSlide(cur.slide === 'record' ? 'overview' : cur.slide, 1, list) })), prefs.interval * 1000);
    return () => clearTimeout(t);
  }, [prefs.auto, prefs.slide, prefs.interval, paused, hasData, list]);

  // любое действие у экрана ставит автосмену на паузу, чтобы не уйти с экрана посреди записи
  const touch = useCallback(() => {
    setIdle(false);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setIdle(true), 6000);
    if (!prefs.auto) return;
    setPaused(true);
    if (pauseTimer.current) clearTimeout(pauseTimer.current);
    pauseTimer.current = setTimeout(() => setPaused(false), PAUSE_MS);
  }, [prefs.auto]);
  useEffect(() => { idleTimer.current = setTimeout(() => setIdle(true), 6000); return () => { if (idleTimer.current) clearTimeout(idleTimer.current); if (pauseTimer.current) clearTimeout(pauseTimer.current); }; }, []);

  // --- пульт: стрелки двигают фокус, PageUp/PageDown и N/P листают экраны, пробел переключает автосмену ---
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      touch();
      if (e.key === 'PageDown' || e.key === 'n' || e.key === 'N' || e.key === 'MediaTrackNext') { step(1); e.preventDefault(); return; }
      if (e.key === 'PageUp' || e.key === 'p' || e.key === 'P' || e.key === 'MediaTrackPrevious') { step(-1); e.preventDefault(); return; }
      if (e.key === ' ' && !(document.activeElement instanceof HTMLButtonElement)) { save({ auto: !prefs.auto }); e.preventDefault(); return; }
      const keys: Record<string, number> = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
      if (!(e.key in keys)) return;
      const els = [...document.querySelectorAll<HTMLButtonElement>('button[data-tv]:not(:disabled)')];
      if (!els.length) return;
      const i = els.indexOf(document.activeElement as HTMLButtonElement);
      els[(i + keys[e.key]! + els.length) % els.length]!.focus();
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('pointerdown', touch);
    window.addEventListener('pointermove', touch);
    return () => { window.removeEventListener('keydown', onKey); window.removeEventListener('pointerdown', touch); window.removeEventListener('pointermove', touch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [touch, slide, prefs.auto]);

  // не давать экрану гаснуть
  useEffect(() => {
    let lock: { release: () => Promise<void> } | null = null;
    const get = async () => { try { lock = await (navigator as unknown as { wakeLock?: { request: (t: string) => Promise<{ release: () => Promise<void> }> } }).wakeLock?.request('screen') ?? null; } catch { /* не поддерживается */ } };
    get();
    const vis = () => { if (document.visibilityState === 'visible') get(); };
    document.addEventListener('visibilitychange', vis);
    return () => { document.removeEventListener('visibilitychange', vis); lock?.release().catch(() => {}); };
  }, []);

  const fullscreen = () => { try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); } catch { /* ignore */ } };

  const mark = async (memberId: number, index: number) => {
    await fetch('/api/tv/mark', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ memberId, index }) });
    load();
  };
  // Запись сделанного: зарядка, тренировка, учёба, привычка, книга
  const record = async (body: Record<string, unknown>, okText: string) => {
    try {
      const r = await fetch('/api/tv/record', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ memberId: who, ...body }) });
      const j = await r.json();
      setNote(r.ok ? `✔ ${okText}` : `✖ ${j.error ?? 'Не получилось'}`);
    } catch { setNote('✖ Нет связи с сервером'); }
    setTimeout(() => setNote(''), 4000);
    load();
  };

  // бегущая строка
  const lines = useMemo(() => (d ? tvHighlights(d, hour) : []), [d, hour]);
  const [li, setLi] = useState(0);
  useEffect(() => { const t = setInterval(() => setLi((x) => x + 1), 7000); return () => clearInterval(t); }, []);

  if (!d) return <div className="tv"><p className="tv-load">Загрузка…</p></div>;
  const line = lines.length ? lines[li % lines.length] : '';

  return (
    <div className={`tv ${idle ? 'idle' : ''}`} data-phase={dayPhase(hour)} style={{ ['--tv-scale' as string]: prefs.scale }}>
      {off && <div className="tv-off">Нет связи с сервером…</div>}
      {cheer && (
        <div className={`tv-cheer ${cheer.big ? 'big' : 'small'}`} role="status" aria-live="polite" key={cheer.id}>
          {cheer.big && <div className="tv-confetti" aria-hidden>{Array.from({ length: 18 }, (_, i) => <i key={i} style={{ left: `${(i * 37) % 100}%`, animationDelay: `${(i % 6) * 0.25}s` }}>{['🎉', '✨', '⭐', '🎊'][i % 4]}</i>)}</div>}
          <span className="tv-cheer-e">{cheer.emoji}</span><b>{cheer.text}</b>
        </div>
      )}

      <header className="tv-head">
        <div className="tv-brand"><b>{APP_EMOJI} {APP_NAME}</b><small>демо v{APP_VERSION}</small></div>
        <div className="tv-clock"><b>{clock.time}</b><small>{clock.date}</small></div>
      </header>

      <nav className="tv-tabs" aria-label="Экраны">
        <button data-tv className={`tv-tab auto ${prefs.auto ? 'on' : ''}`} onClick={() => save({ auto: !prefs.auto, slide: prefs.slide === 'record' ? 'overview' : prefs.slide })} aria-pressed={prefs.auto}>
          {prefs.auto ? (paused ? '⏸ Пауза' : '▶ Авто') : '▶ Авто'}
        </button>
        {TV_SLIDES.map((s) => (
          <button key={s.id} data-tv className={`tv-tab ${slide === s.id ? 'cur' : ''}`} aria-current={slide === s.id ? 'page' : undefined} onClick={() => go(s.id)}>
            <span>{s.emoji}</span><b>{s.label}</b>
          </button>
        ))}
        <span className="tv-tools">
          <button data-tv className="tv-tab sm" onClick={() => save({ interval: TV_INTERVALS[(TV_INTERVALS.indexOf(prefs.interval as (typeof TV_INTERVALS)[number]) + 1) % TV_INTERVALS.length]! })} title="Как часто меняется экран">⏱ {prefs.interval} с</button>
          <button data-tv className="tv-tab sm" onClick={() => save({ scale: SCALES[Math.max(0, SCALES.indexOf(prefs.scale as (typeof SCALES)[number]) - 1)]! })} aria-label="Мельче">A−</button>
          <button data-tv className="tv-tab sm" onClick={() => save({ scale: SCALES[Math.min(SCALES.length - 1, SCALES.indexOf(prefs.scale as (typeof SCALES)[number]) + 1)]! })} aria-label="Крупнее">A+</button>
          <button data-tv className="tv-tab sm" onClick={() => { const on = !sound; setSoundEnabled(on); setSound(on); if (on) playSound('levelup', true); }} aria-pressed={sound} aria-label={sound ? 'Выключить звук' : 'Включить звук'}>{sound ? '🔊' : '🔇'}</button>
          <button data-tv className="tv-tab sm" onClick={fullscreen} aria-label="Во весь экран">⛶</button>
        </span>
      </nav>
      <div className="tv-timer" aria-hidden>{prefs.auto && !paused && <i key={`${slide}:${prefs.interval}`} style={{ animationDuration: `${prefs.interval}s` }} />}</div>

      <main className="tv-stage" key={slide}>
        {slide === 'overview' && <OverviewSlide d={d} />}
        {slide === 'heroes' && <HeroesSlide d={d} />}
        {slide === 'boss' && <BossSlide d={d} />}
        {slide === 'battles' && <BattlesSlide d={d} />}
        {slide === 'mountain' && <MountainSlide d={d} />}
        {slide === 'rating' && <RatingSlide d={d} />}
        {slide === 'week' && <WeekSlide d={d} />}
        {slide === 'season' && <SeasonSlide d={d} />}
        {slide === 'quests' && <QuestsSlide d={d} mark={mark} />}
        {slide === 'record' && <RecordSlide d={d} who={who} setWho={setWho} note={note} record={record} />}
      </main>

      <footer className="tv-ticker" aria-live="off"><span key={li}>{line}</span></footer>
    </div>
  );
}
