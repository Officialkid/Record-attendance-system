import { Mail, ArrowRight, HelpCircle, PlayCircle, Lightbulb } from 'lucide-react';

export default function HelpPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Help &amp; Support
        </h1>
        <p className="text-gray-600">
          Get assistance with using AttendanceTracker
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Contact Support */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
            <Mail className="w-6 h-6 text-purple-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Email Support
          </h2>
          <p className="text-gray-600 mb-4">
            Have a question? Send us an email and we&apos;ll get back to you within 24 hours.
          </p>
          <a
            href="mailto:support@attendancetracker.com"
            className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium"
          >
            support@attendancetracker.com
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <HelpCircle className="w-6 h-6 text-blue-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Frequently Asked Questions
          </h2>
          <p className="text-gray-600 mb-4">
            Find answers to common questions about using the platform.
          </p>
          <button
            disabled
            className="text-gray-400 cursor-not-allowed"
          >
            Coming Soon
          </button>
        </div>

        {/* Video Tutorials */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
            <PlayCircle className="w-6 h-6 text-green-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Video Tutorials
          </h2>
          <p className="text-gray-600 mb-4">
            Watch step-by-step guides on how to use key features.
          </p>
          <button
            disabled
            className="text-gray-400 cursor-not-allowed"
          >
            Coming Soon
          </button>
        </div>

        {/* Feature Requests */}
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center mb-4">
            <Lightbulb className="w-6 h-6 text-yellow-600" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Feature Requests
          </h2>
          <p className="text-gray-600 mb-4">
            Have an idea for a new feature? We&apos;d love to hear it!
          </p>
          <button
            disabled
            className="text-gray-400 cursor-not-allowed"
          >
            Coming Soon
          </button>
        </div>

      </div>
    </div>
  );
}
