/**
 * FreightFlow AI — Server-Side API Route Handler
 * POST /api/ai/query
 * 
 * Receives user query + context from the client, routes through
 * providerManager with fallback, and returns AI response.
 * API key is never exposed to the browser.
 */

import { NextResponse } from 'next/server';
import { generate } from '@/lib/ai/providers/providerManager';
import { logisticsSystemPrompt } from '@/lib/ai/prompts/system/logisticsSystemPrompt';

export async function POST(request) {
  try {
    const body = await request.json();
    const { prompt, systemPromptOverride } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Missing or invalid prompt' },
        { status: 400 }
      );
    }

    const systemPrompt = systemPromptOverride || logisticsSystemPrompt;

    const result = await generate(systemPrompt, prompt);

    return NextResponse.json({
      response: result.text,
      provider: result.provider,
      latencyMs: result.latencyMs,
    });
  } catch (error) {
    console.error('[AI API Route] Error:', error.message);
    return NextResponse.json(
      { error: 'AI service temporarily unavailable. Please try again.' },
      { status: 503 }
    );
  }
}
