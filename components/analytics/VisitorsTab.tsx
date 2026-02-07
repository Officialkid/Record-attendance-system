'use client';

import { Users } from 'lucide-react';

interface VisitorsTabProps {
  month: number;
  year: number;
}

export default function VisitorsTab({ month: _month, year: _year }: VisitorsTabProps) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <div className="max-w-md mx-auto">
        <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Users className="w-8 h-8 text-purple-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Visitor Insights Coming Soon
        </h3>
        <p className="text-gray-600 mb-4">
          Track visitor retention, conversion rates, follow-up status, and engagement metrics.
        </p>
        <div className="inline-flex items-center gap-2 text-sm text-gray-500">
          <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
          In Development
        </div>
      </div>
    </div>
  );
}
