'use client';

import Link from 'next/link';
import { Plus, BarChart3, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function QuickActions() {
  const actions = [
    {
      title: 'Record Attendance',
      description: "Add this week's service attendance",
      href: '/add-attendance',
      icon: Plus,
      color: 'gold',
      primary: true,
    },
    {
      title: 'View Analytics',
      description: 'See trends and insights',
      href: '/view-analytics',
      icon: BarChart3,
      color: 'blue',
      primary: false,
    },
  ];

  return (
    <div>
      <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {actions.map((action, index) => {
          const Icon = action.icon;
          const isPrimary = action.primary;

          return (
            <motion.div
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Link
                href={action.href}
                className={`group block p-6 rounded-xl border-2 transition-all duration-200 ${
                  isPrimary
                    ? 'bg-gradient-to-br from-yellow-400 to-yellow-500 border-yellow-600 hover:shadow-xl hover:scale-105'
                    : 'bg-white border-gray-200 hover:border-blue-500 hover:shadow-lg'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div
                      className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4 ${
                        isPrimary
                          ? 'bg-white/20 backdrop-blur-sm'
                          : 'bg-blue-50 group-hover:bg-blue-100'
                      } transition-colors`}
                    >
                      <Icon className={`w-6 h-6 ${isPrimary ? 'text-white' : 'text-blue-600'}`} />
                    </div>

                    <h3
                      className={`text-lg font-semibold mb-1 ${
                        isPrimary ? 'text-white' : 'text-gray-900'
                      }`}
                    >
                      {action.title}
                    </h3>

                    <p className={`text-sm ${isPrimary ? 'text-white/90' : 'text-gray-600'}`}>
                      {action.description}
                    </p>
                  </div>

                  <ArrowRight
                    className={`w-5 h-5 opacity-0 group-hover:opacity-100 transition-all group-hover:translate-x-1 ${
                      isPrimary ? 'text-white' : 'text-blue-600'
                    }`}
                  />
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
