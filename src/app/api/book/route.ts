import { loadFamily } from '@/lib/services/load';
import { bookView } from '@/lib/services/view';
import { db, handle } from '@/lib/server';

export const dynamic = 'force-dynamic';

/** Данные для печатной «Книги достижений» (для всей семьи, как и ТВ, без входа). */
export const GET = () => handle(() => { const { raw, family } = loadFamily(db()); return bookView(raw, family); });
