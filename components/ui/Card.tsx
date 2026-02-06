'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface CardProps {
  children: ReactNode;
  className?: string;
  title?: string;
  icon?: ReactNode;
}

export default function Card({ children, className, title, icon }: CardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-lg shadow-lg p-6 transition-shadow hover:shadow-xl',
        className
      )}
    >
      {(title || icon) && (
        <div className="flex items-center mb-4">
          {icon && <div className="mr-3">{icon}</div>}
          {title && <h3 className="text-xl font-bold text-royal-purple">{title}</h3>}
        </div>
      )}
      {children}
    </div>
  );
}
