import Journal from "../models/Journal.js";
import { getAIResponse } from "../services/aiService.js";
import { findHarmfulWords } from "../helpers/harmful.js";
import { generateAIResponse } from "../helpers/ai-utils.js";
import User from "../models/User.js";
import HarmfulWordLog from "../models/HarmfulWordLog.js";

// ------------------------------------------------------
// GET JOURNALS
// ------------------------------------------------------
export const getJournals = async (req, res) => {
  try {
    if (!req.user?.id)
      return res.status(401).json({ success: false, message: "Unauthorized" });

    const limit = parseInt(req.query.limit) || 10;

    const journals = await Journal.findAll({
      where: { userId: req.user.id },
      order: [["createdAt", "DESC"]],
      limit,
    });

    res.json({ success: true, data: journals });
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
// CREATE JOURNAL (CLEAN VERSION - NO THERAPIST LOGIC)
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
    // 3️⃣ If harmful: generate safe-response version
    // ----------------------------------------
    const finalAIResponse = generateAIResponse(
      harmfulDetected,
      aiResult?.aiResponse || ""
    );

    // ----------------------------------------
    // 4️⃣ Create Journal Entry
    // ----------------------------------------
    const journal = await Journal.create({
      userId: req.user.id,
      content,
      isVoice: !!is_voice,
      mood: aiResult?.mood || "neutral",
      moodScore: aiResult?.moodScore ?? 5,
      aiReport:
        aiResult?.aiReport || "Keep journaling to track your emotions!",
      aiResponse: finalAIResponse,

      containsHarmful: harmfulDetected,
      harmfulWords: harmfulDetected ? harmfulWords.join(",") : null,
    });

    // ----------------------------------------
    // 5️⃣ Log Harmful Words (if any)
    // ----------------------------------------
    if (harmfulDetected) {
      for (const word of harmfulWords) {
        await HarmfulWordLog.create({
          userId: req.user.id,
          journalEntryId: journal.id,
          word,
          context: content.substring(0, 300),
        });
      }
    }

    // ----------------------------------------
    // 6️⃣ Return (Therapist Logic Removed)
    // ----------------------------------------
    return res.status(201).json({
      success: true,
      data: journal.get({ plain: true }),
      harmful_detected: harmfulDetected,
    });
  } catch (error) {
    console.error("Journal creation failed:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create journal entry",
      error: error.message,
    });
  }
};
