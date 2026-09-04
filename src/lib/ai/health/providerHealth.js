/**
 * FreightFlow AI — Provider Health & Latency Monitor
 * 
 * Tracks per-provider latency, error rates, timeouts, and rate limit events.
 * Exposes health status (Healthy / Degraded / Down) for observability.
 */

const ERROR_TYPES = {
  RATE_LIMIT: 'RATE_LIMIT',
  TIMEOUT: 'TIMEOUT',
  INVALID_API_KEY: 'INVALID_API_KEY',
  PROVIDER_DOWN: 'PROVIDER_DOWN',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN: 'UNKNOWN',
};

// In-memory metrics store (per-session)
const metrics = {
  requests: 0,
  successes: 0,
  failures: 0,
  totalLatencyMs: 0,
  errors: [],    // Last 50 errors
  latencies: [], // Last 100 latencies
};

/**
 * Record a successful AI provider call.
 */
export function recordSuccess(latencyMs) {
  metrics.requests++;
  metrics.successes++;
  metrics.totalLatencyMs += latencyMs;
  metrics.latencies.push(latencyMs);
  if (metrics.latencies.length > 100) metrics.latencies.shift();
}

/**
 * Record a failed AI provider call.
 */
export function recordFailure(errorType, message = '') {
  metrics.requests++;
  metrics.failures++;
  metrics.errors.push({
    type: errorType || ERROR_TYPES.UNKNOWN,
    message,
    timestamp: new Date().toISOString(),
  });
  if (metrics.errors.length > 50) metrics.errors.shift();
}

/**
 * Classify an error from a provider response/exception.
 */
export function classifyError(error) {
  const msg = (error?.message || error?.toString() || '').toLowerCase();
  if (msg.includes('rate') || msg.includes('429') || msg.includes('quota')) return ERROR_TYPES.RATE_LIMIT;
  if (msg.includes('timeout') || msg.includes('timed out')) return ERROR_TYPES.TIMEOUT;
  if (msg.includes('api key') || msg.includes('401') || msg.includes('403') || msg.includes('unauthorized')) return ERROR_TYPES.INVALID_API_KEY;
  if (msg.includes('503') || msg.includes('502') || msg.includes('unavailable')) return ERROR_TYPES.PROVIDER_DOWN;
  if (msg.includes('fetch') || msg.includes('network') || msg.includes('econnrefused')) return ERROR_TYPES.NETWORK_ERROR;
  return ERROR_TYPES.UNKNOWN;
}

/**
 * Get current provider health status and metrics.
 */
export function getHealthStatus() {
  const avgLatency = metrics.latencies.length > 0
    ? Math.round(metrics.totalLatencyMs / metrics.successes)
    : 0;
  const errorRate = metrics.requests > 0
    ? ((metrics.failures / metrics.requests) * 100).toFixed(1)
    : '0.0';
  const recentErrors = metrics.errors.slice(-5);

  let status = 'Healthy';
  if (parseFloat(errorRate) > 20) status = 'Down';
  else if (parseFloat(errorRate) > 5 || avgLatency > 5000) status = 'Degraded';

  return {
    status,
    totalRequests: metrics.requests,
    successes: metrics.successes,
    failures: metrics.failures,
    avgLatencyMs: avgLatency,
    errorRate: `${errorRate}%`,
    recentErrors,
  };
}

export { ERROR_TYPES };
