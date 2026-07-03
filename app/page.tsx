import { redirect } from 'next/navigation';

import { getSession } from '@/lib/cap/auth';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const session = await getSession();
  redirect(session?.user ? '/dashboard' : '/login');
}
