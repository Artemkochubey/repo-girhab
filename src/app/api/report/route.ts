import { isDate } from '@/lib/date';
import { weekStart } from '@/lib/game/boss';
import { HttpError } from '@/lib/services/actions';
import { loadFamily } from '@/lib/services/load';
import { buildReport } from '@/lib/services/report';
import { db, getCtx, handle } from '@/lib/server';

export const dynamic = 'force-dynamic';

/** Недельный отчёт: только режим родителя. ?week=YYYY-MM-DD (любой день нужной недели). */
export const GET = (req: Request) =>
  handle(async () => {
    const ctx = await getCtx();
    if (!ctx.parent) throw new HttpError(403, 'Нужен PIN родителя');
    const { raw, family } = loadFamily(db());
    const q = new URL(req.url).searchParams.get('week');
    const requested = q && isDate(q) ? weekStart(q) : weekStart(family.today);
    const week = requested > weekStart(family.today) ? weekStart(family.today) : requested;
    return buildReport(raw, family, week);
  });
