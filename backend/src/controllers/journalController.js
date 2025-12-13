// src/controllers/journalController.js
import { Op } from 'sequelize';
import Journal from "../models/Journal.js";
import HarmfulWordLog from "../models/HarmfulWordLog.js";
import { findHarmfulWords } from "../helpers/harmful.js";
import { getAIResponse } from "../services/aiService.js";
import { generateAIResponse } from "../helpers/ai-utils.js";
import sequelize from "../config/database.js";

// Enable logging for development
const isDevelopment = process.env.NODE_ENV === 'development';

// ------------------------------------------------------
// GET JOURNALS
// ------------------------------------------------------
export const getJournals = async (req, res) => {
  console.log('🔍 [getJournals] Starting to fetch journals');
  
  try {
    if (!req.user?.id) {
      console.log('❌ [getJournals] No user ID in request');
      return res.status(400).json({ error: 'User ID is required' });
    }

    console.log(`📊 [getJournals] Fetching up to 100 journals for user ${req.user.id}`);
    
    // Start a transaction
    const transaction = await sequelize.transaction();
    
    try {
      // Get the count first
      const count = await Journal.count({
        where: { userId: req.user.id },
        transaction
      });
      
      console.log(`📊 [getJournals] Found ${count} journals for user ${req.user.id}`);
      
      // Then get the actual data with proper field mappings
      const entries = await Journal.findAll({
        where: { userId: req.user.id },
        order: [['created_at', 'DESC']],
        limit: 100,
        transaction
      });
      
      // Commit the transaction
      await transaction.commit();
      
      console.log(`✅ [getJournals] Successfully retrieved ${entries.length} journals`);
      
      // Map the entries to ensure consistent field names
      const formattedEntries = entries.map(entry => ({
        id: entry.id,
        userId: entry.userId,
        content: entry.content,
        isVoice: entry.isVoice,
        mood: entry.mood,
        moodScore: entry.moodScore,
        aiReport: entry.aiReport,
        aiResponse: entry.aiResponse,
        assignedTherapistId: entry.assignedTherapistId,
        containsHarmful: entry.containsHarmful,
        harmfulWords: Array.isArray(entry.harmfulWords) ? entry.harmfulWords : [],
        isCrisis: entry.isCrisis,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt
      }));
      
      res.status(200).json({
        success: true,
        count: formattedEntries.length,
        data: formattedEntries
      });
      
    } catch (dbError) {
      // Rollback the transaction if there's an error
      await transaction.rollback();
      console.error('❌ [getJournals] Database error:', dbError);
      throw dbError;
    }
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
  console.log('📋 [createJournal] Request body:', { 
    content: req.body.content?.substring(0, 50) + '...', 
    is_voice: req.body.is_voice 
  });
  
  // Start a transaction
  const transaction = await sequelize.transaction();
  
  try {
    if (!req.user?.id) {
      console.log('❌ [createJournal] No user ID in request');
      return res.status(400).json({ error: 'User ID is required' });
    }

    const { content, is_voice } = req.body;
    
    if (!content) {
      console.log('❌ [createJournal] No content provided');
      return res.status(400).json({ error: 'Journal content is required' });
    }

    console.log('🔍 [createJournal] Checking for harmful words');
    const { containsHarmful, harmfulWords } = await findHarmfulWords(content);
    
    if (containsHarmful) {
      console.log('⚠️ [createJournal] Harmful content detected:', harmfulWords);
      
      // Log harmful words to the database
      await HarmfulWordLog.bulkCreate(
        harmfulWords.map(word => ({
          journal_entry_id: null, // Will be updated after journal creation
          user_id: req.user.id,
          word: word,
          context: content
        })),
        { transaction }
      );
    } else {
      console.log('🛡️ [createJournal] Harmful words detected: No');
    }

    console.log('🤖 [createJournal] Starting AI analysis');
    let aiAnalysis = {
      mood: 'neutral',
      moodScore: 5,
      aiResponse: 'Keep journaling to track your emotions!',
      aiReport: 'Keep journaling to track your emotions!'
    };

    try {
      const aiResponse = await generateAIResponse(content);
      if (aiResponse) {
        aiAnalysis = {
          mood: aiResponse.mood || 'neutral',
          moodScore: aiResponse.moodScore || 5,
          aiResponse: aiResponse.aiResponse || 'Keep journaling to track your emotions!',
          aiReport: aiResponse.aiReport || 'Keep journaling to track your emotions!'
        };
      }
      console.log('✅ [createJournal] AI analysis successful');
    } catch (aiError) {
      console.error('⚠️ [createJournal] AI analysis failed:', aiError);
      // Continue with default values if AI fails
    }

    console.log('💾 [createJournal] Saving journal to database');
    const journalData = {
      userId: req.user.id,
      content,
      isVoice: !!is_voice,
      mood: aiAnalysis.mood,
      moodScore: aiAnalysis.moodScore,
      aiReport: aiAnalysis.aiReport,
      aiResponse: aiAnalysis.aiResponse,
      containsHarmful,
      harmfulWords: harmfulWords || []
    };

    console.log('📄 [createJournal] Journal data prepared:', {
      userId: journalData.userId,
      content: journalData.content.substring(0, 50) + '...',
      isVoice: journalData.isVoice,
      mood: journalData.mood,
      moodScore: journalData.moodScore,
      containsHarmful: journalData.containsHarmful,
      harmfulWords: journalData.harmfulWords
    });

    const journal = await Journal.create(journalData, { transaction });
    
    // Update harmful word logs with the new journal entry ID
    if (containsHarmful && harmfulWords.length > 0) {
      await HarmfulWordLog.update(
        { journal_entry_id: journal.id },
        { 
          where: { 
            user_id: req.user.id, 
            journal_entry_id: null 
          },
          transaction 
        }
      );
    }

    await transaction.commit();
    
    console.log(`✅ [createJournal] Journal entry created with ID: ${journal.id}`);
    
    // Format the response
    const responseData = {
      id: journal.id,
      userId: journal.userId,
      content: journal.content,
      isVoice: journal.isVoice,
      mood: journal.mood,
      moodScore: journal.moodScore,
      aiReport: journal.aiReport,
      aiResponse: journal.aiResponse,
      containsHarmful: journal.containsHarmful,
      harmfulWords: Array.isArray(journal.harmfulWords) ? journal.harmfulWords : [],
      isCrisis: journal.isCrisis,
      createdAt: journal.createdAt,
      updatedAt: journal.updatedAt
    };
    
    return res.status(201).json({
      success: true,
      data: responseData,
      harmful_detected: containsHarmful
    });

  } catch (error) {
    console.error('❌ [createJournal] Error in transaction, rolling back:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...(error.original && { originalError: error.original })
    });
    
    if (transaction) {
      await transaction.rollback();
    }
    
    // Handle validation errors
    if (error.name === 'SequelizeValidationError' || error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors?.map(err => ({
          field: err.path,
          message: err.message
        }))
      });
    }
    
    // Handle other errors
    return res.status(500).json({ 
      success: false, 
      message: "Failed to create journal entry",
      ...(isDevelopment && {
        error: error.message,
        stack: error.stack,
        ...(error.original && { originalError: error.original })
      })
    });
  }
};
