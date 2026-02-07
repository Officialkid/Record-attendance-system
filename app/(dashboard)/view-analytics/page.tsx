'use client';

import { useState } from 'react';
import { useOrganization } from '@/lib/OrganizationContext';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  FileText,
  Download,
  Printer 
} from 'lucide-react';
import OverviewTab from '@/components/analytics/OverviewTab';
import TrendsTab from '@/components/analytics/TrendsTab';
import VisitorsTab from '@/components/analytics/VisitorsTab';
import ReportsTab from '@/components/analytics/ReportsTab';
import { toast } from 'react-hot-toast';

export default function ViewAnalyticsPage() {
  const { currentOrg } = useOrganization();
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [activeTab, setActiveTab] = useState('overview');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const years = Array.from({ length: 11 }, (_, i) => 2020 + i);

  const tabs = [
    { id: 'overview', label: 'Overview', icon: BarChart3 },
    { id: 'trends', label: 'Trends', icon: TrendingUp },
    { id: 'visitors', label: 'Visitors', icon: Users },
    { id: 'reports', label: 'Reports', icon: FileText },
  ];

  const handleResetFilters = () => {
    const now = new Date();
    setSelectedMonth(now.getMonth() + 1);
    setSelectedYear(now.getFullYear());
  };

  const handleExport = () => {
    // Placeholder for export functionality
    toast('Export functionality coming soon', {
      icon: '📥',
      duration: 3000,
    });
  };

  const handlePrint = () => {
    // Placeholder for print functionality
    toast('Preparing print view...', {
      icon: '🖨',
      duration: 2000,
    });
    setTimeout(() => window.print(), 500);
  };

  return (
    <div className="space-y-6">
      
      {/* PAGE HEADER */}
      <div>
        {/* Breadcrumb */}
        <nav className="text-sm text-gray-500 mb-2">
          <span>Dashboard</span>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">Analytics</span>
        </nav>

        {/* Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Analytics Dashboard
            </h1>
            <p className="text-gray-600">
              Insights and trends for {currentOrg?.name || 'your organization'}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
            >
              <Download className="w-4 h-4" />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
            >
              <Printer className="w-4 h-4" />
              <span className="hidden sm:inline">Print</span>
            </button>
          </div>
        </div>
      </div>

      {/* FILTERS BAR */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          
          {/* Month Filter */}
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            >
              {months.map((month, index) => (
                <option key={index} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
          </div>

          {/* Year Filter */}
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Year
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          {/* Service Type Filter (Future) */}
          <div className="flex-1">
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Service Type
            </label>
            <select
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm text-gray-500"
            >
              <option>All Services</option>
            </select>
          </div>

          {/* Reset Button */}
          <div className="flex items-end">
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              Reset
            </button>
          </div>

        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm whitespace-nowrap transition-colors
                  ${isActive
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* TAB CONTENT */}
      <div>
        {activeTab === 'overview' && <OverviewTab month={selectedMonth} year={selectedYear} />}
        {activeTab === 'trends' && <TrendsTab year={selectedYear} />}
        {activeTab === 'visitors' && <VisitorsTab month={selectedMonth} year={selectedYear} />}
        {activeTab === 'reports' && <ReportsTab />}
      </div>

    </div>
  );
}
