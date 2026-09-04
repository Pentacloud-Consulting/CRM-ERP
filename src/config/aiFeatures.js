/**
 * FreightFlow AI Copilot — Feature Flags & Kill Switches
 * 
 * Toggle individual AI features without deployment.
 * Set any flag to `false` to instantly disable that feature system-wide.
 */

export const aiFeatures = {
  // ── Phase 1: Foundation ──
  accountSummary: true,      // Auto-generated account narrative cards
  commandCenter: true,       // Global AI Command Center (Spotlight / Cmd+K)
  shipmentHealth: true,      // Deterministic shipment health scoring
  dashboardInsights: true,   // Dashboard AI insights hero card
  leadScoring: true,         // Deterministic lead scoring engine

  // ── Phase 2: Sales Intelligence ──
  dealCoach: false,          // AI Deal Coach & Win Probability
  revenueForecast: false,    // Predictive revenue forecasting
  aiAlerts: false,           // Proactive AI alert notifications

  // ── Phase 3: Autonomous Actions ──
  toolCalling: false,        // AI tool calling & action execution
  actionApproval: false,     // Human-in-the-loop approval gates
  memory: false,             // Conversational entity memory
  cacheLayer: true,          // Response caching (always on for performance)

  // ── Phase 4: Enterprise ──
  ragKnowledge: false,       // RAG SOP & customs retrieval
  executiveCopilot: false,   // Executive briefing copilot
};

/**
 * AI Provider Configuration
 * Supported: 'gemini' | 'openai' | 'claude' | 'mock'
 */
export const aiConfig = {
  provider: process.env.NEXT_PUBLIC_AI_PROVIDER || 'gemini',
  fallbackProvider: 'mock',
  cacheTTL: 30 * 60 * 1000, // 30 minutes in ms
  maxRequestsPerMinute: 50,
  maxTokensPerDay: 200000,
};
