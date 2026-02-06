'use client';

import { useAuth } from '@/lib/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { motion } from 'framer-motion';

interface ProtectedRouteProps {
  children: ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      // Redirect to sign-in if not authenticated
      router.push('/sign-in');
    }
  }, [user, loading, router]);

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f9f9f9] via-white to-[#f3f4f6]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative">
            {/* Spinning circle */}
            <div className="w-16 h-16 border-4 border-gray-200 border-t-[#4b248c] rounded-full animate-spin mx-auto mb-4"></div>
            
            {/* Logo/Icon in center */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-gradient-to-br from-[#4b248c] to-[#0047AB] rounded-full"></div>
            </div>
          </div>
          
          <p className="text-gray-600 font-medium mt-4">Loading...</p>
        </motion.div>
      </div>
    );
  }

  // Don't render anything while redirecting
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#f9f9f9] via-white to-[#f3f4f6]">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-gray-200 border-t-[#4b248c] rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Redirecting to sign in...</p>
        </motion.div>
      </div>
    );
  }

  // User is authenticated, render children
  return <>{children}</>;
}
