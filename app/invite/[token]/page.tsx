import Link from 'next/link';

import { AuthMarketingPanel } from '@/components/cap/auth-marketing-panel';
import { InviteClaimPanel } from '@/components/cap/invite-claim-panel';
import { getSession, isGoogleAuthConfigured } from '@/lib/cap/auth';
import { getDepartmentInviteByToken } from '@/lib/cap/services';

export const dynamic = 'force-dynamic';

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const [session, invite] = await Promise.all([getSession(), getDepartmentInviteByToken(token)]);

  return (
    <main className="min-h-screen px-6 py-10">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <AuthMarketingPanel />

        {invite ? (
          <InviteClaimPanel
            invite={invite}
            token={token}
            signedInUser={session?.user ? { name: session.user.name, email: session.user.email } : null}
            googleEnabled={isGoogleAuthConfigured()}
          />
        ) : (
          <section className="rounded-[32px] border border-[#ddd3f0] bg-white p-6 shadow-sm sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#C9A461]">Department invite</p>
            <h2 className="mt-3 text-3xl font-semibold text-[#241c33]">This invite link is not available.</h2>
            <p className="mt-3 text-sm text-[#5f5673]">
              The invite may have expired, already been used, or been copied incorrectly. Ask the department admin for a fresh one-time link.
            </p>
            <Link href="/login" className="mt-6 inline-flex rounded-2xl bg-[#4B248C] px-5 py-3 text-sm font-semibold text-white">
              Open CIOM Portal login
            </Link>
          </section>
        )}
      </div>
    </main>
  );
}
