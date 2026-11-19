import { getConfig, loadFamily } from '@/lib/services/load';
import { buildState } from '@/lib/services/view';
import { db, getCtx, handle } from '@/lib/server';

export const dynamic = 'force-dynamic';

export const GET = () =>
  handle(async () => {
    const ctx = await getCtx();
    const { raw, family } = loadFamily(db());
    const cfg = getConfig(db());
    return buildState(raw, family, { memberId: ctx.memberId, parent: ctx.parent, cfg, pinSet: !!cfg.pinHash });
  });
