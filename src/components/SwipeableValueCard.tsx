'use client';

import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import type { Value, SortCategory } from '@/lib/types';
import { useReducedMotion } from '@/hooks/useReducedMotion';

interface SwipeableValueCardProps {
  value: Value;
  onSwipe: (category: SortCategory) => void;
  isTop: boolean;
  index: number;
}

const SWIPE_THRESHOLD = 100;
const VELOCITY_THRESHOLD = 500;

export default function SwipeableValueCard({
  value,
  onSwipe,
  isTop,
  index,
}: SwipeableValueCardProps) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const [exitDirection, setExitDirection] = useState<SortCategory | null>(null);
  const prefersReducedMotion = useReducedMotion();

  // Rotate based on x position
  const rotate = useTransform(x, [-200, 200], [-15, 15]);

  // Opacity indicators based on drag position
  const rightIndicatorOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const leftIndicatorOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);
  const upIndicatorOpacity = useTransform(y, [-SWIPE_THRESHOLD, 0], [1, 0]);

  // Scale for stacked cards
  const scale = 1 - index * 0.05;
  const yOffset = index * 8;

  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const { offset, velocity } = info;

      // Check for vertical swipe first (up = somewhat)
      if (
        offset.y < -SWIPE_THRESHOLD ||
        velocity.y < -VELOCITY_THRESHOLD
      ) {
        setExitDirection('somewhat');
        return;
      }

      // Right swipe = very important
      if (
        offset.x > SWIPE_THRESHOLD ||
        velocity.x > VELOCITY_THRESHOLD
      ) {
        setExitDirection('very');
        return;
      }

      // Left swipe = less important
      if (
        offset.x < -SWIPE_THRESHOLD ||
        velocity.x < -VELOCITY_THRESHOLD
      ) {
        setExitDirection('less');
        return;
      }
    },
    []
  );

  // Handle keyboard shortcuts when this is the top card
  useEffect(() => {
    if (!isTop) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        setExitDirection('very');
      } else if (e.key === 'ArrowUp') {
        setExitDirection('somewhat');
      } else if (e.key === 'ArrowLeft') {
        setExitDirection('less');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isTop]);

  // Handle exit animation complete
  const handleAnimationComplete = useCallback(() => {
    if (exitDirection) {
      onSwipe(exitDirection);
    }
  }, [exitDirection, onSwipe]);

  // Calculate exit position
  const getExitPosition = () => {
    switch (exitDirection) {
      case 'very':
        return { x: 500, y: 0, rotate: 30 };
      case 'less':
        return { x: -500, y: 0, rotate: -30 };
      case 'somewhat':
        return { x: 0, y: -500, rotate: 0 };
      default:
        return { x: 0, y: 0, rotate: 0 };
    }
  };

  return (
    <motion.div
      className="absolute w-full max-w-sm"
      style={{
        x: isTop ? x : 0,
        y: isTop ? y : yOffset,
        rotate: isTop ? rotate : 0,
        scale,
        zIndex: 10 - index,
      }}
      drag={isTop}
      dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.9}
      onDragEnd={handleDragEnd}
      animate={exitDirection ? getExitPosition() : { x: 0, y: yOffset }}
      transition={
        prefersReducedMotion
          ? { duration: 0.01 }
          : exitDirection
            ? { duration: 0.3 }
            : { duration: 0.2 }
      }
      onAnimationComplete={handleAnimationComplete}
    >
      {/* Card */}
      <div className="bg-white rounded-2xl shadow-xl p-8 min-h-[280px] flex flex-col justify-center items-center relative overflow-hidden border border-gray-100">
        {/* Direction Indicators */}
        {isTop && (
          <>
            {/* Very Important - Right */}
            <motion.div
              className="absolute top-4 right-4 bg-accent-500 text-white px-3 py-1 rounded-full text-sm font-medium"
              style={{ opacity: rightIndicatorOpacity }}
            >
              Very Important
            </motion.div>

            {/* Less Important - Left */}
            <motion.div
              className="absolute top-4 left-4 bg-gray-400 text-white px-3 py-1 rounded-full text-sm font-medium"
              style={{ opacity: leftIndicatorOpacity }}
            >
              Less Important
            </motion.div>

            {/* Somewhat - Up */}
            <motion.div
              className="absolute top-4 left-1/2 -translate-x-1/2 bg-amber-500 text-white px-3 py-1 rounded-full text-sm font-medium"
              style={{ opacity: upIndicatorOpacity }}
            >
              Somewhat
            </motion.div>
          </>
        )}

        {/* Value Content */}
        <h2 className="text-3xl font-bold text-brand-900 mb-4 text-center">
          {value.name}
        </h2>
        <p className="text-lg text-gray-600 text-center leading-relaxed">
          {value.cardText}
        </p>

        {/* Keyboard hints for top card */}
        {isTop && (
          <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-6 text-xs text-gray-400">
            <span>← Less</span>
            <span>↑ Somewhat</span>
            <span>→ Very</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
