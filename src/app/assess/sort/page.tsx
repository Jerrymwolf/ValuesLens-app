'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import CardDeck from '@/components/CardDeck';
import CustomValueModal from '@/components/CustomValueModal';
import { useAssessmentStore } from '@/stores/assessmentStore';
import { VALUES_BY_ID } from '@/lib/data/values';
import type { SortCategory } from '@/lib/types';

const MIN_VERY_IMPORTANT = 5;
const MIN_VERY_IMPORTANT_FOR_STORY = 3;

export default function SortPage() {
  const router = useRouter();
  const {
    shuffledValueIds,
    currentCardIndex,
    sortValue,
    sortedValues,
    sessionId,
  } = useAssessmentStore();

  const [showCustomValueModal, setShowCustomValueModal] = useState(false);

  // Redirect to home if no session
  useEffect(() => {
    if (!sessionId || shuffledValueIds.length === 0) {
      router.replace('/');
    }
  }, [sessionId, shuffledValueIds, router]);

  // Convert IDs to Value objects
  const values = useMemo(() => {
    return shuffledValueIds
      .map((id) => VALUES_BY_ID[id])
      .filter(Boolean);
  }, [shuffledValueIds]);

  // Category counts for display
  const categoryCounts = useMemo(() => ({
    very: sortedValues.very.length,
    somewhat: sortedValues.somewhat.length,
    less: sortedValues.less.length,
  }), [sortedValues]);

  // Can skip when 5+ values marked as Very Important
  const canSkip = sortedValues.very.length >= MIN_VERY_IMPORTANT;

  // Check if sorting is complete
  useEffect(() => {
    if (currentCardIndex >= values.length && values.length > 0) {
      // All cards sorted, show custom value modal
      setShowCustomValueModal(true);
    }
  }, [currentCardIndex, values.length]);

  const handleSwipe = (valueId: string, category: SortCategory) => {
    sortValue(valueId, category);
  };

  const handleSkip = () => {
    // Show custom value modal before proceeding
    setShowCustomValueModal(true);
  };

  const handleCustomValueModalClose = () => {
    setShowCustomValueModal(false);

    // Check if user has enough values to proceed
    if (sortedValues.very.length < MIN_VERY_IMPORTANT_FOR_STORY) {
      // Not enough values - stay on sort page
      return;
    }

    // Navigate to story page
    router.push('/assess/story');
  };

  if (!sessionId || values.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center"
      >
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Sort Your Values
          </h1>
          <p className="text-gray-500">
            How important is each value to you?
          </p>
        </div>

        <CardDeck
          values={values}
          currentIndex={currentCardIndex}
          onSwipe={handleSwipe}
          categoryCounts={categoryCounts}
          canSkip={canSkip}
          onSkip={handleSkip}
        />
      </motion.div>

      {/* Custom Value Modal */}
      <CustomValueModal
        isOpen={showCustomValueModal}
        onClose={handleCustomValueModalClose}
        veryImportantCount={sortedValues.very.length}
      />
    </>
  );
}
