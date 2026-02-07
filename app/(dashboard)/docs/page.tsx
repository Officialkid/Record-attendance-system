import { FileText } from 'lucide-react';

export default function DocsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Documentation
        </h1>
        <p className="text-gray-600">
          Learn how to use AttendanceTracker effectively
        </p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Documentation Coming Soon
        </h2>
        <p className="text-gray-600 max-w-md mx-auto">
          We&apos;re working on comprehensive documentation to help you get the most out of AttendanceTracker.
        </p>
      </div>
    </div>
  );
}
