import React, { useState } from 'react';
import type { ElementInfo } from '../types';

interface RequestPopupProps {
  elementInfo: ElementInfo;
  position: { x: number; y: number };
  currentRole: 'PM' | 'Designer' | 'Developer';
  onClose: () => void;
  onSave: (data: { title: string; description: string }) => void;
  zIndex?: number;
}

export function RequestPopup({
  elementInfo,
  position,
  currentRole,
  onClose,
  onSave,
  zIndex = 1000001,
}: RequestPopupProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isRephrasing, setIsRephrasing] = useState<'title' | 'description' | null>(null);

  // Position popup intelligently to avoid going off-screen
  const popupStyle: React.CSSProperties = {
    position: 'fixed',
    left: Math.min(position.x, window.innerWidth - 450),
    top: Math.min(position.y, window.innerHeight - 400),
    width: '420px',
    zIndex,
    backgroundColor: '#1a202c',
    color: '#e2e8f0',
    borderRadius: '8px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.3)',
    border: '1px solid #2d3748',
  };

  const handleRephrase = async (field: 'title' | 'description') => {
    const content = field === 'title' ? title : description;
    if (!content.trim()) {
      return;
    }

    setIsRephrasing(field);

    // Simulate AI rephrasing (in production, this would call an API)
    setTimeout(() => {
      const rephrased = `[Improved by AI] ${content}`;
      if (field === 'title') {
        setTitle(rephrased);
      } else {
        setDescription(rephrased);
      }
      setIsRephrasing(null);
    }, 1000);
  };

  const handleSave = () => {
    if (!title.trim() || !description.trim()) {
      return;
    }

    onSave({
      title,
      description,
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.2)',
          zIndex: zIndex - 1,
        }}
        data-loop-inspector-popup-backdrop
      />

      {/* Popup Card */}
      <div
        style={popupStyle}
        onClick={(e) => e.stopPropagation()}
        data-loop-inspector-popup
      >
        {/* Header */}
        <div
          style={{
            padding: '16px',
            borderBottom: '1px solid #2d3748',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>New Request</h3>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#a0aec0',
                fontSize: '24px',
                cursor: 'pointer',
                padding: '0 8px',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
            <span
              style={{
                display: 'inline-block',
                padding: '2px 8px',
                backgroundColor: '#2d3748',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '500',
              }}
            >
              {currentRole}
            </span>
            <span style={{ fontSize: '11px', color: '#718096' }}>
              {elementInfo.name} • {elementInfo.width ? 'Area selected' : 'Point selected'}
            </span>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Title Field */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: '500' }}>Title</label>
              <button
                onClick={() => handleRephrase('title')}
                disabled={isRephrasing === 'title'}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9f7aea',
                  fontSize: '11px',
                  cursor: isRephrasing === 'title' ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  opacity: isRephrasing === 'title' ? 0.5 : 1,
                }}
              >
                ✨ {isRephrasing === 'title' ? 'Rephrasing...' : 'AI Assist'}
              </button>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter request title..."
              style={{
                width: '100%',
                padding: '10px 12px',
                backgroundColor: '#2d3748',
                border: '1px solid #4a5568',
                borderRadius: '6px',
                color: '#e2e8f0',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#9f7aea';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#4a5568';
              }}
            />
          </div>

          {/* Description Field */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: '500' }}>Brief Intro / Description</label>
              <button
                onClick={() => handleRephrase('description')}
                disabled={isRephrasing === 'description'}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9f7aea',
                  fontSize: '11px',
                  cursor: isRephrasing === 'description' ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  opacity: isRephrasing === 'description' ? 0.5 : 1,
                }}
              >
                ✨ {isRephrasing === 'description' ? 'Rephrasing...' : 'AI Assist'}
              </button>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly describe what should be done as part of this request..."
              style={{
                width: '100%',
                minHeight: '120px',
                padding: '10px 12px',
                backgroundColor: '#2d3748',
                border: '1px solid #4a5568',
                borderRadius: '6px',
                color: '#e2e8f0',
                fontSize: '14px',
                outline: 'none',
                resize: 'none',
                boxSizing: 'border-box',
                fontFamily: 'inherit',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#9f7aea';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#4a5568';
              }}
            />
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={!title.trim() || !description.trim()}
            style={{
              width: '100%',
              padding: '10px 20px',
              backgroundColor: !title.trim() || !description.trim() ? '#4a5568' : '#9f7aea',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              cursor: !title.trim() || !description.trim() ? 'not-allowed' : 'pointer',
              opacity: !title.trim() || !description.trim() ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (title.trim() && description.trim()) {
                e.currentTarget.style.backgroundColor = '#805ad5';
              }
            }}
            onMouseLeave={(e) => {
              if (title.trim() && description.trim()) {
                e.currentTarget.style.backgroundColor = '#9f7aea';
              }
            }}
          >
            Save Request
          </button>
        </div>
      </div>
    </>
  );
}
