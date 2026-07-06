import 'server-only';

import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';

function normalizeExtractedText(text: string) {
  return text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
}

export interface ParsedProtocolRecordImportRow {
  recordDate: string;
  values: {
    offering: number;
    tithe: number;
    expenses: number;
    headcount: number;
  };
}

function parseNumericToken(token: string | undefined) {
  if (!token) {
    return 0;
  }

  const normalized = token.replace(/,/g, '').trim();
  if (!normalized) {
    return 0;
  }

  const numericValue = Number(normalized);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function toIsoDateFromDayMonthYear(day: number, monthLabel: string, year: number) {
  const monthIndex = new Date(`${monthLabel} 1, ${year}`).getMonth();
  if (!Number.isFinite(monthIndex)) {
    throw new Error(`Could not understand the month "${monthLabel}".`);
  }

  const value = new Date(Date.UTC(year, monthIndex, day));
  if (Number.isNaN(value.getTime())) {
    throw new Error(`Could not understand the date "${day} ${monthLabel} ${year}".`);
  }

  return value.toISOString().slice(0, 10);
}

function resolveProtocolRowNumbers(tokens: number[]) {
  const offering = tokens[0] ?? 0;
  const tithe = tokens[1] ?? 0;
  let expenses = 0;
  let headcount = 0;

  if (tokens.length >= 5) {
    expenses = tokens[2] ?? 0;
    headcount = tokens[4] ?? 0;
    return { offering, tithe, expenses, headcount };
  }

  if (tokens.length === 4) {
    const [,, third, fourth] = tokens;
    if (offering + tithe - third === fourth) {
      expenses = third;
      headcount = 0;
    } else if (offering + tithe === third) {
      expenses = 0;
      headcount = fourth;
    } else {
      expenses = third;
      headcount = fourth;
    }

    return { offering, tithe, expenses, headcount };
  }

  if (tokens.length === 3) {
    const third = tokens[2] ?? 0;
    expenses = offering + tithe === third ? 0 : third;
    return { offering, tithe, expenses, headcount };
  }

  return { offering, tithe, expenses, headcount };
}

export function parseProtocolAccountsText(text: string, fallbackYear = new Date().getUTCFullYear()) {
  const normalized = normalizeExtractedText(text);
  if (!normalized) {
    throw new Error('No protocol accounts text was found to import.');
  }

  const explicitYear =
    normalized.match(/protocol\s+accounts\s+(\d{4})/i)?.[1] ||
    normalized.match(/\b(20\d{2})\b/)?.[1];
  const year = explicitYear ? Number(explicitYear) : fallbackYear;

  const rows: ParsedProtocolRecordImportRow[] = [];
  for (const rawLine of normalized.split('\n')) {
    const line = rawLine.trim();
    if (
      !line ||
      /^ciom\b/i.test(line) ||
      /^date\b/i.test(line) ||
      /^department analysis\b/i.test(line)
    ) {
      continue;
    }

    const dateMatch = line.match(/^(\d{1,2})(?:st|nd|rd|th)?\s+([A-Za-z]+)\s+(.+)$/i);
    if (!dateMatch) {
      continue;
    }

    const [, dayValue, monthLabel, remainder] = dateMatch;
    const numericTokens = (remainder.match(/-?\d[\d,]*(?:\.\d+)?/g) || []).map((token) =>
      parseNumericToken(token)
    );

    if (numericTokens.length < 2) {
      continue;
    }

    rows.push({
      recordDate: toIsoDateFromDayMonthYear(Number(dayValue), monthLabel, year),
      values: resolveProtocolRowNumbers(numericTokens),
    });
  }

  if (rows.length === 0) {
    throw new Error('No protocol weekly rows were detected. Paste the table or upload the extracted document.');
  }

  return rows;
}

export async function extractTextFromDocumentFile(file: File) {
  const fileName = file.name.toLowerCase();
  const contentType = file.type;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  if (
    contentType.startsWith('text/') ||
    fileName.endsWith('.txt') ||
    fileName.endsWith('.md')
  ) {
    return normalizeExtractedText(buffer.toString('utf8'));
  }

  if (
    contentType ===
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    fileName.endsWith('.docx')
  ) {
    const result = await mammoth.extractRawText({ buffer });
    return normalizeExtractedText(result.value);
  }

  if (contentType === 'application/pdf' || fileName.endsWith('.pdf')) {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return normalizeExtractedText(result.text);
    } finally {
      await parser.destroy();
    }
  }

  throw new Error('Unsupported minutes file type. Upload a .txt, .docx, or .pdf file.');
}

export async function extractProtocolRecordsFromDocumentFile(file: File, fallbackYear?: number) {
  const text = await extractTextFromDocumentFile(file);
  return parseProtocolAccountsText(text, fallbackYear);
}
