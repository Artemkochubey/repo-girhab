export interface Release { version: string; items: string[] }

/** Разбирает CHANGELOG.md: заголовки «## версия», внутри пункты «- текст». */
export function parseChangelog(md: string): Release[] {
  const out: Release[] = [];
  for (const line of md.split(/\r?\n/)) {
    const h = /^##\s+(.+?)\s*$/.exec(line);
    if (h) { out.push({ version: h[1]!, items: [] }); continue; }
    const li = /^-\s+(.+)$/.exec(line);
    if (li && out.length) out[out.length - 1]!.items.push(li[1]!.trim());
  }
  return out;
}

export const changelogSource = (releases: Release[]): string =>
  `// Создан скриптом \`npm run docs:changelog\` из CHANGELOG.md, руками не править.\nimport type { Release } from './changelog';\n\nexport const RELEASES: Release[] = ${JSON.stringify(releases, null, 2)};\n`;
