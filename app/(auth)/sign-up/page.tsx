'use client';

import { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, Lock, User, Building, Phone, Eye, EyeOff, 
  Check, X, ChevronLeft, ChevronRight, Sparkles,
  BarChart3, Users, Calendar
} from 'lucide-react';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import confetti from 'canvas-confetti';
import toast from 'react-hot-toast';

interface FormData {
  // Step 1
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  // Step 2
  organizationName: string;
  organizationType: string;
  country: string;
  phone: string;
}

type PasswordStrength = 'weak' | 'medium' | 'strong';

export default function SignUpPage() {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    organizationName: '',
    organizationType: 'Church',
    country: 'Kenya',
    phone: '',
  });
  const { signUp } = useAuth();
  const router = useRouter();

  const updateFormData = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Password strength checker
  const checkPasswordStrength = (password: string): PasswordStrength => {
    if (password.length < 8) return 'weak';
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    const strength = [hasUpperCase, hasNumber, hasSpecialChar].filter(Boolean).length;
    
    if (strength >= 2 && password.length >= 10) return 'strong';
    if (strength >= 1 && password.length >= 8) return 'medium';
    return 'weak';
  };

  const passwordStrength = checkPasswordStrength(formData.password);

  // Validation functions
  const validateStep1 = () => {
    if (formData.fullName.length < 2) return false;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) return false;
    if (formData.password.length < 8) return false;
    if (!/[A-Z]/.test(formData.password)) return false;
    if (!/[0-9]/.test(formData.password)) return false;
    if (formData.password !== formData.confirmPassword) return false;
    return true;
  };

  const validateStep2 = () => {
    if (formData.organizationName.length < 2) return false;
    if (!formData.organizationType) return false;
    if (!formData.country) return false;
    if (formData.phone && formData.phone.length < 10) return false;
    return true;
  };

  const canProceed = () => {
    if (step === 1) return validateStep1();
    if (step === 2) return validateStep2();
    return true;
  };

  const handleNext = () => {
    if (canProceed()) {
      setStep(prev => Math.min(prev + 1, 2));
    }
  };

  const handleBack = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Create user account and get user ID
      const userId = await signUp(formData.email, formData.password, { 
        fullName: formData.fullName,
        organizationName: formData.organizationName 
      });

      if (!userId) throw new Error('User ID not found');

      // Create organization document
      const organizationRef = doc(db, 'organizations', `org_${Date.now()}`);
      const organizationId = organizationRef.id;

      await setDoc(organizationRef, {
        name: formData.organizationName,
        type: formData.organizationType,
        country: formData.country,
        phone: formData.phone,
        ownerId: userId,
        members: [userId],
        plan: 'free',
        settings: {
          currency: formData.country === 'Kenya' ? 'KES' : 'USD',
          timezone: formData.country === 'Kenya' ? 'Africa/Nairobi' : 'UTC',
        },
        createdAt: Timestamp.now(),
      });

      // Update user document with organization ID
      const userRef = doc(db, 'users', userId);
      await setDoc(userRef, {
        email: formData.email,
        fullName: formData.fullName,
        organizations: [organizationId],
        currentOrganization: organizationId,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      }, { merge: true });

      // Success animation
      confetti({
        particleCount: 150,
        spread: 120,
        origin: { y: 0.6 },
        colors: ['#4b248c', '#0047AB', '#F3CC3C'],
      });

      toast.success("Welcome! Let's record your first service 🎉");
      
      // Redirect to dashboard
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);

    } catch (error: unknown) {
      console.error('Sign up error:', error);
      // Error already handled in AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-[500px]">
          {/* Logo */}
          <Link href="/" className="inline-block mb-8">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-[#4b248c] to-[#0047AB] rounded-lg flex items-center justify-center">
                <span className="text-white text-xl font-bold">C</span>
              </div>
              <span className="text-xl font-bold text-gray-900">Insight Tracker</span>
            </div>
          </Link>

          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Step {step} of 2</span>
              <span className="text-sm text-gray-600">
                {step === 1 ? 'Personal Info' : 'Organization'}
              </span>
            </div>
            <div className="flex gap-2">
              {[1, 2].map((s) => (
                <div
                  key={s}
                  className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                    s <= step ? 'bg-gradient-to-r from-[#4b248c] to-[#0047AB]' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <AnimatePresence mode="wait">
              {/* Step 1: Personal Information */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Start for FREE</h2>
                    <p className="text-gray-600">Create your account to begin tracking</p>
                  </div>

                  {/* Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        value={formData.fullName}
                        onChange={(e) => updateFormData('fullName', e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#4b248c] focus:outline-none transition-colors"
                        placeholder="John Kamau"
                      />
                      {formData.fullName.length >= 2 && (
                        <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 w-5 h-5" />
                      )}
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => updateFormData('email', e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#4b248c] focus:outline-none transition-colors"
                        placeholder="john@church.org"
                      />
                      {/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
                        <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 w-5 h-5" />
                      )}
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.password}
                        onChange={(e) => updateFormData('password', e.target.value)}
                        required
                        className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:border-[#4b248c] focus:outline-none transition-colors"
                        placeholder="Create a strong password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                    {formData.password && (
                      <div className="mt-2">
                        <div className="flex gap-1 mb-1">
                          <div className={`h-1 flex-1 rounded-full ${passwordStrength === 'weak' ? 'bg-red-500' : passwordStrength === 'medium' ? 'bg-yellow-500' : 'bg-green-500'}`} />
                          <div className={`h-1 flex-1 rounded-full ${passwordStrength === 'medium' || passwordStrength === 'strong' ? passwordStrength === 'medium' ? 'bg-yellow-500' : 'bg-green-500' : 'bg-gray-200'}`} />
                          <div className={`h-1 flex-1 rounded-full ${passwordStrength === 'strong' ? 'bg-green-500' : 'bg-gray-200'}`} />
                        </div>
                        <p className={`text-xs ${passwordStrength === 'weak' ? 'text-red-600' : passwordStrength === 'medium' ? 'text-yellow-600' : 'text-green-600'}`}>
                          Password strength: {passwordStrength}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Min 8 chars, 1 uppercase, 1 number
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => updateFormData('confirmPassword', e.target.value)}
                        required
                        className="w-full pl-10 pr-12 py-3 border-2 border-gray-200 rounded-xl focus:border-[#4b248c] focus:outline-none transition-colors"
                        placeholder="Confirm your password"
                      />
                      {formData.confirmPassword && formData.password === formData.confirmPassword && (
                        <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-500 w-5 h-5" />
                      )}
                    </div>
                    {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                      <motion.p
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="text-red-500 text-sm mt-1 flex items-center gap-1"
                      >
                        <X className="w-4 h-4" /> Passwords do not match
                      </motion.p>
                    )}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    type="button"
                    onClick={handleNext}
                    disabled={!canProceed()}
                    className="w-full bg-[#F3CC3C] hover:bg-[#e5be2d] text-gray-900 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    Next <ChevronRight className="w-5 h-5" />
                  </motion.button>
                </motion.div>
              )}

              {/* Step 2: Organization Details */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Organization details</h2>
                    <p className="text-gray-600">Tell us about your ministry</p>
                  </div>

                  {/* Organization Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Organization Name <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        value={formData.organizationName}
                        onChange={(e) => updateFormData('organizationName', e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#4b248c] focus:outline-none transition-colors"
                        placeholder="Insight Tracker"
                      />
                    </div>
                  </div>

                  {/* Organization Type */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Organization Type <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.organizationType}
                      onChange={(e) => updateFormData('organizationType', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#4b248c] focus:outline-none transition-colors"
                    >
                      <option value="Church">Church</option>
                      <option value="Ministry">Ministry</option>
                      <option value="Community Group">Community Group</option>
                      <option value="Non-Profit">Non-Profit</option>
                      <option value="Event Organization">Event Organization</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Country */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Country <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.country}
                      onChange={(e) => updateFormData('country', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#4b248c] focus:outline-none transition-colors"
                    >
                      <option value="Kenya">Kenya</option>
                      <option value="Uganda">Uganda</option>
                      <option value="Tanzania">Tanzania</option>
                      <option value="Rwanda">Rwanda</option>
                      <option value="Nigeria">Nigeria</option>
                      <option value="South Africa">South Africa</option>
                      <option value="USA">USA</option>
                      <option value="UK">UK</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number <span className="text-gray-400 text-xs">(Optional)</span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => updateFormData('phone', e.target.value)}
                        className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-[#4b248c] focus:outline-none transition-colors"
                        placeholder="+254 712 345 678"
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Optional - used only for support and account recovery
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="button"
                      onClick={handleBack}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2"
                    >
                      <ChevronLeft className="w-5 h-5" /> Back
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={isLoading || !canProceed()}
                      className="flex-1 bg-[#F3CC3C] hover:bg-[#e5be2d] text-gray-900 py-3 rounded-xl font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <div className="w-5 h-5 border-2 border-gray-900 border-t-transparent rounded-full animate-spin"></div>
                          Creating...
                        </>
                      ) : (
                        <>
                          Create Free Account <Sparkles className="w-5 h-5" />
                        </>
                      )}
                    </motion.button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          {/* Footer */}
          <div className="mt-6 text-center">
            <p className="text-gray-600">
              Already have an account?{' '}
              <Link href="/sign-in" className="text-[#4b248c] hover:text-[#0047AB] font-semibold">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Benefits */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-[#4b248c] to-[#0047AB] text-white p-12 items-center justify-center">
        <div className="max-w-md">
          {/* Logo */}
          <div className="mb-8">
            <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold mb-2">Start Tracking Your Growth - FREE Forever</h1>
            <p className="text-white/80 text-lg">No credit card required. Upgrade anytime.</p>
          </div>

          {/* Features */}
          <div className="space-y-4 mb-8">
            {[
              { icon: Calendar, text: 'Unlimited attendance tracking' },
              { icon: BarChart3, text: 'Beautiful analytics & charts' },
              { icon: Users, text: 'Visitor management' },
              { icon: Sparkles, text: 'No credit card required' },
              { icon: Check, text: 'Free forever - upgrade anytime' },
            ].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-start gap-3"
              >
                <div className="w-6 h-6 rounded-full bg-[#F3CC3C] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-gray-900" />
                </div>
                <feature.icon className="w-6 h-6 text-white/80 flex-shrink-0" />
                <span className="text-lg">{feature.text}</span>
              </motion.div>
            ))}
          </div>

          {/* Testimonial */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20"
          >
            <div className="flex gap-1 mb-3">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg key={star} className="w-5 h-5 text-[#F3CC3C]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <p className="text-white/90 italic mb-4">
              &quot;This tool transformed how we track our growth. Highly recommend!&quot;
            </p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#F3CC3C] rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-gray-900" />
              </div>
              <div>
                <p className="font-semibold">Pastor David</p>
                <p className="text-white/60 text-sm">Nairobi</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
