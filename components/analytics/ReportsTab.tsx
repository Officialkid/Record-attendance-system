'use client';

import { useState } from 'react';
import { useOrganization } from '@/lib/OrganizationContext';
import { 
  FileText, 
  Download, 
  Printer,
  Calendar,
  TrendingUp,
  Users,
  Mail,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function ReportsTab() {
  const { terminology } = useOrganization();
  const [generating, setGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const reportTypes = [
    {
      id: 'monthly-summary',
      name: 'Monthly Summary Report',
      description: `Overview of ${terminology.events.toLowerCase()}, attendance, and ${terminology.visitors.toLowerCase()} for a specific month`,
      icon: Calendar,
      color: 'purple',
      available: false, // Coming soon
    },
    {
      id: 'annual-report',
      name: 'Annual Report',
      description: 'Year-end summary with trends, growth analysis, and key statistics',
      icon: TrendingUp,
      color: 'blue',
      available: false,
    },
    {
      id: 'visitor-list',
      name: `${terminology.visitors} Contact List`,
      description: `Export all ${terminology.visitor.toLowerCase()} contact information to CSV or PDF`,
      icon: Users,
      color: 'green',
      available: true, // This works (links to Visitors page)
    },
    {
      id: 'custom-report',
      name: 'Custom Date Range',
      description: 'Generate a report for any custom date range you choose',
      icon: FileText,
      color: 'yellow',
      available: false,
    },
  ];

  const handleGenerateReport = (reportId: string) => {
    if (reportId === 'visitor-list') {
      // Redirect to visitors page where export is available
      window.location.href = '/visitors';
      return;
    }

    setGenerating(true);
    setSelectedReport(reportId);

    // Simulate report generation
    setTimeout(() => {
      toast.success('Report generated! Download started.');
      setGenerating(false);
      setSelectedReport(null);
    }, 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-6 border border-purple-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="w-7 h-7 text-purple-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Reports & Exports
            </h2>
            <p className="text-gray-700 text-sm">
              Generate professional reports to share with your leadership team, board members, or donors. 
              Export your data in multiple formats for presentations and record-keeping.
            </p>
          </div>
        </div>
      </div>

      {/* REPORT TYPES */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {reportTypes.map((report) => {
          const Icon = report.icon;
          const colorClasses = {
            purple: 'bg-purple-100 text-purple-600',
            blue: 'bg-blue-100 text-blue-600',
            green: 'bg-green-100 text-green-600',
            yellow: 'bg-yellow-100 text-yellow-600',
          }[report.color];

          return (
            <div
              key={report.id}
              className={`
                bg-white rounded-xl border-2 p-6 transition-all
                ${report.available 
                  ? 'border-gray-200 hover:border-purple-300 hover:shadow-md cursor-pointer' 
                  : 'border-gray-200 opacity-60'
                }
              `}
              onClick={() => report.available && handleGenerateReport(report.id)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses}`}>
                  <Icon className="w-6 h-6" />
                </div>
                {!report.available && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">
                    Coming Soon
                  </span>
                )}
                {report.available && (
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-semibold rounded-full inline-flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Available
                  </span>
                )}
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {report.name}
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                {report.description}
              </p>

              {report.available ? (
                <button
                  onClick={() => handleGenerateReport(report.id)}
                  disabled={generating && selectedReport === report.id}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {generating && selectedReport === report.id ? (
                    <>Generating...</>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Generate Report
                    </>
                  )}
                </button>
              ) : (
                <button
                  disabled
                  className="w-full px-4 py-2 bg-gray-100 text-gray-400 font-medium rounded-lg cursor-not-allowed"
                >
                  Coming Soon
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* EXPORT FORMATS INFO */}
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Available Export Formats
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* PDF */}
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <FileText className="w-6 h-6 text-red-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">PDF</h4>
            <p className="text-sm text-gray-600">
              Professional formatted reports ready to share
            </p>
            <p className="text-xs text-yellow-600 mt-2 font-medium">
              Coming Soon
            </p>
          </div>

          {/* CSV */}
          <div className="text-center p-4 border-2 border-green-300 bg-green-50 rounded-lg">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Download className="w-6 h-6 text-green-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">CSV</h4>
            <p className="text-sm text-gray-600">
              Spreadsheet format for Excel or Google Sheets
            </p>
            <p className="text-xs text-green-600 mt-2 font-semibold inline-flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              Available Now
            </p>
          </div>

          {/* Print */}
          <div className="text-center p-4 border border-gray-200 rounded-lg">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
              <Printer className="w-6 h-6 text-blue-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">Print</h4>
            <p className="text-sm text-gray-600">
              Print-optimized layout for physical copies
            </p>
            <button
              onClick={handlePrint}
              className="text-xs text-blue-600 hover:text-blue-700 mt-2 font-medium"
            >
              Print This Page
            </button>
          </div>

        </div>
      </div>

      {/* REQUEST CUSTOM REPORT */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200 p-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Mail className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Need a Custom Report?
            </h3>
            <p className="text-gray-700 text-sm mb-4">
              Have specific reporting needs? We can create custom reports tailored to your organization's requirements. 
              Contact us and let us know what you need.
            </p>
            <a
              href="mailto:info@insighttrackerapp.com?subject=Custom Report Request"
              className="inline-flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-lg transition-colors"
            >
              <Mail className="w-5 h-5" />
              Request Custom Report
            </a>
          </div>
        </div>
      </div>

      {/* TIPS */}
      <div className="bg-blue-50 rounded-xl border border-blue-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          💡 Tips for Great Reports
        </h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>
              <strong>Be consistent:</strong> Record {terminology.events.toLowerCase()} regularly to generate meaningful trend reports
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>
              <strong>Collect contacts:</strong> Capture {terminology.visitor.toLowerCase()} information to build better relationship reports
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>
              <strong>Review monthly:</strong> Generate monthly reports to track progress and share with leadership
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-600 font-bold">•</span>
            <span>
              <strong>Use filters:</strong> Adjust date ranges and filters before generating reports for targeted insights
            </span>
          </li>
        </ul>
      </div>

    </div>
  );
}
