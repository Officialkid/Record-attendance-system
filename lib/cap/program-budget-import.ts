import JSZip from 'jszip';
import { DOMParser } from '@xmldom/xmldom';

const WORKBOOK_NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const REL_NS = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
const PACKAGE_REL_NS = 'http://schemas.openxmlformats.org/package/2006/relationships';

const SECTION_ORDER = ['Supermarket', 'Market', 'Miscellaneous', 'Other expenses'] as const;

type SectionName = (typeof SECTION_ORDER)[number];

type ParsedBudgetLine = {
  section: SectionName;
  itemName: string;
  unit: string | null;
  description: string;
  amount: number;
};

export type ImportedCampBudgetItem = {
  categoryName: string;
  description: string;
  expectedAmount: number | null;
  actualAmount: number | null;
};

export type ImportedCampBudget = {
  sheetPrefix: string;
  items: ImportedCampBudgetItem[];
  categories: string[];
  expectedTotal: number;
  actualTotal: number;
};

function normalizeText(value: string | null | undefined) {
  return (value || '').replace(/\s+/g, ' ').trim();
}

function normalizeKeyPart(value: string | null | undefined) {
  return normalizeText(value).toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function decodeXmlText(value: string) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function columnLettersToIndex(reference: string) {
  const letters = reference.replace(/[^A-Z]/gi, '').toUpperCase();
  let total = 0;
  for (const letter of letters) {
    total = total * 26 + (letter.charCodeAt(0) - 64);
  }
  return Math.max(total - 1, 0);
}

function getDirectChildrenByTagName(node: Element, tagName: string) {
  const children: Element[] = [];
  for (let index = 0; index < node.childNodes.length; index += 1) {
    const child = node.childNodes[index];
    if (child.nodeType === child.ELEMENT_NODE && (child as Element).tagName === tagName) {
      children.push(child as Element);
    }
  }
  return children;
}

function getSharedStrings(document: Document) {
  const items = Array.from(document.getElementsByTagNameNS(WORKBOOK_NS, 'si'));
  return items.map((item) =>
    Array.from(item.getElementsByTagNameNS(WORKBOOK_NS, 't'))
      .map((textNode) => normalizeText(textNode.textContent || ''))
      .join('')
  );
}

function getCellValue(cell: Element, sharedStrings: string[]) {
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

function getWorksheetRows(document: Document, sharedStrings: string[]) {
  const rows = Array.from(document.getElementsByTagNameNS(WORKBOOK_NS, 'row'));
  return rows.map((row) => {
    const values: string[] = [];
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

function getRelationshipTarget(document: Document, relationshipId: string) {
  const relationships = Array.from(document.getElementsByTagNameNS(PACKAGE_REL_NS, 'Relationship'));
  const relationship = relationships.find((entry) => entry.getAttribute('Id') === relationshipId);
  return relationship?.getAttribute('Target') || null;
}

function buildSheetMap(workbookDocument: Document, relationshipsDocument: Document) {
  const sheets = Array.from(workbookDocument.getElementsByTagNameNS(WORKBOOK_NS, 'sheet'));
  const map = new Map<string, string>();

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

function detectSection(value: string): SectionName | null {
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

function isHeaderRow(row: string[]) {
  const normalized = row.map((value) => normalizeKeyPart(value));
  return normalized.includes('item') && normalized.includes('total');
}

function getHeaderOffset(row: string[]) {
  const firstCell = normalizeKeyPart(row[0]);
  return firstCell === 'comments' || firstCell === 'comment' ? 1 : 0;
}

function isSummaryLabel(value: string) {
  const normalized = normalizeKeyPart(value);
  return (
    normalized === 'total' ||
    normalized === 'grand total' ||
    normalized === 'discount' ||
    normalized === 'spent'
  );
}

function parseLastNumericValue(row: string[]) {
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

function buildDescription(itemName: string, unit: string | null) {
  const item = normalizeText(itemName);
  const normalizedUnit = normalizeText(unit);
  if (!normalizedUnit) {
    return item;
  }

  const unitKey = normalizeKeyPart(normalizedUnit);
  if (!unitKey) {
    return item;
  }

  return `${item} (${normalizedUnit})`;
}

function createLineKey(section: SectionName, itemName: string, unit: string | null) {
  return `${normalizeKeyPart(section)}::${normalizeKeyPart(itemName)}::${normalizeKeyPart(unit)}`;
}

function parseBudgetSheet(rows: string[]) {
  return rows;
}

function extractBudgetLines(worksheetRows: string[][]) {
  const lines: ParsedBudgetLine[] = [];
  let activeSection: SectionName = 'Supermarket';
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

async function readXml(zip: JSZip, entryPath: string) {
  const file = zip.file(entryPath);
  if (!file) {
    throw new Error(`Workbook entry "${entryPath}" was not found.`);
  }

  const text = await file.async('text');
  return new DOMParser().parseFromString(decodeXmlText(text), 'text/xml');
}

export async function parseCampBudgetWorkbook(
  workbookBuffer: Buffer | ArrayBuffer,
  requestedSheetPrefix: string
): Promise<ImportedCampBudget> {
  const zip = await JSZip.loadAsync(workbookBuffer);
  const workbookDocument = await readXml(zip, 'xl/workbook.xml');
  const relationshipsDocument = await readXml(zip, 'xl/_rels/workbook.xml.rels');
  const sharedStringsDocument = await readXml(zip, 'xl/sharedStrings.xml');
  const sharedStrings = getSharedStrings(sharedStringsDocument);
  const sheetMap = buildSheetMap(workbookDocument, relationshipsDocument);

  const prefix = normalizeText(requestedSheetPrefix);
  if (!prefix) {
    throw new Error('Enter the sheet prefix used inside the workbook.');
  }

  const budgetSheetName = Array.from(sheetMap.keys()).find(
    (name) => normalizeKeyPart(name) === normalizeKeyPart(`${prefix} Budget`)
  );
  const actualSheetName = Array.from(sheetMap.keys()).find(
    (name) => normalizeKeyPart(name) === normalizeKeyPart(`${prefix} Actual Price List`)
  );

  if (!budgetSheetName || !actualSheetName) {
    throw new Error(`Could not find both "${prefix} Budget" and "${prefix} Actual Price List" in this workbook.`);
  }

  const budgetRows = getWorksheetRows(await readXml(zip, sheetMap.get(budgetSheetName)!), sharedStrings);
  const actualRows = getWorksheetRows(await readXml(zip, sheetMap.get(actualSheetName)!), sharedStrings);

  const expectedLines = extractBudgetLines(budgetRows);
  const actualLines = extractBudgetLines(actualRows);

  const merged = new Map<
    string,
    {
      categoryName: SectionName;
      description: string;
      expectedAmount: number | null;
      actualAmount: number | null;
    }
  >();

  for (const line of expectedLines) {
    const key = createLineKey(line.section, line.itemName, line.unit);
    merged.set(key, {
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
      continue;
    }

    merged.set(key, {
      categoryName: line.section,
      description: line.description,
      expectedAmount: null,
      actualAmount: line.amount,
    });
  }

  const items = SECTION_ORDER.flatMap((section) =>
    Array.from(merged.values()).filter((item) => item.categoryName === section)
  );

  const expectedTotal = items.reduce((sum, item) => sum + (item.expectedAmount || 0), 0);
  const actualTotal = items.reduce((sum, item) => sum + (item.actualAmount || 0), 0);

  return {
    sheetPrefix: prefix,
    items,
    categories: SECTION_ORDER.filter((section) => items.some((item) => item.categoryName === section)),
    expectedTotal,
    actualTotal,
  };
}
