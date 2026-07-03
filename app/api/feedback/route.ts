import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      message: 'The legacy feedback endpoint has been retired in CAP.',
    },
    { status: 410 }
  );
}
