'use client';
import { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, ChevronLeft, ChevronRight, Upload, Sparkles, FileText, BarChart3, Loader2 } from 'lucide-react';
import { useApp } from '@/lib/store/AppContext';
import { buildContext } from '@/lib/ai/contextBuilder';
import styles from './AIPanel.module.css';

const SAMPLE_QUERIES = [
  'What is the OTD rate for DOH–FRA lane?',
  'Show me open exceptions',
  'Average customs dwell time by jurisdiction',
  'Chargeable weight by carrier this month',
];

const AI_RESPONSES = {
  'otd': { metric: 'On-Time Delivery Rate (DOH–FRA)', value: '94.2%', detail: 'Based on 17 shipments in the last 90 days. 16 delivered within SLA window. 1 delayed due to customs hold (SHP-2026-00201).', type: 'metric' },
  'exception': { metric: 'Open Exceptions', value: '3', detail: '• SHP-2026-00201 — Customs Hold (UAE-Customs, 8 days)\n• SHP-2026-00245 — AWR Temperature Excursion (HKG)\n• BKR-0005 — Waitlisted booking (DXB–LHR)', type: 'list' },
  'customs': { metric: 'Avg. Customs Dwell Time', value: '18.4 hrs', detail: '• EU-ICS2: 20.0 hrs (1 clearance)\n• SG-Customs: 2.0 hrs (1 clearance)\n• UAE-Customs: Pending (1 held — 8+ days)', type: 'metric' },
  'weight': { metric: 'Chargeable Weight by Carrier (Aug 2026)', value: '26,200 kg', detail: '• Qatar Airways (QR): 9,800 kg — 2 shipments\n• Singapore Airlines (SQ): 3,100 kg — 1 shipment\n• IAG Cargo (BA): 8,500 kg — 1 shipment\n• Lufthansa (LH): 1,800 kg — 1 shipment\n• Emirates (EK): 950 kg — 1 pending', type: 'metric' },
};

export default function AIPanel({ open, onToggle }) {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I can help you with shipment tracking, metrics, and document intake. Try asking about OTD rates, open exceptions, or upload a document.', type: 'text' }
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const { state } = useApp();

  const handleSend = async () => {
    if (!query.trim() || isTyping) return;
    const userMsg = query.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg, type: 'text' }]);
    setQuery('');
    setIsTyping(true);

    try {
      // Build full relational CRM & Operations context
      const crmContext = buildContext(state);
      
      const fullPrompt = `The user is asking: "${userMsg}"\n\n` +
        `Here is the current real-time CRM & Operations state:\n\n` +
        `\`\`\`json\n${JSON.stringify(crmContext, null, 2)}\n\`\`\`\n\n` +
        `Please analyze the data and answer the user's question accurately with full details.`;

      const res = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: fullPrompt }),
      });

      if (!res.ok) throw new Error('API error');

      const data = await res.json();
      setMessages(prev => [...prev, { role: 'assistant', content: data.response, type: 'text' }]);
    } catch (err) {
      console.error('[AIPanel] Error calling AI route:', err);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I encountered an issue retrieving that information. Please check your network connection or try again.',
        type: 'text'
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!open) {
    return (
      <div className={styles.collapsed}>
        <button className={styles.expandBtn} onClick={onToggle} aria-label="Open AI panel">
          <Bot size={20} />
        </button>
      </div>
    );
  }

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.aiIcon}>
            <Sparkles size={16} />
          </div>
          <div>
            <div className={styles.headerTitle}>AI Assistant</div>
            <div className={styles.headerSub}>Governed metrics & document intake</div>
          </div>
        </div>
        <button className={styles.closeBtn} onClick={onToggle} aria-label="Close AI panel">
          <ChevronRight size={16} />
        </button>
      </div>

      <div className={styles.quickActions}>
        <button className={styles.actionBtn}>
          <FileText size={14} />
          <span>Document Intake</span>
        </button>
        <button className={styles.actionBtn}>
          <BarChart3 size={14} />
          <span>Reports</span>
        </button>
      </div>

      <div className={styles.messages}>
        {messages.map((msg, i) => (
          <div key={i} className={`${styles.message} ${styles[msg.role]}`}>
            {msg.role === 'assistant' && (
              <div className={styles.msgAvatar}>
                <Bot size={14} />
              </div>
            )}
            <div className={styles.msgContent}>
              {msg.type === 'metric' || msg.type === 'list' ? (
                <div className={styles.metricCard}>
                  <div className={styles.metricLabel}>{msg.metric}</div>
                  <div className={styles.metricValue}>{msg.value}</div>
                  <div className={styles.metricDetail}>{msg.detail}</div>
                </div>
              ) : (
                <div 
                  className={styles.msgText} 
                  dangerouslySetInnerHTML={{ __html: renderFormattedContent(msg.content) }} 
                />
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className={`${styles.message} ${styles.assistant}`}>
            <div className={styles.msgAvatar}>
              <Bot size={14} />
            </div>
            <div className={styles.msgContent}>
              <div className={styles.typing}>
                <Loader2 size={14} className={styles.spinner} />
                <span>Analyzing...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.suggestions}>
        {SAMPLE_QUERIES.map((q, i) => (
          <button
            key={i}
            className={styles.suggestion}
            onClick={() => { setQuery(q); inputRef.current?.focus(); }}
          >
            {q}
          </button>
        ))}
      </div>

      <div className={styles.inputArea}>
        <div className={styles.inputWrapper}>
          <input
            ref={inputRef}
            type="text"
            className={styles.input}
            placeholder="Ask about metrics, tracking, or upload a doc..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            className={styles.sendBtn}
            onClick={handleSend}
            disabled={!query.trim() || isTyping}
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}

/**
 * Format markdown text into clean HTML for tables, headers, lists, and inline tags.
 */
function renderFormattedContent(text) {
  if (!text) return '';

  let formatted = text;

  // 1. Process Markdown Tables
  const tableRegex = /((?:\|[^\n]+\|\n?)+)/g;
  formatted = formatted.replace(tableRegex, (match) => {
    const lines = match.trim().split('\n').filter(l => l.trim().startsWith('|'));
    if (lines.length < 2) return match;

    const parseCells = line => line.split('|').slice(1, -1).map(c => c.trim());
    const headers = parseCells(lines[0]);
    
    // skip line[1] if it's separator (|---|---|)
    const startIdx = (lines[1] && (lines[1].includes(':-') || lines[1].includes('---'))) ? 2 : 1;
    const rows = lines.slice(startIdx).map(line => parseCells(line));

    let html = '<div class="ai-table-container"><table class="ai-table"><thead><tr>';
    headers.forEach(h => { html += `<th>${formatInline(h)}</th>`; });
    html += '</tr></thead><tbody>';
    rows.forEach(row => {
      html += '<tr>';
      row.forEach(cell => { html += `<td>${formatInline(cell)}</td>`; });
      html += '</tr>';
    });
    html += '</tbody></table></div>';
    return html;
  });

  // 2. Headers
  formatted = formatted.replace(/^### (.*?)$/gm, '<h4 class="ai-h4">$1</h4>');
  formatted = formatted.replace(/^## (.*?)$/gm, '<h3 class="ai-h3">$1</h3>');
  formatted = formatted.replace(/^# (.*?)$/gm, '<h2 class="ai-h2">$1</h2>');

  // 3. Horizontal rules
  formatted = formatted.replace(/^---$/gm, '<hr class="ai-hr" />');

  // 4. Bullet lists
  formatted = formatted.replace(/^\* (.*?)$/gm, '<li class="ai-li">$1</li>');
  formatted = formatted.replace(/^- (.*?)$/gm, '<li class="ai-li">$1</li>');
  formatted = formatted.replace(/(<li class="ai-li">.*?<\/li>\n?)+/gs, '<ul class="ai-ul">$&</ul>');

  // 5. Inline formatting (bold, code, italic)
  formatted = formatInline(formatted);

  // 6. Paragraph spacing (double newlines to br)
  formatted = formatted.replace(/\n{2,}/g, '<br/><br/>');
  formatted = formatted.replace(/\n/g, '<br/>');

  return formatted;
}

function formatInline(str) {
  if (!str) return '';
  return str
    .replace(/`([^`]+)`/g, '<code class="ai-code">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\*([^*]+)\*/g, '<em>$1</em>');
}
