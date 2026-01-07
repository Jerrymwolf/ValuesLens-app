'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { useAssessmentStore } from '@/stores/assessmentStore';
import { VALUES_BY_ID } from '@/lib/data/values';
import { useHydration } from '@/hooks/useHydration';

type Phase = 'select' | 'rank';

export default function SelectPage() {
  const router = useRouter();
  const isHydrated = useHydration();
  const {
    sessionId,
    sortedValues,
    customValue,
    setTop5,
    setRankedValues,
  } = useAssessmentStore();

  const [phase, setPhase] = useState<Phase>('select');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // ALL useMemo hooks FIRST (before hydration guard)
  const veryImportantValues = useMemo(() => {
    return sortedValues.very.map((id) => {
      if (id.startsWith('custom_') && customValue?.id === id) {
        return {
          id,
          name: customValue.name,
          cardText: 'A value that matters deeply to you',
        };
      }
      return VALUES_BY_ID[id];
    }).filter(Boolean);
  }, [sortedValues.very, customValue]);

  // ALL useEffect hooks NEXT (with isHydrated guard inside)
  useEffect(() => {
    if (!isHydrated) return;
    if (!sessionId) {
      router.replace('/');
      return;
    }
    if (sortedValues.very.length < 5) {
      router.replace('/assess/sort');
      return;
    }
  }, [isHydrated, sessionId, sortedValues.very.length, router]);

  useEffect(() => {
    if (!isHydrated) return;
    if (veryImportantValues.length === 5 && phase === 'select' && selectedIds.length === 0) {
      setSelectedIds(sortedValues.very.slice(0, 5));
      setPhase('rank');
    }
  }, [isHydrated, veryImportantValues.length, sortedValues.very, phase, selectedIds.length]);

  // Hydration guard - AFTER all hooks
  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  // Selection handlers
  const handleSelect = (valueId: string) => {
    if (selectedIds.includes(valueId)) {
      setSelectedIds(selectedIds.filter((id) => id !== valueId));
    } else if (selectedIds.length < 5) {
      setSelectedIds([...selectedIds, valueId]);
    }
  };

  const handleSelectionComplete = () => {
    if (selectedIds.length === 5) {
      setTop5(selectedIds);
      setPhase('rank');
    }
  };

  // Reorder handlers
  const moveUp = (index: number) => {
    if (index === 0) return;
    const newIds = [...selectedIds];
    [newIds[index - 1], newIds[index]] = [newIds[index], newIds[index - 1]];
    setSelectedIds(newIds);
  };

  const moveDown = (index: number) => {
    if (index === selectedIds.length - 1) return;
    const newIds = [...selectedIds];
    [newIds[index], newIds[index + 1]] = [newIds[index + 1], newIds[index]];
    setSelectedIds(newIds);
  };

  const handleRankComplete = () => {
    setRankedValues(selectedIds);
    router.push('/assess/story');
  };

  const handleBack = () => {
    if (phase === 'rank') {
      setPhase('select');
    } else {
      router.push('/assess/sort');
    }
  };

  if (!sessionId || veryImportantValues.length < 5) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col max-w-lg mx-auto"
    >
      {/* Header */}
      <div className="text-center mb-6">
        <p className="text-sm text-gray-500 mb-1">Step 2 of 5</p>
        <h1 className="text-2xl font-bold text-brand-900">
          {phase === 'select' ? 'Select Your Top 5 Values' : 'Rank Your Top 5 Values'}
        </h1>
        <p className="text-gray-500 mt-1">
          {phase === 'select'
            ? "These are your 'Very Important' values. Pick the 5 that resonate most."
            : 'Put them in order from most to least important'}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {/* Selection Phase */}
        {phase === 'select' && (
          <motion.div
            key="select"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="grid grid-cols-2 gap-3 mb-6">
              {veryImportantValues.map((value) => {
                const selectedIndex = selectedIds.indexOf(value.id);
                const isSelected = selectedIndex !== -1;
                const isDisabled = !isSelected && selectedIds.length >= 5;

                return (
                  <button
                    key={value.id}
                    onClick={() => !isDisabled && handleSelect(value.id)}
                    disabled={isDisabled}
                    className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50'
                        : isDisabled
                        ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                        : 'border-gray-200 hover:border-gray-300 bg-white'
                    }`}
                  >
                    {isSelected && (
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-brand-500 text-white flex items-center justify-center text-sm font-bold">
                        {selectedIndex + 1}
                      </div>
                    )}
                    <p className="font-semibold text-brand-900 pr-8">{value.name}</p>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{value.cardText}</p>
                  </button>
                );
              })}
            </div>

            <p className="text-center text-sm text-gray-500 mb-4">
              Selected: {selectedIds.length} of 5
            </p>

            <button
              onClick={handleSelectionComplete}
              disabled={selectedIds.length !== 5}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue to Ranking →
            </button>
          </motion.div>
        )}

        {/* Ranking Phase */}
        {phase === 'rank' && (
          <motion.div
            key="rank"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="space-y-3 mb-6">
              {selectedIds.map((id, index) => {
                const value = id.startsWith('custom_') && customValue?.id === id
                  ? { id, name: customValue.name, cardText: 'A value that matters deeply to you' }
                  : VALUES_BY_ID[id];

                const isTopThree = index < 3;

                return (
                  <div
                    key={id}
                    className={`flex items-center gap-3 p-4 rounded-xl border shadow-sm transition-all ${
                      isTopThree
                        ? 'bg-white border-gray-200'
                        : 'bg-gray-50 border-gray-100 opacity-75'
                    }`}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                      index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-amber-700' : 'bg-gray-300'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-brand-900">{value?.name}</p>
                      {isTopThree && (
                        <p className="text-xs text-accent-600">Will be in your story</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => moveUp(index)}
                        disabled={index === 0}
                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronUp size={20} className="text-gray-500" />
                      </button>
                      <button
                        onClick={() => moveDown(index)}
                        disabled={index === selectedIds.length - 1}
                        className="p-1 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ChevronDown size={20} className="text-gray-500" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Info about top 3 */}
            <div className="bg-brand-50 rounded-xl p-3 mb-6 text-center border border-brand-100">
              <p className="text-sm text-brand-700">
                Your <strong>top 3 values</strong> will be used in your values story
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="flex-1 py-3 border border-gray-200 text-gray-600 font-medium rounded-full hover:bg-gray-50 transition-all"
              >
                ← Back
              </button>
              <button
                onClick={handleRankComplete}
                className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-full transition-all"
              >
                Continue to Story →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
