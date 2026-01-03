'use client';

import { motion } from 'framer-motion';

interface PrismBackgroundProps {
  variant?: 'full' | 'subtle' | 'bar-top' | 'bar-bottom';
  animate?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export default function PrismBackground({
  variant = 'subtle',
  animate = false,
  className = '',
  children,
}: PrismBackgroundProps) {
  if (variant === 'bar-top') {
    return (
      <div className={`relative ${className}`}>
        <div className="absolute top-0 left-0 right-0 h-2 bg-prism" />
        {children}
      </div>
    );
  }

  if (variant === 'bar-bottom') {
    return (
      <div className={`relative ${className}`}>
        {children}
        <div className="absolute bottom-0 left-0 right-0 h-2 bg-prism" />
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className={`relative ${className}`}>
        {animate ? (
          <motion.div
            className="absolute inset-0 bg-prism bg-[length:200%_200%]"
            animate={{
              backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
            }}
            transition={{
              duration: 8,
              ease: 'easeInOut',
              repeat: Infinity,
            }}
          />
        ) : (
          <div className="absolute inset-0 bg-prism" />
        )}
        <div className="relative">{children}</div>
      </div>
    );
  }

  // Default: subtle
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-0 bg-prism-subtle" />
      <div className="relative">{children}</div>
    </div>
  );
}
