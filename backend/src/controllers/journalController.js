// src/controllers/journalController.js
import JournalEntry from "../models/journal_entries.js"; // your model
import HarmfulWordLog from "../models/harmful_word_log.js"; // your harmful word log model
import { Op } from "sequelize";

// Create a new journal entry
export const createJournal = async (req, res) => {
  try {
    const { user_id, content, mood, mood_score, is_voice, harmful_words } = req.body;

    // Validate required fields
    if (!user_id || !content) {
      return res.status(400).json({ message: "User ID and content are required." });
    }

    // Validate mood_score (1-10)
    let validMoodScore = parseInt(mood_score);
    if (isNaN(validMoodScore) || validMoodScore < 1 || validMoodScore > 10) {
      validMoodScore = 5; // default neutral
    }

    // Ensure harmful_words is a JSON string for DB storage
    let harmfulWordsArray = [];
    if (Array.isArray(harmful_words)) {
      harmfulWordsArray = harmful_words;
    } else if (typeof harmful_words === "string") {
      try {
        harmfulWordsArray = JSON.parse(harmful_words);
      } catch (err) {
        harmfulWordsArray = [harmful_words]; // treat as single word
      }
    }

    const harmfulWordsStr = harmfulWordsArray.length ? JSON.stringify(harmfulWordsArray) : null;

    // Generate AI response (mock example)
    const ai_response = JSON.stringify({
      mood: mood || "neutral",
      moodScore: validMoodScore,
      aiResponse: `Keep journaling to track your emotions!`
    });

    // Create journal entry
    const journal = await JournalEntry.create({
      user_id,
      content,
      mood: mood || "neutral",
      mood_score: validMoodScore,
      is_voice: is_voice || 0,
      ai_response,
      harmful_words: harmfulWordsStr,
      contains_harmful: harmfulWordsArray.length > 0 ? 1 : 0
    });

    // Insert into harmful_word_log if applicable
    if (harmfulWordsArray.length) {
      const logEntries = harmfulWordsArray.map(word => ({
        journal_entry_id: journal.id,
        user_id,
        word,
        created_at: new Date(),
        updated_at: new Date()
      }));
      await HarmfulWordLog.bulkCreate(logEntries);
    }

    return res.status(201).json({ message: "Journal created successfully", journal });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};
