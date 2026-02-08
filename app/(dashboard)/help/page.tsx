'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { 
  Mail, 
  HelpCircle, 
  MessageSquare,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  
} from 'lucide-react';
import UpdatesAndFeedbackTab from '@/components/updates/UpdatesAndFeedbackTab';

export default function HelpPage() {
  const searchParams = useSearchParams();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'support' | 'updates'>('support');

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'updates') {
      setActiveTab('updates');
    }
  }, [searchParams]);

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
          answer: `Yes! Click the organization name in the top bar to see all your organizations. Click "+ Add Organization" to create a new one. You can switch between organizations anytime. Each organization has its own separate data and settings.`
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
          answer: `Bulk import is coming soon! For now, you can manually add historical events by entering past dates in the "Add Event" form. If you have many records to import (50+), contact us at info@insighttrackerapp.com and we can help with a manual import.`
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
          question: 'How do I change my password?',
          answer: `Go to Settings > Account, then scroll to the "Change Password" section. Enter your current password, then your new password twice. Click "Change Password" to save. You can also reset your password from the sign-in page if you've forgotten it.`
        },
        {
          question: 'How do I change my profile picture?',
          answer: `Go to Settings > Account. Click "Upload Photo" next to your profile picture. Select an image from your device (JPG, PNG, or GIF, max 5MB). Your new picture will appear in the sidebar and top bar immediately.`
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
          answer: `We're currently in free beta! All features are free while we gather feedback. Paid plans will launch in a few months with: unlimited historical data (free plan: 6 months), advanced forecasting, unlimited visitor contacts (free plan: 50), multiple admin users, custom branding, and priority support. Pricing will be very affordable for African organizations.`
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

