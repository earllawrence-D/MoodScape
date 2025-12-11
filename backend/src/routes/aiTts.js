import express from 'express';
import { generateVoiceStream } from '../utils/tts.js';


const router = express.Router();


// POST /api/ai/tts
router.post('/', async (req, res) => {
try {
const { text, voice } = req.body;
if (!text) return res.status(400).json({ success: false, message: 'text required' });


const stream = await generateVoiceStream(text, voice);


res.setHeader('Content-Type', 'audio/wav');
stream.pipe(res);
} catch (err) {
console.error('TTS error', err);
res.status(500).json({ success: false, message: 'TTS failed' });
}
});


export default router;