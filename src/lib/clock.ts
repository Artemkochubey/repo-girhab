/** Текущий час (0–23) в часовом поясе семьи. */
export function hourIn(timeZone: string, now = new Date()): number {
  try {
    const h = new Intl.DateTimeFormat('en', { timeZone, hour: 'numeric', hourCycle: 'h23' }).formatToParts(now).find((p) => p.type === 'hour')?.value;
    return Number(h) % 24;
  } catch { return now.getHours(); }
}
