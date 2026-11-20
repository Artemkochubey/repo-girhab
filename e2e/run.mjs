// Сквозные проверки в настоящем браузере: npm run build && npm run e2e
// Нужен Playwright: npm i --no-save playwright && npx playwright install chromium
// Скрипт сам создаёт временную базу (в папке временных файлов системы), запускает сайт на свободном порту,
// проходит основные сценарии и останавливает сайт. Рабочие данные семьи он не трогает.
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch {
  console.error('Не найден Playwright. Выполните: npm i --no-save playwright && npx playwright install chromium');
  process.exit(2);
}

const free = () => new Promise((res) => { const s = net.createServer(); s.listen(0, () => { const p = s.address().port; s.close(() => res(p)); }); });
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'e2e-'));
const env = { ...process.env, DB_PATH: path.join(tmp, 'app.db'), BACKUP_DIR: path.join(tmp, 'backups'), BACKUP_MIRROR_DIR: path.join(tmp, 'mirror'), NODE_ENV: 'production' };
const port = await free();
const base = `http://localhost:${port}`;

execFileSync('npx', ['tsx', 'scripts/migrate.ts'], { env, stdio: 'ignore' });
execFileSync('npx', ['tsx', 'scripts/seed.ts'], { env, stdio: 'ignore' });
const server = spawn('npx', ['next', 'start', '-p', String(port)], { env, stdio: 'ignore' });
const stop = () => { try { server.kill('SIGTERM'); } catch { /* уже остановлен */ } };
process.on('exit', stop);
for (let i = 0; i < 60; i++) {
  try { if ((await fetch(base + '/api/state')).ok) break; } catch { /* ещё не поднялся */ }
  await new Promise((r) => setTimeout(r, 500));
  if (i === 59) { console.error('Сайт не запустился'); stop(); process.exit(1); }
}

const results = [];
const check = async (name, fn) => {
  try { await fn(); results.push([true, name]); console.log('✔', name); }
  catch (e) { results.push([false, name]); console.log('✖', name, '\n   ', String(e.message ?? e).split('\n')[0]); }
};
const ok = (cond, msg) => { if (!cond) throw new Error(msg); };

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 430, height: 900 } });
const p = await ctx.newPage();
const dismiss = async () => {
  for (let i = 0; i < 4; i++) { const e = await p.$('text=Круто!'); if (e) { await e.click().catch(() => {}); await p.waitForTimeout(250); } }
  for (const sel of ['.classmodal .close', '.cp-head .close']) { const e = await p.$(sel); if (e) await e.click().catch(() => {}); }
};
const state = () => p.evaluate(async () => (await fetch('/api/state')).json());
const rpc = (action, args = {}) => p.evaluate(async ([a, x]) => (await fetch('/api/rpc', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ action: a, ...x }) })).json(), [action, args]);

await check('вход под героем и главная страница', async () => {
  await p.goto(base + '/'); await p.click('text=Младший'); await p.waitForSelector('.mark-tile'); await dismiss();
  ok((await p.locator('nav.tabs a').count()) === 5, 'должно быть пять вкладок');
});
await check('«Отметить»: зарядка и прогулка дают очки', async () => {
  await p.click('.quick-fab'); await p.waitForSelector('.card.quick');
  await p.click('.quick .btn:has-text("Сделал(а) зарядку")'); await p.waitForTimeout(600); await dismiss();
  await p.click('.quick-row:has-text("Прогулка") .btn:has-text("+30")'); await p.waitForTimeout(600); await dismiss();
  const st = (await state()).detail.day;
  ok(st.stats.warmups === 1, 'зарядка не записалась');
  ok(Math.round(st.stats.workoutMinutes) === 15, `30 минут прогулки должны дать 15, а дали ${st.stats.workoutMinutes}`);
});
await check('«Отметить»: доброе дело, повтор недоступен, журнал', async () => {
  await p.click('.quick .seg button:has-text("Добрые дела")');
  await p.click('.deed:has-text("Помыл посуду")'); await p.waitForTimeout(700); await dismiss();
  ok(await p.locator('.deed:has-text("Помыл посуду")').isDisabled(), 'повтор того же дела должен быть недоступен');
  await p.click('.quick .btn:has-text("Моя доброта")'); await p.waitForSelector('.deed-log li');
  ok((await p.locator('.deed-log li').count()) === 1, 'в журнале должно быть одно дело');
});
await check('сундуки: заработать и открыть на вкладке «Добыча»', async () => {
  for (let i = 0; i < 3; i++) await rpc('addWorkout', { minutes: 300 });
  await p.goto(base + '/bag'); await p.waitForSelector('text=Открыть сундук'); await dismiss();
  await p.click('button:has-text("Открыть сундук")'); await p.waitForSelector('.reward');
});
await check('рейтинг дня: места и источники очков', async () => {
  await p.goto(base + '/rating'); await p.waitForSelector('.rating-table'); await dismiss();
  const rows = await p.locator('.rating-table tbody tr').count();
  ok(rows === 4, `в рейтинге должно быть 4 героя, а их ${rows}`);
  ok((await p.locator('.rating-table tbody tr').first().innerText()).includes('Младший'), 'у Младшего больше всех очков от нормы, он должен быть первым');
  ok((await p.locator('.rating-table thead th.c-src').count()) >= 2, 'нет столбцов источников очков');
});
await check('лицо героя: создать и сохранить отдельно от смайлика', async () => {
  await p.goto(base + '/hero'); await dismiss(); await p.click('.herolook .btn'); await p.waitForSelector('.facepick');
  await p.click('.seg button:has-text("Девочка")'); await p.click('.face-opt:has-text("Косы")'); await p.click('.btn:has-text("Сохранить лицо")'); await p.waitForTimeout(700);
  const me = (await state()).members.find((m) => m.name === 'Младший');
  ok(me.face?.hair === 'braids' && me.gender === 'f', 'лицо не сохранилось');
  ok(me.emoji === '🧒', 'смайлик профиля не должен меняться');
  await p.click('.picker .btn.ghost:has-text("Закрыть")');
});
await check('ТВ: добрые дела записываются без входа', async () => {
  const tv = await (await browser.newContext({ viewport: { width: 1920, height: 1080 } })).newPage();
  await tv.goto(base + '/tv'); await tv.waitForSelector('.tv-tabs'); await tv.click('.tv-tab:has-text("Запись")'); await tv.click('.tv-who:has-text("Старший")');
  await tv.click('.tv-b:has-text("Покормил птиц")'); await tv.waitForSelector('.tv-note:has-text("✔")');
});
await check('родитель: PIN, настройки, копия данных и вторая папка', async () => {
  await p.goto(base + '/'); await dismiss(); await p.click('text=🔒 PIN');
  for (const i of await p.$$('.modal input[type=password]')) await i.fill('1234');
  await p.click('.modal .btn:not(.ghost)'); await p.waitForTimeout(900);
  await p.goto(base + '/settings'); await p.waitForSelector('.settings-tabs');
  await p.click('.settings-tabs button:has-text("Данные")'); await p.waitForSelector('text=Создать копию сейчас');
  await p.click('.btn:has-text("Создать копию сейчас")'); await p.waitForSelector('text=Копия создана');
  ok(fs.readdirSync(path.join(tmp, 'backups')).some((f) => f.endsWith('.db')), 'копия не появилась в основной папке');
  ok(fs.readdirSync(path.join(tmp, 'mirror')).some((f) => f.endsWith('.db')), 'копия не появилась во второй папке');
});
await check('нет связи: полоса предупреждения появляется и исчезает', async () => {
  await p.goto(base + '/'); await p.waitForSelector('.mark-tile'); await dismiss();
  await ctx.setOffline(true);
  await p.evaluate(() => window.dispatchEvent(new Event('offline')));
  await p.waitForSelector('.offline-bar');
  await ctx.setOffline(false);
  await p.evaluate(() => window.dispatchEvent(new Event('online')));
  await p.waitForSelector('.offline-bar', { state: 'detached', timeout: 15000 });
});
await check('страница «Что нового» открывается', async () => {
  await p.goto(base + '/about'); await p.waitForSelector('h1:has-text("Что нового")'); ok((await p.locator('details.fold').count()) >= 1, 'нет списка версий');
});

await browser.close();
stop();
const failed = results.filter(([g]) => !g).length;
console.log(`\nПроверок: ${results.length}, не прошло: ${failed}. Временные файлы: ${tmp}`);
process.exit(failed ? 1 : 0);
