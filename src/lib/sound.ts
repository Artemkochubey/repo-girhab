/** Звуки игры: короткие мелодии, которые браузер рисует сам (файлов нет). По умолчанию выключены, включаются на каждом устройстве отдельно. */
export type SoundKind = 'ok' | 'deed' | 'chest' | 'levelup' | 'win' | 'hit' | 'tap';
export interface Note { f: number; at: number; dur: number; type?: OscillatorType; vol?: number }

const N = { C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880, C6: 1046.5, E6: 1318.5, G6: 1568, G4: 392, C4: 261.63, E4: 329.63, A4: 440 };
export const SOUNDS: Record<SoundKind, Note[]> = {
  tap: [{ f: N.E5, at: 0, dur: 0.06, vol: 0.5 }],
  ok: [{ f: N.G5, at: 0, dur: 0.09 }, { f: N.C6, at: 0.09, dur: 0.16 }],
  deed: [{ f: N.C5, at: 0, dur: 0.1 }, { f: N.E5, at: 0.1, dur: 0.1 }, { f: N.G5, at: 0.2, dur: 0.1 }, { f: N.C6, at: 0.3, dur: 0.22 }],
  chest: [{ f: N.C5, at: 0, dur: 0.12, type: 'triangle' }, { f: N.E5, at: 0.12, dur: 0.12, type: 'triangle' }, { f: N.G5, at: 0.24, dur: 0.12, type: 'triangle' }, { f: N.C6, at: 0.36, dur: 0.12, type: 'triangle' }, { f: N.E6, at: 0.48, dur: 0.12, type: 'triangle' }, { f: N.G6, at: 0.6, dur: 0.4, type: 'triangle' }],
  levelup: [{ f: N.C5, at: 0, dur: 0.14 }, { f: N.E5, at: 0.14, dur: 0.14 }, { f: N.G5, at: 0.28, dur: 0.14 }, { f: N.C6, at: 0.42, dur: 0.14 }, { f: N.G5, at: 0.56, dur: 0.1 }, { f: N.C6, at: 0.66, dur: 0.5 }],
  win: [{ f: N.G4, at: 0, dur: 0.12, type: 'square', vol: 0.5 }, { f: N.C5, at: 0.12, dur: 0.12, type: 'square', vol: 0.5 }, { f: N.E5, at: 0.24, dur: 0.12, type: 'square', vol: 0.5 }, { f: N.G5, at: 0.36, dur: 0.3, type: 'square', vol: 0.5 }, { f: N.E5, at: 0.66, dur: 0.1, type: 'square', vol: 0.5 }, { f: N.G5, at: 0.76, dur: 0.5, type: 'square', vol: 0.5 }],
  hit: [{ f: 180, at: 0, dur: 0.08, type: 'sawtooth', vol: 0.6 }, { f: 110, at: 0.05, dur: 0.12, type: 'sawtooth', vol: 0.6 }],
};

const KEY = 'mr_sound';
export const soundEnabled = (): boolean => { try { return localStorage.getItem(KEY) === '1'; } catch { return false; } };
export const setSoundEnabled = (on: boolean): void => { try { if (on) localStorage.setItem(KEY, '1'); else localStorage.removeItem(KEY); } catch { /* без хранилища звук не запомнится */ } };

let ctx: AudioContext | null = null;
/** Сыграть звук. Ничего не делает, если звук выключен или браузер не умеет. Первый вызов должен идти из нажатия (правило браузеров). */
export function playSound(kind: SoundKind, force = false): void {
  if (!force && !soundEnabled()) return;
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx ??= new AC();
    if (ctx.state === 'suspended') void ctx.resume();
    const t0 = ctx.currentTime + 0.01;
    for (const n of SOUNDS[kind]) {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = n.type ?? 'sine'; o.frequency.value = n.f;
      const v = (n.vol ?? 1) * 0.12;
      g.gain.setValueAtTime(0.0001, t0 + n.at);
      g.gain.exponentialRampToValueAtTime(v, t0 + n.at + 0.015);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + n.at + n.dur);
      o.connect(g); g.connect(ctx.destination);
      o.start(t0 + n.at); o.stop(t0 + n.at + n.dur + 0.02);
    }
  } catch { /* звук не обязателен */ }
}

/** Какой звук сыграть после действия (по имени и ответу сервера); null — молчим. */
export function soundFor(action: string, result: unknown): SoundKind | null {
  const r = (result ?? {}) as { counted?: boolean; ok?: boolean };
  switch (action) {
    case 'openChest': return 'chest';
    case 'addDeed': return r.counted === false ? 'tap' : 'deed';
    case 'addWorkout': case 'addStudy': case 'recordWarmup': case 'toggleWarmup': case 'addBook': case 'recordHabit': case 'toggleHabit': case 'markQuest': case 'buyTalent': case 'useAbility': case 'equipGear': return 'ok';
    default: return null;
  }
}
