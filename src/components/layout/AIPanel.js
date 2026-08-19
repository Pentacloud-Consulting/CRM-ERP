'use client';
import { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, ChevronLeft, ChevronRight, Upload, Sparkles, FileText, BarChart3, Loader2 } from 'lucide-react';
import { useApp } from '@/lib/store/AppContext';
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

  const handleSend = () => {
    if (!query.trim() || isTyping) return;
    const userMsg = query.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMsg, type: 'text' }]);
    setQuery('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const lower = userMsg.toLowerCase();
      let response;
      if (lower.includes('otd') || lower.includes('on-time') || lower.includes('delivery rate')) {
        response = AI_RESPONSES['otd'];
      } else if (lower.includes('exception') || lower.includes('alert') || lower.includes('issue')) {
        response = AI_RESPONSES['exception'];
      } else if (lower.includes('customs') || lower.includes('dwell') || lower.includes('clearance')) {
        response = AI_RESPONSES['customs'];
      } else if (lower.includes('weight') || lower.includes('carrier') || lower.includes('chargeable')) {
        response = AI_RESPONSES['weight'];
      } else if (lower.includes('where') || lower.includes('track') || lower.includes('status')) {
        response = { type: 'text', content: 'Based on the latest FSU data:\n\n• SHP-2026-00187 (SIN→NRT): Departed SIN at 02:30 UTC on SQ7212. ETA NRT ~09:00 UTC.\n• SHP-2026-00231 (DOH→HKG): Arrived HKG at 17:30 UTC on QR8820. Awaiting RCF scan.\n• SHP-2026-00201 (LHR→DOH): In Customs Hold at DOH — awaiting Certificate of Origin.' };
      } else {
        response = { type: 'text', content: `I understand you're asking about "${userMsg}". Let me check the governed metric catalog...\n\nI don't have a pre-defined metric for this query yet. I can help with:\n• OTD rates by trade lane\n• Open exceptions count\n• Customs dwell time\n• Chargeable weight by carrier\n• Shipment tracking status\n\nWould you like me to look into any of these?` };
      }

      setMessages(prev => [...prev, { role: 'assistant', ...response }]);
      setIsTyping(false);
    }, 1200 + Math.random() * 800);
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
                <div className={styles.msgText}>{msg.content}</div>
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
