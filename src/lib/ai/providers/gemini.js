/**
 * FreightFlow AI — Google Gemini 2.5 Flash Provider
 * 
 * Handles communication with Google's Generative AI API.
 * Server-side only (API key never exposed to client).
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

let genAI = null;
let model = null;

function getModel() {
  if (!model) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error('GEMINI_API_KEY is not configured');
    genAI = new GoogleGenerativeAI(apiKey);
    model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
  }
  return model;
}

/**
 * Send a prompt to Gemini and return the text response.
 * @param {string} systemPrompt - System-level instructions
 * @param {string} userPrompt - User query with context
 * @returns {Promise<string>} AI response text
 */
export async function generateResponse(systemPrompt, userPrompt) {
  const geminiModel = getModel();
  
  // Retry loop for temporary 503 spikes
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const result = await geminiModel.generateContent({
        contents: [
          { role: 'user', parts: [{ text: `${systemPrompt}\n\n---\n\n${userPrompt}` }] },
        ],
        generationConfig: {
          temperature: 0.4,
          topP: 0.95,
          topK: 40,
          maxOutputTokens: 2048,
        },
      });
      const response = result.response;
      return response.text();
    } catch (err) {
      if (attempt === 1 && (err.message.includes('503') || err.message.includes('high demand'))) {
        console.warn('[Gemini Provider] 503 spike encountered, retrying in 800ms...');
        await new Promise(r => setTimeout(r, 800));
        continue;
      }
      throw err;
    }
  }
}

export const providerName = 'gemini';
