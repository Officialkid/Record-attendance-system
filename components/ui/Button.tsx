'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'onDrag' | 'onDragStart' | 'onDragEnd'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', children, ...props }, ref) => {
    // Exclude conflicting drag event props
    const { onDrag, onDragStart, onDragEnd, ...safeProps } = props as any;
    const baseStyles =
      'inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variants = {
      primary: 'bg-primary-blue text-white hover:bg-primary-blue/90 focus:ring-primary-blue',
      secondary: 'bg-royal-purple text-white hover:bg-royal-purple/90 focus:ring-royal-purple',
      outline:
        'border-2 border-primary-blue text-primary-blue hover:bg-primary-blue hover:text-white',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: safeProps.disabled ? 1 : 1.02 }}
        whileTap={{ scale: safeProps.disabled ? 1 : 0.98 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...safeProps}
      >
        {children}
      </motion.button>
    );
  }
);

Button.displayName = 'Button';

export default Button;
