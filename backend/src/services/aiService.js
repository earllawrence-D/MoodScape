import Groq from "groq-sdk";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

export const getAIResponse = async (content) => {
  try {
    const response = await client.chat.completions.create({
      model: "openai/gpt-oss-20b",
      messages: [
        {
          role: "system",
          content: `
Analyze the user's text and return JSON with:
{
  "mood": "string",       // mood label like happy, sad, anxious
  "moodScore": 1-10,      // numeric score
  "aiResponse": "string"  // text response to user
}
          `
        },
        { role: "user", content }
      ],
      temperature: 0.7,
      max_tokens: 300
    });

    const raw = response.choices[0].message.content;

    // Safe JSON parsing with fallback
    try {
      const parsed = JSON.parse(raw);
      return {
        mood: parsed.mood || "neutral",
        moodScore: parsed.moodScore ?? 5,
        aiResponse: parsed.aiResponse || "Keep journaling to track your emotions!"
      };
    } catch (e) {
      console.warn("AI returned invalid JSON:", raw);
      return {
        mood: "neutral",
        moodScore: 5,
        aiResponse: "Keep journaling to track your emotions!"
      };
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
