'use client';

import { useState } from 'react';
import { 
  Mail, 
  HelpCircle, 
  MessageSquare,
  Bell,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Send,
  Lightbulb,
  TrendingUp,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function HelpPage() {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'support' | 'updates'>('support');

  // FAQ Data
  const faqs = [
    {
      category: 'Getting Started',
      questions: [
        {
          question: 'How do I create my first event?',
          answer: `After signing up, navigate to "Add Event" (or "Add Service" for churches) from the sidebar. Enter the event date, total attendance count, and optionally add visitor information. Click "Save" and your event will be recorded. You'll see it appear in your dashboard immediately.`
        },
        {
          question: 'Can I manage multiple organizations?',
          answer: `Yes! You can manage multiple organizations from a single account. To add another organization, go to Settings and look for the organization switcher. Click "+ Add New Organization" and complete the setup process. You can switch between organizations anytime from the top navigation bar.`
        },
        {
          question: 'What organization types are supported?',
          answer: `Insight Tracker supports Churches, Ministries, NGOs, Corporate events, Community Groups, Event Organizers, Educational Institutions, and more. Each organization type gets customized event terminology and event type options relevant to your use case.`
        },
        {
          question: 'Is there a mobile app?',
          answer: `Currently, Insight Tracker is a web application that works great on mobile browsers. We've designed it to be fully responsive, so you can access all features from your phone or tablet. A native mobile app is on our roadmap for future development.`
        },
      ]
    },
    {
      category: 'Events & Attendance',
      questions: [
        {
          question: 'Can I edit or delete past events?',
          answer: `Yes! You can edit or delete any event record. Go to your Dashboard or Analytics page, find the event in the recent activity list, click the three-dot menu (⋮) next to it, and select "Edit Event" to modify the details or "Delete Event" to remove it permanently. Note that deletions cannot be undone.`
        },
        {
          question: 'How do I track visitors/guests?',
          answer: `When adding an event, scroll to the "Visitor Details" section. Click "Add Visitor" to capture their name and contact information (email or phone). You can add multiple visitors per event. All visitor data is accessible from the "Visitors" page where you can search, filter, and export contact information.`
        },
        {
          question: 'What event types can I create?',
          answer: `Event types are customized based on your organization type. Churches see options like "Sunday Service" and "Prayer Meeting". Corporate organizations see "Team Meeting" and "Conference". NGOs see "Community Outreach" and "Training Workshop". You can also create custom event types by typing your own in the event type field.`
        },
        {
          question: 'Can I import historical data?',
          answer: `Direct bulk import is not currently available in the free version. However, you can manually add historical events by entering past dates in the "Add Event" form. For bulk imports (100+ records), please contact support at info@insighttrackerapp.com to discuss custom solutions.`
        },
        {
          question: 'What if I accidentally record the same event twice?',
          answer: `Insight Tracker prevents duplicate events for the same date. If you try to add an event for a date that already has a record, you'll receive an error message. If you need to update that event, use the "Edit Event" option instead. If you somehow created duplicates, you can delete the extra ones.`
        },
      ]
    },
    {
      category: 'Analytics & Reports',
      questions: [
        {
          question: 'How do I view attendance trends?',
          answer: `Navigate to the "Analytics" page from the sidebar. You'll see monthly attendance charts, year-over-year comparisons, and growth statistics. Use the month and year filters at the top to view different time periods. The dashboard also shows a mini trend chart for quick insights.`
        },
        {
          question: 'Can I export my data?',
          answer: `Yes! On the Visitors page, click "Export CSV" to download all visitor contact information. Additional export features for attendance reports (Excel, PDF) are coming soon. All your data is stored securely and you maintain full ownership.`
        },
        {
          question: 'What does "year-over-year" comparison show?',
          answer: `The year-over-year comparison chart shows your attendance for each month of the current year compared to the same months in the previous year. This helps you identify seasonal patterns and measure long-term growth. Green indicates growth, red indicates decline.`
        },
        {
          question: 'How far back can I see my data?',
          answer: `On the free plan, you can view data from the last 6 months. Older data is automatically archived but not deleted. Upgrade to a paid plan for unlimited historical data access and advanced analytics features.`
        },
      ]
    },
    {
      category: 'Account & Settings',
      questions: [
        {
          question: 'How do I change my organization details?',
          answer: `Go to Settings from the sidebar, then select "Organization" from the left menu. You can update your organization name, type, country, and phone number. Click "Save Changes" when done. Note that changing organization type will update your event terminology throughout the app.`
        },
        {
          question: 'Can I change my email address?',
          answer: `Email address changes are not currently available in the app. If you need to change your email, please contact support at info@insighttrackerapp.com with your current email and desired new email. We'll assist you with the transfer.`
        },
        {
          question: 'How do I reset my password?',
          answer: `On the sign-in page, click "Forgot password?" below the password field. Enter your email address and we'll send you a password reset link. Check your spam folder if you don't receive it within a few minutes. Password reset links expire after 1 hour for security.`
        },
        {
          question: 'Can I delete my account?',
          answer: `Yes. Go to Settings > Organization, scroll to the "Danger Zone" section at the bottom, and click "Delete Organization". This will permanently delete all your data including events, visitors, and analytics. This action cannot be undone, so please be certain before proceeding.`
        },
      ]
    },
    {
      category: 'Pricing & Plans',
      questions: [
        {
          question: 'Is Insight Tracker really free?',
          answer: `Yes! We offer a generous free plan that includes unlimited event tracking, basic analytics (last 6 months), visitor management (up to 50 contacts), 1 organization, and 1 admin user. This is perfect for small organizations just getting started with data tracking.`
        },
        {
          question: 'What features are in paid plans?',
          answer: `Paid plans (coming soon) will include: unlimited historical data access, advanced analytics and forecasting, unlimited visitor contacts, multiple admin users, custom branding, API access, priority support, and more. We're still finalizing pricing to ensure it's affordable for organizations in Kenya and globally.`
        },
        {
          question: 'Do you offer discounts for non-profits?',
          answer: `Yes! We believe in supporting organizations that serve communities. Non-profits, churches, and NGOs receive special pricing (up to 50% off paid plans). Contact us at info@insighttrackerapp.com with proof of non-profit status to qualify.`
        },
        {
          question: 'What payment methods do you accept?',
          answer: `When paid plans launch, we'll accept M-Pesa (for Kenya), credit/debit cards (Visa, Mastercard), and mobile money (for other African countries). No payment information is required for the free plan.`
        },
      ]
    },
    {
      category: 'Technical & Troubleshooting',
      questions: [
        {
          question: 'Why can\'t I see my recent events?',
          answer: `First, check that you're viewing the correct organization (if you manage multiple). Then, verify your date filters on the Analytics page - you might be viewing a different month/year. Try refreshing the page. If the issue persists, clear your browser cache or try a different browser. Contact support if problems continue.`
        },
        {
          question: 'The app is running slowly. What should I do?',
          answer: `Slow performance is usually due to internet connection. Check your network speed. Close unnecessary browser tabs. Clear your browser cache (Settings > Privacy > Clear browsing data). If you're on mobile data, switch to WiFi if possible. Our servers are optimized for fast loading, so persistent issues may be local.`
        },
        {
          question: 'I\'m getting "Permission Denied" errors',
          answer: `This usually means you don't have access to view that organization's data. Verify you're signed into the correct account. If you were removed from an organization, you'll lose access to its data. If you believe this is an error, contact the organization owner or reach out to support.`
        },
        {
          question: 'Which browsers are supported?',
          answer: `Insight Tracker works best on modern browsers: Google Chrome (recommended), Safari, Firefox, and Microsoft Edge. We recommend keeping your browser updated to the latest version. Internet Explorer is not supported. Mobile browsers (Chrome, Safari) are fully supported.`
        },
      ]
    },
    {
      category: 'Privacy & Security',
      questions: [
        {
          question: 'How is my data protected?',
          answer: `All data is stored securely on Google Firebase with enterprise-grade encryption. We use HTTPS for all connections. Your attendance data is private to your organization - no other users can access it. We never sell your data to third parties. Read our full Privacy Policy for details.`
        },
        {
          question: 'Who can see my organization\'s data?',
          answer: `Only users you explicitly add to your organization can view its data. On the free plan, this is just you (the owner). With paid plans, you can invite team members as admin users. Each organization's data is completely isolated - even our support team requires your permission to access it for troubleshooting.`
        },
        {
          question: 'Can I export all my data?',
          answer: `Yes! You own your data. Currently, you can export visitor information as CSV. Full data export (all events, analytics) is being developed. If you need a complete data export urgently, contact support and we'll provide it manually within 48 hours.`
        },
      ]
    },
  ];

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div className="space-y-6">
      
      {/* PAGE HEADER */}
      <div>
        <nav className="text-sm text-gray-500 mb-2">
          <span>Dashboard</span>
          <span className="mx-2">/</span>
          <span className="text-gray-900 font-medium">Help & Support</span>
        </nav>

        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Help & Support
        </h1>
        <p className="text-gray-600">
          Get assistance with using Insight Tracker
        </p>
      </div>

      {/* TABS */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-6">
          <button
            onClick={() => setActiveTab('support')}
            className={`
              pb-3 px-1 border-b-2 font-medium text-sm transition-colors
              ${activeTab === 'support'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }
            `}
          >
            Support & FAQ
          </button>
          <button
            onClick={() => setActiveTab('updates')}
            className={`
              pb-3 px-1 border-b-2 font-medium text-sm transition-colors relative
              ${activeTab === 'updates'
                ? 'border-purple-600 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }
            `}
          >
            Updates & Feedback
            <span className="absolute -top-1 -right-6 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
          </button>
        </nav>
      </div>

      {/* TAB CONTENT */}
      {activeTab === 'support' && (
        <div className="space-y-6">
          
          {/* QUICK CONTACT CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Email Support */}
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
                href="mailto:info@insighttrackerapp.com"
                className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium transition-colors"
              >
                info@insighttrackerapp.com
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>

            {/* Live Chat (Coming Soon) */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 relative overflow-hidden">
              <div className="absolute top-3 right-3">
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-semibold rounded">
                  Coming Soon
                </span>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                <MessageSquare className="w-6 h-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Live Chat
              </h2>
              <p className="text-gray-600 mb-4">
                Get instant answers from our support team during business hours.
              </p>
              <button
                disabled
                className="text-gray-400 cursor-not-allowed font-medium"
              >
                Coming Soon
              </button>
            </div>

          </div>

          {/* FAQ SECTION */}
          <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <HelpCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    Frequently Asked Questions
                  </h2>
                  <p className="text-sm text-gray-600">
                    Find answers to common questions
                  </p>
                </div>
              </div>
            </div>

            {/* FAQ Categories */}
            <div className="divide-y divide-gray-200">
              {faqs.map((category, categoryIndex) => (
                <div key={categoryIndex} className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    {category.category}
                  </h3>
                  <div className="space-y-3">
                    {category.questions.map((faq, faqIndex) => {
                      const globalIndex = categoryIndex * 100 + faqIndex;
                      const isOpen = openFaqIndex === globalIndex;

                      return (
                        <div
                          key={faqIndex}
                          className="border border-gray-200 rounded-lg overflow-hidden"
                        >
                          <button
                            onClick={() => toggleFaq(globalIndex)}
                            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                          >
                            <span className="font-medium text-gray-900 pr-4">
                              {faq.question}
                            </span>
                            {isOpen ? (
                              <ChevronUp className="w-5 h-5 text-gray-500 flex-shrink-0" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                            )}
                          </button>
                          {isOpen && (
                            <div className="px-4 pb-4 text-gray-700 leading-relaxed">
                              {faq.answer}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>

            {/* Still Need Help */}
            <div className="p-6 bg-gray-50 border-t border-gray-200 text-center">
              <p className="text-gray-700 mb-3">
                Still can&apos;t find what you&apos;re looking for?
              </p>
              <a
                href="mailto:info@insighttrackerapp.com"
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
              >
                <Mail className="w-5 h-5" />
                Contact Support
              </a>
            </div>
          </div>

        </div>
      )}

      {activeTab === 'updates' && (
        <UpdatesAndFeedbackTab />
      )}

    </div>
  );
}

// UPDATES & FEEDBACK TAB COMPONENT
function UpdatesAndFeedbackTab() {
  const [featureRequest, setFeatureRequest] = useState('');
  const [requestType, setRequestType] = useState<'feature' | 'bug' | 'improvement'>('feature');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!featureRequest.trim()) {
      toast.error('Please describe your request');
      return;
    }

    setSubmitting(true);
    
    // Simulate API call (replace with actual implementation)
    setTimeout(() => {
      toast.success('Thank you! Your feedback has been submitted.');
      setFeatureRequest('');
      setSubmitting(false);
    }, 1000);
  };

  // Product Updates
  const updates = [
    {
      date: 'February 2026',
      title: 'Edit & Delete Events Now Available! 🎉',
      description: 'You can now edit past event records or delete them if needed. Just click the menu button next to any event.',
      status: 'new',
    },
    {
      date: 'February 2026',
      title: 'Visitor Directory Launched',
      description: 'Access all visitor information in one place. Search, filter, and export contact details from the new Visitors page.',
      status: 'new',
    },
    {
      date: 'January 2026',
      title: 'Dynamic Event Terminology',
      description: 'The app now adapts to your organization type! Churches see "Services", NGOs see "Events", Corporates see "Meetings".',
      status: 'recent',
    },
  ];

  // Upcoming Features
  const upcoming = [
    {
      title: 'Mobile App',
      description: 'Native iOS and Android apps for easier on-the-go tracking',
      votes: 47,
      status: 'In Development',
    },
    {
      title: 'Bulk Import',
      description: 'Import historical data from Excel/CSV files',
      votes: 32,
      status: 'Planned',
    },
    {
      title: 'Team Collaboration',
      description: 'Add multiple admin users to help manage your organization',
      votes: 28,
      status: 'Planned',
    },
    {
      title: 'WhatsApp Integration',
      description: 'Send attendance reminders and reports via WhatsApp',
      votes: 25,
      status: 'Under Review',
    },
  ];

  return (
    <div className="space-y-6">
      
      {/* RECENT UPDATES */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-purple-50 to-blue-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Latest Updates
              </h2>
              <p className="text-sm text-gray-600">
                See what&apos;s new in Insight Tracker
              </p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {updates.map((update, index) => (
            <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0">
                  {update.status === 'new' && (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full">
                      <Sparkles className="w-3 h-3" />
                      New
                    </span>
                  )}
                  {update.status === 'recent' && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded-full">
                      Recent
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">
                        {update.title}
                      </h3>
                      <p className="text-gray-700 text-sm mb-2">
                        {update.description}
                      </p>
                      <p className="text-xs text-gray-500">
                        {update.date}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* UPCOMING FEATURES */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Coming Soon
              </h2>
              <p className="text-sm text-gray-600">
                Features we&apos;re working on based on your feedback
              </p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {upcoming.map((feature, index) => (
            <div key={index} className="p-6 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {feature.title}
                  </h3>
                  <p className="text-gray-700 text-sm mb-2">
                    {feature.description}
                  </p>
                  <div className="flex items-center gap-3">
                    <span className={`
                      px-2 py-1 text-xs font-semibold rounded
                      ${feature.status === 'In Development' ? 'bg-green-100 text-green-800' : ''}
                      ${feature.status === 'Planned' ? 'bg-blue-100 text-blue-800' : ''}
                      ${feature.status === 'Under Review' ? 'bg-yellow-100 text-yellow-800' : ''}
                    `}>
                      {feature.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      {feature.votes} votes
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => toast.success('Vote recorded! Thank you.')}
                  className="flex-shrink-0 px-4 py-2 border border-purple-300 hover:border-purple-500 text-purple-600 hover:text-purple-700 font-medium rounded-lg text-sm transition-colors"
                >
                  Vote
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* FEATURE REQUEST FORM */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-yellow-50 to-orange-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Share Your Ideas
              </h2>
              <p className="text-sm text-gray-600">
                Help us build features you need
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Request Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              What would you like to share?
            </label>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setRequestType('feature')}
                className={`
                  px-4 py-3 border-2 rounded-lg font-medium text-sm transition-all
                  ${requestType === 'feature'
                    ? 'border-purple-600 bg-purple-50 text-purple-700'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                Feature Request
              </button>
              <button
                type="button"
                onClick={() => setRequestType('bug')}
                className={`
                  px-4 py-3 border-2 rounded-lg font-medium text-sm transition-all
                  ${requestType === 'bug'
                    ? 'border-red-600 bg-red-50 text-red-700'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                Report Bug
              </button>
              <button
                type="button"
                onClick={() => setRequestType('improvement')}
                className={`
                  px-4 py-3 border-2 rounded-lg font-medium text-sm transition-all
                  ${requestType === 'improvement'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                Improvement
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tell us more
            </label>
            <textarea
              value={featureRequest}
              onChange={(e) => setFeatureRequest(e.target.value)}
              rows={5}
              placeholder="Describe your idea, bug report, or suggestion in detail..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              The more details you provide, the better we can help!
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting || !featureRequest.trim()}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-black font-semibold rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>Submitting...</>
            ) : (
              <>
                <Send className="w-5 h-5" />
                Submit Feedback
              </>
            )}
          </button>

          <p className="text-xs text-center text-gray-500">
            We read every submission and will follow up via email if we need more information.
          </p>
        </form>
      </div>

      {/* COMMUNITY NOTE */}
      <div className="bg-gradient-to-r from-purple-100 to-blue-100 rounded-xl p-6 border border-purple-200">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0">
            <CheckCircle2 className="w-7 h-7 text-purple-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Building Together
            </h3>
            <p className="text-gray-700 text-sm leading-relaxed">
              Insight Tracker is shaped by users like you. Your feedback directly influences our roadmap. 
              We&apos;re committed to building features that help organizations track their impact and grow their communities. 
              Thank you for being part of our journey! 🙏
            </p>
          </div>
        </div>
      </div>

    </div>
  );
}
