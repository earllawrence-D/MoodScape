import Groq from "groq-sdk";

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

function cleanJSON(raw) {
  // Remove ```json or ``` wrapping and trim whitespace
  return raw.replace(/```json/g, "").replace(/```/g, "").trim();
}

export default async function analyzeMood(text) {
  try {
    const response = await client.chat.completions.create({
      model: "openai/gpt-oss-20b", // Or "llama3-70b-8192", "mixtral-8x7b-32768"
      messages: [
        {
          role: "system",
          content:
            "Analyze emotional tone of the user's text. Return moodLabel, score (1–10), summary in valid JSON."
        },
        { role: "user", content: text }
      ]
    });

    let raw = response.choices[0].message.content;
    raw = cleanJSON(raw);

    try {
      const data = JSON.parse(raw);
      return data;
    } catch (parseError) {
      console.warn("Failed to parse AI output as JSON, returning fallback:", raw);
      return { moodLabel: "neutral", score: 5, summary: raw };
    }
  } catch (error) {
    console.error("moodAnalyzer Error:", error);
    return { moodLabel: "neutral", score: 5, summary: "" };
  }
}
