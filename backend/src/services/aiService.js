import Groq from "groq-sdk";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const MOOD_LABELS = [
  'very happy', 'happy', 'slightly happy', 'neutral', 
  'slightly sad', 'sad', 'very sad', 'anxious', 
  'stressed', 'angry', 'frustrated', 'excited',
  'grateful', 'hopeful', 'proud', 'content'
];

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
    aiResponse: response
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
      // Handle cases where the response might be wrapped in markdown code blocks
      const jsonMatch = raw.match(/```(?:json)?\n([\s\S]*?)\n```/) || [null, raw];
      const jsonString = jsonMatch[1] || jsonMatch[0] || raw;
      
      const parsed = JSON.parse(jsonString);
      return {
        mood: parsed.mood?.toLowerCase() || "neutral",
        moodScore: parsed.moodScore ? Math.max(1, Math.min(10, parseInt(parsed.moodScore))) : 5,
        aiResponse: parsed.aiResponse || "Thank you for sharing your thoughts. I'm here to listen."
      };
    } catch (e) {
      console.warn("AI returned invalid JSON, falling back to simple analysis. Raw response:", raw);
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
