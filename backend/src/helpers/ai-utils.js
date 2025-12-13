import { getAIResponse } from '../services/aiService.js';

// Remove links, limit sentences, limit character length
export function sanitizeAndShorten(text) {
  if (!text) return "";

  let clean = text
    .replace(/https?:\/\/[^\s]+/g, "") 
    .replace(/\s+/g, " ")
    .trim();

  const sentences = clean.match(/[^.!?]+[.!?]?/g) || [clean];
  let short = sentences.slice(0, 2).join(" ").trim();

  if (short.length > 320) short = short.slice(0, 317) + "...";

  return short;
}

// Crisis response for harmful content
export function crisisResponse() {
  return {
    mood: 'crisis',
    moodScore: 1,
    aiResponse: "I'm really sorry you're feeling this way. Your safety matters. If you feel unsafe, please talk to someone you trust or contact emergency services immediately.",
    aiReport: "Crisis response triggered - user may need immediate assistance."
  };
}

// Analyze mood from text
function analyzeMoodFromText(text) {
  if (!text) return 'neutral';
  
  const lowerText = text.toLowerCase();
  
  if (/(sad|depressed|down|miserable|unhappy|upset|die|suicid|hurt myself)/.test(lowerText)) return 'sad';
  if (/(happy|joy|excited|great|amazing|wonderful)/.test(lowerText)) return 'happy';
  if (/(angry|mad|frustrated|annoyed|irritated)/.test(lowerText)) return 'angry';
  if (/(anxious|nervous|worried|stressed|overwhelmed)/.test(lowerText)) return 'anxious';
  
  return 'neutral';
}

// Generate AI response with proper formatting
export async function generateAIResponse(content, isHarmfulDetected = false) {
  try {
    if (isHarmfulDetected) {
      return crisisResponse();
    }

    // Get response from AI service
    const aiResponse = await getAIResponse(content);
    
    // Ensure we have a valid response
    if (!aiResponse) {
      return {
        mood: 'neutral',
        moodScore: 5,
        aiResponse: "Thank you for sharing. I'm here to listen.",
        aiReport: "AI service returned no response"
      };
    }

    // If we got a string response, try to parse it
    if (typeof aiResponse === 'string') {
      try {
        // Try to parse as JSON
        const parsed = JSON.parse(aiResponse);
        return {
          mood: (parsed.mood || analyzeMoodFromText(content)).toLowerCase(),
          moodScore: Math.max(1, Math.min(10, parseInt(parsed.moodScore) || 5)),
          aiResponse: parsed.aiResponse || parsed.message || "Thank you for sharing. I'm here to listen.",
          aiReport: parsed.aiReport || "Response parsed from string"
        };
      } catch (e) {
        // If not JSON, use as plain text response
        return {
          mood: analyzeMoodFromText(aiResponse),
          moodScore: 5,
          aiResponse: aiResponse,
          aiReport: "AI returned plain text response"
        };
      }
    }

    // If we got an object response, ensure it has all required fields
    return {
      mood: (aiResponse.mood || analyzeMoodFromText(content)).toLowerCase(),
      moodScore: Math.max(1, Math.min(10, parseInt(aiResponse.moodScore) || 5)),
      aiResponse: aiResponse.aiResponse || aiResponse.message || "Thank you for sharing. I'm here to listen.",
      aiReport: aiResponse.aiReport || "AI analysis complete"
    };

  } catch (error) {
    console.error('Error generating AI response:', error);
    return {
      mood: 'neutral',
      moodScore: 5,
      aiResponse: "I'm having trouble processing that right now. Please try again.",
      aiReport: `Error: ${error.message}`
    };
  }
}
