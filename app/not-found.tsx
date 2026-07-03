import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-xl rounded-[32px] border border-[#dbcda9] bg-white p-10 text-center shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#8a6d1e]">CAP</p>
        <h1 className="mt-3 text-4xl font-semibold text-[#111111]">Page not found</h1>
        <p className="mt-4 text-sm text-[#5e584d]">
          The page you requested is not available in the rebuilt Christhood Accountability Platform.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex rounded-2xl bg-[#111111] px-5 py-3 text-sm font-semibold text-[#f5f0e1]"
        >
          Return to dashboard
        </Link>
      </div>
    </main>
  );
}
