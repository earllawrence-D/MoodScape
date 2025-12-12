// src/controllers/journalController.js
import JournalEntry from "../models/Journal.js";
import HarmfulWordLog from "../models/HarmfulWordLog.js";
import { findHarmfulWords } from "../helpers/harmful.js";
import { getAIResponse } from "../services/aiService.js";
import { generateAIResponse } from "../helpers/ai-utils.js";

// ------------------------------------------------------
// GET JOURNALS
// ------------------------------------------------------
export const getJournals = async (req, res) => {
  try {
    if (!req.user?.id)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const limit = parseInt(req.query.limit) || 10;

    const journals = await JournalEntry.findAll({
      where: { user_id: req.user.id },
      order: [["created_at", "DESC"]],
      limit,
    });

    const sanitized = journals.map((j) => ({
      ...j.get({ plain: true }),
      harmful_words: Array.isArray(j.harmful_words) ? j.harmful_words : [],
    }));

    res.json({ success: true, data: sanitized });
  } catch (err) {
    console.error("Get journals failed:", err);
    res.status(500).json({
      success: false,
      message: "Failed to get journals",
      error: err.message,
    });
  }
};

// ------------------------------------------------------
// CREATE JOURNAL
// ------------------------------------------------------
export const createJournal = async (req, res) => {
  try {
    if (!req.user?.id)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const { content, is_voice } = req.body;

    if (!content || content.trim() === "")
      return res
        .status(400)
        .json({ success: false, message: "Content is required" });

    // ----------------------------------------
    // 1️⃣ Detect Harmful Words
    // ----------------------------------------
    const harmfulWords = findHarmfulWords(content);
    const harmfulDetected = harmfulWords.length > 0;

    // ----------------------------------------
    // 2️⃣ AI Analysis
    // ----------------------------------------
    let aiResult = {};
    try {
      aiResult = await getAIResponse(content);
    } catch (error) {
      console.error("AI error:", error);
    }

    // ----------------------------------------
    // 3️⃣ Generate safe AI response if harmful
    // ----------------------------------------
    const finalAIResponse = generateAIResponse(
      harmfulDetected,
      aiResult?.aiResponse || "Keep journaling to track your emotions!"
    );

    // ----------------------------------------
    // 4️⃣ Create Journal Entry
    // ----------------------------------------
    const journal = await JournalEntry.create({
      user_id: req.user.id,
      content,
      is_voice: !!is_voice,
      mood: aiResult?.mood || "neutral",
      mood_score: aiResult?.moodScore ?? 5,
      ai_report: aiResult?.aiReport || "Keep journaling to track your emotions!",
      ai_response: finalAIResponse,
      contains_harmful: harmfulDetected ? 1 : 0,
      harmful_words: harmfulDetected ? harmfulWords : [],
    });

    // ----------------------------------------
    // 5️⃣ Log Harmful Words
    // ----------------------------------------
    if (harmfulDetected) {
      const logEntries = harmfulWords.map((word) => ({
        journal_entry_id: journal.id,
        user_id: req.user.id,
        word,
        context: content.substring(0, 300),
        created_at: new Date(),
        updated_at: new Date(),
      }));
      await HarmfulWordLog.bulkCreate(logEntries);
    }

    // ----------------------------------------
    // 6️⃣ Return response
    // ----------------------------------------
    return res.status(201).json({
      success: true,
      data: journal.get({ plain: true }),
      harmful_detected: harmfulDetected,
    });
  } catch (err) {
    console.error("Journal creation failed:", err);
    return res.status(500).json({ success: false, message: "Server error", error: err.message });
  }
};
