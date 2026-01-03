'use client';

import { AnimatePresence, motion } from 'framer-motion';
import SwipeableValueCard from './SwipeableValueCard';
import type { Value, SortCategory } from '@/lib/types';

interface CategoryCounts {
  very: number;
  somewhat: number;
  less: number;
}

interface CardDeckProps {
  values: Value[];
  currentIndex: number;
  onSwipe: (valueId: string, category: SortCategory) => void;
  categoryCounts?: CategoryCounts;
  canSkip?: boolean;
  onSkip?: () => void;
}

export default function CardDeck({
  values,
  currentIndex,
  onSwipe,
  categoryCounts,
  canSkip = false,
  onSkip,
}: CardDeckProps) {
  // Only render top 3 cards for performance
  const visibleCards = values.slice(currentIndex, currentIndex + 3);
  const progress = ((currentIndex) / values.length) * 100;

  const handleSwipe = (category: SortCategory) => {
    const currentValue = values[currentIndex];
    if (currentValue) {
      onSwipe(currentValue.id, category);
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Category Counts */}
      {categoryCounts && (
        <div className="w-full max-w-sm mb-4">
          <div className="flex justify-center gap-4 text-sm">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-accent-500" />
              <span className="text-gray-600">Very Important:</span>
              <span className="font-semibold text-accent-600">{categoryCounts.very}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-400" />
              <span className="text-gray-600">Somewhat:</span>
              <span className="font-semibold text-amber-600">{categoryCounts.somewhat}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-gray-300" />
              <span className="text-gray-600">Less:</span>
              <span className="font-semibold text-gray-500">{categoryCounts.less}</span>
            </div>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="w-full max-w-sm mb-6">
        <div className="flex justify-center text-sm text-gray-500 mb-2">
          <span>{currentIndex} values sorted</span>
        </div>
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-500 to-accent-400 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Card Stack */}
      <div className="relative w-full max-w-sm h-[320px] flex items-center justify-center">
        <AnimatePresence mode="popLayout">
          {visibleCards.map((value, index) => (
            <SwipeableValueCard
              key={value.id}
              value={value}
              onSwipe={handleSwipe}
              isTop={index === 0}
              index={index}
            />
          ))}
        </AnimatePresence>

        {/* Empty state when all cards sorted */}
        {visibleCards.length === 0 && (
          <div className="text-center text-gray-500">
            <p className="text-xl font-medium">All values sorted!</p>
            <p className="text-sm mt-2">Moving to the next step...</p>
          </div>
        )}
      </div>

      {/* Swipe Instructions */}
      <div className="mt-8 flex gap-4 text-sm">
        <div className="flex items-center gap-2 text-gray-400">
          <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            ←
          </div>
          <span>Less</span>
        </div>
        <div className="flex items-center gap-2 text-amber-500">
          <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
            ↑
          </div>
          <span>Somewhat</span>
        </div>
        <div className="flex items-center gap-2 text-accent-600">
          <div className="w-8 h-8 rounded-full bg-accent-50 flex items-center justify-center">
            →
          </div>
          <span>Very</span>
        </div>
      </div>

      {/* Skip Button */}
      <AnimatePresence>
        {canSkip && onSkip && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="mt-8 w-full max-w-sm"
          >
            <button
              onClick={onSkip}
              className="w-full py-3 px-6 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-full shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
            >
              I have enough — Continue →
            </button>
            <p className="text-center text-xs text-gray-400 mt-2">
              You have {categoryCounts?.very || 0} values marked as Very Important
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
