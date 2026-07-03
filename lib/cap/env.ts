import 'server-only';

export function getEnvValue(...keys: string[]) {
  for (const key of keys) {
    const value = process.env[key];
    if (typeof value === 'string' && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

export function hasEnvValue(...keys: string[]) {
  return Boolean(getEnvValue(...keys));
}
