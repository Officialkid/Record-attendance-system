import 'server-only';

import { isGoogleAuthConfigured } from './auth';
import { getConfiguredDatabaseDriver, getDb } from './db';
import { getEnvValue } from './env';
import { isGoogleCalendarSyncConfigured } from './google-calendar';
import { isGroqConfigured } from './groq';
import { isResendConfigured } from './notifications';
import { isR2Configured } from './r2';

function isUnsetEnvValue(value: string | null | undefined) {
  if (!value) {
    return true;
  }

  const normalized = value.trim();
  if (!normalized) {
    return true;
  }

  const placeholderFragments = [
    'replace-with-',
    'user:password@host/dbname',
    'changeme123',
    'your-google-client-id',
    'your-google-client-secret',
  ];

  return placeholderFragments.some((fragment) => normalized.toLowerCase().includes(fragment));
}

function listMissingEnv(keys: string[][]) {
  return keys
    .filter((aliases) => isUnsetEnvValue(getEnvValue(...aliases)))
    .map((aliases) => aliases[0]);
}

function listRequiredEnvLabels(keys: string[][]) {
  return keys.map((aliases) => aliases[0]);
}

export async function getCapHealthSnapshot() {
  let reachable = false;
  let activeDriver = getConfiguredDatabaseDriver();
  let databaseError: string | null = null;

  try {
    const db = await getDb();
    await db.prepare('SELECT 1 AS ok').get();
    reachable = true;
    activeDriver = db.driver;
  } catch (error) {
    databaseError = error instanceof Error ? error.message : 'Unknown database error.';
  }

  const configuredDriver = getConfiguredDatabaseDriver();
  const databaseRequiredVars =
    configuredDriver === 'postgres'
      ? [['DATABASE_URL']]
      : configuredDriver === 'd1-remote'
        ? [['CLOUDFLARE_ACCOUNT_ID', 'R2_ACCOUNT_ID'], ['CLOUDFLARE_API_TOKEN'], ['D1_DATABASE_ID', 'CLOUDFLARE_D1_DATABASE_ID']]
        : [];
  const authRequiredVars = [['NEXTAUTH_SECRET'], ['AUTH_SECRET']];
  const adminSeedRequiredVars = [['CAP_ADMIN_EMAIL', 'MAIN_ADMIN_EMAIL']];
  const googleAuthRequiredVars = [['GOOGLE_CLIENT_ID'], ['GOOGLE_CLIENT_SECRET']];
  const resendRequiredVars = [['RESEND_API_KEY'], ['RESEND_FROM_EMAIL', 'RESEND_FROM_ADDRESS']];
  const groqRequiredVars = [['GROQ_API_KEY']];
  const r2RequiredVars = [
    ['R2_ACCOUNT_ID', 'CLOUDFLARE_ACCOUNT_ID'],
    ['R2_ACCESS_KEY_ID', 'CLOUDFLARE_R2_ACCESS_KEY_ID'],
    ['R2_SECRET_ACCESS_KEY', 'CLOUDFLARE_R2_SECRET_ACCESS_KEY'],
    ['R2_BUCKET', 'CLOUDFLARE_R2_BUCKET_NAME'],
  ];
  const googleCalendarRequiredVars: string[][] = [];
  const cronRequiredVars = [['CRON_SECRET']];

  const databaseMissingVars = listMissingEnv(databaseRequiredVars);
  const authMissingVars = listMissingEnv(authRequiredVars);
  const adminSeedMissingVars = listMissingEnv(adminSeedRequiredVars);
  const googleAuthMissingVars = listMissingEnv(googleAuthRequiredVars);
  const resendMissingVars = listMissingEnv(resendRequiredVars);
  const groqMissingVars = listMissingEnv(groqRequiredVars);
  const r2MissingVars = listMissingEnv(r2RequiredVars);
  const googleCalendarMissingVars = listMissingEnv(googleCalendarRequiredVars);
  const cronMissingVars = listMissingEnv(cronRequiredVars);
  const totalMissingVars = Array.from(
    new Set([
      ...databaseMissingVars,
      ...authMissingVars,
      ...adminSeedMissingVars,
      ...googleAuthMissingVars,
      ...resendMissingVars,
      ...groqMissingVars,
      ...r2MissingVars,
      ...googleCalendarMissingVars,
      ...cronMissingVars,
    ])
  );
  const dynamicGuidanceNote =
    configuredDriver === 'postgres'
      ? reachable
        ? 'CIOM Portal is running on the Postgres/Neon path and the database connection is healthy.'
        : databaseMissingVars.length > 0
          ? 'CIOM Portal is configured for the Postgres/Neon runtime path, but required database environment values are still missing.'
          : 'CIOM Portal is configured for the Postgres/Neon runtime path, but the current database connection check is failing.'
      : configuredDriver === 'd1-remote'
        ? reachable
          ? 'CIOM Portal is running on the Cloudflare D1 path and the database connection is healthy.'
          : databaseMissingVars.length > 0
            ? 'CIOM Portal is configured for the D1 runtime path, but required Cloudflare environment values are still missing.'
            : 'CIOM Portal is configured for the D1 runtime path, but the current database connection check is failing.'
        : 'CIOM Portal is using the local SQLite development fallback.';

  return {
    app: {
      name: 'CIOM Portal',
      status: reachable ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
    },
    database: {
      configuredDriver,
      activeDriver,
      reachable,
      error: databaseError,
      hasDatabaseUrl: Boolean(getEnvValue('DATABASE_URL')),
      hasD1Config: Boolean(
        getEnvValue('CLOUDFLARE_ACCOUNT_ID', 'R2_ACCOUNT_ID') &&
          getEnvValue('CLOUDFLARE_API_TOKEN') &&
          getEnvValue('D1_DATABASE_ID', 'CLOUDFLARE_D1_DATABASE_ID')
      ),
    },
    integrations: {
      googleAuthConfigured: isGoogleAuthConfigured(),
      resendConfigured: isResendConfigured(),
      groqConfigured: isGroqConfigured(),
      r2Configured: isR2Configured(),
      googleCalendarConfigured: isGoogleCalendarSyncConfigured(),
      cronSecretConfigured: Boolean(process.env.CRON_SECRET),
    },
    readiness: {
      database: {
        requiredVars: listRequiredEnvLabels(databaseRequiredVars),
        missingVars: databaseMissingVars,
      },
      auth: {
        requiredVars: listRequiredEnvLabels(authRequiredVars),
        missingVars: authMissingVars,
      },
      adminSeed: {
        requiredVars: listRequiredEnvLabels(adminSeedRequiredVars),
        missingVars: adminSeedMissingVars,
      },
      googleAuth: {
        requiredVars: listRequiredEnvLabels(googleAuthRequiredVars),
        missingVars: googleAuthMissingVars,
      },
      resend: {
        requiredVars: listRequiredEnvLabels(resendRequiredVars),
        missingVars: resendMissingVars,
      },
      groq: {
        requiredVars: listRequiredEnvLabels(groqRequiredVars),
        missingVars: groqMissingVars,
      },
      r2: {
        requiredVars: listRequiredEnvLabels(r2RequiredVars),
        missingVars: r2MissingVars,
      },
      googleCalendar: {
        requiredVars: listRequiredEnvLabels(googleCalendarRequiredVars),
        missingVars: googleCalendarMissingVars,
      },
      cron: {
        requiredVars: listRequiredEnvLabels(cronRequiredVars),
        missingVars: cronMissingVars,
      },
      totalMissingVars,
    },
    guidance: {
      envHandoff: '/docs',
      recommendedSetupOrder:
        configuredDriver === 'postgres'
          ? [
              'DATABASE_URL',
              'NEXTAUTH_SECRET',
              'AUTH_SECRET',
              'CAP_ADMIN_EMAIL',
              'CRON_SECRET',
              'GOOGLE_CLIENT_ID',
              'GOOGLE_CLIENT_SECRET',
              'RESEND_API_KEY',
              'RESEND_FROM_EMAIL',
              'GROQ_API_KEY',
              'R2_ACCOUNT_ID',
              'R2_ACCESS_KEY_ID',
              'R2_SECRET_ACCESS_KEY',
              'R2_BUCKET',
            ]
          : configuredDriver === 'd1-remote'
            ? [
                'CLOUDFLARE_ACCOUNT_ID',
                'CLOUDFLARE_API_TOKEN',
                'D1_DATABASE_ID',
                'NEXTAUTH_SECRET',
                'AUTH_SECRET',
                'CAP_ADMIN_EMAIL',
                'CRON_SECRET',
                'GOOGLE_CLIENT_ID',
                'GOOGLE_CLIENT_SECRET',
              ]
            : ['NEXTAUTH_SECRET', 'AUTH_SECRET', 'CAP_ADMIN_EMAIL', 'CRON_SECRET'],
      note: dynamicGuidanceNote,
    },
  };
}
