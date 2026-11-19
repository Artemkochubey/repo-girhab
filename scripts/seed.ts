import { openDb } from '../src/lib/db/client';
import { config, member, hero } from '../src/lib/db/schema';
import { LOOT_COMMON, LOOT_LEGEND, LOOT_RARE } from '../src/lib/game/loot';

const db = openDb();
if (db.select().from(config).get()) {
  console.log('Данные уже есть, сид пропущен');
  process.exit(0);
}

db.insert(config).values({
  id: 1,
  loot: LOOT_COMMON,
  lootRare: LOOT_RARE,
  lootLegend: LOOT_LEGEND,
}).run();

// Имена временные: поменяйте в «Настройках» после запуска.
const people = [
  { name: 'Папа', emoji: '🧔', color: '#f59e0b', isParent: true, goal: 60, superGoal: 100 },
  { name: 'Мама', emoji: '👩', color: '#ec4899', isParent: true, goal: 60, superGoal: 100 },
  { name: 'Старший', emoji: '🧑', color: '#3b82f6', isParent: false, goal: 60, superGoal: 100 },
  { name: 'Младший', emoji: '🧒', color: '#22c55e', isParent: false, goal: 40, superGoal: 70 },
];
for (const p of people) {
  const row = db.insert(member).values(p).returning().get();
  db.insert(hero).values({ memberId: row.id }).run();
}
console.log('Сид выполнен:', db.select().from(member).all().length, 'участника');
