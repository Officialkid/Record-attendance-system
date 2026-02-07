'use client';

import { FileText } from 'lucide-react';

export default function ReportsTab() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
      <div className="max-w-md mx-auto">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Printable Reports Coming Soon
        </h3>
        <p className="text-gray-600 mb-6">
          Generate PDF reports, export to Excel, and share insights with your leadership team.
        </p>
        <button
          disabled
          className="px-6 py-3 bg-gray-100 text-gray-400 font-semibold rounded-lg cursor-not-allowed"
        >
          Generate Report
        </button>
      </div>
    </div>
  );
}
