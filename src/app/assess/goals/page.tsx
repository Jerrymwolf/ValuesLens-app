'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAssessmentStore } from '@/stores/assessmentStore';
import { VALUES_BY_ID } from '@/lib/data/values';
import WOOPValueCard from '@/components/WOOPValueCard';

export default function GoalsPage() {
  const router = useRouter();
  const {
    sessionId,
    rankedValues,
    customValue,
    transcript,
    sortedValues,
    woop,
    definitions,
    setWoop,
    setDefinitions,
  } = useAssessmentStore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  // Get top 3 values
  const top3Values = useMemo(() => {
    return rankedValues.slice(0, 3).map((id) => {
      if (id.startsWith('custom_') && customValue?.id === id) {
        return {
          id,
          name: customValue.name,
          cardText: 'A value that matters deeply to you',
        };
      }
      return VALUES_BY_ID[id];
    }).filter(Boolean);
  }, [rankedValues, customValue]);

  // Redirect if no session or no ranked values
  useEffect(() => {
    if (!sessionId) {
      router.replace('/');
      return;
    }
    if (rankedValues.length < 3) {
      router.replace('/assess/story');
      return;
    }
  }, [sessionId, rankedValues.length, router]);

  // Check if all 3 WOOP cards are complete
  const allComplete = useMemo(() => {
    return top3Values.every((value) => {
      const w = woop[value.id];
      return w && w.outcome && w.obstacle && w.plan;
    });
  }, [top3Values, woop]);

  // Handle WOOP completion for a value
  const handleWoopComplete = useCallback((valueId: string, woopData: { outcome: string; obstacle: string; plan: string }) => {
    setWoop(valueId, woopData);
  }, [setWoop]);

  const handleBack = () => {
    router.push('/assess/story');
  };

  const generateDefinitions = async () => {
    setIsGenerating(true);
    setError('');

    try {
      const response = await fetch('/api/ai/generate-definitions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          rankedValues,
          transcript,
          sortedValues,
          goals: Object.fromEntries(
            top3Values.map((v) => {
              const w = woop[v.id];
              return [v.id, w ? `If ${w.obstacle.toLowerCase()}, then I will ${w.plan}` : ''];
            })
          ),
          customValue,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate definitions');
      }

      const data = await response.json();

      if (data.definitions) {
        setDefinitions(data.definitions);
        router.push('/assess/share');
      } else {
        throw new Error('No definitions returned');
      }
    } catch (err) {
      console.error('Generation error:', err);
      setError('Failed to generate your personalized definitions. Please try again.');
      setIsGenerating(false);
    }
  };

  const handleContinue = () => {
    if (allComplete) {
      generateDefinitions();
    }
  };

  if (!sessionId || top3Values.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  // Loading state
  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-16 h-16 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-6" />
          <h2 className="text-xl font-bold text-brand-900 mb-2">
            Creating your personalized card...
          </h2>
          <p className="text-gray-500">
            This usually takes a few seconds
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col"
    >
      {/* Header */}
      <div className="text-center mb-6">
        <p className="text-sm text-gray-500 mb-1">Step 3 of 4</p>
        <h1 className="text-2xl font-bold text-brand-900">
          Values in Action
        </h1>
        <p className="text-gray-500 mt-1">
          Create if-then commitments for each value
        </p>
      </div>

      {/* WOOP explanation */}
      <div className="bg-prism-subtle rounded-xl p-4 mb-6 border border-prism-purple/20">
        <p className="text-sm text-gray-700">
          <span className="font-semibold text-prism-purple">WOOP</span> (Wish, Outcome, Obstacle, Plan)
          is a research-backed method that doubles goal achievement. For each value,
          identify what might stop you and plan how you&apos;ll respond.
        </p>
      </div>

      {/* WOOP Cards */}
      <div className="space-y-4 mb-6">
        {top3Values.map((value, index) => (
          <motion.div
            key={value.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <WOOPValueCard
              valueName={value.name}
              storyText={transcript}
              definition={definitions[value.id]?.definition}
              savedWoop={woop[value.id]}
              onComplete={(woopData) => handleWoopComplete(value.id, woopData)}
            />
          </motion.div>
        ))}
      </div>

      {/* Progress indicator */}
      <div className="text-center mb-4">
        <p className="text-sm text-gray-500">
          {Object.keys(woop).filter(id => {
            const w = woop[id];
            return w && w.outcome && w.obstacle && w.plan;
          }).length} of 3 complete
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleBack}
          className="flex-1 py-3 border border-gray-200 text-gray-600 font-medium rounded-full hover:bg-gray-50 transition-all"
        >
          ← Back
        </button>
        <button
          onClick={handleContinue}
          disabled={!allComplete}
          className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Generate My 2026 Card →
        </button>
      </div>
    </motion.div>
  );
}
