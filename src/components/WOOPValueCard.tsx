'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Sparkles, RefreshCw, Check } from 'lucide-react';

interface WOOPSuggestions {
  outcomes: string[];
  obstacles: string[];
  actionSuggestions: Record<string, string[]>;
}

interface WOOPValueCardProps {
  valueId: string;
  valueName: string;
  storyText?: string;
  definition?: string;
  savedWoop?: {
    outcome: string;
    obstacle: string;
    plan: string;
  };
  onComplete: (valueId: string, woop: { outcome: string; obstacle: string; plan: string }) => void;
}

export default function WOOPValueCard({
  valueId,
  valueName,
  storyText,
  definition,
  savedWoop,
  onComplete,
}: WOOPValueCardProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<WOOPSuggestions | null>(null);

  const [selectedOutcome, setSelectedOutcome] = useState(savedWoop?.outcome || '');
  const [customOutcome, setCustomOutcome] = useState('');
  const [selectedObstacle, setSelectedObstacle] = useState(savedWoop?.obstacle || '');
  const [customObstacle, setCustomObstacle] = useState('');
  const [plan, setPlan] = useState(savedWoop?.plan || '');

  const [expandedSection, setExpandedSection] = useState<'outcome' | 'obstacle' | 'plan'>('outcome');

  // Use ref for callback to avoid stale closures and infinite loops
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Track if initial fetch was done
  const hasFetchedRef = useRef(false);

  // Fetch WOOP suggestions
  const fetchSuggestions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/generate-woop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          valueName,
          storyText,
          definition,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate suggestions');
      }

      const data = await response.json();
      setSuggestions(data);
    } catch (err) {
      console.error('WOOP fetch error:', err);
      setError('Could not load AI suggestions. Write your own below.');
    } finally {
      setLoading(false);
    }
  }, [valueName, storyText, definition]);

  // Fetch on mount (only if no saved data)
  useEffect(() => {
    if (hasFetchedRef.current) return;
    if (!savedWoop?.outcome) {
      hasFetchedRef.current = true;
      fetchSuggestions();
    }
  }, [savedWoop?.outcome, fetchSuggestions]);

  // Get current action suggestions for selected obstacle
  const actionSuggestions = suggestions?.actionSuggestions?.[selectedObstacle] || [];

  // Check if complete
  const isComplete = !!selectedOutcome && !!selectedObstacle && !!plan;

  // Track previous values for auto-advance
  const prevOutcomeRef = useRef(selectedOutcome);
  const prevObstacleRef = useRef(selectedObstacle);

  // Auto-advance sections when values change
  useEffect(() => {
    // Only advance if outcome just got set (was empty, now has value)
    if (selectedOutcome && !prevOutcomeRef.current && expandedSection === 'outcome') {
      setExpandedSection('obstacle');
    }
    prevOutcomeRef.current = selectedOutcome;
  }, [selectedOutcome, expandedSection]);

  useEffect(() => {
    // Only advance if obstacle just got set (was empty, now has value)
    if (selectedObstacle && !prevObstacleRef.current && expandedSection === 'obstacle') {
      setExpandedSection('plan');
    }
    prevObstacleRef.current = selectedObstacle;
  }, [selectedObstacle, expandedSection]);

  // Save when complete - use ref for callback to avoid infinite loops
  useEffect(() => {
    if (isComplete) {
      onCompleteRef.current(valueId, {
        outcome: selectedOutcome,
        obstacle: selectedObstacle,
        plan,
      });
    }
  }, [valueId, selectedOutcome, selectedObstacle, plan, isComplete]);

  const toggleSection = (section: 'outcome' | 'obstacle' | 'plan') => {
    setExpandedSection(expandedSection === section ? section : section);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 bg-prism-subtle border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-lg text-brand-900">{valueName}</h3>
          {isComplete && (
            <div className="flex items-center gap-1 text-green-600 text-sm">
              <Check size={16} />
              Complete
            </div>
          )}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="p-6 text-center">
          <Sparkles className="w-8 h-8 text-prism-purple mx-auto mb-2 animate-pulse" />
          <p className="text-gray-500 text-sm">Generating personalized suggestions...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 bg-amber-50 border-b border-amber-100">
          <p className="text-amber-700 text-sm">{error}</p>
          <button
            onClick={fetchSuggestions}
            className="mt-2 text-amber-800 text-sm underline flex items-center gap-1"
          >
            <RefreshCw size={14} />
            Try again
          </button>
        </div>
      )}

      {/* Main content */}
      {!loading && (
        <div className="divide-y divide-gray-100">
          {/* OUTCOME Section */}
          <div>
            <button
              onClick={() => toggleSection('outcome')}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-prism-purple text-white text-sm font-bold flex items-center justify-center">
                  1
                </span>
                <span className="font-medium text-gray-900">What&apos;s your best outcome?</span>
              </div>
              <div className="flex items-center gap-2">
                {selectedOutcome && (
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    Selected
                  </span>
                )}
                <ChevronDown
                  size={20}
                  className={`text-gray-400 transition-transform ${
                    expandedSection === 'outcome' ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </button>

            <AnimatePresence>
              {expandedSection === 'outcome' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-2">
                    {suggestions?.outcomes.map((outcome, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setSelectedOutcome(outcome);
                          setCustomOutcome('');
                        }}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          selectedOutcome === outcome
                            ? 'border-prism-purple bg-prism-subtle'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className="text-sm text-gray-700">{outcome}</p>
                      </button>
                    ))}

                    {/* Custom input */}
                    <input
                      type="text"
                      placeholder="Or write your own outcome..."
                      value={customOutcome}
                      onChange={(e) => {
                        setCustomOutcome(e.target.value);
                        setSelectedOutcome(e.target.value);
                      }}
                      className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-prism-purple focus:border-transparent"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* OBSTACLE Section */}
          <div>
            <button
              onClick={() => toggleSection('obstacle')}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-prism-coral text-white text-sm font-bold flex items-center justify-center">
                  2
                </span>
                <span className="font-medium text-gray-900">What obstacle might stop you?</span>
              </div>
              <div className="flex items-center gap-2">
                {selectedObstacle && (
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    Selected
                  </span>
                )}
                <ChevronDown
                  size={20}
                  className={`text-gray-400 transition-transform ${
                    expandedSection === 'obstacle' ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </button>

            <AnimatePresence>
              {expandedSection === 'obstacle' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-2">
                    {suggestions?.obstacles.map((obstacle, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setSelectedObstacle(obstacle);
                          setCustomObstacle('');
                          setPlan(''); // Reset plan when obstacle changes
                        }}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          selectedObstacle === obstacle
                            ? 'border-prism-coral bg-red-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className="text-sm text-gray-700">{obstacle}</p>
                      </button>
                    ))}

                    {/* Custom input */}
                    <input
                      type="text"
                      placeholder="Or write your own obstacle..."
                      value={customObstacle}
                      onChange={(e) => {
                        setCustomObstacle(e.target.value);
                        setSelectedObstacle(e.target.value);
                        setPlan('');
                      }}
                      className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-prism-coral focus:border-transparent"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* PLAN Section */}
          <div>
            <button
              onClick={() => toggleSection('plan')}
              className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-prism-orange text-white text-sm font-bold flex items-center justify-center">
                  3
                </span>
                <span className="font-medium text-gray-900">Your commitment</span>
              </div>
              <div className="flex items-center gap-2">
                {plan && (
                  <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
                    Complete
                  </span>
                )}
                <ChevronDown
                  size={20}
                  className={`text-gray-400 transition-transform ${
                    expandedSection === 'plan' ? 'rotate-180' : ''
                  }`}
                />
              </div>
            </button>

            <AnimatePresence>
              {expandedSection === 'plan' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 space-y-3">
                    {/* If-then statement */}
                    <div className="p-3 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">
                        <span className="font-medium text-prism-coral">If</span>{' '}
                        {selectedObstacle || '[select an obstacle above]'}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium text-prism-purple">Then I will</span>
                      </p>
                    </div>

                    {/* Action suggestions */}
                    {actionSuggestions.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-xs text-gray-500">Suggestions:</p>
                        {actionSuggestions.map((action, i) => (
                          <button
                            key={i}
                            onClick={() => setPlan(action)}
                            className={`w-full text-left p-3 rounded-lg border transition-all ${
                              plan === action
                                ? 'border-prism-purple bg-prism-subtle'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <p className="text-sm text-gray-700">{action}</p>
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Custom action input */}
                    <input
                      type="text"
                      placeholder="Or write your own action..."
                      value={plan}
                      onChange={(e) => setPlan(e.target.value)}
                      className="w-full p-3 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-prism-purple focus:border-transparent"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Complete summary */}
      {isComplete && (
        <div className="p-4 bg-green-50 border-t border-green-100">
          <p className="text-sm text-green-800">
            <span className="font-medium">Your commitment:</span> If {selectedObstacle.toLowerCase()}, then I will {plan}
          </p>
        </div>
      )}
    </div>
  );
}
