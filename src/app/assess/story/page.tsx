'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, ChevronDown, Mic, Keyboard, Check } from 'lucide-react';
import { useAssessmentStore } from '@/stores/assessmentStore';
import { VALUES_BY_ID } from '@/lib/data/values';

type Phase = 'select' | 'reorder' | 'story';

const MIN_WORDS = 30;
const MAX_WORDS = 500;

export default function StoryPage() {
  const router = useRouter();
  const {
    sessionId,
    sortedValues,
    customValue,
    transcript,
    setRankedValues,
    setTranscript,
  } = useAssessmentStore();

  const [phase, setPhase] = useState<Phase>('select');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [inputMode, setInputMode] = useState<'voice' | 'text'>('text');
  const [isRecording, setIsRecording] = useState(false);
  const [storyText, setStoryText] = useState(transcript || '');

  // Get all "Very Important" values
  const veryImportantValues = useMemo(() => {
    return sortedValues.very.map((id) => {
      if (id.startsWith('custom_') && customValue?.id === id) {
        return {
          id,
          name: customValue.name,
          cardText: 'A value that matters deeply to you',
          domain: 'Custom',
        };
      }
      return VALUES_BY_ID[id];
    }).filter(Boolean);
  }, [sortedValues.very, customValue]);

  // Redirect if no session
  useEffect(() => {
    if (!sessionId) {
      router.replace('/');
      return;
    }
    if (sortedValues.very.length < 3) {
      router.replace('/assess/sort');
      return;
    }
  }, [sessionId, sortedValues.very.length, router]);

  // If exactly 3 values, skip selection
  useEffect(() => {
    if (veryImportantValues.length === 3 && phase === 'select') {
      setSelectedIds(sortedValues.very.slice(0, 3));
      setPhase('reorder');
    }
  }, [veryImportantValues.length, sortedValues.very, phase]);

  // Word count
  const wordCount = useMemo(() => {
    return storyText.trim().split(/\s+/).filter(Boolean).length;
  }, [storyText]);

  const canContinue = wordCount >= MIN_WORDS;

  // Selection handlers
  const handleSelect = (valueId: string) => {
    if (selectedIds.includes(valueId)) {
      // Deselect
      setSelectedIds(selectedIds.filter((id) => id !== valueId));
    } else if (selectedIds.length < 3) {
      // Select
      setSelectedIds([...selectedIds, valueId]);
    }
  };

  const handleSelectionComplete = () => {
    if (selectedIds.length === 3) {
      setPhase('reorder');
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

  const handleReorderComplete = () => {
    setRankedValues(selectedIds);
    setPhase('story');
  };

  // Voice recording
  const startRecording = useCallback(() => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Voice input is not supported in your browser. Please use text input.');
      setInputMode('text');
      return;
    }

    const SpeechRecognition = (window as unknown as { SpeechRecognition?: typeof window.SpeechRecognition; webkitSpeechRecognition?: typeof window.SpeechRecognition }).SpeechRecognition ||
                              (window as unknown as { webkitSpeechRecognition?: typeof window.SpeechRecognition }).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      // Start from resultIndex to avoid re-processing previous results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + ' ';
        }
      }
      if (finalTranscript) {
        setStoryText((prev) => prev + finalTranscript);
      }
    };

    recognition.onerror = () => {
      setIsRecording(false);
      setInputMode('text');
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
    setIsRecording(true);

    // Store reference for stopping
    (window as unknown as { currentRecognition?: SpeechRecognition }).currentRecognition = recognition;
  }, []);

  const stopRecording = useCallback(() => {
    const recognition = (window as unknown as { currentRecognition?: SpeechRecognition }).currentRecognition;
    if (recognition) {
      recognition.stop();
      setIsRecording(false);
    }
  }, []);

  // Continue to goals
  const handleContinue = () => {
    setTranscript(storyText);
    router.push('/assess/goals');
  };

  // Go back handler
  const handleBack = () => {
    if (phase === 'reorder') {
      setPhase('select');
    } else if (phase === 'story') {
      setPhase('reorder');
    }
  };

  if (!sessionId || veryImportantValues.length < 3) {
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
        <p className="text-sm text-gray-500 mb-1">Step 2 of 4</p>
        <h1 className="text-2xl font-bold text-brand-900">
          {phase === 'select' && 'Pick Your Top 3 Values'}
          {phase === 'reorder' && 'Your Top 3 Values'}
          {phase === 'story' && 'Tell Your Values Story'}
        </h1>
        <p className="text-gray-500 mt-1">
          {phase === 'select' && 'Select in order of importance'}
          {phase === 'reorder' && 'Drag or use arrows to reorder'}
          {phase === 'story' && 'Share a time you lived your values'}
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

                return (
                  <button
                    key={value.id}
                    onClick={() => handleSelect(value.id)}
                    className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? 'border-brand-500 bg-brand-50'
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
              Selected: {selectedIds.length} of 3
            </p>

            <button
              onClick={handleSelectionComplete}
              disabled={selectedIds.length !== 3}
              className="w-full py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue →
            </button>
          </motion.div>
        )}

        {/* Reorder Phase */}
        {phase === 'reorder' && (
          <motion.div
            key="reorder"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            <div className="space-y-3 mb-6">
              {selectedIds.map((id, index) => {
                const value = id.startsWith('custom_') && customValue?.id === id
                  ? { id, name: customValue.name, cardText: 'A value that matters deeply to you' }
                  : VALUES_BY_ID[id];

                return (
                  <div
                    key={id}
                    className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm"
                  >
                    <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-brand-900">{value?.name}</p>
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

            <div className="flex gap-3">
              <button
                onClick={handleBack}
                className="flex-1 py-3 border border-gray-200 text-gray-600 font-medium rounded-full hover:bg-gray-50 transition-all"
              >
                ← Back
              </button>
              <button
                onClick={handleReorderComplete}
                className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-full transition-all"
              >
                Looks good →
              </button>
            </div>
          </motion.div>
        )}

        {/* Story Phase */}
        {phase === 'story' && (
          <motion.div
            key="story"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {/* Prompt */}
            <div className="bg-brand-50 rounded-xl p-4 mb-6 border border-brand-100">
              <p className="text-brand-800 italic">
                &ldquo;Tell us a time when you were driven by one or more of your values to act in your life. Make it a powerful story!&rdquo;
              </p>
            </div>

            {/* Input Mode Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setInputMode('text')}
                className={`flex-1 py-2 px-4 rounded-full flex items-center justify-center gap-2 transition-all ${
                  inputMode === 'text'
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Keyboard size={18} />
                Type
              </button>
              <button
                onClick={() => setInputMode('voice')}
                className={`flex-1 py-2 px-4 rounded-full flex items-center justify-center gap-2 transition-all ${
                  inputMode === 'voice'
                    ? 'bg-brand-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Mic size={18} />
                Record
              </button>
            </div>

            {/* Text Input */}
            {inputMode === 'text' && (
              <textarea
                value={storyText}
                onChange={(e) => setStoryText(e.target.value)}
                placeholder="Start writing your story..."
                className="w-full h-48 p-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none"
              />
            )}

            {/* Voice Input */}
            {inputMode === 'voice' && (
              <div className="mb-4">
                <div className="bg-gray-50 rounded-xl p-4 min-h-[192px] mb-4">
                  {storyText ? (
                    <p className="text-gray-700">{storyText}</p>
                  ) : (
                    <p className="text-gray-400 italic">Your story will appear here...</p>
                  )}
                </div>
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-full py-4 rounded-full font-semibold flex items-center justify-center gap-2 transition-all ${
                    isRecording
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-brand-600 hover:bg-brand-700 text-white'
                  }`}
                >
                  <Mic size={20} className={isRecording ? 'animate-pulse' : ''} />
                  {isRecording ? 'Stop Recording' : 'Start Recording'}
                </button>
              </div>
            )}

            {/* Word Count */}
            <div className="flex justify-between text-sm mb-6">
              <span className={wordCount >= MIN_WORDS ? 'text-accent-600' : 'text-gray-500'}>
                {wordCount} / {MIN_WORDS} words minimum
                {wordCount >= MIN_WORDS && <Check size={14} className="inline ml-1" />}
              </span>
              {wordCount > MAX_WORDS && (
                <span className="text-amber-500">Max {MAX_WORDS} words</span>
              )}
            </div>

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
                disabled={!canContinue}
                className="flex-1 py-3 bg-brand-600 hover:bg-brand-700 text-white font-semibold rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Continue →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
