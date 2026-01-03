// === VALUES ===
export interface Value {
  id: string;
  name: string;
  cardText: string;
}

// === SORTING ===
export type SortCategory = 'very' | 'somewhat' | 'less';

export interface ValueSort {
  valueId: string;
  category: SortCategory;
  sortedAt: number;
}

// === DEFINITIONS ===
export interface RefinedDefinition {
  tagline: string;
  definition: string;
}

export interface ProfileValue {
  rank: 1 | 2 | 3 | 4 | 5;
  valueId: string;
  valueName: string;
  tagline: string;
  definition?: string;
  userEdited: boolean;
}

// === API ===
export interface RefineDefinitionRequest {
  valueName: string;
  transcript: string;
  rankedValues: string[];
}

export interface RefineDefinitionResponse {
  success: boolean;
  definitions: {
    value1: { name: string; tagline: string; definition: string };
    value2: { name: string; tagline: string };
    value3: { name: string; tagline: string };
  };
  usedFallback: boolean;
}

export interface CreateProfileRequest {
  sessionId: string;
  values: ProfileValue[];
}

export interface CreateProfileResponse {
  success: boolean;
  slug: string;
  profileUrl: string;
}
