import React, { useState, useRef, useEffect } from 'react';
import type { ElementInfo } from '../types';

interface AnnotationSidebarProps {
  elementInfo: ElementInfo | null;
  isOpen: boolean;
  onClose: () => void;
  zIndex?: number;
  onWidthChange?: (width: number) => void;
}

export function AnnotationSidebar({
  elementInfo,
  isOpen,
  onClose,
  zIndex = 1000000,
  onWidthChange,
}: AnnotationSidebarProps) {
  const [width, setWidth] = useState(400);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Array<{ id: string; text: string; timestamp: Date }>>([]);
  const [inputValue, setInputValue] = useState('');

  // Handle resize
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 300 && newWidth <= 800) {
        setWidth(newWidth);
        onWidthChange?.(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing, onWidthChange]);

  // Notify parent of width changes when sidebar opens
  useEffect(() => {
    if (isOpen) {
      onWidthChange?.(width);
    } else {
      onWidthChange?.(0);
    }
  }, [isOpen, width, onWidthChange]);

  // Prevent cursor change on body when resizing
  useEffect(() => {
    if (isResizing) {
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  }, [isResizing]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const newMessage = {
      id: Date.now().toString(),
      text: inputValue,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue('');
  };

  if (!isOpen) return null;

  return (
    <div
      ref={sidebarRef}
      data-loop-inspector-sidebar
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        bottom: 0,
        width: `${width}px`,
        backgroundColor: '#1a202c',
        color: '#e2e8f0',
        zIndex,
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-2px 0 8px rgba(0, 0, 0, 0.3)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
        {/* Resize handle */}
        <div
          data-loop-inspector-resize-handle
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: '4px',
            cursor: 'ew-resize',
            backgroundColor: isResizing ? '#4299e1' : 'transparent',
            transition: 'background-color 0.2s',
          }}
          onMouseDown={() => setIsResizing(true)}
          onMouseEnter={(e) => {
            if (!isResizing) {
              e.currentTarget.style.backgroundColor = 'rgba(66, 153, 225, 0.3)';
            }
          }}
          onMouseLeave={(e) => {
            if (!isResizing) {
              e.currentTarget.style.backgroundColor = 'transparent';
            }
          }}
        />

        {/* Header */}
        <div
          style={{
            padding: '16px',
            borderBottom: '1px solid #2d3748',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <h2 style={{ fontSize: '18px', fontWeight: '600', margin: 0 }}>
              Element Annotations
            </h2>
            {elementInfo && (
              <p style={{ fontSize: '12px', color: '#a0aec0', margin: '4px 0 0 0' }}>
                {elementInfo.component || elementInfo.name || 'Unknown Element'}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            data-loop-inspector-close
            style={{
              background: 'none',
              border: 'none',
              color: '#a0aec0',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '4px 8px',
              lineHeight: '1',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#e2e8f0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#a0aec0';
            }}
          >
            ×
          </button>
        </div>

        {/* Element Info Section */}
        {elementInfo && (
          <div
            style={{
              padding: '16px',
              borderBottom: '1px solid #2d3748',
              fontSize: '13px',
            }}
          >
            <div style={{ marginBottom: '8px' }}>
              <span style={{ color: '#a0aec0' }}>File: </span>
              <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                {elementInfo.file || elementInfo.path}
              </span>
            </div>
            {elementInfo.line && (
              <div style={{ marginBottom: '8px' }}>
                <span style={{ color: '#a0aec0' }}>Line: </span>
                <span style={{ fontFamily: 'monospace' }}>{elementInfo.line}</span>
              </div>
            )}
            {elementInfo.id && (
              <div>
                <span style={{ color: '#a0aec0' }}>ID: </span>
                <span style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                  {elementInfo.id}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Messages/Chat Area */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {messages.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                color: '#718096',
                fontSize: '14px',
                marginTop: '40px',
              }}
            >
              <p>No annotations yet.</p>
              <p style={{ fontSize: '12px', marginTop: '8px' }}>
                Add notes, comments, or feedback about this element.
              </p>
            </div>
          ) : (
            messages.map((message) => (
              <div
                key={message.id}
                style={{
                  backgroundColor: '#2d3748',
                  borderRadius: '8px',
                  padding: '12px',
                  fontSize: '14px',
                }}
              >
                <div style={{ marginBottom: '4px', color: '#e2e8f0' }}>
                  {message.text}
                </div>
                <div style={{ fontSize: '11px', color: '#718096' }}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Input Area */}
        <form
          onSubmit={handleSendMessage}
          style={{
            padding: '16px',
            borderTop: '1px solid #2d3748',
          }}
        >
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Add an annotation..."
              style={{
                flex: 1,
                padding: '10px 12px',
                backgroundColor: '#2d3748',
                border: '1px solid #4a5568',
                borderRadius: '6px',
                color: '#e2e8f0',
                fontSize: '14px',
                outline: 'none',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#4299e1';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#4a5568';
              }}
            />
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                backgroundColor: '#4299e1',
                border: 'none',
                borderRadius: '6px',
                color: 'white',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#3182ce';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#4299e1';
              }}
            >
              Send
            </button>
          </div>
        </form>
      </div>
  );
}
