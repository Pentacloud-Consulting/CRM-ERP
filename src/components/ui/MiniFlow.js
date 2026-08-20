import React from 'react';

export default function MiniFlow({ steps, currentStepIndex }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
      {steps.map((step, idx) => {
        const isCompleted = idx <= currentStepIndex;
        const isCurrent = idx === currentStepIndex;
        
        return (
          <React.Fragment key={step}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px', minWidth: '60px' }}>
              <div style={{ 
                width: '12px', height: '12px', borderRadius: '50%', 
                backgroundColor: isCompleted ? 'var(--primary)' : 'var(--bg-secondary)',
                border: `2px solid ${isCompleted ? 'var(--primary)' : 'var(--border-color)'}`,
                boxShadow: isCurrent ? '0 0 0 3px var(--primary-tint)' : 'none',
                transition: 'all 0.3s ease'
              }} />
              <span style={{ 
                fontSize: '10px', 
                fontWeight: isCurrent ? 700 : 500,
                color: isCompleted ? 'var(--text-primary)' : 'var(--text-tertiary)',
                textAlign: 'center',
                whiteSpace: 'nowrap'
              }}>{step}</span>
            </div>
            {idx < steps.length - 1 && (
              <div style={{ 
                flex: 1, 
                height: '2px', 
                backgroundColor: idx < currentStepIndex ? 'var(--primary)' : 'var(--border-color)',
                minWidth: '20px',
                marginTop: '-16px',
                transition: 'all 0.3s ease'
              }} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}
