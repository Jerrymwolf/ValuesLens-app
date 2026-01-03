'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useAssessmentStore } from '@/stores/assessmentStore';

interface CustomValueModalProps {
  isOpen: boolean;
  onClose: (addedCustomValue?: string) => void;
  veryImportantCount: number;
}

const MIN_VERY_IMPORTANT = 3;

export default function CustomValueModal({
  isOpen,
  onClose,
  veryImportantCount,
}: CustomValueModalProps) {
  const [customValue, setCustomValue] = useState('');
  const [error, setError] = useState('');
  const { addCustomValue } = useAssessmentStore();

  const canProceed = veryImportantCount >= MIN_VERY_IMPORTANT;

  const handleSubmit = () => {
    const trimmed = customValue.trim();

    if (trimmed) {
      // Validate
      if (trimmed.length < 2) {
        setError('Value must be at least 2 characters');
        return;
      }
      if (trimmed.length > 30) {
        setError('Value must be less than 30 characters');
        return;
      }
      if (!/^[a-zA-Z\s]+$/.test(trimmed)) {
        setError('Value can only contain letters and spaces');
        return;
      }

      // Add custom value
      addCustomValue(trimmed);
      setCustomValue('');
      setError('');
      onClose(trimmed);
    } else {
      onClose();
    }
  };

  const handleSkip = () => {
    setCustomValue('');
    setError('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
        onClick={handleSkip}
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
              {canProceed ? "Didn't see a value?" : 'Add more values'}
            </h2>
            <button
              onClick={handleSkip}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          {!canProceed && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-amber-800">
                You need at least {MIN_VERY_IMPORTANT} values marked as Very Important to continue.
                You currently have {veryImportantCount}.
              </p>
            </div>
          )}

          <p className="text-gray-600 mb-4">
            {canProceed
              ? 'Add a value that matters to you but wasn\'t in our list.'
              : 'Go back and mark more values as Very Important, or add a custom value below.'}
          </p>

          <div className="mb-4">
            <input
              type="text"
              value={customValue}
              onChange={(e) => {
                setCustomValue(e.target.value);
                setError('');
              }}
              placeholder="Enter your value..."
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
              maxLength={30}
            />
            {error && (
              <p className="text-red-500 text-sm mt-1">{error}</p>
            )}
            <p className="text-xs text-gray-400 mt-2">
              Examples: Sustainability, Faith, Justice, Playfulness
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleSkip}
              className="flex-1 py-3 text-gray-600 hover:text-gray-900 font-medium transition-colors border border-gray-200 rounded-full"
            >
              {canProceed ? 'Skip' : 'Go back'}
            </button>
            <button
              onClick={handleSubmit}
              disabled={!customValue.trim() && !canProceed}
              className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {customValue.trim() ? 'Add Value' : 'Continue'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
