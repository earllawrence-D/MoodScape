// src/controllers/journalController.js
import JournalEntry from "../models/Journal.js";
import HarmfulWordLog from "../models/HarmfulWordLog.js";
import { findHarmfulWords } from "../helpers/harmful.js";
import { getAIResponse } from "../services/aiService.js";
import { generateAIResponse } from "../helpers/ai-utils.js";
import sequelize from "../config/database.js";

// ------------------------------------------------------
// GET JOURNALS
// ------------------------------------------------------
export const getJournals = async (req, res) => {
  console.log('🔍 [getJournals] Starting to fetch journals');
  const transaction = await sequelize.transaction();
  
  try {
    if (!req.user?.id) {
      console.log('❌ [getJournals] No user ID in request');
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized: No user ID provided" 
      });
    }

    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    console.log(`📊 [getJournals] Fetching up to ${limit} journals for user ${req.user.id}`);

    // Test database connection first
    try {
      await sequelize.authenticate();
      console.log('✅ [getJournals] Database connection is active');
    } catch (dbError) {
      console.error('❌ [getJournals] Database connection error:', dbError);
      return res.status(500).json({
        success: false,
        message: "Database connection error",
        error: dbError.message
      });
    }

    const journals = await JournalEntry.findAll({
      where: { userId: req.user.id },
      order: [["createdAt", "DESC"]],
      limit,
      raw: false,
      nest: true,
      transaction
    });

    console.log(`📝 [getJournals] Found ${journals.length} journals`);

    // Convert to plain objects and ensure harmful_words is always an array
    const sanitized = journals.map(journal => {
      try {
        const plainJournal = journal.get({ plain: true });
        return {
          ...plainJournal,
          harmful_words: Array.isArray(plainJournal.harmfulWords) ? 
            plainJournal.harmfulWords : 
            (plainJournal.harmfulWords ? [plainJournal.harmfulWords] : [])
        };
      } catch (mapError) {
        console.error('❌ [getJournals] Error processing journal:', mapError);
        return null;
      }
    }).filter(Boolean); // Remove any null entries from mapping errors

    await transaction.commit();
    console.log('✅ [getJournals] Successfully fetched journals');
    
    return res.json({ 
      success: true, 
      data: sanitized,
      count: sanitized.length
    });
    
  } catch (err) {
    await transaction.rollback();
    console.error('❌ [getJournals] Error:', {
      message: err.message,
      stack: err.stack,
      name: err.name,
      ...(err.original && { originalError: err.original })
    });
    
    res.status(500).json({
      success: false,
      message: "Failed to get journals",
      error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
  }
};

// ------------------------------------------------------
// CREATE JOURNAL
// ------------------------------------------------------
export const createJournal = async (req, res) => {
  console.log('📝 [createJournal] Starting journal creation');
  const transaction = await sequelize.transaction();
  
  try {
    // Validate user
    if (!req.user?.id) {
      console.log('❌ [createJournal] No user ID in request');
      return res.status(401).json({ 
        success: false, 
        message: "Unauthorized: No user ID provided" 
      });
    }

    // Validate request body
    const { content, is_voice } = req.body;
    console.log('📋 [createJournal] Request body:', { 
      content: content ? `${content.substring(0, 50)}...` : 'empty',
      is_voice
    });

    if (!content || content.trim() === "") {
      console.log('❌ [createJournal] Empty content');
      return res.status(400).json({ 
        success: false, 
        message: "Content is required" 
      });
    }

    try {
      // ----------------------------------------
      // 1️⃣ Detect Harmful Words
      // ----------------------------------------
      console.log('🔍 [createJournal] Checking for harmful words');
      const harmfulWords = findHarmfulWords(content);
      const harmfulDetected = harmfulWords.length > 0;
      console.log(`🛡️ [createJournal] Harmful words detected: ${harmfulWords.length > 0 ? 'Yes' : 'No'}`);
      if (harmfulDetected) {
        console.log('⚠️ [createJournal] Harmful words found:', harmfulWords);
      }

      // ----------------------------------------
      // 2️⃣ AI Analysis
      // ----------------------------------------
      console.log('🤖 [createJournal] Starting AI analysis');
      let aiResult = {
        mood: "neutral",
        moodScore: 5,
        aiReport: "Keep journaling to track your emotions!",
        aiResponse: "Keep journaling to track your emotions!"
      };
      
      try {
        const aiResponse = await getAIResponse(content);
        console.log('✅ [createJournal] AI analysis successful');
        aiResult = {
          ...aiResult,
          ...aiResponse,
          mood: aiResponse?.mood || "neutral",
          moodScore: typeof aiResponse?.moodScore === 'number' ? aiResponse.moodScore : 5,
          aiReport: aiResponse?.aiReport || aiResult.aiReport,
          aiResponse: aiResponse?.aiResponse || aiResult.aiResponse
        };
      } catch (aiError) {
        console.error('⚠️ [createJournal] AI analysis failed, using defaults:', aiError.message);
        // Continue with default values
      }

      // Prepare journal data
      const journalData = {
        userId: req.user.id,
        content: content.trim(),
        isVoice: !!is_voice,
        mood: aiResult.mood,
        moodScore: aiResult.moodScore,
        aiReport: aiResult.aiReport,
        aiResponse: aiResult.aiResponse,
        containsHarmful: harmfulDetected,
        harmfulWords: harmfulWords
      };

      console.log('📄 [createJournal] Journal data prepared:', {
        ...journalData,
        content: `${journalData.content.substring(0, 30)}...`
      });

      // ----------------------------------------
      // 3️⃣ Create Journal Entry
      // ----------------------------------------
      console.log('💾 [createJournal] Saving journal to database');
      const journal = await JournalEntry.create(journalData, { 
        transaction,
        returning: true,
        raw: true
      });
      
      console.log('✅ [createJournal] Journal saved with ID:', journal.id);

      // ----------------------------------------
      // 4️⃣ Log Harmful Words if any
      // ----------------------------------------
      if (harmfulDetected && harmfulWords.length > 0) {
        console.log('📝 [createJournal] Logging harmful words');
        const logEntries = harmfulWords.map((word) => ({
          journalEntryId: journal.id,
          userId: req.user.id,
          word: String(word).substring(0, 255),
          context: String(content).substring(0, 300),
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        try {
          await HarmfulWordLog.bulkCreate(logEntries, { transaction });
          console.log(`✅ [createJournal] Logged ${logEntries.length} harmful words`);
        } catch (logError) {
          console.error('⚠️ [createJournal] Failed to log harmful words:', logError);
          // Don't fail the whole request if logging fails
        }
      }

      // Commit the transaction
      await transaction.commit();
      console.log('✅ [createJournal] Transaction committed successfully');

      // Get the created journal with proper serialization
      const createdJournal = journal.get ? journal.get({ plain: true }) : journal;

      // ----------------------------------------
      // 5️⃣ Return successful response
      // ----------------------------------------
      console.log('🎉 [createJournal] Journal created successfully');
      return res.status(201).json({
        success: true,
        data: {
          ...createdJournal,
          harmful_words: Array.isArray(createdJournal.harmfulWords) ? 
            createdJournal.harmfulWords : 
            (createdJournal.harmfulWords ? [createdJournal.harmfulWords] : [])
        },
        harmful_detected: harmfulDetected,
      });

    } catch (error) {
      // Rollback the transaction in case of error
      console.error('❌ [createJournal] Error in transaction, rolling back:', {
        message: error.message,
        stack: error.stack,
        name: error.name,
        ...(error.original && { originalError: error.original })
      });
      
      await transaction.rollback();
      throw error; // Re-throw to be caught by the outer catch
    }

  } catch (error) {
    console.error('❌ [createJournal] Critical error:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...(error.original && { originalError: error.original })
    });
    
    return res.status(500).json({ 
      success: false, 
      message: "Failed to create journal entry",
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
      ...(process.env.NODE_ENV === 'development' && { 
        stack: error.stack,
        ...(error.original && { originalError: error.original })
      })
    });
  }
};
