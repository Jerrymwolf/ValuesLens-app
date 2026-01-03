'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import type { Value } from '@/lib/types';

interface ValueSelectorProps {
  values: Value[];
  selected: string[];
  onToggle: (id: string) => void;
  maxSelections?: number;
}

export default function ValueSelector({
  values,
  selected,
  onToggle,
  maxSelections = 5,
}: ValueSelectorProps) {
  const isMaxReached = selected.length >= maxSelections;

  return (
    <div className="w-full">
      {/* Counter */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-sm text-gray-500">
          Select your most important values
        </span>
        <span
          className={`text-sm font-medium px-3 py-1 rounded-full ${
            selected.length === maxSelections
              ? 'bg-accent-100 text-accent-700'
              : 'bg-gray-100 text-gray-600'
          }`}
        >
          {selected.length} of {maxSelections} selected
        </span>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {values.map((value) => {
          const isSelected = selected.includes(value.id);
          const isDisabled = !isSelected && isMaxReached;

          return (
            <motion.button
              key={value.id}
              onClick={() => !isDisabled && onToggle(value.id)}
              disabled={isDisabled}
              whileTap={{ scale: isDisabled ? 1 : 0.97 }}
              className={`
                relative p-4 rounded-xl border-2 text-left transition-all
                focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2
                ${
                  isSelected
                    ? 'border-brand-500 bg-brand-50'
                    : isDisabled
                    ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                    : 'border-gray-200 bg-white hover:border-brand-300 hover:shadow-sm'
                }
              `}
              aria-pressed={isSelected}
              aria-label={`${value.name}${isSelected ? ', selected' : ''}`}
            >
              {/* Checkmark */}
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-2 right-2 w-5 h-5 bg-brand-600 rounded-full flex items-center justify-center"
                >
                  <Check className="w-3 h-3 text-white" strokeWidth={3} />
                </motion.div>
              )}

              {/* Value name */}
              <span
                className={`font-medium ${
                  isSelected ? 'text-brand-900' : 'text-gray-900'
                }`}
              >
                {value.name}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Keyboard hint */}
      <p className="mt-4 text-xs text-gray-400 text-center">
        Tab to navigate, Space or Enter to select
      </p>
    </div>
  );
}
