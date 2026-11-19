import { tvRecord } from '@/lib/services/tvRecord';
import { db, handle } from '@/lib/server';

export const dynamic = 'force-dynamic';

/** Запись сделанного с ТВ: зарядка, тренировка, учёба, привычка, книга. */
export const POST = (req: Request) => handle(async () => tvRecord(db(), await req.json()));
