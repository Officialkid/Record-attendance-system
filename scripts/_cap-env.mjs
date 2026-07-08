import fs from 'node:fs';
import path from 'node:path';

import postgres from 'postgres';

function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }

  return value;
}

export function readLocalEnv(cwd = process.cwd()) {
  const envPath = path.join(cwd, '.env.local');
  const envText = fs.readFileSync(envPath, 'utf8');

  return Object.fromEntries(
    envText
      .split(/\r?\n/)
      .filter((line) => line.includes('=') && !line.trim().startsWith('#'))
      .map((line) => {
        const index = line.indexOf('=');
        const key = line.slice(0, index).trim();
        const value = stripQuotes(line.slice(index + 1).trim());
        return [key, value];
      })
  );
}

export function getDatabaseUrl(cwd = process.cwd()) {
  const env = readLocalEnv(cwd);
  const databaseUrl = env.DATABASE_URL;

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is missing from .env.local');
  }

  return databaseUrl;
}

export function createSqlClient(cwd = process.cwd()) {
  return postgres(getDatabaseUrl(cwd), {
    max: 1,
    prepare: false,
  });
}
