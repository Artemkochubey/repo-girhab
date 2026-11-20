/** Чтение вслух средствами браузера (русский голос, если он есть в системе). */
export const canSpeak = (): boolean => typeof window !== 'undefined' && 'speechSynthesis' in window && typeof SpeechSynthesisUtterance !== 'undefined';

export function speak(text: string): boolean {
  if (!canSpeak()) return false;
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ru-RU'; u.rate = 0.9; u.pitch = 1.1;
    const v = synth.getVoices().find((x) => x.lang.toLowerCase().startsWith('ru'));
    if (v) u.voice = v;
    synth.speak(u);
    return true;
  } catch { return false; }
}
export const stopSpeaking = (): void => { try { if (canSpeak()) window.speechSynthesis.cancel(); } catch { /* ignore */ } };
