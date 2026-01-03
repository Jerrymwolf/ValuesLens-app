'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff, RotateCcw, Keyboard } from 'lucide-react';
import { useWebSpeechRecognition } from '@/hooks/useWebSpeechRecognition';

interface VoiceRecorderProps {
  onTranscriptChange: (text: string) => void;
  minWords?: number;
  placeholder?: string;
}

export default function VoiceRecorder({
  onTranscriptChange,
  minWords = 10,
  placeholder = 'Type what this value means to you...',
}: VoiceRecorderProps) {
  const [showTextarea, setShowTextarea] = useState(false);
  const [manualText, setManualText] = useState('');
  const {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  } = useWebSpeechRecognition();

  const currentText = showTextarea ? manualText : transcript;
  const wordCount = currentText.trim().split(/\s+/).filter(Boolean).length;
  const meetsMinimum = wordCount >= minWords;

  // Sync to parent
  const syncTranscript = useCallback(() => {
    onTranscriptChange(currentText);
  }, [currentText, onTranscriptChange]);

  useEffect(() => {
    syncTranscript();
  }, [syncTranscript]);

  // Auto-switch to textarea if speech not supported
  useEffect(() => {
    if (!isSupported && !showTextarea) {
      setShowTextarea(true);
    }
  }, [isSupported, showTextarea]);

  const handleReset = () => {
    if (showTextarea) {
      setManualText('');
    } else {
      resetTranscript();
    }
  };

  const handleToggleMode = () => {
    if (!showTextarea && transcript) {
      // Transfer transcript to manual text when switching to textarea
      setManualText(transcript);
    }
    setShowTextarea(!showTextarea);
  };

  return (
    <div className="w-full">
      {!showTextarea ? (
        <>
          {/* Mic Button */}
          <div className="flex justify-center mb-6">
            <motion.button
              onClick={isListening ? stopListening : startListening}
              className={`w-20 h-20 rounded-full flex items-center justify-center shadow-lg ${
                isListening
                  ? 'bg-red-500 hover:bg-red-600'
                  : 'bg-indigo-600 hover:bg-indigo-700'
              } text-white transition-colors`}
              animate={
                isListening
                  ? { scale: [1, 1.05, 1], boxShadow: ['0 0 0 0 rgba(239, 68, 68, 0.4)', '0 0 0 20px rgba(239, 68, 68, 0)', '0 0 0 0 rgba(239, 68, 68, 0)'] }
                  : {}
              }
              transition={{ repeat: isListening ? Infinity : 0, duration: 1.5 }}
              aria-label={isListening ? 'Stop recording' : 'Start recording'}
            >
              {isListening ? <MicOff size={32} /> : <Mic size={32} />}
            </motion.button>
          </div>

          {/* Status text */}
          <p className="text-center text-sm text-gray-500 mb-4">
            {isListening ? 'Listening... Tap to stop' : 'Tap microphone to start speaking'}
          </p>

          {/* Error display */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error === 'not-allowed'
                ? 'Microphone access denied. Please enable in browser settings.'
                : `Error: ${error}`}
            </div>
          )}

          {/* Live Transcript */}
          <div className="p-4 bg-gray-50 rounded-xl min-h-[120px] border border-gray-200">
            {transcript || interimTranscript ? (
              <>
                <p className="text-gray-700 whitespace-pre-wrap">{transcript}</p>
                {interimTranscript && (
                  <p className="text-gray-400 italic">{interimTranscript}</p>
                )}
              </>
            ) : (
              <p className="text-gray-400 italic">
                Your words will appear here as you speak...
              </p>
            )}
          </div>

          {/* Controls */}
          <div className="flex justify-between mt-4">
            <button
              onClick={handleReset}
              disabled={!transcript && !interimTranscript}
              className="text-gray-500 hover:text-gray-700 flex items-center gap-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw size={16} /> Start over
            </button>
            <button
              onClick={handleToggleMode}
              className="text-gray-500 hover:text-gray-700 flex items-center gap-1.5 text-sm"
            >
              <Keyboard size={16} /> Type instead
            </button>
          </div>
        </>
      ) : (
        /* Textarea Fallback */
        <>
          <textarea
            value={manualText}
            onChange={(e) => setManualText(e.target.value)}
            placeholder={placeholder}
            className="w-full h-40 p-4 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          {/* Controls */}
          <div className="flex justify-between mt-4">
            <button
              onClick={handleReset}
              disabled={!manualText}
              className="text-gray-500 hover:text-gray-700 flex items-center gap-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RotateCcw size={16} /> Clear
            </button>
            {isSupported && (
              <button
                onClick={handleToggleMode}
                className="text-gray-500 hover:text-gray-700 flex items-center gap-1.5 text-sm"
              >
                <Mic size={16} /> Use voice
              </button>
            )}
          </div>
        </>
      )}

      {/* Word count */}
      <p
        className={`text-sm mt-4 text-center ${
          meetsMinimum ? 'text-green-600' : 'text-gray-400'
        }`}
      >
        {wordCount} word{wordCount !== 1 ? 's' : ''}{' '}
        {!meetsMinimum && `(minimum ${minWords})`}
        {meetsMinimum && <span className="ml-1">✓</span>}
      </p>
    </div>
  );
}
