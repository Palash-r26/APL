// ── FILE: utils/gemini.js ── Google Gemini AI client wrapper
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Lazy-init: only create the client when actually called
let genAI = null;
let model = null;

/**
 * Get or create the Gemini generative model instance.
 * Uses gemini-1.5-flash for speed + cost efficiency at a hackathon.
 */
const getModel = () => {
  if (!model) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_key_here') {
      throw new Error('GEMINI_API_KEY is not configured. Set it in .env');
    }
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }
  return model;
};

/**
 * Call Gemini with a text prompt and expect structured JSON back.
 * @param {string} prompt - The text prompt
 * @param {object} responseSchema - JSON schema for structured output
 * @returns {object} Parsed JSON response from Gemini
 */
const callGeminiJSON = async (prompt, responseSchema) => {
  try {
    const m = getModel();
    const result = await m.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema,
      },
    });
    const text = result.response.text();
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`Gemini JSON call failed: ${err.message}`);
  }
};

/**
 * Call Gemini Vision with an image (base64) + text prompt, expecting JSON output.
 * @param {string} base64Image - Base64-encoded image data
 * @param {string} mimeType - Image MIME type (image/jpeg, image/png, etc.)
 * @param {string} prompt - Text prompt describing what to extract
 * @param {object} responseSchema - JSON schema for structured output
 * @returns {object} Parsed JSON response from Gemini
 */
const callGeminiVision = async (base64Image, mimeType, prompt, responseSchema) => {
  try {
    const m = getModel();
    const imagePart = {
      inlineData: {
        data: base64Image,
        mimeType,
      },
    };
    const textPart = { text: prompt };

    const result = await m.generateContent({
      contents: [{ role: 'user', parts: [imagePart, textPart] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema,
      },
    });
    const text = result.response.text();
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`Gemini Vision call failed: ${err.message}`);
  }
};

/**
 * Multi-turn chat with Gemini for symptom analysis.
 * @param {Array} messages - Array of {role, content} conversation messages
 * @param {string} systemInstruction - System prompt for the AI
 * @returns {object} Parsed JSON triage result
 */
const callGeminiChat = async (messages, systemInstruction) => {
  try {
    const m = getModel();

    // Build the full prompt with system instruction + conversation history
    let fullPrompt = systemInstruction + '\n\nConversation history:\n';
    for (const msg of messages) {
      const role = msg.role === 'user' ? 'Patient' : 'Triage AI';
      fullPrompt += `${role}: ${msg.content}\n`;
    }
    fullPrompt += '\nRespond with the JSON triage assessment based on the conversation above.';

    const result = await m.generateContent({
      contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            department: { type: 'string' },
            priorityTier: { type: 'string', enum: ['RED', 'YELLOW', 'GREEN'] },
            reasoning: { type: 'string' },
            followUpQuestion: { type: 'string', nullable: true },
            triageComplete: { type: 'boolean' },
          },
          required: ['department', 'priorityTier', 'reasoning', 'triageComplete'],
        },
      },
    });
    const text = result.response.text();
    return JSON.parse(text);
  } catch (err) {
    throw new Error(`Gemini Chat call failed: ${err.message}`);
  }
};

module.exports = {
  getModel,
  callGeminiJSON,
  callGeminiVision,
  callGeminiChat,
};
