'use client';

import { motion } from 'framer-motion';
import { useId } from 'react';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showText?: boolean;
  animate?: boolean; // false for image export
  className?: string;
}

const SIZES = {
  sm: { icon: 24, text: 'text-base', gap: 'gap-1.5' },
  md: { icon: 32, text: 'text-xl', gap: 'gap-2' },
  lg: { icon: 48, text: 'text-2xl', gap: 'gap-2.5' },
};

// Particle positions (scaled to fit within viewBox with margin)
const PARTICLES = [
  { cx: 34, cy: 10, r: 2.5, color: '#6B46C1', delay: 0 },    // Purple
  { cx: 38, cy: 16, r: 2, color: '#4A5FC1', delay: 0.3 },    // Blue
  { cx: 36, cy: 6, r: 1.5, color: '#E85D4C', delay: 0.6 },   // Coral
  { cx: 42, cy: 12, r: 1.5, color: '#F6AD55', delay: 0.9 },  // Orange
];

export default function Logo({
  size = 'md',
  showText = true,
  animate = true,
  className = '',
}: LogoProps) {
  const gradientId = useId(); // Unique ID per instance
  const { icon, text, gap } = SIZES[size];

  // Respect reduced motion preference (check only on client)
  const prefersReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const shouldAnimate = animate && !prefersReducedMotion;

  return (
    <div className={`flex items-center ${gap} ${className}`}>
      <svg
        width={icon}
        height={icon}
        viewBox="0 0 44 44"
        fill="none"
        className="flex-shrink-0"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6B46C1" stopOpacity="0.15" />
            <stop offset="33%" stopColor="#4A5FC1" stopOpacity="0.15" />
            <stop offset="66%" stopColor="#E85D4C" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#F6AD55" stopOpacity="0.15" />
          </linearGradient>
        </defs>

        {/* Magnifying glass */}
        <circle
          cx="18"
          cy="18"
          r="12"
          fill={`url(#${gradientId})`}
          stroke="#002233"
          strokeWidth="2"
        />
        <line
          x1="27"
          y1="27"
          x2="38"
          y2="38"
          stroke="#002233"
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Prism particles */}
        {PARTICLES.map((p, i) =>
          shouldAnimate ? (
            <motion.circle
              key={i}
              cx={p.cx}
              cy={p.cy}
              r={p.r}
              fill={p.color}
              animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity, delay: p.delay }}
            />
          ) : (
            <circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill={p.color} />
          )
        )}
      </svg>

      {showText && (
        <span className={`font-bold ${text}`}>
          <span className="text-brand-900">Values</span>
          <span
            className="bg-clip-text text-transparent bg-prism"
            style={{
              background: 'linear-gradient(135deg, #6B46C1, #4A5FC1, #E85D4C, #F6AD55)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Lens
          </span>
        </span>
      )}
    </div>
  );
}
