import fs from 'node:fs';
import { rulesMarkdown } from '../src/lib/rulesContent';

// Собирает RULES.md из кода игры: npm run docs:rules
fs.writeFileSync('RULES.md', rulesMarkdown());
console.log('RULES.md обновлён');
