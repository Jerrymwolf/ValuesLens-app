'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { SortCategory } from '@/lib/types';

interface Demographics {
  ageRange?: '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+';
  industry?: string;
  leadershipRole?: boolean;
  country?: string;
}

interface ValueDefinition {
  tagline: string;
  commitment: string;
  definition: string;
  behavioralAnchors: string[];
  weeklyQuestion: string;
  userEdited: boolean;
}

interface CustomValue {
  id: string;
  name: string;
}

interface VOOPData {
  outcome: string;
  obstacle: string;
  plan: string; // The "then I will..." part
}

interface AssessmentState {
  // Session
  sessionId: string | null;
  startedAt: number | null;
  consentResearch: boolean;
  demographics: Demographics | null;

  // Sort phase
  shuffledValueIds: string[];
  currentCardIndex: number;
  sortedValues: {
    very: string[];
    somewhat: string[];
    less: string[];
  };
  customValue: CustomValue | null;

  // Selection phase
  top5: string[];

  // Ranking phase
  rankedValues: string[];

  // Definition phase
  transcript: string;

  // Goals phase (2026 commitments)
  goals: Record<string, string>;

  // VOOP data per value
  voop: Record<string, VOOPData>;

  // AI results
  definitions: Record<string, ValueDefinition>;

  // Sharing
  shareSlug: string | null;
}

interface AssessmentActions {
  // Session
  initSession: (sessionId: string, shuffledValueIds: string[]) => void;
  setConsent: (consent: boolean, demographics?: Demographics) => void;

  // Sorting
  sortValue: (valueId: string, category: SortCategory) => void;
  undoLastSort: () => void;
  addCustomValue: (name: string) => void;

  // Selection
  setTop5: (valueIds: string[]) => void;
  toggleTop5: (valueId: string) => void;

  // Ranking
  setRankedValues: (valueIds: string[]) => void;
  moveRank: (fromIndex: number, toIndex: number) => void;

  // Definition
  setTranscript: (text: string) => void;
  setDefinitions: (defs: Record<string, ValueDefinition>) => void;
  updateDefinition: (valueId: string, updates: Partial<Omit<ValueDefinition, 'userEdited'>>) => void;

  // Goals
  setGoal: (valueId: string, text: string) => void;
  setGoals: (goals: Record<string, string>) => void;

  // VOOP
  setVoop: (valueId: string, voop: VOOPData) => void;

  // Sharing
  setShareSlug: (slug: string) => void;

  // Reset
  reset: () => void;
}

type AssessmentStore = AssessmentState & AssessmentActions;

const initialState: AssessmentState = {
  sessionId: null,
  startedAt: null,
  consentResearch: false,
  demographics: null,
  shuffledValueIds: [],
  currentCardIndex: 0,
  sortedValues: {
    very: [],
    somewhat: [],
    less: [],
  },
  customValue: null,
  top5: [],
  rankedValues: [],
  transcript: '',
  goals: {},
  voop: {},
  definitions: {},
  shareSlug: null,
};

export const useAssessmentStore = create<AssessmentStore>()(
  persist(
    (set) => ({
      ...initialState,

      // Session
      initSession: (sessionId, shuffledValueIds) =>
        set({
          ...initialState,
          sessionId,
          shuffledValueIds,
          startedAt: Date.now(),
        }),

      setConsent: (consent, demographics) =>
        set({
          consentResearch: consent,
          demographics: demographics || null,
        }),

      // Sorting
      sortValue: (valueId, category) =>
        set((state) => ({
          sortedValues: {
            ...state.sortedValues,
            [category]: [...state.sortedValues[category], valueId],
          },
          currentCardIndex: state.currentCardIndex + 1,
        })),

      undoLastSort: () =>
        set((state) => {
          if (state.currentCardIndex === 0) return state;

          const lastValueId = state.shuffledValueIds[state.currentCardIndex - 1];
          const newSorted = { ...state.sortedValues };

          for (const cat of ['very', 'somewhat', 'less'] as SortCategory[]) {
            newSorted[cat] = newSorted[cat].filter((id) => id !== lastValueId);
          }

          return {
            sortedValues: newSorted,
            currentCardIndex: state.currentCardIndex - 1,
          };
        }),

      addCustomValue: (name) =>
        set((state) => {
          const customId = `custom_${Date.now()}`;
          return {
            customValue: { id: customId, name },
            sortedValues: {
              ...state.sortedValues,
              very: [...state.sortedValues.very, customId],
            },
          };
        }),

      // Selection
      setTop5: (valueIds) => set({ top5: valueIds }),

      toggleTop5: (valueId) =>
        set((state) => {
          const isSelected = state.top5.includes(valueId);
          if (isSelected) {
            return { top5: state.top5.filter((id) => id !== valueId) };
          }
          if (state.top5.length >= 5) {
            return state;
          }
          return { top5: [...state.top5, valueId] };
        }),

      // Ranking
      setRankedValues: (valueIds) => set({ rankedValues: valueIds }),

      moveRank: (fromIndex, toIndex) =>
        set((state) => {
          const newRanked = [...state.rankedValues];
          const [moved] = newRanked.splice(fromIndex, 1);
          newRanked.splice(toIndex, 0, moved);
          return { rankedValues: newRanked };
        }),

      // Definition
      setTranscript: (text) => set({ transcript: text }),

      setDefinitions: (defs) => set({ definitions: defs }),

      updateDefinition: (valueId, updates: Partial<Omit<ValueDefinition, 'userEdited'>>) =>
        set((state) => ({
          definitions: {
            ...state.definitions,
            [valueId]: {
              ...state.definitions[valueId],
              ...updates,
              userEdited: true,
            },
          },
        })),

      // Goals
      setGoal: (valueId, text) =>
        set((state) => ({
          goals: {
            ...state.goals,
            [valueId]: text,
          },
        })),

      setGoals: (goals) => set({ goals }),

      // VOOP
      setVoop: (valueId, voopData) =>
        set((state) => ({
          voop: {
            ...state.voop,
            [valueId]: voopData,
          },
          // Also set the goal as the full if-then statement
          goals: {
            ...state.goals,
            [valueId]: `If ${voopData.obstacle.toLowerCase()}, then I will ${voopData.plan}`,
          },
        })),

      // Sharing
      setShareSlug: (slug) => set({ shareSlug: slug }),

      // Reset
      reset: () => set(initialState),
    }),
    {
      name: 'valuesprofile-assessment',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Migration: rename woop → voop for existing users
if (typeof window !== 'undefined') {
  const stored = localStorage.getItem('valuesprofile-assessment');
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      if (parsed.state?.woop && !parsed.state?.voop) {
        parsed.state.voop = parsed.state.woop;
        delete parsed.state.woop;
        localStorage.setItem('valuesprofile-assessment', JSON.stringify(parsed));
      }
    } catch {
      // Ignore parse errors
    }
  }
}

// Selectors
export const selectProgress = (state: AssessmentStore) => ({
  current: state.currentCardIndex,
  total: state.shuffledValueIds.length,
  percentage:
    state.shuffledValueIds.length > 0
      ? Math.round((state.currentCardIndex / state.shuffledValueIds.length) * 100)
      : 0,
});

export const selectCurrentValue = (state: AssessmentStore) =>
  state.shuffledValueIds[state.currentCardIndex] || null;

export const selectVeryImportantValues = (state: AssessmentStore) => state.sortedValues.very;

export const selectIsSortingComplete = (state: AssessmentStore) =>
  state.currentCardIndex >= state.shuffledValueIds.length && state.shuffledValueIds.length > 0;
