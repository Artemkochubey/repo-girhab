import { addDays, isDate } from '@/lib/date';
import { loadFamily } from '@/lib/services/load';
import { ratingView } from '@/lib/services/view';
import { db, handle } from '@/lib/server';

export const dynamic = 'force-dynamic';

/** Рейтинг дня для всей семьи (как и ТВ, без входа). ?date=ГГГГ-ММ-ДД: любой из последних 30 дней, по умолчанию сегодня. */
export const GET = (req: Request) =>
  handle(() => {
    const { raw, family } = loadFamily(db());
    const q = new URL(req.url).searchParams.get('date');
    const date = q && isDate(q) && q <= family.today && q >= addDays(family.today, -30) ? q : family.today;
    return ratingView(raw, family, date);
  });
