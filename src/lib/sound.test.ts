import { describe, expect, it } from 'vitest';
import { SOUNDS, soundFor, type SoundKind } from './sound';

describe('звуки', () => {
  it('у каждого звука есть ноты с допустимой частотой и временем, звук короче двух секунд', () => {
    for (const [k, notes] of Object.entries(SOUNDS) as [SoundKind, (typeof SOUNDS)[SoundKind]][]) {
      expect(notes.length, k).toBeGreaterThan(0);
      for (const n of notes) { expect(n.f).toBeGreaterThan(50); expect(n.f).toBeLessThan(4000); expect(n.at).toBeGreaterThanOrEqual(0); expect(n.dur).toBeGreaterThan(0); }
      expect(Math.max(...notes.map((n) => n.at + n.dur)), k).toBeLessThan(2);
    }
  });
  it('какой звук после какого действия', () => {
    expect(soundFor('openChest', {})).toBe('chest');
    expect(soundFor('addDeed', { counted: true })).toBe('deed');
    expect(soundFor('addDeed', { counted: false })).toBe('tap');
    expect(soundFor('addWorkout', { ok: true })).toBe('ok');
    expect(soundFor('setConfig', {})).toBeNull();
    expect(soundFor('nope', undefined)).toBeNull();
  });
});
