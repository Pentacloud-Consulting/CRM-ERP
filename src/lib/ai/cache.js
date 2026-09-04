/**
 * FreightFlow AI — Response Cache Layer
 * 
 * In-memory cache with configurable TTL to prevent redundant LLM calls.
 * Caches account summaries, search results, and AI-generated content.
 */

import { aiConfig } from '@/config/aiFeatures';

const cache = new Map();

/**
 * Get a cached response by key.
 * Returns null if the entry is expired or missing.
 */
export function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > aiConfig.cacheTTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

/**
 * Set a cache entry with the configured TTL.
 */
export function setCache(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now(),
  });
}

/**
 * Invalidate a specific cache entry.
 */
export function invalidateCache(key) {
  cache.delete(key);
}

/**
 * Clear all cached entries.
 */
export function clearCache() {
  cache.clear();
}

/**
 * Get cache stats for health monitoring.
 */
export function getCacheStats() {
  let hits = 0;
  let expired = 0;
  const now = Date.now();
  for (const [, entry] of cache) {
    if (now - entry.timestamp > aiConfig.cacheTTL) {
      expired++;
    } else {
      hits++;
    }
  }
  return { size: cache.size, active: hits, expired };
}
