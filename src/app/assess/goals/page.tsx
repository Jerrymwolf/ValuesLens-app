'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Target, BookOpen, Sparkles, Share2, ArrowLeft, ListChecks } from 'lucide-react';
import { useAssessmentStore } from '@/stores/assessmentStore';
import { ALL_VALUES } from '@/lib/data/values';
import { shuffleArray } from '@/lib/utils/shuffle';
import { generateSlug } from '@/lib/utils/slugs';
import Logo from '@/components/Logo';

const STEPS = [
  {
    icon: Target,
    title: 'Sort',
    time: '~4 min',
    description: 'Swipe through 52 values. Right = Very Important, Up = Somewhat, Left = Less.',
  },
  {
    icon: ListChecks,
    title: 'Select Top 5',
    time: '~2 min',
    description: 'Pick and rank your top 5 values. Your top 3 go into your story.',
  },
  {
    icon: BookOpen,
    title: 'Story',
    time: '~3 min',
    description: 'Share a powerful story about living your values. Voice or text.',
  },
  {
    icon: Sparkles,
    title: 'Goals',
    time: '~2 min',
    description: "Create 'if-then' commitments using VOOP. AI helps with suggestions.",
  },
  {
    icon: Share2,
    title: 'Share',
    time: '~1 min',
    description: 'Get a beautiful shareable card with your values and commitments.',
  },
];

export default function StartPage() {
  const router = useRouter();
  const {
    initSession,
    setConsent: setStoreConsent,
    sessionId,
    currentCardIndex,
    shuffledValueIds,
    rankedValues,
    reset,
  } = useAssessmentStore();

  const [consent, setConsent] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [showResumeModal, setShowResumeModal] = useState(false);

  // Check for existing session
  useEffect(() => {
    if (sessionId && shuffledValueIds.length > 0) {
      const isIncomplete = currentCardIndex < shuffledValueIds.length || rankedValues.length === 0;
      if (isIncomplete) {
        setShowResumeModal(true);
      }
    }
  }, [sessionId, currentCardIndex, shuffledValueIds.length, rankedValues.length]);

  const getResumeRoute = () => {
    if (currentCardIndex < shuffledValueIds.length) return '/assess/sort';
    if (rankedValues.length === 0) return '/assess/narrow';
    return '/assess/rank';
  };

  const handleResume = () => {
    setShowResumeModal(false);
    router.push(getResumeRoute());
  };

  const handleStartFresh = () => {
    reset();
    setShowResumeModal(false);
  };

  const handleStart = () => {
    setIsStarting(true);
    const newSessionId = generateSlug();
    const shuffledIds = shuffleArray(ALL_VALUES.map((v) => v.id));
    initSession(newSessionId, shuffledIds);
    setStoreConsent(consent);
    router.push('/assess/sort');
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Prism bar */}
      <div className="h-2 bg-prism" />

      {/* Header */}
      <div className="bg-prism-subtle border-b border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="md" />
          <button
            onClick={() => router.push('/')}
            className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1"
          >
            <ArrowLeft size={16} />
            Back
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-10">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <h1 className="text-3xl font-bold text-brand-900 mb-2">How It Works</h1>
          <p className="text-lg text-gray-600">Discover your core values in about 12 minutes</p>
        </motion.div>

        {/* Steps */}
        <div className="space-y-4 mb-10">
          {STEPS.map((step, index) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex gap-4 p-5 bg-gray-50 rounded-2xl border border-gray-100"
              >
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center text-brand-600">
                    <Icon size={24} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-bold text-brand-600">Step {index + 1}</span>
                    <span className="text-xs text-gray-400 bg-gray-200 px-2 py-0.5 rounded-full">
                      {step.time}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-brand-900 mb-1">{step.title}</h3>
                  <p className="text-gray-600 text-sm">{step.description}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Consent & Start */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
        >
          <label className="flex items-start gap-3 cursor-pointer mb-4">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              className="mt-1 w-5 h-5 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
            />
            <span className="text-sm text-gray-600">
              I consent to my <strong>fully anonymized</strong> responses being used for research
              to improve values-based decision making.
              <span className="text-gray-400 ml-1">(Optional)</span>
            </span>
          </label>

          <p className="text-xs text-gray-500 mb-6 pl-8">
            We don&apos;t collect names, emails, or any personal information. Your data is anonymized
            at collection. See our{' '}
            <a
              href="https://github.com/jeremiahwolf/ValuesLens-app/blob/main/LICENSE"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brand-600 hover:underline"
            >
              MIT License
            </a>.
          </p>

          <button
            onClick={handleStart}
            disabled={isStarting}
            className="w-full py-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-full text-lg shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isStarting ? 'Starting...' : 'Begin Assessment →'}
          </button>

          <p className="text-center text-sm text-gray-400 mt-4">
            No account required · Progress saved locally · Fully anonymous
          </p>
        </motion.div>
      </div>

      {/* Resume Modal */}
      <AnimatePresence>
        {showResumeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 px-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl"
            >
              <h2 className="text-xl font-bold text-brand-900 mb-2">Welcome back!</h2>
              <p className="text-gray-600 mb-6">
                You have an assessment in progress (
                {Math.round((currentCardIndex / shuffledValueIds.length) * 100) || 0}% complete).
                Would you like to continue?
              </p>
              <div className="space-y-3">
                <button
                  onClick={handleResume}
                  className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-full transition-all"
                >
                  Continue where I left off
                </button>
                <button
                  onClick={handleStartFresh}
                  className="w-full py-3 text-gray-600 hover:text-gray-900 font-medium transition-colors"
                >
                  Start fresh
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
