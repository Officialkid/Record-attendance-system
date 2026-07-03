import { NextResponse } from 'next/server';

import { getSession } from '@/lib/cap/auth';
import { buildGeneratedReportDocx, buildGeneratedReportFilename } from '@/lib/cap/report-export';
import { getGeneratedReportById } from '@/lib/cap/services';

export async function GET(
  _request: Request,
  context: { params: Promise<{ reportId: string }> }
) {
  const session = await getSession();
  if (!session?.user) {
    return NextResponse.json({ success: false, message: 'Unauthorized.' }, { status: 401 });
  }

  const { reportId } = await context.params;
  const numericReportId = Number(reportId);
  if (!Number.isFinite(numericReportId) || numericReportId <= 0) {
    return NextResponse.json({ success: false, message: 'Invalid report id.' }, { status: 400 });
  }

  try {
    const report = await getGeneratedReportById(session.user, numericReportId);
    const buffer = await buildGeneratedReportDocx(report);
    const filename = `${buildGeneratedReportFilename(report)}.docx`;
    const body = new Uint8Array(buffer);

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to export report.',
      },
      { status: 400 }
    );
  }
}
