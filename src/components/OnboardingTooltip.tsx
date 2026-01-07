'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRight, ArrowUp, ArrowLeft } from 'lucide-react';

const STORAGE_KEY = 'valueslens-seen-swipe-tooltip';

interface OnboardingTooltipProps {
  onDismiss?: () => void;
}

export default function OnboardingTooltip({ onDismiss }: OnboardingTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(false);

  useEffect(() => {
    // Check if user has already seen the tooltip
    const hasSeenTooltip = localStorage.getItem(STORAGE_KEY);
    if (!hasSeenTooltip) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    setIsVisible(false);
    onDismiss?.();
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
        onClick={handleDismiss}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-xl font-bold text-brand-900">
              How to Sort Your Values
            </h2>
            <button
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <p className="text-gray-600 mb-6">
            Swipe or use keyboard arrows to sort each value by how important it is to you.
          </p>

          {/* Gesture explanations */}
          <div className="space-y-4 mb-6">
            {/* Swipe Right */}
            <div className="flex items-center gap-4 p-3 bg-accent-50 rounded-xl border border-accent-200">
              <div className="w-10 h-10 bg-accent-500 rounded-full flex items-center justify-center">
                <ArrowRight className="text-white" size={20} />
              </div>
              <div>
                <p className="font-semibold text-accent-700">Swipe RIGHT</p>
                <p className="text-sm text-gray-600">Very Important to me</p>
              </div>
            </div>

            {/* Swipe Up */}
            <div className="flex items-center gap-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
              <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                <ArrowUp className="text-white" size={20} />
              </div>
              <div>
                <p className="font-semibold text-amber-700">Swipe UP</p>
                <p className="text-sm text-gray-600">Somewhat important to me</p>
              </div>
            </div>

            {/* Swipe Left */}
            <div className="flex items-center gap-4 p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div className="w-10 h-10 bg-gray-400 rounded-full flex items-center justify-center">
                <ArrowLeft className="text-white" size={20} />
              </div>
              <div>
                <p className="font-semibold text-gray-600">Swipe LEFT</p>
                <p className="text-sm text-gray-600">Less important to me</p>
              </div>
            </div>
          </div>

          {/* Don't show again checkbox */}
          <label className="flex items-center gap-2 mb-4 cursor-pointer">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm text-gray-500">Don&apos;t show this again</span>
          </label>

          <button
            onClick={handleDismiss}
            className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-full transition-all"
          >
            Got it!
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
