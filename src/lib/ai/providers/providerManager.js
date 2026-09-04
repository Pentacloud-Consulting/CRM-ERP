/**
 * FreightFlow AI — Dynamic Provider Manager & Fallback Chain
 * 
 * Routes AI generation requests through the configured primary provider
 * with automatic fallback to secondary/mock providers on failure.
 * 
 * Fallback Chain: Primary (Gemini) → Mock (Offline)
 * 
 * Future placeholders: OpenAI, Claude (not implemented yet).
 */

import { aiConfig } from '@/config/aiFeatures';
import { recordSuccess, recordFailure, classifyError } from '@/lib/ai/health/providerHealth';

// Lazy-loaded provider modules
const providers = {};

async function getProvider(name) {
  if (providers[name]) return providers[name];
  switch (name) {
    case 'gemini':
      providers[name] = await import('./gemini.js');
      break;
    case 'mock':
      providers[name] = await import('./mock.js');
      break;
    // Future: case 'openai': providers[name] = await import('./openai.js'); break;
    // Future: case 'claude': providers[name] = await import('./claude.js'); break;
    default:
      providers[name] = await import('./mock.js');
  }
  return providers[name];
}

/**
 * Generate a response using the configured provider with automatic fallback.
 * @param {string} systemPrompt - System-level instructions
 * @param {string} userPrompt - User query with embedded context
 * @returns {Promise<{ text: string, provider: string, latencyMs: number }>}
 */
export async function generate(systemPrompt, userPrompt) {
  const primaryName = aiConfig.provider;
  const fallbackName = aiConfig.fallbackProvider;

  // Try primary provider
  try {
    const startTime = Date.now();
    const provider = await getProvider(primaryName);
    const text = await provider.generateResponse(systemPrompt, userPrompt);
    const latencyMs = Date.now() - startTime;
    recordSuccess(latencyMs);
    return { text, provider: primaryName, latencyMs };
  } catch (primaryError) {
    const errorType = classifyError(primaryError);
    recordFailure(errorType, primaryError.message);
    console.warn(`[AI Provider] Primary "${primaryName}" failed (${errorType}): ${primaryError.message}. Falling back to "${fallbackName}".`);

    // Try fallback provider
    try {
      const startTime = Date.now();
      const fallbackProvider = await getProvider(fallbackName);
      const text = await fallbackProvider.generateResponse(systemPrompt, userPrompt);
      const latencyMs = Date.now() - startTime;
      recordSuccess(latencyMs);
      return { text, provider: fallbackName, latencyMs };
    } catch (fallbackError) {
      recordFailure(classifyError(fallbackError), fallbackError.message);
      console.error(`[AI Provider] Fallback "${fallbackName}" also failed:`, fallbackError.message);
      throw new Error('All AI providers failed. Please check your API configuration.');
    }
  }
}

/**
 * Get the name of the currently active primary provider.
 */
export function getActiveProvider() {
  return aiConfig.provider;
}
