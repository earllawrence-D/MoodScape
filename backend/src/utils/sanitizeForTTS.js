// backend/src/utils/sanitizeForTTS.js
export const sanitizeForTTS = (text = "") => {
if (!text || typeof text !== 'string') return '';


// Characters to remove from spoken output (user requested):
// = # % ^ $ * (single) and similar isolated symbols. Keep punctuation like . , ? !
// We'll replace them with a space so words don't run together.
return text
// remove invisibles/zero-width
.replace(/\u200B|\u200C|\u200D/g, '')
// remove the listed characters when isolated or adjacent to whitespace
.replace(/[=#%\^\$\*]/g, '')
// also remove stray repeated punctuation sequences (but keep single . , ? !)
.replace(/\.{2,}/g, '.')
.replace(/!{2,}/g, '!')
.replace(/\?{2,}/g, '?')
// collapse multiple spaces
.replace(/\s+/g, ' ')
.trim();
};
// cleanText.js
export const cleanText = (text = "") => {
  return text
    // Remove emojis
    .replace(
      /([\u2700-\u27BF]|[\uE000-\uF8FF]|[\u2190-\u21FF]|([\uD83C\uD000-\uDFFF])|([\uD83D\uD000-\uDFFF])|([\uD83E\uD000-\uDFFF]))/g,
      ""
    )
    // Remove markdown symbols **bold**, *italic*, __underline__
    .replace(/(\*{1,3}|_{1,3}|`|~{2})/g, "")
    // Remove hashtags, @mentions
    .replace(/[@#][A-Za-z0-9-_]+/g, "")
    // Remove URLs
    .replace(/https?:\/\/[^\s]+/g, "")
    // Remove symbols like ## -- ** //
    .replace(/(\*{2,}|#{2,}|-{2,}|\/{2,})/g, "")
    // Replace multiple spaces with single space
    .replace(/\s\s+/g, " ")
    // Clean repeated punctuation like "!!!" or "??"
    .replace(/([!?.,])\1+/g, "$1")
    // Final trim
    .trim();
};
