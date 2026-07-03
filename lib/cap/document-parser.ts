import 'server-only';

import mammoth from 'mammoth';
import { PDFParse } from 'pdf-parse';

function normalizeExtractedText(text: string) {
  return text.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
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
