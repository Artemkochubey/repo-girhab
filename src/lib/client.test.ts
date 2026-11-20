import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiError, MSG_OFFLINE, MSG_SERVER, MSG_UNREADABLE, post, rpc } from './client';

const reply = (status: number, body: unknown) => vi.fn(async () => ({ ok: status < 400, status, json: async () => { if (body === undefined) throw new Error('не JSON'); return body; } }) as unknown as Response);
const run = async (p: Promise<unknown>) => { try { await p; return null; } catch (e) { return e as ApiError; } };

afterEach(() => vi.unstubAllGlobals());

describe('понятные ошибки обращения к серверу', () => {
  it('нет сети: сообщение про связь и status 0', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new TypeError('Failed to fetch'); }));
    const e = await run(rpc('addWorkout', { minutes: 5 }));
    expect(e).toBeInstanceOf(ApiError);
    expect(e!.message).toBe(MSG_OFFLINE);
    expect(e!.status).toBe(0);
  });
  it('текст ошибки от сервера сохраняется (PIN, лимиты)', async () => {
    vi.stubGlobal('fetch', reply(403, { error: 'Нужен PIN родителя' }));
    const e = await run(rpc('setConfig', {}));
    expect(e!.message).toBe('Нужен PIN родителя');
    expect(e!.status).toBe(403);
  });
  it('ошибка сервера без текста: просьба подождать и ссылка на logs.bat', async () => {
    vi.stubGlobal('fetch', reply(500, undefined));
    expect((await run(post('/api/backup', {})))!.message).toBe(MSG_SERVER);
    vi.stubGlobal('fetch', reply(502, {}));
    expect((await run(post('/api/backup', {})))!.message).toBe(MSG_SERVER);
  });
  it('ответ не JSON при успехе: просьба обновить страницу', async () => {
    vi.stubGlobal('fetch', reply(200, undefined));
    expect((await run(rpc('x')))!.message).toBe(MSG_UNREADABLE);
  });
  it('успех возвращает тело ответа', async () => {
    vi.stubGlobal('fetch', reply(200, { ok: true, points: 8 }));
    expect(await rpc('addDeed', { kind: 'dishes' })).toEqual({ ok: true, points: 8 });
  });
});
