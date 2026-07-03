export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
        <div className="h-4 w-40 animate-pulse rounded bg-[#ece4f8]" />
        <div className="mt-4 h-10 w-72 animate-pulse rounded bg-[#f1ebfb]" />
        <div className="mt-3 h-4 w-full max-w-2xl animate-pulse rounded bg-[#f1ebfb]" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="rounded-[28px] border border-[#ddd3f0] bg-white p-5 shadow-sm">
            <div className="h-4 w-24 animate-pulse rounded bg-[#ece4f8]" />
            <div className="mt-6 h-10 w-16 animate-pulse rounded bg-[#f1ebfb]" />
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, index) => (
          <div key={index} className="rounded-[28px] border border-[#ddd3f0] bg-white p-6 shadow-sm">
            <div className="h-4 w-32 animate-pulse rounded bg-[#ece4f8]" />
            <div className="mt-3 h-8 w-56 animate-pulse rounded bg-[#f1ebfb]" />
            <div className="mt-6 h-56 animate-pulse rounded-3xl bg-[#f8f5fd]" />
          </div>
        ))}
      </div>
    </div>
  );
}
