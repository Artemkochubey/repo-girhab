import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

/** @type {import('next').NextConfig} */
export default {
  output: 'standalone',
  serverExternalPackages: ['better-sqlite3'],
  env: { NEXT_PUBLIC_APP_VERSION: pkg.version },
};
