'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Loader2, X, CheckCircle2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { browserLocalPersistence, browserSessionPersistence, setPersistence } from 'firebase/auth';
import { auth } from '@/lib/firebase';

export default function SignInPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [shakeForm, setShakeForm] = useState(false);
  
  const { signIn, user } = useAuth();
  const router = useRouter();

  // Load remember me preference
  useEffect(() => {
    const remembered = localStorage.getItem('rememberMe') === 'true';
    setRememberMe(remembered);
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      router.push('/add-attendance');
    }
  }, [user, router]);

  // Validate email format
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setEmailError('');
    setPasswordError('');

    // Validation
    if (!email) {
      setEmailError('Email is required');
      return;
    }
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    if (!password) {
      setPasswordError('Password is required');
      return;
    }

    setIsLoading(true);

    try {
      // Set persistence based on remember me
      await setPersistence(
        auth,
        rememberMe ? browserLocalPersistence : browserSessionPersistence
      );

      await signIn(email, password);
      
      // Save remember me preference
      localStorage.setItem('rememberMe', rememberMe.toString());

      // Get user display name
      const displayName = auth.currentUser?.displayName || 'there';
      toast.success(`Welcome back, ${displayName}!`);
      
      router.push('/add-attendance');
    } catch (error: unknown) {
      // Trigger shake animation
      setShakeForm(true);
      setTimeout(() => setShakeForm(false), 500);

      // Clear password field
      setPassword('');

      // Convert Firebase errors to user-friendly messages
      let errorMessage = 'Something went wrong. Please try again.';
      
      const errorCode = (error as { code?: string }).code;

      if (errorCode === 'auth/user-not-found' || errorCode === 'auth/wrong-password') {
        errorMessage = 'Invalid email or password';
      } else if (errorCode === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again in a few minutes.';
      } else if (errorCode === 'auth/network-request-failed') {
        errorMessage = 'Please check your internet connection';
      } else if (errorCode === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password';
      }

      setError(errorMessage);

      // Focus back to password input
      document.getElementById('password')?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle remember me
  const handleRememberMeChange = () => {
    const newValue = !rememberMe;
    setRememberMe(newValue);
    localStorage.setItem('rememberMe', newValue.toString());
  };

  return (
    <>
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-[450px]"
        >
          {/* Card */}
          <motion.div
            animate={shakeForm ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.5 }}
            className="bg-white rounded-lg shadow-sm p-8"
          >
            {/* Ministry Logo */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-[#4b248c] to-[#0047AB] rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">CM</span>
              </div>
              <h1 className="text-[2rem] font-bold text-gray-900 mb-2">Welcome Back</h1>
              <p className="text-base text-gray-600">Sign in to your account</p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailError('');
                    setError('');
                  }}
                  autoComplete="email"
                  autoFocus
                  className={`w-full h-12 px-3 border ${
                    emailError ? 'border-red-500' : 'border-gray-300'
                  } rounded-lg focus:ring-2 focus:ring-[#0047AB] focus:border-transparent outline-none transition-all placeholder-gray-400`}
                  placeholder="your@email.com"
                />
                {emailError && (
                  <p className="mt-1.5 text-sm text-red-600">{emailError}</p>
                )}
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setPasswordError('');
                      setError('');
                    }}
                    autoComplete="current-password"
                    className={`w-full h-12 px-3 pr-12 border ${
                      passwordError ? 'border-red-500' : 'border-gray-300'
                    } rounded-lg focus:ring-2 focus:ring-[#0047AB] focus:border-transparent outline-none transition-all placeholder-gray-400`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="mt-1.5 text-sm text-red-600">{passwordError}</p>
                )}
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={handleRememberMeChange}
                    className="w-4 h-4 text-[#0047AB] border-gray-300 rounded focus:ring-2 focus:ring-[#0047AB]"
                  />
                  <span className="ml-2 text-sm text-gray-700">Remember me for 30 days</span>
                </label>

                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm font-medium text-[#0047AB] hover:text-[#4b248c] transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              {/* Error Message */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 bg-red-50 border border-red-200 rounded-lg"
                >
                  <p className="text-sm text-red-600 text-center">{error}</p>
                </motion.div>
              )}

              {/* Submit Button */}
              <motion.button
                whileHover={{ scale: isLoading ? 1 : 1.02 }}
                whileTap={{ scale: isLoading ? 1 : 0.98 }}
                type="submit"
                disabled={isLoading}
                className="w-full h-12 bg-[#F3CC3C] text-black font-semibold rounded-lg hover:bg-[#e6c035] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </motion.button>
            </form>
          </motion.div>

          {/* Footer */}
          <div className="text-center mt-6">
            <p className="text-gray-600">
              Don&apos;t have an account?{' '}
              <Link
                href="/sign-up"
                className="text-[#0047AB] font-semibold hover:text-[#4b248c] transition-colors"
              >
                Sign up for free
              </Link>
            </p>
          </div>
        </motion.div>
      </div>

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotPassword}
        onClose={() => setShowForgotPassword(false)}
      />
    </>
  );
}

// Forgot Password Modal Component
interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const { resetPassword } = useAuth();

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setEmail('');
        setSuccess(false);
        setError('');
      }, 300);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      await resetPassword(email);
      setSuccess(true);
      toast.success('Password reset email sent!');
    } catch (error: unknown) {
      let errorMessage = 'Please check your connection and try again';

      const errorCode = (error as { code?: string }).code;
      
      if (errorCode === 'auth/user-not-found') {
        errorMessage = 'No account found with this email';
      } else if (errorCode === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address';
      } else if (errorCode === 'auth/too-many-requests') {
        errorMessage = 'Too many requests. Please try again later.';
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-lg shadow-xl w-full max-w-[400px] p-6 relative"
            >
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              {!success ? (
                <>
                  {/* Header */}
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset Your Password</h2>
                    <p className="text-gray-600">
                      Enter your email and we&apos;ll send you a reset link
                    </p>
                  </div>

                  {/* Form */}
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700 mb-1.5">
                        Email Address
                      </label>
                      <input
                        id="reset-email"
                        type="email"
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          setError('');
                        }}
                        autoFocus
                        className="w-full h-12 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0047AB] focus:border-transparent outline-none transition-all placeholder-gray-400"
                        placeholder="your@email.com"
                      />
                      {error && (
                        <p className="mt-1.5 text-sm text-red-600">{error}</p>
                      )}
                    </div>

                    <motion.button
                      whileHover={{ scale: isLoading ? 1 : 1.02 }}
                      whileTap={{ scale: isLoading ? 1 : 0.98 }}
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 bg-[#0047AB] text-white font-semibold rounded-lg hover:bg-[#4b248c] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        'Send Reset Link'
                      )}
                    </motion.button>
                  </form>
                </>
              ) : (
                <>
                  {/* Success State */}
                  <div className="text-center py-4">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your email!</h2>
                    <p className="text-gray-600 mb-6">
                      We&apos;ve sent password reset instructions to <strong>{email}</strong>
                    </p>
                    <button
                      onClick={onClose}
                      className="w-full h-12 bg-[#0047AB] text-white font-semibold rounded-lg hover:bg-[#4b248c] transition-colors"
                    >
                      Back to Sign In
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
