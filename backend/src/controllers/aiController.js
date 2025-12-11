// backend/src/controllers/aiController.js
import { generateAIResponse } from "../config/groq.js";

/**
 * Simple in-memory conversation store.
 * For production, replace with persistent storage tied to user ID.
 */
let conversations = {};

/**
 * POST /api/ai/chat
 * Body: { message: string, systemPrompt?: string }
 * Auth: expects req.user.id to exist (keep your auth middleware)
 */
export const chat = async (req, res) => {
  try {
    const userId = req?.user?.id || (req.body && req.body.userId) || "anonymous";

    const message = (req.body && req.body.message) || "";
    const systemPrompt = (req.body && req.body.systemPrompt) || "";

    if (!message || typeof message !== "string" || message.trim() === "") {
      return res.status(400).json({ success: false, error: "Message is required." });
    }

    // Ensure conversation array exists
    if (!conversations[userId]) conversations[userId] = [];

    // Push the user's message to memory
    conversations[userId].push({ role: "user", content: message });

    // Call the generator
    const result = await generateAIResponse(conversations[userId], systemPrompt);

    if (result.success) {
      // Save assistant reply to conversation
      conversations[userId].push({ role: "assistant", content: result.reply });

      return res.json({
        success: true,
        reply: result.reply,
        conversation: conversations[userId],
      });
    } else {
      // If generateAIResponse failed, record an assistant error message so the UI has a stable reply to render
      const assistantErrorContent =
        result.error || "Sorry, the AI could not generate a response at this time.";

      conversations[userId].push({
        role: "assistant",
        content: assistantErrorContent,
        meta: { error: true },
      });

      return res.status(502).json({
        success: false,
        error: assistantErrorContent,
        raw: result.raw || null,
        conversation: conversations[userId],
      });
    }
  } catch (err) {
    console.error("AI chat controller unexpected error:", err);
    return res.status(500).json({ success: false, error: "Internal server error." });
  }
};

export const getConversationHistory = (req, res) => {
  const userId = req?.user?.id || (req.query && req.query.userId) || "anonymous";
  res.json({ success: true, conversation: conversations[userId] || [] });
};

export const clearConversationHistory = (req, res) => {
  const userId = req?.user?.id || (req.body && req.body.userId) || "anonymous";
  conversations[userId] = [];
  res.json({ success: true, message: "Conversation history cleared.", conversation: [] });
};
