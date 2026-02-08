'use client';

import { useState } from 'react';
import {
  Bell,
  Sparkles,
  TrendingUp,
  Lightbulb,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

export default function UpdatesAndFeedbackTab() {
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

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requestType,
          message: featureRequest.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send feedback');
      }

      toast.success('Thank you! Your feedback has been submitted.');
      setFeatureRequest('');
    } catch (error) {
      console.error(error);
      toast.error('Unable to send feedback right now. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const updates = [
    {
      date: 'February 2026',
      title: 'Edit & Delete Events Now Available',
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
                    <span
                      className={`
                        px-2 py-1 text-xs font-semibold rounded
                        ${feature.status === 'In Development' ? 'bg-green-100 text-green-800' : ''}
                        ${feature.status === 'Planned' ? 'bg-blue-100 text-blue-800' : ''}
                        ${feature.status === 'Under Review' ? 'bg-yellow-100 text-yellow-800' : ''}
                      `}
                    >
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
                  type="button"
                >
                  Vote
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

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
              Thank you for being part of our journey.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
