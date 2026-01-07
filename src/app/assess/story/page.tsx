'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Mic, Keyboard, Check } from 'lucide-react';
import { useAssessmentStore } from '@/stores/assessmentStore';
import { VALUES_BY_ID } from '@/lib/data/values';
import { useHydration } from '@/hooks/useHydration';

const MIN_WORDS = 30;
const MAX_WORDS = 500;

export default function StoryPage() {
  const router = useRouter();
  const isHydrated = useHydration();
  const {
    sessionId,
    rankedValues,
    customValue,
    transcript,
    setTranscript,
  } = useAssessmentStore();

  const [inputMode, setInputMode] = useState<'voice' | 'text'>('text');
  const [isRecording, setIsRecording] = useState(false);
  const [storyText, setStoryText] = useState(transcript || '');

  // Hydration guard
  if (!isHydrated) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    );
  }

  // Get top 3 values from ranked values
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
      router.replace('/assess/select');
      return;
    }
  }, [sessionId, rankedValues.length, router]);

  // Word count
  const wordCount = useMemo(() => {
    return storyText.trim().split(/\s+/).filter(Boolean).length;
  }, [storyText]);

  const canContinue = wordCount >= MIN_WORDS;

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

  // Go back
  const handleBack = () => {
    router.push('/assess/select');
  };

  if (!sessionId || top3Values.length < 3) {
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
        <p className="text-sm text-gray-500 mb-1">Step 3 of 5</p>
        <h1 className="text-2xl font-bold text-brand-900">Tell Your Values Story</h1>
        <p className="text-gray-500 mt-1">Share a time you lived your values</p>
      </div>

      {/* Top 3 Values Display */}
      <div className="space-y-3 mb-6">
        {top3Values.map((value, index) => (
          <div key={value.id} className="flex items-start gap-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
              index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-gray-400' : 'bg-amber-700'
            }`}>
              {index + 1}
            </div>
            <div>
              <p className="font-semibold text-brand-900">{value.name}</p>
              <p className="text-sm text-gray-600">{value.cardText}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Enhanced Personalized Prompt */}
      <div className="bg-gradient-to-br from-brand-50 to-prism-subtle rounded-xl p-5 mb-6 border border-brand-100">
        <p className="text-brand-800 font-medium text-lg leading-relaxed">
          You stand for <strong className="text-brand-900">{top3Values[0]?.name}</strong>,<br/>
          You are driven by <strong className="text-brand-900">{top3Values[1]?.name}</strong>,<br/>
          and you believe in <strong className="text-brand-900">{top3Values[2]?.name}</strong>.
        </p>
        <p className="text-brand-700 mt-4 italic">
          Tell a powerful story about a time when you were driven to stand up for these values.
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

      {/* Question Prompts */}
      <p className="text-sm text-gray-500 mb-3">
        <span className="font-medium">Consider:</span> What happened? What did it make you think? How did you feel? What motivated you?
      </p>

      {/* Text Input */}
      {inputMode === 'text' && (
        <textarea
          value={storyText}
          onChange={(e) => setStoryText(e.target.value)}
          placeholder={`Start your story here...

What was the situation? What did you do?
What were you thinking? How did you feel?
What motivated you to act on your values?`}
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
  );
}
