import { addDays, isDate } from '@/lib/date';
import { loadFamily } from '@/lib/services/load';
import { ratingView, ratingWeekView } from '@/lib/services/view';
import { db, handle } from '@/lib/server';

export const dynamic = 'force-dynamic';

/** Рейтинг дня для всей семьи (как и ТВ, без входа). ?date=ГГГГ-ММ-ДД: любой из последних 30 дней, по умолчанию сегодня. */
export const GET = (req: Request) =>
  handle(() => {
    const { raw, family } = loadFamily(db());
    const sp = new URL(req.url).searchParams;
    // ?week=ГГГГ-ММ-ДД (любая дата недели): рейтинг недели, до 8 недель назад
    const w = sp.get('week');
    if (w) return ratingWeekView(raw, family, isDate(w) && w <= family.today && w >= addDays(family.today, -56) ? w : family.today);
    const q = sp.get('date');
    const date = q && isDate(q) && q <= family.today && q >= addDays(family.today, -30) ? q : family.today;
    return ratingView(raw, family, date);
  });
