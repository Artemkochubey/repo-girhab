import { dateAllowed, isDate } from '@/lib/date';
import { getConfig, loadFamily } from '@/lib/services/load';
import { buildState } from '@/lib/services/view';
import { db, getCtx, handle } from '@/lib/server';

export const dynamic = 'force-dynamic';

export const GET = (req: Request) =>
  handle(async () => {
    const ctx = await getCtx();
    const { raw, family } = loadFamily(db());
    const cfg = getConfig(db());
    const q = new URL(req.url).searchParams.get('date');
    const date = q && isDate(q) && dateAllowed(q, family.today, ctx.parent) ? q : undefined;
    return buildState(raw, family, { memberId: ctx.memberId, parent: ctx.parent, date, cfg: { minutes: cfg.minutes, superMinutes: cfg.superMinutes, timezone: cfg.timezone }, pinSet: !!cfg.pinHash });
  });
