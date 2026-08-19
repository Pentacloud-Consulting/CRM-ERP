'use client';
import { useRef, useState, useEffect, useCallback } from 'react';

export default function SignaturePad({ onSignatureChange, width = 500, height = 200 }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const getCoords = useCallback((e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if (e.touches) {
      return {
        x: (e.touches[0].clientX - rect.left) * scaleX,
        y: (e.touches[0].clientY - rect.top) * scaleY,
      };
    }
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }, []);

  const startDrawing = useCallback((e) => {
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = getCoords(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  }, [getCoords]);

  const draw = useCallback((e) => {
    if (!isDrawing) return;
    e.preventDefault();
    const ctx = canvasRef.current.getContext('2d');
    const { x, y } = getCoords(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  }, [isDrawing, getCoords]);

  const stopDrawing = useCallback(() => {
    if (isDrawing) {
      setIsDrawing(false);
      if (hasSignature && onSignatureChange) {
        onSignatureChange(canvasRef.current.toDataURL('image/png'));
      }
    }
  }, [isDrawing, hasSignature, onSignatureChange]);

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    if (onSignatureChange) onSignatureChange(null);
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        width={width * 2}
        height={height * 2}
        style={{
          width: '100%',
          height: height,
          border: '2px dashed var(--border-color, #d1d5db)',
          borderRadius: '12px',
          cursor: 'crosshair',
          touchAction: 'none',
          backgroundColor: '#fafbfc',
        }}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        onTouchStart={startDrawing}
        onTouchMove={draw}
        onTouchEnd={stopDrawing}
      />
      {!hasSignature && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
          color: '#9ca3af', fontSize: '14px', fontWeight: 500, pointerEvents: 'none',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px',
        }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
          </svg>
          <span>Draw your signature here</span>
        </div>
      )}
      {hasSignature && (
        <button
          onClick={clearSignature}
          style={{
            position: 'absolute', top: '8px', right: '8px',
            background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444',
            border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px',
            padding: '4px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
          }}
        >
          Clear
        </button>
      )}
    </div>
  );
}
