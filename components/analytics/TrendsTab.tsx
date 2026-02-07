'use client';

import YearOverYearChart from '@/components/charts/YearOverYearChart';

interface TrendsTabProps {
  year: number;
}

export default function TrendsTab({ year }: TrendsTabProps) {
  return (
    <div className="space-y-6">
      
      {/* Year-over-Year Comparison */}
      <YearOverYearChart selectedYear={year} />

      {/* Future: Add more trend visualizations */}
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg 
              className="w-8 h-8 text-blue-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" 
              />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            More Trends Coming Soon
          </h3>
          <p className="text-gray-600">
            Additional trend analysis, seasonal patterns, and comparative insights will be available here.
          </p>
        </div>
      </div>

    </div>
  );
}
