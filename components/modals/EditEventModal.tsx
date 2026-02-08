'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar, Users } from 'lucide-react';
import { addVisitorToService, deleteVisitor, getVisitorsForService, updateService, type Service, type Visitor } from '@/lib/firestore-multitenant';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { useAuth } from '@/lib/AuthContext';
import { useOrganization } from '@/lib/OrganizationContext';

interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service | null;
  onSuccess: () => void;
}

export default function EditEventModal({
  isOpen,
  onClose,
  service,
  onSuccess,
}: EditEventModalProps) {
  const [formData, setFormData] = useState({
    serviceDate: '',
    totalAttendance: 0,
    eventType: '',
  });
  const [loading, setLoading] = useState(false);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [visitorsLoading, setVisitorsLoading] = useState(false);
  const [newVisitor, setNewVisitor] = useState({ name: '', contact: '' });
  const { user } = useAuth();
  const { terminology, eventTypes } = useOrganization();
  const eventTypeSamples = eventTypes.filter((type) => type !== 'Other').slice(0, 3);
  const eventTypePlaceholder = eventTypeSamples.length
    ? `e.g., ${eventTypeSamples.join(', ')}`
    : `e.g., ${terminology.Event} Type`;

  useEffect(() => {
    if (service) {
      setFormData({
        serviceDate: format(new Date(service.serviceDate), 'yyyy-MM-dd'),
        totalAttendance: service.totalAttendance,
        eventType: service.eventType || '',
      });
    }
  }, [service]);

  useEffect(() => {
    const loadVisitors = async () => {
      if (!service) return;
      setVisitorsLoading(true);
      try {
        const data = await getVisitorsForService(service.id);
        setVisitors(data);
      } catch (error) {
        console.error('Error loading visitors:', error);
      } finally {
        setVisitorsLoading(false);
      }
    };

    if (service) {
      loadVisitors();
    }
  }, [service]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!service) return;

    if (formData.totalAttendance < 0) {
      toast.error('Attendance cannot be negative');
      return;
    }

    setLoading(true);
    try {
      const result = await updateService(service.id, {
        serviceDate: new Date(formData.serviceDate),
        totalAttendance: formData.totalAttendance,
        eventType: formData.eventType,
      }, user?.uid);

      if (result.success) {
        toast.success('Event updated successfully!');
        onSuccess();
        onClose();
      } else {
        toast.error(result.error || 'Failed to update event');
      }
    } catch {
      toast.error('An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVisitor = async () => {
    if (!service) return;
    if (!newVisitor.name.trim() && !newVisitor.contact.trim()) {
      toast.error(`Add a name or contact for the ${terminology.visitor.toLowerCase()}`);
      return;
    }

    try {
      const result = await addVisitorToService(service.id, {
        name: newVisitor.name.trim(),
        contact: newVisitor.contact.trim(),
      });

      if (result.success) {
        toast.success(`${terminology.visitor} added`);
        setNewVisitor({ name: '', contact: '' });
        const data = await getVisitorsForService(service.id);
        setVisitors(data);
      } else {
        toast.error(result.error || `Failed to add ${terminology.visitor.toLowerCase()}`);
      }
    } catch {
      toast.error(`Failed to add ${terminology.visitor.toLowerCase()}`);
    }
  };

  const handleDeleteVisitor = async (visitorId: string) => {
    if (!service) return;
    try {
      const result = await deleteVisitor(service.id, visitorId);
      if (result.success) {
        toast.success(`${terminology.visitor} removed`);
        setVisitors((prev) => prev.filter((visitor) => visitor.id !== visitorId));
      } else {
        toast.error(result.error || `Failed to remove ${terminology.visitor.toLowerCase()}`);
      }
    } catch {
      toast.error(`Failed to remove ${terminology.visitor.toLowerCase()}`);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && service && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
          />

          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Edit {terminology.Event}</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {terminology.Event} Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="date"
                      value={formData.serviceDate}
                      onChange={(e) => setFormData({ ...formData, serviceDate: e.target.value })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Total Attendance
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="number"
                      value={formData.totalAttendance}
                      onChange={(e) => setFormData({
                        ...formData,
                        totalAttendance: Number.parseInt(e.target.value, 10) || 0,
                      })}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    {terminology.Event} Type
                  </label>
                  <input
                    type="text"
                    value={formData.eventType}
                    onChange={(e) => setFormData({ ...formData, eventType: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    placeholder={eventTypePlaceholder}
                  />
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-900">{terminology.visitors}</h3>
                    <span className="text-xs text-gray-500">{visitors.length} total</span>
                  </div>

                  <div className="space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={newVisitor.name}
                        onChange={(e) => setNewVisitor({ ...newVisitor, name: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder={`${terminology.visitor} name`}
                      />
                      <input
                        type="text"
                        value={newVisitor.contact}
                        onChange={(e) => setNewVisitor({ ...newVisitor, contact: e.target.value })}
                        className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="Phone or email"
                      />
                      <button
                        type="button"
                        onClick={handleAddVisitor}
                        className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition-colors"
                      >
                        Add {terminology.visitor}
                      </button>
                    </div>

                    {visitorsLoading ? (
                      <p className="text-xs text-gray-500">Loading {terminology.visitors.toLowerCase()}...</p>
                    ) : visitors.length === 0 ? (
                      <p className="text-xs text-gray-500">No {terminology.visitors.toLowerCase()} recorded yet.</p>
                    ) : (
                      <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
                        {visitors.map((visitor) => (
                          <div
                            key={visitor.id}
                            className="flex items-center justify-between px-3 py-2 border-b border-gray-200 last:border-b-0"
                          >
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {visitor.visitorName || `Unnamed ${terminology.visitor}`}
                              </div>
                              {visitor.visitorContact && (
                                <div className="text-xs text-gray-500">{visitor.visitorContact}</div>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteVisitor(visitor.id)}
                              className="text-xs text-red-600 hover:text-red-700 font-semibold"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-semibold rounded-lg transition-all disabled:opacity-50"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
