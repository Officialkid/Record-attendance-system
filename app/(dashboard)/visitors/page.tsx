'use client';

import { useCallback, useEffect, useState } from 'react';
import { useOrganization } from '@/lib/OrganizationContext';
import {
  getServicesByMonth,
  getVisitorsForService,
  deleteVisitor,
} from '@/lib/firestore-multitenant';
import {
  Search,
  Download,
  Trash2,
  Mail,
  Phone,
  Calendar,
  UserPlus,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'react-hot-toast';

interface VisitorData {
  id: string;
  serviceId: string;
  name: string | null;
  contact: string | null;
  visitDate: Date;
  eventDate: Date;
  eventType: string;
}

export default function VisitorsPage() {
  const { currentOrg, terminology } = useOrganization();
  const [visitors, setVisitors] = useState<VisitorData[]>([]);
  const [filteredVisitors, setFilteredVisitors] = useState<VisitorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const filterVisitors = useCallback(() => {
    if (!searchQuery.trim()) {
      setFilteredVisitors(visitors);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = visitors.filter((visitor) => {
      return (
        visitor.name?.toLowerCase().includes(query) ||
        visitor.contact?.toLowerCase().includes(query) ||
        visitor.eventType.toLowerCase().includes(query)
      );
    });

    setFilteredVisitors(filtered);
  }, [searchQuery, visitors]);

  const loadVisitors = useCallback(async () => {
    if (!currentOrg) return;

    setLoading(true);
    try {
      const services = await getServicesByMonth(currentOrg.id, selectedMonth, selectedYear);

      const allVisitors: VisitorData[] = [];

      for (const service of services) {
        const serviceVisitors = await getVisitorsForService(service.id);

        serviceVisitors.forEach((visitor) => {
          allVisitors.push({
            id: visitor.id,
            serviceId: service.id,
            name: visitor.visitorName,
            contact: visitor.visitorContact,
            visitDate: visitor.visitDate,
            eventDate: service.serviceDate,
            eventType: service.eventType || terminology.Event,
          });
        });
      }

      setVisitors(allVisitors);
      setFilteredVisitors(allVisitors);
    } catch (error) {
      console.error('Error loading visitors:', error);
      toast.error(`Failed to load ${terminology.visitors.toLowerCase()}`);
    } finally {
      setLoading(false);
    }
  }, [currentOrg, selectedMonth, selectedYear, terminology]);

  useEffect(() => {
    if (currentOrg) {
      loadVisitors();
    }
  }, [currentOrg, loadVisitors]);

  useEffect(() => {
    filterVisitors();
  }, [filterVisitors]);

  const handleDelete = async (serviceId: string, visitorId: string) => {
    if (!confirm(`Delete this ${terminology.visitor.toLowerCase()} record?`)) return;

    try {
      const result = await deleteVisitor(serviceId, visitorId);

      if (result.success) {
        toast.success(`${terminology.visitor} deleted successfully`);
        loadVisitors();
      } else {
        toast.error(`Failed to delete ${terminology.visitor.toLowerCase()}`);
      }
    } catch {
      toast.error('An error occurred');
    }
  };

  const handleExport = () => {
    const headers = ['Name', 'Contact', `${terminology.Event} Type`, `${terminology.Event} Date`, 'Visit Date'];
    const rows = filteredVisitors.map((visitor) => [
      visitor.name || 'N/A',
      visitor.contact || 'N/A',
      visitor.eventType,
      format(new Date(visitor.eventDate), 'MMM d, yyyy'),
      format(new Date(visitor.visitDate), 'MMM d, yyyy'),
    ]);

    const csv = [headers, ...rows].map((row) => row.join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `${terminology.visitors.toLowerCase()}-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    anchor.click();

    toast.success('Exported successfully!');
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="bg-white rounded-xl p-8">
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-12 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <nav className="text-sm text-gray-500 mb-2">
          <span>Dashboard</span>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">{terminology.visitors}</span>
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {terminology.visitors} Directory
            </h1>
            <p className="text-gray-600">
              View and manage all {terminology.visitors.toLowerCase()} information
            </p>
          </div>

          <button
            onClick={handleExport}
            disabled={filteredVisitors.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search by name, contact, or ${terminology.event.toLowerCase()} type...`}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              />
            </div>
          </div>

          <div className="w-full sm:w-40">
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

          <div className="w-full sm:w-32">
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
        </div>

        <div className="mt-3 text-sm text-gray-600">
          Showing <strong>{filteredVisitors.length}</strong> of <strong>{visitors.length}</strong> {terminology.visitors.toLowerCase()}
        </div>
      </div>

      {filteredVisitors.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <UserPlus className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No {terminology.visitors} Found
          </h3>
          <p className="text-gray-600">
            {searchQuery
              ? 'Try adjusting your search or filters'
                : `${terminology.visitor} information will appear here when you add ${terminology.visitors.toLowerCase()} to ${terminology.events.toLowerCase()}`}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    {terminology.visitor} Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    {terminology.Event} Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    {terminology.Event} Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                    Visit Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredVisitors.map((visitor) => (
                  <tr key={visitor.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <UserPlus className="w-4 h-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {visitor.name || <span className="text-gray-400">N/A</span>}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {visitor.contact?.includes('@') ? (
                          <Mail className="w-4 h-4 text-gray-400" />
                        ) : (
                          <Phone className="w-4 h-4 text-gray-400" />
                        )}
                        <span className="text-sm text-gray-700">
                          {visitor.contact || <span className="text-gray-400">N/A</span>}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-700">{visitor.eventType}</span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-700">
                          {format(new Date(visitor.eventDate), 'MMM d, yyyy')}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-xs text-gray-500">
                        {format(new Date(visitor.visitDate), 'MMM d, yyyy')}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => handleDelete(visitor.serviceId, visitor.id)}
                        className="p-2 hover:bg-red-50 rounded-lg transition-colors group"
                        title={`Delete ${terminology.visitor.toLowerCase()}`}
                      >
                        <Trash2 className="w-4 h-4 text-gray-400 group-hover:text-red-600" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="md:hidden divide-y divide-gray-200">
            {filteredVisitors.map((visitor) => (
              <div key={visitor.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <UserPlus className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">
                        {visitor.name || <span className="text-gray-400">N/A</span>}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      {visitor.contact?.includes('@') ? (
                        <Mail className="w-3 h-3" />
                      ) : (
                        <Phone className="w-3 h-3" />
                      )}
                      <span>{visitor.contact || 'N/A'}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(visitor.serviceId, visitor.id)}
                    className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4 text-red-600" />
                  </button>
                </div>

                <div className="text-xs text-gray-500 space-y-1">
                  <div>{visitor.eventType}</div>
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {format(new Date(visitor.eventDate), 'MMM d, yyyy')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
