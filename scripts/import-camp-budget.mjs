import fs from 'node:fs/promises';
import path from 'node:path';

import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';
import postgres from 'postgres';

const WORKBOOK_NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const REL_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const PACKAGE_REL_NS = 'http://schemas.openxmlformats.org/package/2006/relationships';
const SECTION_ORDER = ['Supermarket', 'Market', 'Miscellaneous', 'Other expenses'];

function normalizeText(value) {
  return String(value || '').replace(/\s+/g, ' ').trim();
}

function normalizeKeyPart(value) {
  return normalizeText(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function decodeXmlText(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parseDotEnv(text) {
  const env = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }
    const separator = line.indexOf('=');
    if (separator === -1) {
      continue;
    }
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    value = value.replace(/^"(.*)"$/, '$1');
    env[key] = value;
  }
  return env;
}

function columnLettersToIndex(reference) {
  const letters = reference.replace(/[^A-Z]/gi, '').toUpperCase();
  let total = 0;
  for (const letter of letters) {
    total = total * 26 + (letter.charCodeAt(0) - 64);
  }
  return Math.max(total - 1, 0);
}

function getDirectChildrenByTagName(node, tagName) {
  const children = [];
  for (let index = 0; index < node.childNodes.length; index += 1) {
    const child = node.childNodes[index];
    if (child.nodeType === child.ELEMENT_NODE && child.tagName === tagName) {
      children.push(child);
    }
  }
  return children;
}

function getSharedStrings(document) {
  const items = Array.from(document.getElementsByTagNameNS(WORKBOOK_NS, 'si'));
  return items.map((item) =>
    Array.from(item.getElementsByTagNameNS(WORKBOOK_NS, 't'))
      .map((textNode) => normalizeText(textNode.textContent || ''))
      .join('')
  );
}

function getCellValue(cell, sharedStrings) {
  const type = cell.getAttribute('t');
  if (type === 'inlineStr') {
    return normalizeText(
      Array.from(cell.getElementsByTagNameNS(WORKBOOK_NS, 't'))
        .map((textNode) => textNode.textContent || '')
        .join('')
    );
  }

  const valueNode = cell.getElementsByTagNameNS(WORKBOOK_NS, 'v')[0];
  if (!valueNode) {
    return '';
  }

  const rawValue = normalizeText(valueNode.textContent || '');
  if (type === 's') {
    const index = Number(rawValue);
    return Number.isInteger(index) && index >= 0 ? normalizeText(sharedStrings[index] || '') : '';
  }

  return rawValue;
}

function getWorksheetRows(document, sharedStrings) {
  const rows = Array.from(document.getElementsByTagNameNS(WORKBOOK_NS, 'row'));
  return rows.map((row) => {
    const values = [];
    const cells = getDirectChildrenByTagName(row, 'c');
    for (const cell of cells) {
      const reference = cell.getAttribute('r') || '';
      const columnIndex = columnLettersToIndex(reference);
      values[columnIndex] = getCellValue(cell, sharedStrings);
    }

    while (values.length > 0 && !normalizeText(values[values.length - 1])) {
      values.pop();
    }

    return values.map((value) => normalizeText(value));
  });
}

function getRelationshipTarget(document, relationshipId) {
  const relationships = Array.from(document.getElementsByTagNameNS(PACKAGE_REL_NS, 'Relationship'));
  const relationship = relationships.find((entry) => entry.getAttribute('Id') === relationshipId);
  return relationship?.getAttribute('Target') || null;
}

function buildSheetMap(workbookDocument, relationshipsDocument) {
  const sheets = Array.from(workbookDocument.getElementsByTagNameNS(WORKBOOK_NS, 'sheet'));
  const map = new Map();

  for (const sheet of sheets) {
    const name = normalizeText(sheet.getAttribute('name') || '');
    const relationshipId =
      sheet.getAttributeNS(REL_NS, 'id') ||
      sheet.getAttribute('r:id') ||
      sheet.getAttribute('id') ||
      '';
    const target = relationshipId ? getRelationshipTarget(relationshipsDocument, relationshipId) : null;
    if (!name || !target) {
      continue;
    }

    const normalizedTarget = target.startsWith('/') ? target.slice(1) : target.replace(/^(\.\.\/)+/, 'xl/');
    map.set(name, normalizedTarget.startsWith('xl/') ? normalizedTarget : `xl/${normalizedTarget}`);
  }

  return map;
}

function detectSection(value) {
  const normalized = normalizeKeyPart(value);
  if (!normalized) {
    return null;
  }
  if (normalized.includes('supermarket') || normalized.includes('shopping for')) {
    return 'Supermarket';
  }
  if (normalized === 'market') {
    return 'Market';
  }
  if (normalized === 'miscellaneous') {
    return 'Miscellaneous';
  }
  if (normalized === 'other expenses' || normalized === 'other expense') {
    return 'Other expenses';
  }
  return null;
}

function isHeaderRow(row) {
  const normalized = row.map((value) => normalizeKeyPart(value));
  return normalized.includes('item') && normalized.includes('total');
}

function getHeaderOffset(row) {
  const firstCell = normalizeKeyPart(row[0]);
  return firstCell === 'comments' || firstCell === 'comment' ? 1 : 0;
}

function isSummaryLabel(value) {
  const normalized = normalizeKeyPart(value);
  return normalized === 'total' || normalized === 'grand total' || normalized === 'discount' || normalized === 'spent';
}

function parseLastNumericValue(row) {
  for (let index = row.length - 1; index >= 0; index -= 1) {
    const cell = row[index];
    const match = normalizeText(cell).match(/-?\d[\d,]*(?:\.\d+)?/g);
    if (!match || match.length === 0) {
      continue;
    }
    const candidate = Number(match[match.length - 1].replace(/,/g, ''));
    if (Number.isFinite(candidate)) {
      return candidate;
    }
  }
  return null;
}

function buildDescription(itemName, unit) {
  const item = normalizeText(itemName);
  const normalizedUnit = normalizeText(unit);
  return normalizedUnit ? `${item} (${normalizedUnit})` : item;
}

function createLineKey(section, itemName, unit) {
  return `${normalizeKeyPart(section)}::${normalizeKeyPart(itemName)}::${normalizeKeyPart(unit)}`;
}

function extractBudgetLines(worksheetRows) {
  const lines = [];
  let activeSection = 'Supermarket';
  let hasCommentsColumn = true;

  for (const row of worksheetRows) {
    const meaningful = row.filter((value) => normalizeText(value));
    if (meaningful.length === 0) {
      continue;
    }

    const section = detectSection(meaningful[0] || '');
    if (section) {
      activeSection = section;
      continue;
    }

    if (isHeaderRow(row)) {
      hasCommentsColumn = getHeaderOffset(row) === 1;
      continue;
    }

    const itemIndex = hasCommentsColumn ? 1 : 0;
    const unitIndex = hasCommentsColumn ? 2 : 1;
    const itemCell = normalizeText(row[itemIndex] || row[0] || '');
    if (!itemCell || isSummaryLabel(itemCell)) {
      continue;
    }

    const amount = parseLastNumericValue(row);
    if (amount === null) {
      continue;
    }

    const unit = normalizeText(row[unitIndex] || '') || null;
    lines.push({
      section: activeSection,
      itemName: itemCell,
      unit,
      description: buildDescription(itemCell, unit),
      amount,
    });
  }

  return lines;
}

async function readXml(zip, entryPath) {
  const file = zip.file(entryPath);
  if (!file) {
    throw new Error(`Workbook entry "${entryPath}" was not found.`);
  }

  const text = await file.async('text');
  return new DOMParser().parseFromString(decodeXmlText(text), 'text/xml');
}

async function parseCampBudgetWorkbook(workbookBuffer, requestedSheetPrefix) {
  const zip = await JSZip.loadAsync(workbookBuffer);
  const workbookDocument = await readXml(zip, 'xl/workbook.xml');
  const relationshipsDocument = await readXml(zip, 'xl/_rels/workbook.xml.rels');
  const sharedStringsDocument = await readXml(zip, 'xl/sharedStrings.xml');
  const sharedStrings = getSharedStrings(sharedStringsDocument);
  const sheetMap = buildSheetMap(workbookDocument, relationshipsDocument);

  const prefix = normalizeText(requestedSheetPrefix);
  const budgetSheetName = Array.from(sheetMap.keys()).find(
    (name) => normalizeKeyPart(name) === normalizeKeyPart(`${prefix} Budget`)
  );
  const actualSheetName = Array.from(sheetMap.keys()).find(
    (name) => normalizeKeyPart(name) === normalizeKeyPart(`${prefix} Actual Price List`)
  );

  if (!budgetSheetName || !actualSheetName) {
    throw new Error(`Could not find both "${prefix} Budget" and "${prefix} Actual Price List" in this workbook.`);
  }

  const budgetRows = getWorksheetRows(await readXml(zip, sheetMap.get(budgetSheetName)), sharedStrings);
  const actualRows = getWorksheetRows(await readXml(zip, sheetMap.get(actualSheetName)), sharedStrings);
  const expectedLines = extractBudgetLines(budgetRows);
  const actualLines = extractBudgetLines(actualRows);

  const merged = new Map();
  for (const line of expectedLines) {
    merged.set(createLineKey(line.section, line.itemName, line.unit), {
      categoryName: line.section,
      description: line.description,
      expectedAmount: line.amount,
      actualAmount: null,
    });
  }

  for (const line of actualLines) {
    const key = createLineKey(line.section, line.itemName, line.unit);
    const existing = merged.get(key);
    if (existing) {
      existing.actualAmount = line.amount;
    } else {
      merged.set(key, {
        categoryName: line.section,
        description: line.description,
        expectedAmount: null,
        actualAmount: line.amount,
      });
    }
  }

  const items = SECTION_ORDER.flatMap((section) =>
    Array.from(merged.values()).filter((item) => item.categoryName === section)
  );

  return {
    categories: SECTION_ORDER.filter((section) => items.some((item) => item.categoryName === section)),
    items,
    expectedTotal: items.reduce((sum, item) => sum + (item.expectedAmount || 0), 0),
    actualTotal: items.reduce((sum, item) => sum + (item.actualAmount || 0), 0),
  };
}

function getArg(flag) {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : null;
}

async function main() {
  const workbookPath = getArg('--file');
  const eventName = getArg('--event');
  const sheetPrefix = getArg('--prefix');
  const defaultExpectedAmount = Number(getArg('--default-expected') || '1');

  if (!workbookPath || !eventName || !sheetPrefix) {
    throw new Error('Usage: node scripts/import-camp-budget.mjs --file <xlsx> --event <name> --prefix <sheetPrefix>');
  }

  const envText = await fs.readFile(path.join(process.cwd(), '.env.local'), 'utf8');
  const env = parseDotEnv(envText);
  const sql = postgres(env.DATABASE_URL, { max: 1, prepare: false });

  try {
    const workbookBuffer = await fs.readFile(workbookPath);
    const imported = await parseCampBudgetWorkbook(workbookBuffer, sheetPrefix);

    const existing = await sql`select id from events where lower(name) = lower(${eventName}) limit 1`;
    if (existing.length > 0) {
      throw new Error(`An event named "${eventName}" already exists.`);
    }

    const adminRows = await sql`select id from users where lower(email) = lower(${env.CAP_ADMIN_EMAIL}) limit 1`;
    if (adminRows.length === 0) {
      throw new Error(`Could not find admin user ${env.CAP_ADMIN_EMAIL}.`);
    }
    const adminId = Number(adminRows[0].id);

    const programsRows = await sql`select id from departments where slug = 'programs' limit 1`;
    if (programsRows.length === 0) {
      throw new Error('Programs department does not exist.');
    }
    const programsDepartmentId = Number(programsRows[0].id);

    const result = await sql.begin(async (tx) => {
      const eventRows = await tx`
        insert into events (department_id, name, created_by_user_id)
        values (${programsDepartmentId}, ${eventName}, ${adminId})
        returning id
      `;
      const eventId = Number(eventRows[0].id);

      await tx`
        insert into event_memberships (event_id, user_id, side, status, joined_at, remain_visible)
        values (${eventId}, ${adminId}, 'admin', 'approved', CURRENT_TIMESTAMP::text, 1)
        on conflict (event_id, user_id, side) do nothing
      `;

      await tx`
        insert into contribution_ledgers (name, owner_department_id, event_id, default_expected_amount, status)
        values (${`${eventName} - Contributions`}, ${programsDepartmentId}, ${eventId}, ${defaultExpectedAmount}, 'active')
      `;

      const expenseRows = await tx`
        insert into expense_ledgers (name, owner_department_id, event_id, status)
        values (${`${eventName} - Expenses`}, ${programsDepartmentId}, ${eventId}, 'active')
        returning id
      `;
      const expenseLedgerId = Number(expenseRows[0].id);

      const categoryIds = new Map();
      for (const categoryName of imported.categories) {
        const categoryRows = await tx`
          insert into expense_categories (ledger_id, name)
          values (${expenseLedgerId}, ${categoryName})
          returning id
        `;
        categoryIds.set(categoryName, Number(categoryRows[0].id));
      }

      for (const item of imported.items) {
        await tx`
          insert into expense_items
            (category_id, description, expected_amount, actual_amount, paid_by, payment_status, recorded_by_user_id)
          values
            (${categoryIds.get(item.categoryName)}, ${item.description}, ${item.expectedAmount}, ${item.actualAmount}, ${`${sheetPrefix} workbook import`}, 'paid', ${adminId})
        `;
      }

      return {
        eventId,
        importedItemCount: imported.items.length,
        importedCategoryCount: imported.categories.length,
        expectedTotal: imported.expectedTotal,
        actualTotal: imported.actualTotal,
      };
    });

    console.log(JSON.stringify(result, null, 2));
  } finally {
    await sql.end({ timeout: 5 });
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
