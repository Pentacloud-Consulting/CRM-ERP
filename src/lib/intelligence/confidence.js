/**
 * FreightFlow AI — Standardized Confidence Framework
 * 
 * Enforces a uniform confidence rating structure across all deterministic
 * and generative AI outputs (Lead Scores, Shipment Health, Win Probability,
 * Revenue Forecast).
 */

export const CONFIDENCE_LEVELS = {
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
};

/**
 * Create a standardized confidence-scored result.
 * @param {number} score - Numeric score (0–100)
 * @param {string[]} rationale - Array of human-readable reasoning strings
 * @param {Object} options - Optional overrides { confidence, metadata }
 * @returns {Object} Standardized confidence result
 */
export function createScoredResult(score, rationale = [], options = {}) {
  const confidence = options.confidence || deriveConfidence(score, rationale);
  return {
    score: Math.round(Math.max(0, Math.min(100, score))),
    confidence,
    rationale,
    timestamp: new Date().toISOString(),
    ...(options.metadata ? { metadata: options.metadata } : {}),
  };
}

/**
 * Derive confidence level from score and number of rationale signals.
 */
function deriveConfidence(score, rationale) {
  const signalCount = rationale.length;
  if (score >= 75 && signalCount >= 3) return CONFIDENCE_LEVELS.HIGH;
  if (score >= 50 && signalCount >= 2) return CONFIDENCE_LEVELS.MEDIUM;
  return CONFIDENCE_LEVELS.LOW;
}

/**
 * Format a confidence badge for UI display.
 */
export function getConfidenceBadge(confidence) {
  switch (confidence) {
    case CONFIDENCE_LEVELS.HIGH:
      return { label: 'High Confidence', color: '#059669', bg: 'rgba(5,150,105,0.08)' };
    case CONFIDENCE_LEVELS.MEDIUM:
      return { label: 'Medium Confidence', color: '#D97706', bg: 'rgba(217,119,6,0.08)' };
    case CONFIDENCE_LEVELS.LOW:
      return { label: 'Low Confidence', color: '#DC2626', bg: 'rgba(220,38,38,0.08)' };
    default:
      return { label: 'Unknown', color: '#6B7280', bg: 'rgba(107,114,128,0.08)' };
  }
}
