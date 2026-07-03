import { redirect } from 'next/navigation';

import { AuthMarketingPanel } from '@/components/cap/auth-marketing-panel';
import { InviteOnlyAccessPanel } from '@/components/cap/invite-only-access-panel';
import { getSession } from '@/lib/cap/auth';

export const dynamic = 'force-dynamic';

export default async function SignUpPage() {
  const session = await getSession();
  if (session?.user) {
    redirect('/dashboard');
  }

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.1fr_0.9fr]">
        <AuthMarketingPanel />

        <section className="flex items-center">
          <InviteOnlyAccessPanel />
        </section>
      </div>
    </main>
  );
}
