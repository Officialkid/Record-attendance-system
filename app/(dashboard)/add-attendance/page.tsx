'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { Calendar, Plus, Trash2, Minus, Upload, FileSpreadsheet, CheckCircle, LayoutDashboard, BarChart3 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useOrganization } from '@/lib/OrganizationContext';
import { addAttendanceRecord, getServicesByMonth, type Service } from '@/lib/firestore-multitenant';
import { PageHeaderSkeleton, FormSkeleton } from '@/components/ui/LoadingSkeletons';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

interface Visitor {
  visitor_name: string;
  visitor_contact: string;
}

export default function AddAttendancePage() {
  const router = useRouter();
  const { currentOrg } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [showSuccessActions, setShowSuccessActions] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [serviceType, setServiceType] = useState('Saturday Fellowship');
  const [totalAttendance, setTotalAttendance] = useState(1);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkImportText, setBulkImportText] = useState('');
  const [lastService, setLastService] = useState<Service | null>(null);

  const loadLastService = useCallback(async () => {
    if (!currentOrg) return;
    setPageLoading(true);

    try {
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      const services = await getServicesByMonth(currentOrg.id, currentMonth, currentYear);
      setLastService(services.length > 0 ? services[0] : null);
    } catch (error) {
      console.error('Error loading last service:', error);
    } finally {
      setPageLoading(false);
    }
  }, [currentOrg]);

  useEffect(() => {
    if (currentOrg) {
      loadLastService();
    } else {
      setLastService(null);
      setPageLoading(false);
    }
  }, [currentOrg, loadLastService]);

  // Increment/Decrement functions
  const incrementAttendance = () => {
    if (totalAttendance < 1000000) {
      setTotalAttendance(totalAttendance + 1);
    }
  };

  const decrementAttendance = () => {
    if (totalAttendance > 1) {
      setTotalAttendance(totalAttendance - 1);
    }
  };

  const handleAttendanceChange = (value: string) => {
    const num = parseInt(value) || 0;
    if (num >= 1 && num <= 1000000) {
      setTotalAttendance(num);
    } else if (num < 1) {
      setTotalAttendance(1);
    } else {
      setTotalAttendance(1000000);
    }
  };

  const addVisitor = () => {
    if (visitors.length < 5000) {
      setVisitors([...visitors, { visitor_name: '', visitor_contact: '' }]);
    }
  };

  const removeVisitor = (index: number) => {
    setVisitors(visitors.filter((_, i) => i !== index));
  };

  const updateVisitor = (index: number, field: keyof Visitor, value: string) => {
    const updatedVisitors = [...visitors];
    updatedVisitors[index][field] = value;
    setVisitors(updatedVisitors);
  };

  const handleBulkImport = () => {
    if (!bulkImportText.trim()) {
      alert('Please paste visitor data first');
      return;
    }

    try {
      const lines = bulkImportText.trim().split('\n');
      const newVisitors: Visitor[] = [];

      lines.forEach((line) => {
        const trimmedLine = line.trim();
        if (!trimmedLine) return;

        // Support multiple formats and ANY number of columns
        let name = '';
        let contact = '';

        if (trimmedLine.includes('\t')) {
          // Excel tab-separated - can have ANY number of columns
          const parts = trimmedLine.split('\t');
          name = parts[0]?.trim() || '';
          // Concatenate all other columns as "contact" - preserves all data
          const otherColumns = parts.slice(1).filter(p => p.trim()).map(p => p.trim());
          contact = otherColumns.join(' | '); // Join with separator
        } else if (trimmedLine.includes(',')) {
          // Comma-separated - can have ANY number of columns
          const parts = trimmedLine.split(',');
          name = parts[0]?.trim() || '';
          const otherColumns = parts.slice(1).filter(p => p.trim()).map(p => p.trim());
          contact = otherColumns.join(' | ');
        } else {
          // Just name
          name = trimmedLine;
          contact = '';
        }

        if (name) {
          newVisitors.push({
            visitor_name: name.substring(0, 100),
            visitor_contact: contact.substring(0, 500), // Increased limit for multiple columns
          });
        }
      });

      if (newVisitors.length === 0) {
        alert('No valid visitor data found. Make sure each line has a name.');
        return;
      }

      if (newVisitors.length > 5000) {
        alert(`Too many visitors (${newVisitors.length}). Maximum is 5000. First 5000 will be imported.`);
        setVisitors([...visitors, ...newVisitors.slice(0, 5000)]);
      } else {
        setVisitors([...visitors, ...newVisitors]);
      }

      // Clear and close
      setBulkImportText('');
      setShowBulkImport(false);
      alert(`Successfully imported ${Math.min(newVisitors.length, 5000)} visitors with all their details!`);
    } catch (error) {
      console.error('Error parsing bulk import:', error);
      alert('Error parsing visitor data. Please check the format and try again.');
    }
  };

  // Check if Saturday
  const isSaturday = (date: Date) => {
    return date.getDay() === 6;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentOrg) {
      toast.error('No organization selected');
      return;
    }

    // Validation
    if (!selectedDate) {
      toast.error('Please select a service date');
      return;
    }
    
    if (totalAttendance < 1) {
      toast.error('Attendance must be at least 1');
      return;
    }

    if (totalAttendance > 1000000) {
      toast.error('Attendance cannot exceed 1,000,000');
      return;
    }

    if (selectedDate > new Date()) {
      toast.error('Service date cannot be in the future');
      return;
    }

    setShowSuccessActions(false);
    setLoading(true);
    const loadingToast = toast.loading('Saving attendance record...');

    try {
      // Prepare visitors data (preserving all imported columns)
      const visitorsData = visitors
        .filter((v) => v.visitor_name.trim() !== '')
        .map((visitor) => ({
          name: visitor.visitor_name,
          contact: visitor.visitor_contact, // This contains ALL columns from Excel
        }));

      // Save to Firebase with duplicate detection
      const result = await addAttendanceRecord(
        currentOrg.id,
        selectedDate,
        totalAttendance,
        visitorsData
      );

      toast.dismiss(loadingToast);

      if (result.success) {
        toast.success('Attendance saved successfully! 🎉', { duration: 4000 });
        
        // Check for milestone achievements
        const milestones = [50, 100, 150, 200, 250, 300, 500, 1000];
        if (milestones.includes(totalAttendance)) {
          setTimeout(() => {
            toast.success(`🎉 Milestone! ${totalAttendance} attendees!`, {
              duration: 5000,
              style: {
                background: 'linear-gradient(135deg, #4b248c 0%, #0047AB 100%)',
                color: 'white',
                fontSize: '16px',
                fontWeight: '600',
              },
            });
          }, 500);
        }
        
        // Confetti celebration
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#4b248c', '#0047AB', '#F3CC3C']
        });

        setShowSuccessActions(true);

        setTimeout(() => {
          router.push('/dashboard');
        }, 2000);
        
      } else {
        // Handle specific errors
        if (result.error?.includes('already exists')) {
          toast.error('⚠️ Attendance for this date already exists. Please choose a different date.', {
            duration: 6000,
          });
        } else {
          toast.error(result.error || 'Failed to save attendance');
        }
      }
      
    } catch (error: unknown) {
      toast.dismiss(loadingToast);
      console.error('Error saving attendance:', error);
      const message = (error as { message?: string }).message;
      toast.error(message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    router.push('/dashboard');
  };

  const handleAddAnother = () => {
    setSelectedDate(new Date());
    setServiceType('Saturday Fellowship');
    setTotalAttendance(1);
    setVisitors([]);
    setShowSuccessActions(false);
    setBulkImportText('');
    setShowBulkImport(false);
  };

  if (!currentOrg || pageLoading) {
    return (
      <div className="space-y-6">
        <PageHeaderSkeleton />
        <FormSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <nav className="text-sm text-gray-500 mb-2">
          <span>Dashboard</span>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">Add Attendance</span>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Record Service Attendance
        </h1>

        <p className="text-gray-600">
          Track attendance for today&apos;s service and add visitor information.
        </p>

        {lastService && (
          <div className="mt-4 inline-flex items-center gap-2 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg text-sm">
            <Calendar className="w-4 h-4" />
            <span>
              Last recorded: <strong>{format(new Date(lastService.serviceDate), 'MMM d, yyyy')}</strong>
              {' '}({lastService.totalAttendance} attendees)
            </span>
          </div>
        )}
      </div>

      <motion.form
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSubmit}
        className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 lg:p-8 space-y-8"
      >
          {/* Selected Date Display */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-r from-royal-purple to-primary-blue text-white p-6 rounded-xl text-center"
          >
            <div className="text-sm font-medium mb-2">Selected Service Date</div>
            <div className="text-3xl font-bold">
              {selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </div>
          </motion.div>

          {/* Service Date Picker */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-2xl font-bold text-royal-purple mb-6 flex items-center">
              <Calendar className="w-6 h-6 mr-2" />
              Service Information
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Service Date
                </label>
                <DatePicker
                  selected={selectedDate}
                  onChange={(date: Date | null) => date && setSelectedDate(date)}
                  dateFormat="MMMM d, yyyy"
                  maxDate={new Date()}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  calendarClassName="custom-datepicker"
                  dayClassName={(date) =>
                    isSaturday(date)
                      ? 'saturday-highlight'
                      : ''
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Service Type
                </label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                >
                  <option value="Saturday Fellowship">Saturday Fellowship</option>
                  <option value="Sunday Service">Sunday Service</option>
                  <option value="Midweek Service">Midweek Service</option>
                  <option value="Special Event">Special Event</option>
                </select>
              </div>
            </div>
          </motion.div>

          {/* Total Attendance Counter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-gray-50 to-blue-50 p-8 rounded-xl"
          >
            <label className="block text-lg font-bold text-center text-gray-700 mb-4">
              Total Attendance Today
            </label>
            
            {/* Direct Input Field */}
            <div className="mb-4">
              <input
                type="number"
                min="1"
                max="1000000"
                value={totalAttendance}
                onChange={(e) => handleAttendanceChange(e.target.value)}
                className="w-full px-6 py-4 text-center text-4xl font-bold text-primary-blue border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                placeholder="Enter number"
              />
              <p className="text-center text-xs text-gray-500 mt-2">
                Type directly or use +/- buttons below
              </p>
            </div>

            {/* +/- Buttons */}
            <div className="flex items-center justify-center gap-4">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={decrementAttendance}
                disabled={totalAttendance <= 1}
                className="w-12 h-12 rounded-full bg-red-500 text-white flex items-center justify-center text-xl font-bold hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all"
              >
                <Minus className="w-5 h-5" />
              </motion.button>

              <span className="text-sm text-gray-600 font-medium">Quick adjust</span>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                type="button"
                onClick={incrementAttendance}
                disabled={totalAttendance >= 1000000}
                className="w-12 h-12 rounded-full bg-green-500 text-white flex items-center justify-center text-xl font-bold hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg transition-all"
              >
                <Plus className="w-5 h-5" />
              </motion.button>
            </div>
            <p className="text-center text-sm text-gray-500 mt-4">
              Range: 1 to 1,000,000 people
            </p>
          </motion.div>

          {/* Visitors Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
              <div>
                <h2 className="text-2xl font-bold text-royal-purple">Visitor Details</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Optional - For first-time visitors or event attendees
                </p>
              </div>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setShowBulkImport(!showBulkImport)}
                  className="flex items-center px-6 py-3 bg-primary-blue text-white rounded-xl hover:bg-primary-blue/90 transition-all shadow-lg font-medium"
                >
                  <FileSpreadsheet className="w-5 h-5 mr-2" />
                  Import from Excel
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={addVisitor}
                  disabled={visitors.length >= 5000}
                  className="flex items-center px-6 py-3 bg-gold-color text-black-color rounded-xl hover:bg-gold-color/90 transition-all shadow-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Single Visitor
                </motion.button>
              </div>
            </div>

            {/* Bulk Import Section */}
            <AnimatePresence>
              {showBulkImport && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 p-6 bg-blue-50 rounded-xl border-2 border-primary-blue"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <Upload className="w-6 h-6 text-primary-blue flex-shrink-0 mt-1" />
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-primary-blue mb-2">
                        Bulk Import Visitors from Excel
                      </h3>
                      <p className="text-sm text-gray-700 mb-3">
                        Copy your visitor list from Excel and paste it below. All extra columns are preserved!
                      </p>
                      <ul className="text-sm text-gray-600 space-y-1 mb-4 list-disc list-inside">
                        <li><strong>Excel format (recommended):</strong> Name [TAB] Contact [TAB] Email [TAB] Location [TAB] ... (copy directly from Excel with any number of columns)</li>
                        <li><strong>Comma-separated:</strong> Name, Contact, Email, Location, ...</li>
                        <li><strong>Names only:</strong> One name per line</li>
                        <li className="text-primary-blue font-medium">💡 Tip: The system stores ALL columns from your Excel sheet - perfect for events needing extra details!</li>
                      </ul>
                      <textarea
                        value={bulkImportText}
                        onChange={(e) => setBulkImportText(e.target.value)}
                        placeholder="Paste your visitor data here...&#10;&#10;Example with multiple columns:&#10;John Doe&#9;0701234567&#9;john@email.com&#9;Nairobi&#10;Jane Smith&#9;0707654321&#9;jane@email.com&#9;Mombasa&#10;Bob Johnson&#9;0703456789&#9;bob@email.com&#9;Kisumu&#10;&#10;All columns will be saved!"
                        className="w-full h-48 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all font-mono text-sm"
                      />
                      <div className="flex justify-end gap-3 mt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setBulkImportText('');
                            setShowBulkImport(false);
                          }}
                          className="px-5 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-all font-medium"
                        >
                          Cancel
                        </button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          type="button"
                          onClick={handleBulkImport}
                          className="px-5 py-2 bg-primary-blue text-white rounded-lg hover:bg-primary-blue/90 transition-all font-medium shadow-lg"
                        >
                          Import Visitors
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <AnimatePresence mode="popLayout">
              {visitors.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-300"
                >
                  <p className="text-gray-500 text-lg">
                    No visitors added yet
                  </p>
                  <p className="text-gray-400 text-sm mt-2">
                    Click &quot;Import from Excel&quot; for bulk import or &quot;Add Single Visitor&quot; for manual entry
                  </p>
                </motion.div>
              ) : (
                <div className="space-y-4">
                  {visitors.map((visitor, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20, scale: 0.95 }}
                      animate={{ opacity: 1, x: 0, scale: 1 }}
                      exit={{ opacity: 0, x: 20, scale: 0.95 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex gap-4 items-start p-6 bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-md border border-gray-200 hover:shadow-lg transition-all"
                    >
                      <div className="flex-1 grid md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Visitor Name
                          </label>
                          <input
                            type="text"
                            value={visitor.visitor_name}
                            onChange={(e) =>
                              updateVisitor(index, 'visitor_name', e.target.value)
                            }
                            maxLength={100}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            placeholder="Enter visitor name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Contact / Additional Info
                          </label>
                          <input
                            type="text"
                            value={visitor.visitor_contact}
                            onChange={(e) =>
                              updateVisitor(index, 'visitor_contact', e.target.value)
                            }
                            maxLength={500}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                            placeholder="Phone, email, location, etc."
                          />
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1, rotate: 90 }}
                        whileTap={{ scale: 0.9 }}
                        type="button"
                        onClick={() => removeVisitor(index)}
                        className="mt-8 p-3 text-red-600 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-5 h-5" />
                      </motion.button>
                    </motion.div>
                  ))}
                </div>
              )}
            </AnimatePresence>

            {visitors.length > 0 && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-sm text-green-700 text-center font-medium">
                  ✓ {visitors.length.toLocaleString()} visitor{visitors.length !== 1 ? 's' : ''} added
                  {visitors.length >= 5000 && ' (Maximum reached)'}
                </p>
              </div>
            )}
          </motion.div>

        <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 lg:flex-none px-8 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-semibold rounded-lg shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Saving...' : 'Save Attendance Record'}
          </button>

          <button
            type="button"
            onClick={handleCancel}
            className="px-6 py-3 text-gray-700 hover:text-gray-900 font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </motion.form>

      {showSuccessActions && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                Attendance Recorded!
              </h3>
              <p className="text-sm text-green-700 mb-4">
                Your service attendance has been saved successfully.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/dashboard"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-lg transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Go to Dashboard
                </Link>
                <Link
                  href="/view-analytics"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 text-green-700 border border-green-200 font-medium rounded-lg transition-colors"
                >
                  <BarChart3 className="w-4 h-4" />
                  View Analytics
                </Link>
                <button
                  type="button"
                  onClick={handleAddAnother}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 text-green-700 hover:text-green-800 font-medium transition-colors"
                >
                  Add Another Service
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
