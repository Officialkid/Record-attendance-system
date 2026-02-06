'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Plus, Trash2, Save, Minus, Check, Upload, FileSpreadsheet } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useOrganization } from '@/lib/OrganizationContext';
import { addAttendanceRecord } from '@/lib/firestore-multitenant';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';
import type { VisitorFormData } from '@/types';

interface Visitor {
  visitor_name: string;
  visitor_contact: string;
}

export default function AddAttendancePage() {
  const router = useRouter();
  const { currentOrg } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [serviceType, setServiceType] = useState('Saturday Fellowship');
  const [totalAttendance, setTotalAttendance] = useState(1);
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [showBulkImport, setShowBulkImport] = useState(false);
  const [bulkImportText, setBulkImportText] = useState('');

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
        // Success!
        const visitorCount = visitorsData.length;
        const message = visitorCount > 0 
          ? `🎉 Attendance saved! ${totalAttendance.toLocaleString()} attendees, ${visitorCount.toLocaleString()} visitors tracked`
          : `🎉 Attendance saved! ${totalAttendance.toLocaleString()} attendees recorded`;
        
        toast.success(message, { duration: 4000 });
        
        // Confetti celebration
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#4b248c', '#0047AB', '#F3CC3C']
        });

        setSuccess(true);
        
        // Reset form after delay
        setTimeout(() => {
          setSelectedDate(new Date());
          setServiceType('Saturday Fellowship');
          setTotalAttendance(1);
          setVisitors([]);
          setSuccess(false);
          
          // Redirect to analytics
          router.push('/view-analytics');
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
      
    } catch (error: any) {
      toast.dismiss(loadingToast);
      console.error('Error saving attendance:', error);
      toast.error(error.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!currentOrg) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background-color via-blue-50 to-purple-50 pt-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="h-10 w-2/3 bg-gray-200 rounded-lg animate-pulse" />
            <div className="h-4 w-1/2 bg-gray-200 rounded-lg animate-pulse mt-3" />
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 space-y-8">
            <div className="h-24 bg-gray-200 rounded-xl animate-pulse" />
            <div className="grid md:grid-cols-2 gap-6">
              <div className="h-16 bg-gray-200 rounded-xl animate-pulse" />
              <div className="h-16 bg-gray-200 rounded-xl animate-pulse" />
            </div>
            <div className="h-40 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-32 bg-gray-200 rounded-xl animate-pulse" />
            <div className="h-12 bg-gray-200 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background-color via-blue-50 to-purple-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-4">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Add Attendance</h1>
      </div>
      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-royal-purple mb-2">
            Record Attendance - {currentOrg?.name}
          </h1>
          <p className="text-gray-600">Record service attendance and visitor information</p>
        </div>
      </motion.div>

      {/* Form Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        <motion.form
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleSubmit}
          className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-2xl p-8 space-y-8"
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
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Service Date
                </label>
                <DatePicker
                  selected={selectedDate}
                  onChange={(date: Date | null) => date && setSelectedDate(date)}
                  dateFormat="MMMM d, yyyy"
                  maxDate={new Date()}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition-all text-lg font-medium"
                  calendarClassName="custom-datepicker"
                  dayClassName={(date) =>
                    isSaturday(date)
                      ? 'saturday-highlight'
                      : ''
                  }
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Service Type
                </label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition-all text-lg"
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
                className="w-full px-6 py-4 text-center text-4xl font-bold text-primary-blue border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition-all"
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
                <h2 className="text-2xl font-bold text-royal-purple">Visitors</h2>
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
                        className="w-full h-48 px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition-all font-mono text-sm"
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
                    Click "Import from Excel" for bulk import or "Add Single Visitor" for manual entry
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
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Visitor Name
                          </label>
                          <input
                            type="text"
                            value={visitor.visitor_name}
                            onChange={(e) =>
                              updateVisitor(index, 'visitor_name', e.target.value)
                            }
                            maxLength={100}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition-all"
                            placeholder="Enter visitor name"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Contact / Additional Info
                          </label>
                          <input
                            type="text"
                            value={visitor.visitor_contact}
                            onChange={(e) =>
                              updateVisitor(index, 'visitor_contact', e.target.value)
                            }
                            maxLength={500}
                            className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-blue focus:border-primary-blue transition-all"
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

          {/* Submit Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex justify-end pt-4"
          >
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading || success}
              className="relative overflow-hidden flex items-center px-10 py-4 bg-gold-color text-black-color rounded-xl hover:bg-gold-color/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg font-bold shadow-2xl min-w-[250px] justify-center"
            >
              <AnimatePresence mode="wait">
                {success ? (
                  <motion.div
                    key="success"
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    exit={{ scale: 0, rotate: 180 }}
                    className="flex items-center"
                  >
                    <Check className="w-6 h-6 mr-2" />
                    Saved Successfully!
                  </motion.div>
                ) : loading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center"
                  >
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-6 h-6 border-3 border-black-color border-t-transparent rounded-full mr-2"
                    />
                    Saving...
                  </motion.div>
                ) : (
                  <motion.div
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center"
                  >
                    <Save className="w-6 h-6 mr-2" />
                    Save Attendance Record
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </motion.div>
        </motion.form>
      </div>
    </div>
  );
}
