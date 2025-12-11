// backend/src/utils/aiReporter.js
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const OPENAI_KEY = process.env.OPENAI_API_KEY;

export async function generateMedicalReport({ userId, content, mood, moodScore }) {
  // Protect user PII: do not send identifiable fields unless you intend to
  const prompt = `You are a clinical-style analysis assistant. Produce a short medical-style mental health report from the user's journal content. 
Output as JSON object with keys: summary (1-3 sentences), probableDiagnosis (list), severity (mild|moderate|severe), recommendations (list), crisis (true/false), suggestedTherapistAction (text).
Journal content:
"""${content}"""
Mood label: ${mood}
Mood score: ${moodScore}
Be cautious and suggest crisis resources if content indicates self-harm or suicide.`;

  if (!OPENAI_KEY) {
    // Fallback: produce a simple JSON without calling API
    return {
      summary: `Automated summary: detected mood "${mood}".`,
      probableDiagnosis: [mood],
      severity: Math.abs(moodScore) > 0.6 ? 'severe' : (Math.abs(moodScore) > 0.3 ? 'moderate' : 'mild'),
      recommendations: ['Consider contacting a professional', 'Practice grounding techniques'],
      crisis: /suicide|kill myself|end my life|want to die|hurt myself|cut myself/i.test(content),
    };
  }

  // call OpenAI Chat completions (or your provider)
  const resp = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-20b', // adjust to your account and model
      messages: [{ role: 'system', content: 'You produce structured JSON as asked.' }, { role: 'user', content: prompt }],
      max_tokens: 400,
      temperature: 0.2
    })
  });

  const data = await resp.json();
  // the assistant should return a JSON object; attempt to parse from content
  const text = data?.choices?.[0]?.message?.content || '';

  // try to extract JSON
  try {
    const jsonStart = text.indexOf('{');
    const jsonText = jsonStart >= 0 ? text.slice(jsonStart) : text;
    const parsed = JSON.parse(jsonText);
    return parsed;
  } catch (err) {
    // fallback simple structure
    return {
      summary: text.slice(0, 200),
      probableDiagnosis: [mood],
      severity: Math.abs(moodScore) > 0.6 ? 'severe' : (Math.abs(moodScore) > 0.3 ? 'moderate' : 'mild'),
      recommendations: ['Follow up with a professional'],
      crisis: /suicide|kill myself|end my life|want to die|hurt myself|cut myself/i.test(content),
    };
  }
}
