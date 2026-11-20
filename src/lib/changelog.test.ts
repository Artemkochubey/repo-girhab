import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import { changelogSource, parseChangelog } from './changelog';

describe('история версий', () => {
  it('разбор: версии, пункты, лишние строки пропускаются', () => {
    const r = parseChangelog('# История\n\n## 0.2.0\n- Первое\n- Второе\n\nтекст\n## 0.1.0\n- Старое\r\n');
    expect(r).toEqual([{ version: '0.2.0', items: ['Первое', 'Второе'] }, { version: '0.1.0', items: ['Старое'] }]);
  });
  it('пункт до первого заголовка не теряется и не падает', () => {
    expect(parseChangelog('- без версии\n## 1.0.0\n- есть')).toEqual([{ version: '1.0.0', items: ['есть'] }]);
  });
  it('changelogData.ts в репозитории актуален (после правки CHANGELOG.md выполните npm run docs:changelog)', () => {
    const want = changelogSource(parseChangelog(fs.readFileSync('CHANGELOG.md', 'utf8')));
    expect(fs.readFileSync('src/lib/changelogData.ts', 'utf8')).toBe(want);
  });
  it('в CHANGELOG.md первой стоит версия из package.json', () => {
    const v = JSON.parse(fs.readFileSync('package.json', 'utf8')).version as string;
    expect(parseChangelog(fs.readFileSync('CHANGELOG.md', 'utf8'))[0]!.version).toBe(v);
  });
});
