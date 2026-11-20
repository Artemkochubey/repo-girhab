import { loadFamily } from '@/lib/services/load';
import { tvState } from '@/lib/services/view';
import { db, handle } from '@/lib/server';
import { maybeAutoBackup } from '@/lib/services/backupService';

export const dynamic = 'force-dynamic';

export const GET = () => handle(() => { maybeAutoBackup(); const { raw, family } = loadFamily(db()); return tvState(raw, family); });
