import { useState, useEffect } from 'react';
import type { InspectorConfig } from '../types';
import { useInspector } from '../hooks/useInspector';
import { Highlighter } from './Highlighter';
import { InfoPanel } from './InfoPanel';
import { AnnotationSidebar } from './AnnotationSidebar';

export function Inspector({
  enabled: initialEnabled = true,
  attributePrefix = 'data-dev',
  highlightColor = 'rgba(66, 153, 225, 0.5)',
  overlayPosition = 'top-right',
  zIndex = 999999,
  onElementSelect,
}: InspectorConfig) {
  const [isEnabled, setIsEnabled] = useState(initialEnabled);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(0);

  const { hoveredElement, selectedInfo, clearSelection } = useInspector({
    enabled: isEnabled,
    attributePrefix,
    onElementSelect: onElementSelect ? (info) => {
      if (info) {
        onElementSelect(info);
      }
    } : undefined,
  });

  // Apply layout shift when sidebar opens/closes
  useEffect(() => {
    const root = document.documentElement;
    if (isSidebarOpen && sidebarWidth > 0) {
      root.style.marginRight = `${sidebarWidth}px`;
      root.style.transition = 'margin-right 0.2s ease';
    } else {
      root.style.marginRight = '0';
    }

    return () => {
      root.style.marginRight = '0';
      root.style.transition = '';
    };
  }, [isSidebarOpen, sidebarWidth]);

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
          <AnnotationSidebar
            elementInfo={selectedInfo}
            isOpen={isSidebarOpen}
            onClose={() => {
              setIsSidebarOpen(false);
              clearSelection();
            }}
            onWidthChange={setSidebarWidth}
            zIndex={zIndex + 3}
          />
          <InspectorToggle
            isEnabled={isEnabled}
            onToggle={() => {
              setIsEnabled(!isEnabled);
              if (isEnabled) {
                clearSelection();
                setIsSidebarOpen(false);
              }
            }}
            zIndex={zIndex + 2}
          />
          <SidebarToggle
            isSidebarOpen={isSidebarOpen}
            onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
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

interface SidebarToggleProps {
  isSidebarOpen: boolean;
  onToggle: () => void;
  zIndex: number;
}

function SidebarToggle({ isSidebarOpen, onToggle, zIndex }: SidebarToggleProps) {
  const buttonStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: 76,
    right: 16,
    zIndex,
    width: 48,
    height: 48,
    borderRadius: '50%',
    border: 'none',
    backgroundColor: isSidebarOpen ? '#38a169' : '#718096',
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
      title={isSidebarOpen ? 'Close Annotations' : 'Open Annotations'}
      aria-label={isSidebarOpen ? 'Close Annotations' : 'Open Annotations'}
      data-loop-inspector-sidebar-toggle
    >
      {isSidebarOpen ? '📝' : '💬'}
    </button>
  );
}
