import fs from 'node:fs';
import { balanceMarkdown, realStats } from '../src/lib/game/balance';
import { openDb } from '../src/lib/db/client';
import { loadFamily } from '../src/lib/services/load';

// Расчётный разбор баланса: npm run balance. Файл BALANCE.md собирается из кода; по базе семьи (DB_PATH) дополнительно печатается реальная статистика.
fs.writeFileSync('BALANCE.md', balanceMarkdown());
console.log('BALANCE.md обновлён');

const dbFile = process.env.DB_PATH ?? './data/app.db';
if (fs.existsSync(dbFile)) {
  const { family, raw } = loadFamily(openDb(dbFile));
  const rows = realStats(raw.members.map((m) => { const st = family.members.get(m.id)!; return { name: m.name, level: st.level, xp: st.xp, days: st.days, battleRows: st.battle.rows }; }), family.today);
  console.log('\nПо вашей семье (за последние 14 и 30 дней):');
  for (const r of rows) console.log(`- ${r.name}: уровень ${r.level}, опыта ${r.xp}, очков в день ${r.avg14} (14 дн.) / ${r.avg30} (30 дн.), до следующего уровня ~${r.daysToNext ?? '—'} дн., побед над ордой ${r.battleWins} из ${r.battles}`);
  console.log(`Босс: побеждено ${family.bossHistory.filter((b) => b.finished && b.defeated).length} из ${family.bossHistory.filter((b) => b.finished).length} недель`);
}
