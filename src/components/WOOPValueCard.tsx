'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Sparkles, Check } from 'lucide-react';

interface WOOPItem {
  outcomes: string[];
  obstacles: string[];
  obstacle_categories: string[];
  reframes: string[];
}

interface WOOPValueCardProps {
  valueId: string;
  valueName: string;
  woopItem?: WOOPItem;
  isLoading?: boolean;
  loadingMessage?: string;
  error?: string | null;
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
  woopItem,
  isLoading = false,
  loadingMessage,
  error,
  savedWoop,
  onComplete,
}: WOOPValueCardProps) {
  // Use saved values or empty strings
  const [selectedOutcome, setSelectedOutcome] = useState(savedWoop?.outcome || '');
  const [selectedObstacle, setSelectedObstacle] = useState(savedWoop?.obstacle || '');
  const [plan, setPlan] = useState(savedWoop?.plan || '');

  const [expandedSection, setExpandedSection] = useState<'outcome' | 'obstacle' | 'plan'>('outcome');

  // Ref for stable callback
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Track previous values for auto-advance
  const prevOutcomeRef = useRef(selectedOutcome);
  const prevObstacleRef = useRef(selectedObstacle);

  // Auto-advance sections (only when clicking AI suggestions, not when typing custom)
  useEffect(() => {
    const isAISuggestion = woopItem?.outcomes?.includes(selectedOutcome);
    if (selectedOutcome && !prevOutcomeRef.current && expandedSection === 'outcome' && isAISuggestion) {
      setExpandedSection('obstacle');
    }
    prevOutcomeRef.current = selectedOutcome;
  }, [selectedOutcome, expandedSection, woopItem?.outcomes]);

  useEffect(() => {
    const isAISuggestion = woopItem?.obstacles?.includes(selectedObstacle);
    if (selectedObstacle && !prevObstacleRef.current && expandedSection === 'obstacle' && isAISuggestion) {
      setExpandedSection('plan');
    }
    prevObstacleRef.current = selectedObstacle;
  }, [selectedObstacle, expandedSection, woopItem?.obstacles]);

  // Check if complete
  const isComplete = !!selectedOutcome && !!selectedObstacle && !!plan;

  // Save when complete
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
    setExpandedSection(section);
  };

  // Select AI suggestion
  const selectOutcome = (outcome: string) => {
    setSelectedOutcome(outcome);
  };

  const selectObstacle = (obstacle: string) => {
    setSelectedObstacle(obstacle);
    setPlan(''); // Reset plan when obstacle changes
  };

  const selectPlan = (reframe: string) => {
    setPlan(reframe);
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
      {isLoading && (
        <div className="p-6 text-center">
          <Sparkles className="w-8 h-8 text-prism-purple mx-auto mb-2 animate-pulse" />
          <p className="text-gray-500 text-sm">{loadingMessage || 'Generating personalized suggestions...'}</p>
        </div>
      )}

      {/* Error state */}
      {error && !isLoading && (
        <div className="p-4 bg-amber-50 border-b border-amber-100">
          <p className="text-amber-700 text-sm">{error}</p>
        </div>
      )}

      {/* Main content */}
      {!isLoading && (
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
                    {/* AI Suggestions */}
                    {woopItem?.outcomes?.map((outcome, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectOutcome(outcome)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          selectedOutcome === outcome
                            ? 'border-prism-purple bg-prism-subtle'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <Sparkles size={14} className="text-prism-purple mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-700">{outcome}</p>
                        </div>
                      </button>
                    ))}

                    {/* Custom input */}
                    <input
                      type="text"
                      placeholder="Or write your own outcome..."
                      value={woopItem?.outcomes?.includes(selectedOutcome) ? '' : selectedOutcome}
                      onChange={(e) => setSelectedOutcome(e.target.value)}
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
                    {/* AI Suggestions */}
                    {woopItem?.obstacles?.map((obstacle, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectObstacle(obstacle)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          selectedObstacle === obstacle
                            ? 'border-prism-coral bg-red-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <Sparkles size={14} className="text-prism-coral mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-gray-700">{obstacle}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {woopItem.obstacle_categories?.[idx]}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}

                    {/* Custom input */}
                    <input
                      type="text"
                      placeholder="Or write your own obstacle..."
                      value={woopItem?.obstacles?.includes(selectedObstacle) ? '' : selectedObstacle}
                      onChange={(e) => {
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

                    {/* AI Suggestions (reframes) */}
                    {woopItem?.reframes?.map((reframe, idx) => (
                      <button
                        key={idx}
                        onClick={() => selectPlan(reframe)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          plan === reframe
                            ? 'border-prism-purple bg-prism-subtle'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-start gap-2">
                          <Sparkles size={14} className="text-prism-purple mt-0.5 flex-shrink-0" />
                          <p className="text-sm text-gray-700">{reframe}</p>
                        </div>
                      </button>
                    ))}

                    {/* Custom action input */}
                    <input
                      type="text"
                      placeholder="Or write your own action..."
                      value={woopItem?.reframes?.includes(plan) ? '' : plan}
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
            <span className="font-medium">Your commitment:</span> When {selectedObstacle.toLowerCase()}, I&apos;ll remember: {plan}
          </p>
        </div>
      )}
    </div>
  );
}
