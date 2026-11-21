import { describe, it, expect } from 'vitest';
import { readTVPreference } from './tvMode';

describe('ТВ-режим по умолчанию', () => {
  it('без настроек включён', () => { expect(readTVPreference('', null)).toBe(true); });
  it('мышиный режим выбирается адресом или запоминается', () => {
    expect(readTVPreference('?tv=0', null)).toBe(false);
    expect(readTVPreference('?tv=off', null)).toBe(false);
    expect(readTVPreference('', '0')).toBe(false);
  });
  it('?tv=1 включает ТВ-режим, даже если раньше выбрали мышь', () => {
    expect(readTVPreference('?tv=1', '0')).toBe(true);
    expect(readTVPreference('?tv=on', '0')).toBe(true);
  });
});
