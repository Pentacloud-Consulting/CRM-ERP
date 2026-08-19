'use client';
import { useMemo } from 'react';
import { formatDateTime } from '@/lib/utils/formatters';
import { FSU_CODES } from '@/lib/data/seedData';
import styles from './StatusTimeline.module.css';

export default function StatusTimeline({ events = [], compact = false }) {
  const milestones = useMemo(() => {
    const eventMap = {};
    events.forEach(evt => {
      if (!eventMap[evt.event_code] || new Date(evt.event_timestamp) > new Date(eventMap[evt.event_code].event_timestamp)) {
        eventMap[evt.event_code] = evt;
      }
    });

    return FSU_CODES.map(code => {
      const event = eventMap[code.code];
      return {
        ...code,
        completed: !!event,
        event,
        isException: code.code === 'AWR' || code.code === 'MAN',
      };
    });
  }, [events]);

  // Check for exception events
  const exceptionEvents = events.filter(e => e.event_code === 'AWR' || e.event_code === 'MAN');

  // Find the current (last completed) milestone
  const lastCompletedIdx = milestones.reduce((acc, m, i) => m.completed ? i : acc, -1);

  return (
    <div className={`${styles.timeline} ${compact ? styles.compact : ''}`}>
      <div className={styles.track}>
        {milestones.map((m, i) => (
          <div
            key={m.code}
            className={`${styles.milestone} ${m.completed ? styles.completed : ''} ${i === lastCompletedIdx ? styles.current : ''}`}
            title={m.event ? `${m.label}\n${formatDateTime(m.event.event_timestamp)}\n${m.event.location_airport}` : m.label}
          >
            <div className={styles.node}>
              <div className={styles.dot} />
              {i < milestones.length - 1 && (
                <div className={`${styles.connector} ${milestones[i + 1]?.completed ? styles.connectorFilled : ''}`} />
              )}
            </div>
            <div className={styles.label}>
              <span className={styles.code}>{m.code}</span>
              {!compact && <span className={styles.desc}>{m.label}</span>}
              {m.event && !compact && (
                <span className={styles.timestamp}>
                  {formatDateTime(m.event.event_timestamp)}
                </span>
              )}
              {m.event && !compact && (
                <span className={styles.location}>{m.event.location_airport}</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {exceptionEvents.length > 0 && (
        <div className={styles.exceptions}>
          {exceptionEvents.map(evt => (
            <div key={evt.event_id} className={styles.exceptionFlag}>
              <span className={styles.exceptionIcon}>⚠</span>
              <span className={styles.exceptionText}>
                {evt.event_code}: {evt.event_description}
              </span>
              <span className={styles.exceptionTime}>{formatDateTime(evt.event_timestamp)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
