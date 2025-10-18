import { useState } from 'react';
import type { InspectorConfig } from '../types';
import { useInspector } from '../hooks/useInspector';
import { Highlighter } from './Highlighter';
import { InfoPanel } from './InfoPanel';

export function Inspector({
  enabled: initialEnabled = true,
  attributePrefix = 'data-dev',
  highlightColor = 'rgba(66, 153, 225, 0.5)',
  overlayPosition = 'top-right',
  zIndex = 999999,
  onElementSelect,
}: InspectorConfig) {
  const [isEnabled, setIsEnabled] = useState(initialEnabled);

  const { hoveredElement, selectedInfo, clearSelection } = useInspector({
    enabled: isEnabled,
    attributePrefix,
    onElementSelect: onElementSelect ? (info) => {
      if (info) {
        onElementSelect(info);
      }
    } : undefined,
  });

  return (
    <>
      {isEnabled && (
        <>
          <Highlighter
            targetElement={hoveredElement}
            color={highlightColor}
            zIndex={zIndex}
          />
          <InfoPanel
            elementInfo={selectedInfo}
            position={overlayPosition}
            zIndex={zIndex + 1}
            onClose={clearSelection}
          />
          <InspectorToggle
            isEnabled={isEnabled}
            onToggle={() => {
              setIsEnabled(!isEnabled);
              if (isEnabled) {
                clearSelection();
              }
            }}
            zIndex={zIndex + 2}
          />
        </>
      )}

      {!isEnabled && (
        <InspectorToggle
          isEnabled={isEnabled}
          onToggle={() => {
            setIsEnabled(!isEnabled);
          }}
          zIndex={zIndex + 2}
        />
      )}
    </>
  );
}

interface InspectorToggleProps {
  isEnabled: boolean;
  onToggle: () => void;
  zIndex: number;
}

function InspectorToggle({ isEnabled, onToggle, zIndex }: InspectorToggleProps) {
  const buttonStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 16,
    right: 16,
    zIndex,
    width: 48,
    height: 48,
    borderRadius: '50%',
    border: 'none',
    backgroundColor: isEnabled ? '#4299e1' : '#718096',
    color: 'white',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
    transition: 'all 0.2s ease',
  };

  return (
    <button
      type="button"
      onClick={onToggle}
      style={buttonStyle}
      title={isEnabled ? 'Disable Inspector' : 'Enable Inspector'}
      aria-label={isEnabled ? 'Disable Inspector' : 'Enable Inspector'}
      data-loop-inspector-toggle
    >
      {isEnabled ? '🔍' : '👁️'}
    </button>
  );
}
