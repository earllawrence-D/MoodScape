import Groq from "groq-sdk";

// Initialize Groq client with better error handling
let client;
try {
  if (!process.env.GROQ_API_KEY) {
    console.error('GROQ_API_KEY is not set in environment variables');
  } else {
    client = new Groq({ 
      apiKey: process.env.GROQ_API_KEY,
      timeout: 10000, // 10 second timeout
    });
  }
} catch (err) {
  console.error('Failed to initialize Groq client:', err);
}

function cleanJSON(raw) {
  if (!raw) return '';
  // Remove ```json or ``` wrapping and trim whitespace
  return String(raw).replace(/```json/g, "").replace(/```/g, "").trim();
}

// Fallback mood analysis when Groq is not available
function fallbackMoodAnalysis(text) {
  if (!text) return { moodLabel: "neutral", score: 5, summary: "No text provided" };
  
  const lowerText = text.toLowerCase();
  
  // Simple keyword-based mood detection
  const moodKeywords = {
    happy: ['happy', 'joy', 'great', 'good', 'amazing', 'wonderful', 'excited'],
    sad: ['sad', 'unhappy', 'depressed', 'miserable', 'upset', 'cry', 'crying'],
    angry: ['angry', 'mad', 'furious', 'annoyed', 'frustrated'],
    anxious: ['anxious', 'nervous', 'worried', 'stressed', 'overwhelmed']
  };
  
  let mood = 'neutral';
  let score = 5;
  
  // Check for mood keywords
  for (const [moodType, keywords] of Object.entries(moodKeywords)) {
    if (keywords.some(keyword => lowerText.includes(keyword))) {
      mood = moodType;
      break;
    }
  }
  
  // Adjust score based on mood
  if (mood === 'happy') score = 8;
  else if (mood === 'sad') score = 3;
  else if (mood === 'angry') score = 2;
  else if (mood === 'anxious') score = 4;
  
  // Check for crisis keywords
  const crisisKeywords = ['suicide', 'kill myself', 'end my life', 'want to die'];
  const hasCrisis = crisisKeywords.some(keyword => lowerText.includes(keyword));
  
  if (hasCrisis) {
    mood = 'crisis';
    score = 1;
    return {
      moodLabel: mood,
      score: score,
      summary: "I'm really sorry you're feeling this way. Please know that help is available. You're not alone, and there are people who care about you and want to help."
    };
  }
  
  return {
    moodLabel: mood,
    score: score,
    summary: `I noticed you're feeling ${mood}. Thank you for sharing your thoughts.`
  };
}

export default async function analyzeMood(text) {
  // If client initialization failed or no API key, use fallback
  if (!client) {
    console.warn('Groq client not initialized, using fallback mood analysis');
    return fallbackMoodAnalysis(text);
  }

  try {
    const response = await client.chat.completions.create({
      model: "mixtral-8x7b-32768", // Using a more reliable model
      messages: [
        {
          role: "system",
          content: `Analyze the emotional tone of the user's text. Return a JSON object with these fields:
          {
            "moodLabel": "string (one of: happy, sad, angry, anxious, neutral, excited, grateful, hopeful, proud, content, crisis)",
            "score": "number (1-10 where 1 is very negative and 10 is very positive)",
            "summary": "string (a supportive 1-2 sentence response)"
          }
          Be empathetic and understanding. If the user seems to be in crisis, respond with appropriate concern.`
        },
        { 
          role: "user", 
          content: text 
        }
      ],
      temperature: 0.7,
      max_tokens: 300,
      response_format: { type: "json_object" } // Ensure JSON response
    });

    let raw = response.choices[0]?.message?.content;
    if (!raw) throw new Error('No content in response');
    
    raw = cleanJSON(raw);
    
    try {
      const data = JSON.parse(raw);
      // Validate response structure
      if (!data.moodLabel || typeof data.score === 'undefined') {
        throw new Error('Invalid response format from AI');
      }
      return data;
    } catch (parseError) {
      console.warn("Failed to parse AI output as JSON, using fallback analysis. Raw response:", raw);
      return fallbackMoodAnalysis(text);
    }
  } catch (error) {
    console.error("moodAnalyzer Error:", error);
    // Return fallback analysis if there's an error
    return fallbackMoodAnalysis(text);
  }
}
