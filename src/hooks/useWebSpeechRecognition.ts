'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

interface SpeechState {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  error: string | null;
  isSupported: boolean;
}

export function useWebSpeechRecognition() {
  const [state, setState] = useState<SpeechState>({
    isListening: false,
    transcript: '',
    interimTranscript: '',
    error: null,
    isSupported: false,
  });

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptRef = useRef('');

  useEffect(() => {
    // Check for browser support
    const SpeechRecognitionAPI =
      typeof window !== 'undefined'
        ? window.SpeechRecognition || window.webkitSpeechRecognition
        : null;

    if (!SpeechRecognitionAPI) {
      setState((s) => ({ ...s, isSupported: false }));
      return;
    }

    setState((s) => ({ ...s, isSupported: true }));

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript + ' ';
        } else {
          interim += result[0].transcript;
        }
      }

      if (final) {
        transcriptRef.current += final;
      }

      setState((s) => ({
        ...s,
        transcript: transcriptRef.current,
        interimTranscript: interim,
      }));
    };

    recognition.onerror = (event) => {
      // Don't treat 'no-speech' as a fatal error
      if (event.error === 'no-speech') {
        return;
      }
      setState((s) => ({
        ...s,
        error: event.error,
        isListening: false,
      }));
    };

    recognition.onend = () => {
      setState((s) => {
        // Only set isListening to false if we're not in an error state
        // and the user didn't explicitly stop
        if (s.isListening && !s.error) {
          // Auto-restart for continuous listening
          try {
            recognition.start();
            return s;
          } catch {
            return { ...s, isListening: false };
          }
        }
        return { ...s, isListening: false };
      });
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;

    try {
      recognitionRef.current.start();
      setState((s) => ({
        ...s,
        isListening: true,
        error: null,
      }));
    } catch (err) {
      // Recognition might already be running
      console.warn('Speech recognition start error:', err);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (!recognitionRef.current) return;

    try {
      recognitionRef.current.stop();
      setState((s) => ({
        ...s,
        isListening: false,
        interimTranscript: '',
      }));
    } catch (err) {
      console.warn('Speech recognition stop error:', err);
    }
  }, []);

  const resetTranscript = useCallback(() => {
    transcriptRef.current = '';
    setState((s) => ({
      ...s,
      transcript: '',
      interimTranscript: '',
      error: null,
    }));
  }, []);

  return {
    ...state,
    startListening,
    stopListening,
    resetTranscript,
  };
}
