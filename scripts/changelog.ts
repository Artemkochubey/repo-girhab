import fs from 'node:fs';
import { changelogSource, parseChangelog } from '../src/lib/changelog';

// Собирает src/lib/changelogData.ts из CHANGELOG.md для страницы «Что нового»: npm run docs:changelog
fs.writeFileSync('src/lib/changelogData.ts', changelogSource(parseChangelog(fs.readFileSync('CHANGELOG.md', 'utf8'))));
console.log('changelogData.ts обновлён');
