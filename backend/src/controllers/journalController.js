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
    
    // No transaction needed for read operations
    try {
      // Get pagination parameters
      const limit = parseInt(req.query.limit) || 100;
      const offset = parseInt(req.query.offset) || 0;
      
      // Get sort order (default: newest first)
      const sortOrder = req.query.sort === 'oldest' ? 'ASC' : 'DESC';
      
      console.log(`📊 [getJournals] Fetching up to ${limit} journals for user ${req.user.id}`);
      
      const entries = await Journal.findAll({
        where: { userId: req.user.id },
        limit: limit,
        offset: offset,
        order: [['created_at', sortOrder]],
        raw: true
      });
      
      console.log(`📊 [getJournals] Found ${entries.length} journals for user ${req.user.id}`);
      
      // Format the response
      const formattedEntries = entries.map(entry => ({
        id: entry.id,
        content: entry.content,
        isVoice: entry.is_voice,
        mood: entry.mood,
        moodScore: entry.mood_score,
        aiResponse: entry.ai_response,
        containsHarmful: entry.contains_harmful,
        harmfulWords: entry.harmful_words ? JSON.parse(entry.harmful_words) : [],
        createdAt: entry.created_at,
        updatedAt: entry.updated_at
      }));
      
      console.log(`✅ [getJournals] Successfully retrieved ${formattedEntries.length} journals`);
      
      res.status(200).json({
        success: true,
        count: formattedEntries.length,
        data: formattedEntries
      });
      
    } catch (dbError) {
      console.error('❌ [getJournals] Database error:', dbError);
      throw dbError;
    }
  } catch (err) {
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
