const express = require('express');
const router = express.Router();

/**
 * POST /api/realtime/token
 * Fetches an ephemeral token from OpenAI Realtime API.
 * This keeps the main OPENAI_API_KEY secure on the server.
 */
router.post('/token', async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'OPENAI_API_KEY is missing from environment' });
    }

    const response = await fetch("https://api.openai.com/v1/realtime/client_secrets", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        session: {
          type: "realtime",
          model: "gpt-4o-realtime-preview-2024-12-17",
          instructions: "You are an AI Triage Assistant at a hospital. Your job is to briefly ask the patient what brings them in today. If they mention symptoms (e.g. chest pain, fracture), dynamically perform a brief symptom survey to determine urgency. Keep responses short and empathetic. Output JSON format is NOT required for the realtime voice session.",
        }
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API Error:', errorData);
      return res.status(response.status).json({ error: 'Failed to fetch Realtime session token' });
    }

    const data = await response.json();
    // Return the ephemeral token data to the client
    res.json(data);
  } catch (error) {
    console.error('Realtime Token Route Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
