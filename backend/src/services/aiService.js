import Groq from "groq-sdk";

console.log(
  "GROQ_API_KEY loaded:",
  process.env.GROQ_API_KEY ? "YES" : "NO",
  process.env.GROQ_API_KEY?.length
);

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MOOD_LABELS = [
  'very happy', 'happy', 'slightly happy', 'neutral', 
  'slightly sad', 'sad', 'very sad', 'anxious', 
  'stressed', 'angry', 'frustrated', 'excited',
  'grateful', 'hopeful', 'proud', 'content'
];

// Helper function to analyze mood from text
const analyzeMoodFromText = (text) => {
  if (!text) return 'neutral';
  
  const lowerText = text.toLowerCase();
  
  if (/(sad|depressed|down|miserable|unhappy|upset)/.test(lowerText)) return 'sad';
  if (/(happy|joy|excited|great|amazing|wonderful)/.test(lowerText)) return 'happy';
  if (/(angry|mad|frustrated|annoyed|irritated)/.test(lowerText)) return 'angry';
  if (/(anxious|nervous|worried|stressed|overwhelmed)/.test(lowerText)) return 'anxious';
  
  return 'neutral';
};

// Helper function to analyze mood score from text (1-10)
const analyzeMoodScoreFromText = (text) => {
  if (!text) return 5;
  
  const lowerText = text.toLowerCase();
  let score = 5; // neutral
  
  // Positive indicators
  if (/(happy|joy|excited|great|amazing|wonderful|good|pleased)/.test(lowerText)) score += 3;
  if (/(sad|depressed|down|miserable|unhappy|upset)/.test(lowerText)) score -= 3;
  if (/(angry|mad|frustrated|annoyed|irritated)/.test(lowerText)) score -= 2;
  if (/(anxious|nervous|worried|stressed|overwhelmed)/.test(lowerText)) score -= 1;
  
  // Emergency/crisis indicators
  if (/(suicid|kill myself|end it all|want to die|no reason to live)/.test(lowerText)) score = 1;
  
  // Ensure score is between 1 and 10
  return Math.max(1, Math.min(10, score));
};

const generateMoodAnalysis = (content) => {
  const positiveWords = ['happy', 'good', 'great', 'excited', 'joy', 'love', 'amazing', 'wonderful', 'fantastic'];
  const negativeWords = ['sad', 'bad', 'terrible', 'awful', 'hate', 'angry', 'frustrated', 'anxious', 'stressed'];
  
  const words = content.toLowerCase().split(/\s+/);
  let score = 5; // neutral
  
  // Count positive and negative words
  const positiveCount = words.filter(word => positiveWords.includes(word)).length;
  const negativeCount = words.filter(word => negativeWords.includes(word)).length;
  
  // Adjust score based on word counts
  score += (positiveCount * 0.5);
  score -= (negativeCount * 0.5);
  
  // Clamp score between 1 and 10
  score = Math.max(1, Math.min(10, Math.round(score)));
  
  // Determine mood label based on score
  let moodLabel = 'neutral';
  if (score >= 8) moodLabel = 'very happy';
  else if (score >= 6) moodLabel = 'happy';
  else if (score >= 4) moodLabel = 'neutral';
  else if (score >= 2) moodLabel = 'sad';
  else moodLabel = 'very sad';
  
  // Generate a simple response based on mood
  let response = "Thanks for sharing your thoughts. ";
  if (score >= 8) response += "I'm glad to hear you're feeling great! ";
  else if (score >= 6) response += "It sounds like you're in a good mood! ";
  else if (score >= 4) response += "Thanks for sharing your thoughts. ";
  else if (score >= 2) response += "I'm sorry to hear you're feeling down. ";
  else response += "I'm really sorry you're feeling this way. ";
  
  response += "Would you like to talk more about what's on your mind?";
  
  return {
    mood: moodLabel,
    moodScore: score,
    aiResponse: response,
    aiReport: `Automated analysis detected mood as ${moodLabel} (${score}/10). ${response}`
  };
};

export const getAIResponse = async (content) => {
  // First try to get a response from the AI
  try {
    const response = await client.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content: `You are a supportive and empathetic AI assistant. Analyze the user's journal entry and respond with a JSON object containing:
{
  "mood": "string",       // One of: ${MOOD_LABELS.join(', ')}
  "moodScore": 1-10,      // 1=very negative, 10=very positive
  "aiResponse": "string"  // A supportive and helpful response (1-2 sentences)
}

Be empathetic and understanding. If the user is sharing something difficult, acknowledge their feelings and offer support.`
        },
        { role: "user", content }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    const raw = response.choices[0].message.content;
    
    // Try to extract JSON from the response
    try {
      // First, try to find JSON in markdown code blocks
      const jsonMatch = raw.match(/```(?:json)?\n([\s\S]*?)\n```/);
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1]);
        return {
          mood: (parsed.mood || 'neutral').toLowerCase(),
          moodScore: Math.max(1, Math.min(10, parseInt(parsed.moodScore) || 5)),
          aiResponse: parsed.aiResponse || "Thank you for sharing your thoughts. I'm here to listen.",
          aiReport: parsed.aiReport || ''
        };
      }
      
      // If no JSON found, try to parse the entire response as JSON
      try {
        const parsed = JSON.parse(raw);
        return {
          mood: (parsed.mood || 'neutral').toLowerCase(),
          moodScore: Math.max(1, Math.min(10, parseInt(parsed.moodScore) || 5)),
          aiResponse: parsed.aiResponse || "Thank you for sharing your thoughts. I'm here to listen.",
          aiReport: parsed.aiReport || ''
        };
      } catch (e) {
        // If it's not valid JSON, treat the entire response as the AI message
        console.log('AI returned non-JSON response, using as message');
        return {
          mood: analyzeMoodFromText(raw) || 'neutral',
          moodScore: analyzeMoodScoreFromText(raw) || 5,
          aiResponse: raw,
          aiReport: raw
        };
      }
    } catch (e) {
      console.warn("AI service error, falling back to simple analysis. Error:", e.message);
      console.warn("Raw response:", raw);
      
      // If we have a raw response but couldn't parse it, use it as the message
      if (raw && typeof raw === 'string') {
        return {
          mood: analyzeMoodFromText(raw) || 'neutral',
          moodScore: analyzeMoodScoreFromText(raw) || 5,
          aiResponse: raw,
          aiReport: raw
        };
      }
      
      // Fall back to basic analysis
      return generateMoodAnalysis(content);
    }

  } catch (error) {
    console.error("AI service error:", error);
    return {
      mood: "neutral",
      moodScore: 5,
      aiResponse: "Keep journaling to track your emotions!"
    };
  }
};
