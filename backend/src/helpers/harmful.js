// helpers/harmful.js

// Add or refine phrases as needed — always lowercase
export const harmfulList = [
  "kill myself",
  "suicide",
  "end it",
  "i want to die",
  "i want to hurt myself",
  "i'm done living",
  "i want to disappear",
  "self harm",
  "hurt myself",
  "cut myself",
  "i wish i was dead"
];

// Returns array of harmful phrases found
export function findHarmfulWords(text) {
  if (!text) return [];

  const t = text.toLowerCase();
  const found = [];

  for (const phrase of harmfulList) {
    if (t.includes(phrase)) {
      found.push(phrase);
    }
  }

  return found;
}
