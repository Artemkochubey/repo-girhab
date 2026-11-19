import { loadFamily } from '@/lib/services/load';
import { tvState } from '@/lib/services/view';
import { db, handle } from '@/lib/server';

export const dynamic = 'force-dynamic';

export const GET = () => handle(() => { const { raw, family } = loadFamily(db()); return tvState(raw, family); });
