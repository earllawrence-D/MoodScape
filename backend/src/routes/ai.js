import express from 'express';
import { chat, getConversationHistory, clearConversationHistory } from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';
import { aiLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.post('/chat', protect, aiLimiter, chat);
router.get('/history', protect, getConversationHistory);
router.delete('/history', protect, clearConversationHistory);

export default router;
