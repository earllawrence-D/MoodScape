// backend/src/config/groq.js
import Groq from "groq-sdk";
import dotenv from "dotenv";

dotenv.config();

const API_KEY = process.env.GROQ_API_KEY;

if (!API_KEY) {
  // Make startup failure explicit so you notice in logs
  console.error("❌ GROQ_API_KEY is missing in .env! The AI chat will not work without it.");
  // We do NOT throw here to allow the server to run in degraded mode but we will make generateAIResponse return errors.
}

const groq = API_KEY
  ? new Groq({
      apiKey: API_KEY,
    })
  : null;

/**
 * generateAIResponse
 * - messages: array of {role: "user"|"assistant"|"system", content: string}
 * - systemPrompt: optional string to prepend as system message
 *
 * Returns: { success: boolean, reply?: string, error?: string, raw?: any }
 */
export const generateAIResponse = async (messages = [], systemPrompt = "") => {
  if (!groq) {
    return {
      success: false,
      error: "GROQ_API_KEY is not configured on the server.",
    };
  }

  // Build payload for groq.chat.completions.create
  const chatMessages = [];

  if (systemPrompt && typeof systemPrompt === "string" && systemPrompt.trim().length > 0) {
    chatMessages.push({
      role: "system",
      content: systemPrompt,
    });
  }

  for (const m of messages) {
    // normalize roles and content defensively
    const role = (m.role || "user").toLowerCase();
    const content = typeof m.content === "string" ? m.content : JSON.stringify(m.content || "");
    chatMessages.push({
      role: role === "assistant" ? "assistant" : role === "system" ? "system" : "user",
      content,
    });
  }

  // Safety guard
  if (chatMessages.length === 0) {
    return { success: false, error: "No messages provided to generate a response." };
  }

  // Retry loop with exponential backoff for transient network errors
  const maxRetries = 3;
  let attempt = 0;
  let lastErr = null;

  while (attempt < maxRetries) {
    try {
      attempt += 1;

      // You can tune additional parameters as needed (model, temperature, etc.)
      const response = await groq.chat.completions.create({
        model: "openai/gpt-oss-20b",
        messages: chatMessages,
        // You could add temperature: 0.7, max_tokens etc if groq sdk supports them
      });

      // The Groq SDK returns a choices array like other LLM SDKs
      const aiMessage = response?.choices?.[0]?.message?.content;

      if (!aiMessage || aiMessage.trim().length === 0) {
        // Treat empty message as an error but capture raw response to help debugging
        return {
          success: false,
          error: "Model returned an empty response.",
          raw: response,
        };
      }

      return { success: true, reply: aiMessage, raw: response };
    } catch (err) {
      lastErr = err;
      // If the error contains response data, include it in logs for debugging
      const respData = err?.response?.data ?? err?.message ?? err;
      console.error(`❌ Groq AI Error (attempt ${attempt}):`, respData);

      // Basic transient error heuristic: network issues or 5xx
      const status = err?.response?.status;
      const isTransient = !status || (status >= 500 && status < 600);

      if (!isTransient) {
        // Non-transient (client error, auth error) — do not retry
        return {
          success: false,
          error:
            status === 401 || status === 403
              ? "Authentication with Groq API failed. Check GROQ_API_KEY."
              : `AI request failed: ${err.message || JSON.stringify(err)}`,
          raw: err?.response?.data ?? err,
        };
      }

      // If transient and attempts remain, wait then retry
      if (attempt < maxRetries) {
        const backoffMs = 200 * Math.pow(2, attempt - 1); // 200ms, 400ms, 800ms
        await new Promise((r) => setTimeout(r, backoffMs));
        continue;
      }

      // After retries exhausted
      return {
        success: false,
        error: `AI request failed after ${maxRetries} attempts.`,
        raw: err?.response?.data ?? err,
      };
    }
  }

  // Fallback (should not reach here)
  return { success: false, error: "Unknown error while generating AI response.", raw: lastErr };
};

export default {
  groq,
  generateAIResponse,
};
