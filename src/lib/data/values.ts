import type { Value } from '@/lib/types';

export const ALL_VALUES: Value[] = [
  { id: 'accountability', name: 'Accountability', cardText: 'Owning what you do and expecting the same of others' },
  { id: 'achievement', name: 'Achievement', cardText: 'Setting worthy goals and reaching them' },
  { id: 'authenticity', name: 'Authenticity', cardText: 'Being exactly who you are, without apology' },
  { id: 'balance', name: 'Balance', cardText: 'Finding time and energy for all the things that matter' },
  { id: 'care', name: 'Care', cardText: 'Looking after people, especially when they need it most' },
  { id: 'challenge', name: 'Challenge', cardText: 'Taking on hard things that make you stronger' },
  { id: 'collaboration', name: 'Collaboration', cardText: 'Accomplishing more together than you could alone' },
  { id: 'community', name: 'Community', cardText: 'Belonging to something bigger than yourself' },
  { id: 'compassion', name: 'Compassion', cardText: 'Seeing someone hurting and doing something about it' },
  { id: 'courage', name: 'Courage', cardText: 'Acting on conviction despite fear, risk, or personal cost' },
  { id: 'creativity', name: 'Creativity', cardText: 'Bringing something new into the world' },
  { id: 'curiosity', name: 'Curiosity', cardText: 'Exploring, questioning, and seeking to understand' },
  { id: 'development', name: 'Development', cardText: 'Growing your abilities and helping others grow theirs' },
  { id: 'dignity', name: 'Dignity', cardText: 'Treating every person as worthy of respect' },
  { id: 'discipline', name: 'Discipline', cardText: "Doing what needs to be done, even when you don't feel like it" },
  { id: 'duty', name: 'Duty', cardText: "Honoring the responsibilities you've accepted" },
  { id: 'empathy', name: 'Empathy', cardText: 'Feeling what others feel and seeing through their eyes' },
  { id: 'empowerment', name: 'Empowerment', cardText: 'Giving people what they need to succeed' },
  { id: 'excellence', name: 'Excellence', cardText: 'Refusing to settle for good enough' },
  { id: 'fairness', name: 'Fairness', cardText: 'Treating people justly and without favoritism' },
  { id: 'faith', name: 'Faith', cardText: 'Trusting in something greater than yourself' },
  { id: 'family', name: 'Family', cardText: 'Putting your people first' },
  { id: 'forgiveness', name: 'Forgiveness', cardText: 'Letting go of resentment and offering second chances' },
  { id: 'generosity', name: 'Generosity', cardText: 'Giving freely without keeping score' },
  { id: 'gratitude', name: 'Gratitude', cardText: 'Appreciating what you have and who made it possible' },
  { id: 'growth', name: 'Growth', cardText: 'Becoming more than you were' },
  { id: 'honesty', name: 'Honesty', cardText: "Telling the truth, even when it's hard" },
  { id: 'honor', name: 'Honor', cardText: "Living by a code you'd be proud to defend" },
  { id: 'humility', name: 'Humility', cardText: "Knowing you don't have all the answers" },
  { id: 'inclusion', name: 'Inclusion', cardText: 'Making room for everyone at the table' },
  { id: 'independence', name: 'Independence', cardText: 'Standing on your own two feet' },
  { id: 'integrity', name: 'Integrity', cardText: "Doing what's right, even when no one is watching" },
  { id: 'joy', name: 'Joy', cardText: "Taking real pleasure in life's moments" },
  { id: 'justice', name: 'Justice', cardText: "Righting wrongs and standing up for what's fair" },
  { id: 'kindness', name: 'Kindness', cardText: 'Being good to people just because' },
  { id: 'leadership', name: 'Leadership', cardText: 'Showing the way and bringing others with you' },
  { id: 'learning', name: 'Learning', cardText: 'Never being done learning' },
  { id: 'loyalty', name: 'Loyalty', cardText: 'Standing by your people through thick and thin' },
  { id: 'purpose', name: 'Purpose', cardText: "Knowing why you're here and what you're for" },
  { id: 'resilience', name: 'Resilience', cardText: 'Getting knocked down and getting back up' },
  { id: 'resourcefulness', name: 'Resourcefulness', cardText: "Finding a way when there isn't one" },
  { id: 'respect', name: 'Respect', cardText: 'Treating every person as someone who matters' },
  { id: 'responsibility', name: 'Responsibility', cardText: 'Doing what you said you would do' },
  { id: 'safety', name: 'Safety', cardText: 'Protecting people from harm' },
  { id: 'service', name: 'Service', cardText: "Putting others' needs before your own" },
  { id: 'standards', name: 'Standards', cardText: 'Expecting the best from yourself and others' },
  { id: 'steadfastness', name: 'Steadfastness', cardText: 'Staying the course when things get hard' },
  { id: 'tradition', name: 'Tradition', cardText: "Honoring what's been passed down and passing it on" },
  { id: 'transparency', name: 'Transparency', cardText: "Being open about what you're doing and why" },
  { id: 'trust', name: 'Trust', cardText: 'Counting on others and being someone they can count on' },
  { id: 'well-being', name: 'Well-being', cardText: 'Taking care of your body, mind, and spirit' },
  { id: 'wisdom', name: 'Wisdom', cardText: 'Knowing what to do when it matters' },
];

// Validate count
if (ALL_VALUES.length !== 52) {
  throw new Error(`Expected 52 values, got ${ALL_VALUES.length}`);
}

// Map for O(1) lookup by ID
export const VALUES_BY_ID: Record<string, Value> = ALL_VALUES.reduce(
  (acc, value) => ({ ...acc, [value.id]: value }),
  {} as Record<string, Value>
);

// Map for O(1) lookup by name
export const VALUES_BY_NAME: Record<string, Value> = ALL_VALUES.reduce(
  (acc, value) => ({ ...acc, [value.name]: value }),
  {} as Record<string, Value>
);

// Get value by ID helper
export const getValueById = (id: string): Value | undefined => VALUES_BY_ID[id];

// Get value by name helper
export const getValueByName = (name: string): Value | undefined => VALUES_BY_NAME[name];
