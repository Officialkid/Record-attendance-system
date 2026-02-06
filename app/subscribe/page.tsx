'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Mail, Phone, Sparkles, User } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useOrganization } from '@/lib/OrganizationContext';
import { addDoc, collection, getDocs, limit, query, Timestamp, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';

interface WaitlistFormData {
  name: string;
  email: string;
  phone: string;
  subscribe: boolean;
}

export default function SubscribePage() {
  const { user } = useAuth();
  const { currentOrg } = useOrganization();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<WaitlistFormData>({
    name: '',
    email: '',
    phone: '',
    subscribe: true,
  });

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      name: prev.name || user?.displayName || '',
      email: prev.email || user?.email || '',
    }));
  }, [user?.displayName, user?.email]);

  const handleChange = (field: keyof WaitlistFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();

    if (!name || !email) {
      toast.error('Please enter your name and email.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const existingQuery = query(
        collection(db, 'pro_waitlist'),
        where('email', '==', email),
        limit(1)
      );
      const existingSnap = await getDocs(existingQuery);

      if (!existingSnap.empty) {
        toast('You are already on the Pro waitlist.', { icon: '✅' });
        setIsSubmitting(false);
        return;
      }

      await addDoc(collection(db, 'pro_waitlist'), {
        name,
        email,
        phone: formData.phone.trim() || null,
        subscribeToUpdates: formData.subscribe,
        organizationId: currentOrg?.id || null,
        organizationName: currentOrg?.name || null,
        userId: user?.uid || null,
        createdAt: Timestamp.now(),
      });

      toast.success('Thanks! We will keep you updated on Pro benefits.');
      setFormData({ name: '', email, phone: '', subscribe: true });
    } catch (error) {
      console.error('Error joining waitlist:', error);
      toast.error('Failed to join the waitlist. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0f172a] via-[#1d4ed8] to-[#0ea5e9]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_55%)]" />
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative max-w-6xl mx-auto px-6 py-16"
        >
          <div className="max-w-2xl">
            <p className="text-sm uppercase tracking-[0.3em] text-white/70">Pro Waitlist</p>
            <h1 className="mt-4 text-4xl md:text-5xl font-serif font-semibold text-white">
              Join the Pro Waitlist
            </h1>
            <p className="mt-4 text-lg text-white/80">
              {currentOrg?.name ? `${currentOrg.name} ` : ''}can keep growing for free. We will keep
              you updated on the benefits of joining Pro when it launches.
            </p>
          </div>
        </motion.div>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-[1.05fr_0.95fr] gap-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-3xl shadow-xl p-8"
          >
            <h2 className="text-2xl font-semibold text-gray-900">Reserve your spot</h2>
            <p className="text-gray-600 mt-2">
              Share your details and opt in for email updates. Phone number is optional.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(event) => handleChange('name', event.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#1d4ed8] focus:outline-none"
                    placeholder="Your name"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(event) => handleChange('email', event.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#1d4ed8] focus:outline-none"
                    placeholder="you@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(event) => handleChange('phone', event.target.value)}
                    className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#1d4ed8] focus:outline-none"
                    placeholder="+254 712 345 678"
                  />
                </div>
              </div>

              <label className="flex items-start gap-3 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={formData.subscribe}
                  onChange={(event) => handleChange('subscribe', event.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-[#1d4ed8] focus:ring-[#1d4ed8]"
                />
                <span>Subscribe to email notifications about Pro updates.</span>
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#1d4ed8] text-white py-3 rounded-xl font-semibold hover:bg-[#1e40af] transition-colors disabled:opacity-60"
              >
                {isSubmitting ? 'Submitting...' : 'Join Waitlist'}
              </button>
            </form>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="space-y-6"
          >
            <div className="bg-white rounded-3xl shadow-xl p-8">
              <div className="flex items-center gap-3 text-[#1d4ed8]">
                <Sparkles className="w-6 h-6" />
                <h3 className="text-xl font-semibold text-gray-900">Why join the waitlist?</h3>
              </div>
              <p className="text-gray-600 mt-3">
                Pro is designed for ministries that want deeper insights, faster workflows, and
                priority support.
              </p>
              <ul className="mt-6 space-y-3">
                {[
                  'Priority access to new Pro features',
                  'Advanced analytics and exportable reports',
                  'Multi-user roles and permissions',
                  'Dedicated onboarding and support',
                  'Early-bird pricing when Pro launches',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-gray-700">
                    <span className="mt-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#1d4ed8]/10">
                      <Check className="w-4 h-4 text-[#1d4ed8]" />
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gradient-to-br from-[#1d4ed8] to-[#38bdf8] rounded-3xl p-8 text-white shadow-xl">
              <h3 className="text-xl font-semibold">Stay in the loop</h3>
              <p className="mt-3 text-white/80">
                We will share Pro launch news, upcoming benefits, and upgrade options directly to
                your inbox.
              </p>
              <div className="mt-6 flex items-center gap-3 text-white/90">
                <div className="h-2 w-2 rounded-full bg-white" />
                <span>Free forever on the current plan</span>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
