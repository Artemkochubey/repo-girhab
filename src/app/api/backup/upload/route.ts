import { handle } from '@/lib/server';
import { getCtx } from '@/lib/server';
import { HttpError } from '@/lib/services/actions';
import { saveUploaded } from '@/lib/services/backupService';

export const dynamic = 'force-dynamic';
const MAX = 200 * 1024 * 1024;

/** POST (тело — сам файл базы): проверка и добавление в список копий (родитель). Восстановление — отдельным шагом с подтверждением. */
export const POST = (req: Request) => handle(async () => {
  if (!(await getCtx()).parent) throw new HttpError(403, 'Нужен PIN родителя');
  const len = Number(req.headers.get('content-length') ?? 0);
  if (len > MAX) throw new HttpError(413, 'Файл слишком большой');
  const bytes = new Uint8Array(await req.arrayBuffer());
  if (!bytes.length) throw new HttpError(400, 'Пустой файл');
  return { name: saveUploaded(bytes) };
});
