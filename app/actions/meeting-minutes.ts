'use server';

import { getSession } from '@/lib/cap/auth';
import { processMeetingMinutes } from '@/lib/cap/services';

async function requireSessionUser() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('You must be signed in.');
  }

  return session.user;
}

export async function processMeetingMinutesFileAction(formData: FormData) {
  try {
    const user = await requireSessionUser();
    const { extractTextFromDocumentFile } = await import('@/lib/cap/document-parser');

    const file = formData.get('file');
    if (!(file instanceof File)) {
      throw new Error('Select a meeting minutes file to continue.');
    }

    const extractedText = await extractTextFromDocumentFile(file);
    const suggestion = await processMeetingMinutes(user, extractedText);

    return {
      success: true,
      message: 'Minutes file processed successfully.',
      extractedText,
      suggestion,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to process the uploaded minutes file.',
    };
  }
}
