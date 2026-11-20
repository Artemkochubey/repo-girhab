import { dateAllowed, isDate } from '@/lib/date';
import { getConfig, loadFamily } from '@/lib/services/load';
import { adminView, buildState } from '@/lib/services/view';
import { db, getCtx, handle } from '@/lib/server';
import { maybeAutoBackup } from '@/lib/services/backupService';

export const dynamic = 'force-dynamic';

export const GET = (req: Request) =>
  handle(async () => {
    const ctx = await getCtx();
    maybeAutoBackup();
    const { raw, family } = loadFamily(db());
    const cfg = getConfig(db());
    const q = new URL(req.url).searchParams.get('date');
    const date = q && isDate(q) && dateAllowed(q, family.today, ctx.parent) ? q : undefined;
    return buildState(raw, family, { memberId: ctx.memberId, parent: ctx.parent, date, cfg: { minutes: cfg.minutes, superMinutes: cfg.superMinutes, timezone: cfg.timezone, reminderHour: cfg.reminderHour }, pinSet: !!cfg.pinHash,
      admin: ctx.parent ? adminView(raw, family, { loot: cfg.loot, lootRare: cfg.lootRare, lootLegend: cfg.lootLegend, questSets: cfg.questSets }) : undefined });
  });
