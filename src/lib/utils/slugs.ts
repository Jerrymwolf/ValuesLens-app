import { customAlphabet } from 'nanoid';

// Custom alphabet without confusable characters (0/O, 1/l/I)
// 32 characters = ~2.8 trillion combinations with 8 chars
const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789';

export const generateSlug = customAlphabet(alphabet, 8);

// Example output: "k7m3xp2w"
// URL: valuesprofile.app/p/k7m3xp2w
