const express = require('express');
const { GoogleGenAI } = require('@google/genai');
const Event = require('../models/Event');
const requireAuth = require('../middleware/auth');

const router = express.Router();
router.use(requireAuth);

let ai = null;
function getAI() {
  if (!ai) {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not set');
    }
    ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return ai;
}

function getRetryDelayMs(err, fallbackMs) {
  const match = err.message && err.message.match(/retryDelay"\s*:\s*"(\d+(?:\.\d+)?)s"/);
  return match ? parseFloat(match[1]) * 1000 : fallbackMs;
}

async function generateWithRetry(prompt, attempts = 2) {
  for (let i = 0; i < attempts; i++) {
    try {
      return await getAI().models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          thinkingConfig: { thinkingLevel: 'MINIMAL' },
          httpOptions: { timeout: 15000 }
        }
      });
    } catch (err) {
      const isRetryable =
        err.status === 503 || err.status === 429 || err.status === 504 || err.name === 'AbortError';
      if (!isRetryable || i === attempts - 1) throw err;
      const delay = Math.min(getRetryDelayMs(err, 800), 5000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
}

router.get('/', async (req, res) => {
  const events = await Event.find({ user: req.session.userId }).sort({ date: 1, time: 1 });
  res.json(events);
});

router.post('/', async (req, res) => {
  const { title, date, time, description } = req.body;
  if (!title || !date) {
    return res.status(400).json({ error: 'Title and date are required' });
  }
  const event = await Event.create({
    user: req.session.userId,
    title,
    date,
    time: time || '',
    description: description || ''
  });
  res.status(201).json(event);
});

router.post('/parse', async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const today = new Date().toISOString().split('T')[0];
    const prompt = `Today's date is ${today}. Extract a single calendar event from the
following request and respond with ONLY raw JSON (no markdown fences, no extra text)
matching exactly this shape: {"title": string, "date": "YYYY-MM-DD", "time": "HH:MM" or "",
"description": string}. If a relative date like "tomorrow" or "next Tuesday" is given,
resolve it to an absolute date based on today's date. If no time is mentioned, use "".
Request: "${text}"`;

    const result = await generateWithRetry(prompt);
    const raw = (result.text || '').trim();
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(502).json({ error: 'Could not parse a response from the AI model' });
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return res.status(502).json({ error: 'AI model returned malformed JSON' });
    }

    if (!parsed.title || !parsed.date) {
      return res.status(502).json({ error: 'AI model response missing required fields' });
    }

    const event = await Event.create({
      user: req.session.userId,
      title: parsed.title,
      date: parsed.date,
      time: parsed.time || '',
      description: parsed.description || ''
    });
    res.status(201).json(event);
  } catch (err) {
    console.error('Gemini parse error:', err);
    res.status(500).json({ error: 'Error contacting AI model' });
  }
});

router.put('/:id', async (req, res) => {
  const { title, date, time, description } = req.body;
  const event = await Event.findOneAndUpdate(
    { _id: req.params.id, user: req.session.userId },
    { title, date, time, description },
    { new: true }
  );
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }
  res.json(event);
});

router.delete('/:id', async (req, res) => {
  const event = await Event.findOneAndDelete({ _id: req.params.id, user: req.session.userId });
  if (!event) {
    return res.status(404).json({ error: 'Event not found' });
  }
  res.json({ message: 'Event deleted' });
});

module.exports = router;
