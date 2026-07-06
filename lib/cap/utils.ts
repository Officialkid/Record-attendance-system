import { format, isSaturday, isValid, parseISO, previousSaturday } from 'date-fns';

export function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

export function formatCurrency(value: number, currency = process.env.CAP_DEFAULT_CURRENCY || 'KES') {
  return new Intl.NumberFormat('en-KE', {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDisplayDate(value: string) {
  return format(parseISO(value), 'EEE, d MMM yyyy');
}

export function normalizeSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getNearestSaturday(baseDate = new Date()) {
  if (isSaturday(baseDate)) {
    return format(baseDate, 'yyyy-MM-dd');
  }

  // Weekly records are usually entered after service, so default to the most recent
  // Saturday instead of jumping ahead to the upcoming one on Fridays.
  return format(previousSaturday(baseDate), 'yyyy-MM-dd');
}

export function toSqliteBoolean(value: boolean) {
  return value ? 1 : 0;
}

export function fromSqliteBoolean(value: number | null | undefined) {
  return value === 1;
}

export function parseJsonValue<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

export function getTimeBasedGreeting(baseDate = new Date()) {
  const timeZone = process.env.CAP_DEFAULT_TIMEZONE || 'Africa/Nairobi';
  const hourText = new Intl.DateTimeFormat('en-GB', {
    hour: 'numeric',
    hour12: false,
    timeZone,
  }).format(baseDate);
  const hour = Number(hourText);

  if (!Number.isFinite(hour)) {
    return 'Hello';
  }

  if (hour < 5) {
    return 'Good night';
  }

  if (hour < 12) {
    return 'Good morning';
  }

  if (hour < 18) {
    return 'Good afternoon';
  }

  if (hour < 22) {
    return 'Good evening';
  }

  return 'Good night';
}

export function isIsoDateString(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  return isValid(parseISO(value));
}
