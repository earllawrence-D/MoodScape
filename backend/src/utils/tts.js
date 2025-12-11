import Groq from 'groq-sdk';
import { Readable } from 'stream';
import { sanitizeForTTS } from './sanitizeForTTS.js';


const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });


export const generateVoiceStream = async (text, voice = 'Aaliyah-PlayAI') => {
const spoken = sanitizeForTTS(text);


const wav = await groq.audio.speech.create({
model: 'playai-tts',
voice,
response_format: 'wav',
input: spoken,
});


const buffer = Buffer.from(await wav.arrayBuffer());
const stream = new Readable();
stream.push(buffer);
stream.push(null);
return stream;
};