import React, { useState } from 'react';
import type { Request } from '../types';

interface RequestMarkerProps {
  request: Request;
  onClick: () => void;
  zIndex?: number;
}

export function RequestMarker({ request, onClick, zIndex = 999998 }: RequestMarkerProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const priorityColors = {
    low: '#3b82f6',
    medium: '#eab308',
    high: '#ef4444',
  };

  const markerStyle: React.CSSProperties = {
    position: 'fixed',
    left: request.x,
    top: request.y,
    transform: 'translate(-50%, -50%)',
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: priorityColors[request.priority],
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    cursor: 'pointer',
    zIndex,
    transition: 'transform 0.2s ease',
    fontSize: '16px',
  };

  const tooltipStyle: React.CSSProperties = {
    position: 'fixed',
    left: request.x + 20,
    top: request.y - 10,
    backgroundColor: '#1a202c',
    color: '#e2e8f0',
    padding: '12px',
    borderRadius: '6px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    border: '1px solid #2d3748',
    zIndex: zIndex + 1,
    minWidth: '200px',
    maxWidth: '300px',
  };

  return (
    <>
      <div
        style={isHovered ? { ...markerStyle, transform: 'translate(-50%, -50%) scale(1.1)' } : markerStyle}
        onClick={onClick}
        onMouseEnter={() => {
          setIsHovered(true);
          setShowTooltip(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          setShowTooltip(false);
        }}
        data-loop-inspector-marker
      >
        💬
      </div>

      {showTooltip && (
        <div style={tooltipStyle} data-loop-inspector-marker-tooltip>
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '4px' }}>{request.title}</div>
            <div style={{ fontSize: '11px', color: '#a0aec0' }}>
              by {request.author} • {request.timestamp}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            <span
              style={{
                display: 'inline-block',
                padding: '2px 8px',
                backgroundColor: request.priority === 'high' ? '#7f1d1d' : '#2d3748',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: '500',
                textTransform: 'uppercase',
              }}
            >
              {request.priority}
            </span>
            <span
              style={{
                display: 'inline-block',
                padding: '2px 8px',
                backgroundColor: '#2d3748',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: '500',
                textTransform: 'capitalize',
              }}
            >
              {request.status}
            </span>
          </div>
        </div>
      )}
    </>
  );
}
