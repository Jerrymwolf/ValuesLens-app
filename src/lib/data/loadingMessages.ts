export const LOADING_MESSAGES = [
  'Analyzing your words...',
  'Finding the essence...',
  'Crafting your definition...',
  'Distilling your authentic voice...',
];

export const INSPIRATIONAL_QUOTES = [
  '"Values are like fingerprints. Nobody\'s are the same, but you leave them all over everything you do." — Elvis Presley',
  '"It\'s not hard to make decisions when you know what your values are." — Roy Disney',
  '"When your values are clear to you, making decisions becomes easier." — Roy Disney',
  '"The quality of a person\'s life is in direct proportion to their commitment to excellence." — Vince Lombardi',
];

export const getRandomLoadingMessage = (): string => {
  return LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)];
};

export const getRandomQuote = (): string => {
  return INSPIRATIONAL_QUOTES[Math.floor(Math.random() * INSPIRATIONAL_QUOTES.length)];
};

export const HELPER_PROMPTS = (valueName: string): string[] => [
  `When have you seen ${valueName} tested?`,
  `What would violating ${valueName} feel like?`,
  `How does ${valueName} show up in your daily life?`,
  `Why is ${valueName} more important than other values?`,
];
