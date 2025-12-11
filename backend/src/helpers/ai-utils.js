// helpers/ai-utils.js  (PURE ESM)

// Remove links, limit sentences, limit character length
export function sanitizeAndShorten(text) {
  if (!text) return "";

  let clean = text
    .replace(/https?:\/\/\S+/g, "") 
    .replace(/\s+/g, " ")
    .trim();

  const sentences = clean.match(/[^.!?]+[.!?]?/g) || [clean];
  let short = sentences.slice(0, 2).join(" ").trim();

  if (short.length > 320) short = short.slice(0, 317) + "...";

  return short;
}

// Crisis response for harmful content
export function crisisResponse() {
  return (
    "I’m really sorry you're feeling this way. Your safety matters. " +
    "If you feel unsafe, please talk to someone you trust or contact emergency services immediately."
  );
}

// Soft supportive AI fallback
export function supportiveResponse() {
  return (
    "Thank you for sharing that. I'm here with you, and we can work through this together."
  );
}

// Final AI response generator
export function generateAIResponse(isHarmfulDetected, llmOutput = "") {
  if (isHarmfulDetected) return crisisResponse();

  const base = llmOutput?.trim() ? llmOutput : supportiveResponse();
  return sanitizeAndShorten(base);
}
