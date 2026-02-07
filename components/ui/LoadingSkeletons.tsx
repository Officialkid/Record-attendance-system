// STAT CARD SKELETON
export function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
      <div className="flex items-start justify-between mb-4">
        <div className="h-4 bg-gray-200 rounded w-24"></div>
        <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
      </div>
      <div className="h-8 bg-gray-200 rounded w-16 mb-2"></div>
      <div className="h-3 bg-gray-200 rounded w-32"></div>
    </div>
  );
}

// TABLE SKELETON
export function TableSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="animate-pulse">
        {/* Header */}
        <div className="h-12 bg-gray-100 border-b border-gray-200"></div>
        {/* Rows */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 border-b border-gray-200 px-6 py-4 flex items-center gap-4">
            <div className="w-10 h-10 bg-gray-200 rounded-lg"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              <div className="h-3 bg-gray-200 rounded w-1/4"></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// CHART SKELETON
export function ChartSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
      <div className="h-64 bg-gray-100 rounded"></div>
    </div>
  );
}

// PAGE HEADER SKELETON
export function PageHeaderSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
      <div className="h-8 bg-gray-200 rounded w-64 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-96"></div>
    </div>
  );
}

// FORM SKELETON
export function FormSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse space-y-6">
      {[1, 2, 3, 4].map((i) => (
        <div key={i}>
          <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
          <div className="h-12 bg-gray-100 rounded"></div>
        </div>
      ))}
      <div className="h-12 bg-gray-200 rounded w-32"></div>
    </div>
  );
}

// FILTERS BAR SKELETON
export function FiltersBarSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
      <div className="flex flex-col sm:flex-row gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex-1">
            <div className="h-3 bg-gray-200 rounded w-16 mb-2"></div>
            <div className="h-10 bg-gray-100 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

// QUICK ACTIONS SKELETON
export function QuickActionsSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-32 mb-4"></div>
      <div className="grid grid-cols-2 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-20 bg-gray-100 rounded-lg"></div>
        ))}
      </div>
    </div>
  );
}

// SETTINGS SIDEBAR SKELETON
export function SettingsSidebarSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-2 animate-pulse">
      <div className="space-y-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 bg-gray-100 rounded-lg"></div>
        ))}
      </div>
    </div>
  );
}
