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
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const limit = Math.min(parseInt(req.query.limit) || 10, 100);

    const journals = await JournalEntry.findAll({
      where: { userId: req.user.id },
      order: [["createdAt", "DESC"]],
      limit,
      raw: false, // Get full model instances
      nest: true
    });

    // Convert to plain objects and ensure harmful_words is always an array
    const sanitized = journals.map(journal => {
      const plainJournal = journal.get({ plain: true });
      return {
        ...plainJournal,
        harmful_words: Array.isArray(plainJournal.harmfulWords) ? 
          plainJournal.harmfulWords : 
          (plainJournal.harmfulWords ? [plainJournal.harmfulWords] : [])
      };
    });

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
    if (!req.user?.id) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { content, is_voice } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({ 
        success: false, 
        message: "Content is required" 
      });
    }

    // Start a transaction to ensure data consistency
    const transaction = await sequelize.transaction();

    try {
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
        console.error("AI analysis failed:", error);
        // Continue with default values if AI fails
        aiResult = {
          mood: "neutral",
          moodScore: 5,
          aiReport: "Keep journaling to track your emotions!",
          aiResponse: "Keep journaling to track your emotions!"
        };
      }

      // Ensure all required fields have values
      const journalData = {
        userId: req.user.id,
        content: content.trim(),
        isVoice: !!is_voice,
        mood: aiResult.mood || "neutral",
        moodScore: typeof aiResult.moodScore === 'number' ? aiResult.moodScore : 5,
        aiReport: aiResult.aiReport || "Keep journaling to track your emotions!",
        aiResponse: aiResult.aiResponse || "Keep journaling to track your emotions!",
        containsHarmful: harmfulDetected,
        harmfulWords: harmfulWords
      };

      // ----------------------------------------
      // 3️⃣ Create Journal Entry
      // ----------------------------------------
      const journal = await JournalEntry.create(journalData, { transaction });

      // ----------------------------------------
      // 4️⃣ Log Harmful Words if any
      // ----------------------------------------
      if (harmfulDetected && harmfulWords.length > 0) {
        const logEntries = harmfulWords.map((word) => ({
          journalEntryId: journal.id,
          userId: req.user.id,
          word: String(word).substring(0, 255), // Ensure word is a string and not too long
          context: String(content).substring(0, 300),
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        await HarmfulWordLog.bulkCreate(logEntries, { transaction });
      }

      // Commit the transaction
      await transaction.commit();

      // Get the created journal with proper serialization
      const createdJournal = journal.get({ plain: true });

      // ----------------------------------------
      // 5️⃣ Return response
      // ----------------------------------------
      return res.status(201).json({
        success: true,
        data: {
          ...createdJournal,
          harmful_words: createdJournal.harmfulWords || []
        },
        harmful_detected: harmfulDetected,
      });

    } catch (err) {
      // Rollback the transaction in case of error
      await transaction.rollback();
      throw err; // Re-throw to be caught by the outer catch
    }

  } catch (err) {
    console.error("Journal creation failed:", err);
    return res.status(500).json({ 
      success: false, 
      message: "Failed to create journal entry",
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
  }
};
