// backend/src/utils/sentenceParser.js

/**
 * Split text into sentences for TTS streaming
 * @param {string} text - The text to split
 * @returns {Array} Array of sentences
 */
export const splitIntoSentences = (text) => {
  if (!text || typeof text !== 'string') return [];
  
  // Regex to split on sentence boundaries while preserving punctuation
  const sentenceRegex = /[^.!?。！？]*[.!?。！？]+(?:\s+|$)/g;
  const matches = text.match(sentenceRegex);
  
  if (!matches) {
    // If no punctuation found, split by newlines or return as single sentence
    return text.trim() ? [text.trim()] : [];
  }
  
  // Clean up sentences
  return matches
    .map(sentence => sentence.trim())
    .filter(sentence => sentence.length > 0);
};

/**
 * Process streaming chunks and extract sentences
 * @param {string} chunk - New chunk of text
 * @param {string} buffer - Current buffer
 * @returns {Object} { sentences: Array, remainingBuffer: string }
 */
export const processStreamChunk = (chunk, buffer = '') => {
  const newBuffer = buffer + chunk;
  const sentences = [];
  let remainingBuffer = newBuffer;
  
  // Find complete sentences
  const sentenceRegex = /([^.!?。！？]*[.!?。！？]+)(?:\s+|$)/g;
  let match;
  let lastIndex = 0;
  
  while ((match = sentenceRegex.exec(newBuffer)) !== null) {
    const sentence = match[0].trim();
    if (sentence) {
      sentences.push(sentence);
      lastIndex = match.index + match[0].length;
    }
  }
  
  // Update remaining buffer
  remainingBuffer = newBuffer.substring(lastIndex);
  
  return { sentences, remainingBuffer };
};

/**
 * Ensure text has proper punctuation for TTS
 * @param {string} text - Text to normalize
 * @returns {string} Normalized text
 */
export const normalizeForTTS = (text) => {
  if (!text) return '';
  
  let normalized = text.trim();
  
  // Add period if missing at the end
  if (!/[.!?。！？]$/.test(normalized)) {
    normalized += '.';
  }
  
  // Replace multiple spaces with single space
  normalized = normalized.replace(/\s+/g, ' ');
  
  // Ensure space after punctuation if missing
  normalized = normalized.replace(/([.!?。！？])(?!\s|$)/g, '$1 ');
  
  return normalized;
};