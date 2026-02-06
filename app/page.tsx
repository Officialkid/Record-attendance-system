'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Calendar, BarChart3, TrendingUp, Users, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { isFirebaseConfigured } from '@/lib/firebase';
import { getServices } from '@/lib/firestore';

interface Stats {
  totalServices: number;
  totalAttendanceThisMonth: number;
  growthRate: number;
}

export default function HomePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    totalServices: 0,
    totalAttendanceThisMonth: 0,
    growthRate: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) {
      router.push('/add-attendance');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    if (authLoading || user) {
      return;
    }

    // Only fetch stats if Firebase is configured
    if (isFirebaseConfigured()) {
      fetchStats();
    } else {
      // Show demo data if Firebase is not configured
      setStats({
        totalServices: 0,
        totalAttendanceThisMonth: 0,
        growthRate: 0,
      });
      setLoading(false);
    }
  }, [authLoading, user]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  const fetchStats = async () => {
    try {
      const services = await getServices();

      if (services) {
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

        const thisMonthServices = services.filter((s) => {
          const date = new Date(s.service_date);
          return date >= firstDayOfMonth;
        });

        const lastMonthServices = services.filter((s) => {
          const date = new Date(s.service_date);
          return date >= firstDayOfLastMonth && date < firstDayOfMonth;
        });

        const totalThisMonth = thisMonthServices.reduce(
          (sum, s) => sum + s.total_attendance,
          0
        );

        const totalLastMonth = lastMonthServices.reduce(
          (sum, s) => sum + s.total_attendance,
          0
        );

        const growth =
          totalLastMonth > 0
            ? ((totalThisMonth - totalLastMonth) / totalLastMonth) * 100
            : 0;

        setStats({
          totalServices: services.length,
          totalAttendanceThisMonth: totalThisMonth,
          growthRate: growth,
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
      },
    },
  };

  const buttonVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: 'easeOut',
      },
    },
    hover: {
      scale: 1.05,
      transition: {
        duration: 0.2,
        ease: 'easeInOut',
      },
    },
    tap: { scale: 0.95 },
  };

  return (
    <div className="min-h-screen bg-background-color pt-16">
      {/* Hero Section with Animated Gradient */}
      <div className="relative overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-royal-purple via-primary-blue to-royal-purple animate-gradient-xy"></div>
        
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-black/20"></div>

        {/* Floating Orbs */}
        <motion.div
          className="absolute top-20 left-10 w-72 h-72 bg-gold-color/30 rounded-full blur-3xl"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
        <motion.div
          className="absolute bottom-20 right-10 w-96 h-96 bg-primary-blue/30 rounded-full blur-3xl"
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Hero Content */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center"
          >
            {/* Badge */}
            <motion.div variants={itemVariants} className="mb-6 inline-block">
              <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-2">
                <Sparkles className="w-4 h-4 text-gold-color" />
                <span className="text-white/90 text-sm font-medium">
                  Ministry Management System
                </span>
              </div>
            </motion.div>

            {/* Main Heading */}
            <motion.h1
              variants={itemVariants}
              className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight"
            >
              Christhood Ministry
              <br />
              <span className="bg-gradient-to-r from-gold-color to-yellow-300 bg-clip-text text-transparent">
                Attendance System
              </span>
            </motion.h1>

            {/* Tagline */}
            <motion.p
              variants={itemVariants}
              className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto font-medium"
            >
              Track Your Ministry Growth with Precision and Purpose
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={containerVariants}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16"
            >
              <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                <Link
                  href="/add-attendance"
                  className="group relative inline-flex items-center space-x-3 bg-gold-color text-black-color px-8 py-4 rounded-full font-bold text-lg shadow-2xl hover:shadow-gold-color/50 transition-all duration-300"
                >
                  <Calendar className="w-6 h-6" />
                  <span>Add Attendance</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>

              <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                <Link
                  href="/view-analytics"
                  className="group relative inline-flex items-center space-x-3 bg-primary-blue text-white px-8 py-4 rounded-full font-bold text-lg shadow-2xl hover:shadow-primary-blue/50 transition-all duration-300 border-2 border-white/20"
                >
                  <BarChart3 className="w-6 h-6" />
                  <span>View Analytics</span>
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Stats Preview Section */}
      <div className="relative -mt-16 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="grid md:grid-cols-3 gap-6"
          >
            {/* Total Services Card */}
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="bg-white rounded-2xl shadow-xl p-8 border-2 border-transparent hover:border-royal-purple/20 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="bg-royal-purple/10 p-3 rounded-xl">
                  <Calendar className="w-8 h-8 text-royal-purple" />
                </div>
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="w-2 h-2 bg-royal-purple rounded-full"
                />
              </div>
              <h3 className="text-gray-600 font-medium mb-2 text-sm uppercase tracking-wide">
                Total Services
              </h3>
              <p className="text-4xl font-bold text-royal-purple mb-1">
                {loading ? '...' : stats.totalServices}
              </p>
              <p className="text-sm text-gray-500">All time records</p>
            </motion.div>

            {/* Monthly Attendance Card */}
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="bg-white rounded-2xl shadow-xl p-8 border-2 border-transparent hover:border-primary-blue/20 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="bg-primary-blue/10 p-3 rounded-xl">
                  <Users className="w-8 h-8 text-primary-blue" />
                </div>
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [1, 0.5, 1],
                  }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-2 h-2 bg-primary-blue rounded-full"
                />
              </div>
              <h3 className="text-gray-600 font-medium mb-2 text-sm uppercase tracking-wide">
                Attendance This Month
              </h3>
              <p className="text-4xl font-bold text-primary-blue mb-1">
                {loading ? '...' : stats.totalAttendanceThisMonth}
              </p>
              <p className="text-sm text-gray-500">Total people reached</p>
            </motion.div>

            {/* Growth Rate Card */}
            <motion.div
              whileHover={{ scale: 1.05, y: -5 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="bg-white rounded-2xl shadow-xl p-8 border-2 border-transparent hover:border-gold-color/20 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="bg-gold-color/10 p-3 rounded-xl">
                  <TrendingUp
                    className={`w-8 h-8 ${
                      stats.growthRate >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}
                  />
                </div>
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-2 h-2 bg-gold-color rounded-full"
                />
              </div>
              <h3 className="text-gray-600 font-medium mb-2 text-sm uppercase tracking-wide">
                Growth Rate
              </h3>
              <p
                className={`text-4xl font-bold mb-1 ${
                  stats.growthRate >= 0 ? 'text-green-600' : 'text-red-600'
                }`}
              >
                {loading
                  ? '...'
                  : `${stats.growthRate >= 0 ? '+' : ''}${stats.growthRate.toFixed(1)}%`}
              </p>
              <p className="text-sm text-gray-500">Month over month</p>
            </motion.div>
          </motion.div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-royal-purple mb-4">
            Empower Your Ministry
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Simple, powerful tools to track attendance and grow your congregation
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              icon: Calendar,
              title: 'Easy Tracking',
              description: 'Record attendance in seconds with our intuitive interface',
              color: 'royal-purple',
            },
            {
              icon: BarChart3,
              title: 'Powerful Analytics',
              description: 'Gain insights with comprehensive reports and visualizations',
              color: 'primary-blue',
            },
            {
              icon: Users,
              title: 'Visitor Management',
              description: 'Keep track of visitors and follow up effectively',
              color: 'gold-color',
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.2 }}
              whileHover={{ y: -10 }}
              className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300"
            >
              <div className={`bg-${feature.color}/10 p-4 rounded-xl inline-block mb-6`}>
                <feature.icon className={`w-10 h-10 text-${feature.color}`} />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">{feature.title}</h3>
              <p className="text-gray-600 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
