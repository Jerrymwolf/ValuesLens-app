'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { RotateCcw, Sparkles, Coffee } from 'lucide-react';
import ShareInterface2026 from '@/components/ShareInterface2026';
import DemographicsForm from '@/components/DemographicsForm';
import { useAssessmentStore } from '@/stores/assessmentStore';
import { VALUES_BY_ID } from '@/lib/data/values';
import { getFallbackTagline } from '@/lib/data/fallbackTaglines';
import { useHydration } from '@/hooks/useHydration';
import type { ValueWithDefinition } from '@/components/ValuesCard2026';

interface Demographics {
  ageRange?: '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+';
  industry?: string;
  leadershipRole?: boolean;
  country?: string;
}

export default function SharePage() {
  const router = useRouter();
  const isHydrated = useHydration();
  const {
    sessionId,
    rankedValues,
    definitions,
    goals,
    customValue,
    shareSlug,
    setShareSlug,
    setConsent,
    demographics,
    reset,
  } = useAssessmentStore();

  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDemographics, setShowDemographics] = useState(false);

  // ALL useMemo hooks FIRST (before hydration guard)
  const valuesWithDefinitions: ValueWithDefinition[] = useMemo(() => {
    return rankedValues.slice(0, 3).map((id) => {
      const value = VALUES_BY_ID[id];
      const def = definitions[id];
      const isCustom = id.startsWith('custom_');

      // Handle custom values
      const valueName = isCustom && customValue?.id === id
        ? customValue.name
        : value?.name || 'Value';
      const valueTagline = isCustom
        ? 'A value that matters deeply to you'
        : value?.cardText || '';

      return {
        id,
        name: valueName,
        tagline: def?.tagline || valueTagline || getFallbackTagline(valueName),
        definition: def?.definition,
        commitment: def?.commitment || goals[id], // New location, fallback to old goals
      };
    }).filter((v) => v.name);
  }, [rankedValues, definitions, goals, customValue]);

  // createProfile function (defined before useEffects that reference it)
  const createProfile = async () => {
    setIsCreatingProfile(true);
    setError(null);

    try {
      const response = await fetch('/api/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          rankedValues,
          definitions,
          goals,
          customValue,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create profile');
      }

      const data = await response.json();
      setShareSlug(data.slug);
    } catch (err) {
      console.error('Profile creation error:', err);
      setError('Could not create shareable profile');
    } finally {
      setIsCreatingProfile(false);
    }
  };

  // ALL useEffect hooks NEXT (with isHydrated guard inside)
  useEffect(() => {
    if (!isHydrated) return;
    if (!sessionId) {
      router.replace('/');
      return;
    }
    if (rankedValues.length === 0) {
      router.replace('/assess/story');
    }
  }, [isHydrated, sessionId, rankedValues.length, router]);

  useEffect(() => {
    if (!isHydrated) return;
    if (shareSlug || !sessionId || rankedValues.length === 0) return;
    createProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHydrated, sessionId, rankedValues, shareSlug]);

  useEffect(() => {
    if (!isHydrated) return;
    if (shareSlug && !demographics) {
      // Small delay so user sees their card first
      const timer = setTimeout(() => setShowDemographics(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [isHydrated, shareSlug, demographics]);

  // Hydration guard - AFTER all hooks
  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  const shareUrl = shareSlug
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/p/${shareSlug}`
    : undefined;

  const handleStartOver = () => {
    reset();
    router.push('/');
  };

  const handleDemographicsSubmit = (data: Demographics) => {
    setConsent(true, data);
    setShowDemographics(false);
  };

  const handleDemographicsSkip = () => {
    setShowDemographics(false);
  };

  if (!sessionId || valuesWithDefinitions.length === 0) {
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
      className="flex flex-col"
    >
      {/* Celebration header */}
      <div className="text-center mb-8">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.2 }}
          className="inline-flex items-center justify-center w-16 h-16 bg-prism rounded-full mb-4"
        >
          <Sparkles className="w-8 h-8 text-white" />
        </motion.div>
        <h1 className="text-2xl font-bold text-brand-900 mb-2">
          Your 2026 Values Card is Ready!
        </h1>
        <p className="text-gray-600">
          Share your values commitment with the world
        </p>
      </div>

      {/* Profile creation status */}
      {isCreatingProfile && (
        <div className="text-center mb-6 text-gray-500 text-sm">
          Creating your shareable profile...
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm text-center">
          {error}
          <button
            onClick={createProfile}
            className="block mx-auto mt-2 text-amber-700 underline"
          >
            Try again
          </button>
        </div>
      )}

      {/* Share interface */}
      <ShareInterface2026 values={valuesWithDefinitions} shareUrl={shareUrl} />

      {/* Donation */}
      <div className="mt-10 pt-6 border-t border-gray-200 text-center">
        <p className="text-sm text-gray-500 mb-3">
          ValuesLens is free. If it helped you, consider buying me a coffee.
        </p>
        <a
          href="https://buymeacoffee.com/thew0lf"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#FFDD00] hover:bg-[#FFE44D] text-black rounded-full text-sm font-semibold transition-colors shadow-sm"
        >
          <Coffee size={18} />
          Buy me a coffee
        </a>
      </div>

      {/* Start over button */}
      <div className="mt-12 text-center">
        <button
          onClick={handleStartOver}
          className="text-gray-500 hover:text-gray-700 text-sm flex items-center justify-center gap-2 mx-auto transition-colors"
        >
          <RotateCcw size={16} />
          Start a new assessment
        </button>
      </div>

      {/* MVP hint - more coming soon */}
      <div className="mt-8 text-center">
        <p className="text-sm text-gray-400">
          This is just the beginning. More values experiences coming in 2026.
        </p>
      </div>

      {/* Demographics Modal */}
      <DemographicsForm
        isOpen={showDemographics}
        onSubmit={handleDemographicsSubmit}
        onSkip={handleDemographicsSkip}
      />
    </motion.div>
  );
}
