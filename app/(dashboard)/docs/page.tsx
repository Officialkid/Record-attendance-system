import {
  BookOpen,
  CheckCircle2,
  ClipboardList,
  BarChart3,
  Users,
  Bell,
  Settings,
  Shield,
  Download,
  Smartphone,
} from 'lucide-react';

export default function DocsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Documentation
        </h1>
        <p className="text-gray-600">
          Everything you need to start tracking attendance and getting insights.
        </p>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-purple-700" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Quick Start</h2>
          </div>
          <ol className="space-y-3 text-sm text-gray-700">
            <li className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Create your organization and finish the setup wizard.
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Add your first attendance record from the Add Attendance page.
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Open Analytics to see charts and growth metrics instantly.
            </li>
            <li className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              Track visitors and export contact details if needed.
            </li>
          </ol>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <ClipboardList className="w-5 h-5 text-blue-700" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Core Workflow</h2>
          </div>
          <div className="space-y-3 text-sm text-gray-700">
            <p>1) Select an event date and type.</p>
            <p>2) Enter total attendance and optional visitor details.</p>
            <p>3) Save the record. It appears immediately on the dashboard.</p>
            <p>4) Use Analytics to review trends and growth.</p>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <BarChart3 className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900">Analytics</h3>
          </div>
          <p className="text-sm text-gray-700">
            View monthly charts, year-over-year comparisons, and growth metrics. Use date filters to focus on specific periods.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <Users className="w-5 h-5 text-emerald-600" />
            <h3 className="text-lg font-semibold text-gray-900">Visitors</h3>
          </div>
          <p className="text-sm text-gray-700">
            Add visitor details per event. Export contacts from the Visitors page when you need follow-ups.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <Bell className="w-5 h-5 text-amber-600" />
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
          </div>
          <p className="text-sm text-gray-700">
            Product updates appear in Notifications and Help & Support. Enable the PWA for faster access.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <Settings className="w-5 h-5 text-slate-600" />
            <h3 className="text-lg font-semibold text-gray-900">Settings</h3>
          </div>
          <p className="text-sm text-gray-700">
            Update your organization profile, manage account details, and change your password from Settings.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <Download className="w-5 h-5 text-sky-600" />
            <h3 className="text-lg font-semibold text-gray-900">Exports</h3>
          </div>
          <p className="text-sm text-gray-700">
            Export visitor contacts as CSV for outreach or reporting.
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-3">
            <Smartphone className="w-5 h-5 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-900">Install the PWA</h3>
          </div>
          <p className="text-sm text-gray-700">
            On Chrome or Edge, use the Install button in the address bar. The app opens directly on sign-in.
          </p>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-green-600" />
          <h2 className="text-xl font-semibold text-gray-900">Security & Access</h2>
        </div>
        <p className="text-sm text-gray-700">
          Each organization has its own data and settings. Only members you add can access your organization&apos;s data.
        </p>
      </section>
    </div>
  );
}
