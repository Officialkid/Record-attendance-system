import { NextResponse } from 'next/server';

import { getCapHealthSnapshot } from '@/lib/cap/health';

export async function GET() {
  return NextResponse.json(await getCapHealthSnapshot());
}
