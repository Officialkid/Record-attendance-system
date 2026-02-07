import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: number | string;
  subtitle: string;
  icon: LucideIcon;
  trend?: number | null;
  color?: 'purple' | 'blue' | 'green' | 'gold';
}

export default function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  color = 'purple',
}: StatCardProps) {
  const colorVariants = {
    purple: {
      bg: 'bg-purple-50',
      icon: 'bg-gradient-to-br from-purple-600 to-purple-700',
      text: 'text-purple-600',
      border: 'border-purple-100',
    },
    blue: {
      bg: 'bg-blue-50',
      icon: 'bg-gradient-to-br from-blue-600 to-blue-700',
      text: 'text-blue-600',
      border: 'border-blue-100',
    },
    green: {
      bg: 'bg-green-50',
      icon: 'bg-gradient-to-br from-green-600 to-green-700',
      text: 'text-green-600',
      border: 'border-green-100',
    },
    gold: {
      bg: 'bg-yellow-50',
      icon: 'bg-gradient-to-br from-yellow-500 to-yellow-600',
      text: 'text-yellow-600',
      border: 'border-yellow-100',
    },
  } as const;

  const styles = colorVariants[color];

  const getTrendInfo = () => {
    if (trend === null || trend === undefined) return null;

    if (trend > 0) {
      return {
        Icon: TrendingUp,
        color: 'text-green-600',
        bg: 'bg-green-50',
        text: `+${trend}%`,
      };
    }
    if (trend < 0) {
      return {
        Icon: TrendingDown,
        color: 'text-red-600',
        bg: 'bg-red-50',
        text: `${trend}%`,
      };
    }
    return {
      Icon: Minus,
      color: 'text-gray-600',
      bg: 'bg-gray-50',
      text: '0%',
    };
  };

  const trendInfo = getTrendInfo();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      whileHover={{ y: -4, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
      className={`relative overflow-hidden rounded-xl border ${styles.border} bg-white p-6 shadow-sm transition-shadow duration-200`}
    >
      <div
        className={`absolute top-0 right-0 w-32 h-32 ${styles.bg} rounded-full -translate-y-1/2 translate-x-1/2 opacity-50`}
      />

      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
          </div>
          <div
            className={`w-12 h-12 ${styles.icon} rounded-lg flex items-center justify-center shadow-md`}
          >
            <Icon className="w-6 h-6 text-white" />
          </div>
        </div>

        <div className="mb-2">
          <p className={`text-3xl font-bold ${styles.text}`}>
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
        </div>

        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{subtitle}</p>

          {trendInfo && (
            <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${trendInfo.bg}`}>
              <trendInfo.Icon className={`w-3 h-3 ${trendInfo.color}`} />
              <span className={`text-xs font-medium ${trendInfo.color}`}>
                {trendInfo.text}
              </span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
