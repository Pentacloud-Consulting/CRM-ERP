/**
 * FreightFlow AI — Account AI Executive Summary Component
 * 
 * Auto-generates a zero-prompt executive summary on account detail pages.
 * Uses the provider manager via /api/ai/query with 30-min response caching.
 */

'use client';
import { useState, useEffect, useCallback } from 'react';
import { Sparkles, RefreshCw, Loader2, ChevronDown, ChevronUp, Zap } from 'lucide-react';
import { useApp } from '@/lib/store/AppContext';
import { buildAccountContext } from '@/lib/ai/contextBuilder';
import { buildAccountSummaryPrompt } from '@/lib/ai/prompts/feature/accountPrompt';
import { aiFeatures } from '@/config/aiFeatures';
import { trackFeatureUsage } from '@/lib/ai/telemetry';
import styles from './AccountAISummary.module.css';

export default function AccountAISummary({ orgId }) {
  const { state } = useApp();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [collapsed, setCollapsed] = useState(false);
  const [provider, setProvider] = useState(null);
  const [latency, setLatency] = useState(null);

  // Cache key scoped to this account
  const cacheKey = `ai-summary-${orgId}`;

  const generateSummary = useCallback(async (forceRefresh = false) => {
    if (!aiFeatures.accountSummary) return;
    if (!orgId) return;

    // Check localStorage cache
    if (!forceRefresh) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          const age = Date.now() - parsed.timestamp;
          if (age < 30 * 60 * 1000) { // 30 min TTL
            setSummary(parsed.text);
            setProvider(parsed.provider + ' (cached)');
            setLatency(0);
            return;
          }
        }
      } catch (e) { /* ignore cache parse errors */ }
    }

    setLoading(true);
    setError(null);
    trackFeatureUsage('accountSummary');

    try {
      const accountContext = buildAccountContext(state, orgId);
      if (!accountContext) {
        setError('Account not found');
        setLoading(false);
        return;
      }

      const prompt = buildAccountSummaryPrompt(accountContext);

      const response = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error(`AI service error (${response.status})`);
      }

      const data = await response.json();
      setSummary(data.response);
      setProvider(data.provider);
      setLatency(data.latencyMs);

      // Cache the response
      try {
        localStorage.setItem(cacheKey, JSON.stringify({
          text: data.response,
          provider: data.provider,
          timestamp: Date.now(),
        }));
      } catch (e) { /* ignore cache write errors */ }
    } catch (err) {
      console.error('[AccountAISummary] Error:', err.message);
      setError('Unable to generate summary. AI service may be temporarily unavailable.');
    } finally {
      setLoading(false);
    }
  }, [orgId, state, cacheKey]);

  useEffect(() => {
    generateSummary();
  }, [generateSummary]);

  if (!aiFeatures.accountSummary) return null;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.aiIcon}>
            <Sparkles size={14} />
          </div>
          <span className={styles.title}>AI Executive Summary</span>
          {provider && (
            <span className={styles.providerBadge}>
              <Zap size={10} />
              {provider}{latency ? ` · ${latency}ms` : ''}
            </span>
          )}
        </div>
        <div className={styles.headerRight}>
          <button
            className={styles.refreshBtn}
            onClick={() => generateSummary(true)}
            disabled={loading}
            title="Regenerate summary"
          >
            <RefreshCw size={14} className={loading ? styles.spinning : ''} />
          </button>
          <button
            className={styles.collapseBtn}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>
      </div>

      {!collapsed && (
        <div className={styles.body}>
          {loading && (
            <div className={styles.loadingState}>
              <Loader2 size={20} className={styles.spinning} />
              <span>Analyzing account data...</span>
            </div>
          )}
          {error && !loading && (
            <div className={styles.errorState}>{error}</div>
          )}
          {summary && !loading && (
            <div
              className={styles.summaryContent}
              dangerouslySetInnerHTML={{ __html: formatMarkdown(summary) }}
            />
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Minimal markdown-to-HTML formatter for AI responses.
 */
function formatMarkdown(text) {
  return text
    .replace(/### (.*?)$/gm, '<h4>$1</h4>')
    .replace(/## (.*?)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/^\- (.*?)$/gm, '<li>$1</li>')
    .replace(/(<li>.*?<\/li>\n?)+/gs, '<ul>$&</ul>')
    .replace(/^(\d+)\. (.*?)$/gm, '<li>$2</li>')
    .replace(/\n{2,}/g, '<br/><br/>')
    .replace(/\n/g, '<br/>');
}
