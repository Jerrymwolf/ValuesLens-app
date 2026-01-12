'use client';

import { useEffect, useMemo, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAssessmentStore } from '@/stores/assessmentStore';
import { VALUES_BY_ID } from '@/lib/data/values';
import WOOPValueCard from '@/components/WOOPValueCard';
import { useHydration } from '@/hooks/useHydration';

// Types for WOOP API response
interface WOOPItem {
  value_id: string;
  outcomes: string[];
  obstacles: string[];
  obstacle_categories: string[];
  reframes: string[];
}

interface ValueAnalysis {
  value_id: string;
  value_name: string;
  affect: { surface: string; deeper: string };
  behavior: { protective: string; aspirational: string; tell: string };
  cognition: { belief: string; lie: string };
  desire: { hungry_for: string; protecting: string; relief_sought: string };
  wound: string;
  wince_moment: string;
  nod_moment: string;
}

interface WOOPSuggestions {
  language_to_echo: string[];
  analysis: ValueAnalysis[];
  woop: WOOPItem[];
}

export default function GoalsPage() {
  const router = useRouter();
  const isHydrated = useHydration();
  const {
    sessionId,
    rankedValues,
    customValue,
    transcript,
    woop,
    setWoop,
    setDefinitions,
  } = useAssessmentStore();

  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [loadingMessage, setLoadingMessage] = useState('');

  // WOOP suggestions state
  const [woopSuggestions, setWoopSuggestions] = useState<WOOPSuggestions | null>(null);
  const [woopLoading, setWoopLoading] = useState(true);
  const [woopError, setWoopError] = useState<string | null>(null);

  // Ref to prevent double-fetch
  const hasFetchedWoopRef = useRef(false);

  // ALL useMemo hooks FIRST (before hydration guard)
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

  const allComplete = useMemo(() => {
    return top3Values.every((value) => {
      const w = woop[value.id];
      return w && w.outcome && w.obstacle && w.plan;
    });
  }, [top3Values, woop]);

  // ALL useEffect hooks NEXT (with isHydrated guard inside)
  useEffect(() => {
    if (!isHydrated) return;
    if (!sessionId) {
      router.replace('/');
      return;
    }
    if (rankedValues.length < 3) {
      router.replace('/assess/story');
      return;
    }
  }, [isHydrated, sessionId, rankedValues.length, router]);

  // Fetch WOOP suggestions on mount
  useEffect(() => {
    if (!isHydrated) return;
    if (!transcript || top3Values.length === 0) return;
    if (hasFetchedWoopRef.current) return;

    hasFetchedWoopRef.current = true;

    const fetchWoop = async () => {
      try {
        setWoopLoading(true);
        setWoopError(null);

        const response = await fetch('/api/ai/generate-woop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            values: top3Values.map(v => ({ id: v.id, name: v.name })),
            story: transcript,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate suggestions');
        }

        const data = await response.json();
        setWoopSuggestions(data);
      } catch (err) {
        console.error('WOOP fetch error:', err);
        setWoopError('Could not load personalized suggestions. You can still write your own.');
      } finally {
        setWoopLoading(false);
      }
    };

    fetchWoop();
  }, [isHydrated, transcript, top3Values]);

  // ALL useCallback hooks - stable reference for WOOPValueCard
  const handleWoopComplete = useCallback((valueId: string, woopData: { outcome: string; obstacle: string; plan: string }) => {
    setWoop(valueId, woopData);
  }, [setWoop]);

  // Hydration guard - AFTER all hooks
  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  const handleBack = () => {
    router.push('/assess/story');
  };

  const generateValuesCard = async () => {
    setIsGenerating(true);
    setError('');
    setLoadingMessage('Creating your personalized card...');

    try {
      // Format values with IDs and names
      const valuesInput = top3Values.map((v) => ({
        id: v.id,
        name: v.name,
      }));

      // Format enriched WOOP data for values card generation
      const woopData = {
        language_to_echo: woopSuggestions?.language_to_echo || [],
        analysis: woopSuggestions?.analysis || [],
        woop: top3Values.map((v) => {
          const w = woop[v.id];
          const suggestion = woopSuggestions?.woop.find(s => s.value_id === v.id);
          // Get selected obstacle index to use matching category
          const selectedObstacleIdx = suggestion?.obstacles?.indexOf(w?.obstacle || '') ?? 0;
          return {
            value_id: v.id,
            outcome: w?.outcome || suggestion?.outcomes?.[0] || '',
            obstacle: w?.obstacle || suggestion?.obstacles?.[0] || '',
            obstacle_category: suggestion?.obstacle_categories?.[Math.max(0, selectedObstacleIdx)] || 'AVOIDANCE',
            reframe: w?.plan || suggestion?.reframes?.[0] || '',
          };
        }),
      };

      const response = await fetch('/api/ai/generate-values-card', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          values: valuesInput,
          story: transcript,
          woopData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate card');
      }

      const data = await response.json();

      if (!data.values || !Array.isArray(data.values)) {
        throw new Error('Invalid response from API');
      }

      // Transform API response to store format
      const newDefinitions: Record<string, {
        tagline: string;
        commitment: string;
        definition: string;
        behavioralAnchors: string[];
        weeklyQuestion: string;
        userEdited: boolean;
      }> = {};

      data.values.forEach((v: {
        id: string;
        tagline: string;
        commitment: string;
        definition: string;
        behavioral_anchors: string[];
        weekly_question: string;
      }) => {
        newDefinitions[v.id] = {
          tagline: v.tagline,
          commitment: v.commitment,
          definition: v.definition,
          behavioralAnchors: v.behavioral_anchors,
          weeklyQuestion: v.weekly_question,
          userEdited: false,
        };
      });

      setDefinitions(newDefinitions);
      router.push('/assess/share');
    } catch (err) {
      console.error('Generation error:', err);
      setError('Failed to generate your card. Please try again.');
      setIsGenerating(false);
      setLoadingMessage('');
    }
  };

  const handleContinue = () => {
    if (allComplete) {
      generateValuesCard();
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
            {loadingMessage || 'Creating your personalized card...'}
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
        <p className="text-sm text-gray-500 mb-1">Step 4 of 5</p>
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
              valueId={value.id}
              valueName={value.name}
              woopItem={woopSuggestions?.woop.find(w => w.value_id === value.id)}
              isLoading={woopLoading}
              loadingMessage={woopLoading ? 'Analyzing your story...' : undefined}
              error={woopError}
              savedWoop={woop[value.id]}
              onComplete={handleWoopComplete}
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
