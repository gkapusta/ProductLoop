import type { ElementInfo } from '../types';

interface InfoPanelProps {
  elementInfo: ElementInfo | null;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  zIndex?: number;
  onClose?: () => void;
}

export function InfoPanel({
  elementInfo,
  position = 'top-right',
  zIndex = 1000000,
  onClose,
}: InfoPanelProps) {
  if (!elementInfo) {
    return null;
  }

  const positionStyles: Record<string, React.CSSProperties> = {
    'top-left': { top: 16, left: 16 },
    'top-right': { top: 16, right: 16 },
    'bottom-left': { bottom: 16, left: 16 },
    'bottom-right': { bottom: 16, right: 16 },
  };

  const baseStyle: React.CSSProperties = {
    position: 'fixed',
    ...positionStyles[position],
    zIndex,
    backgroundColor: '#1a202c',
    color: '#e2e8f0',
    padding: '16px',
    borderRadius: '8px',
    boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)',
    fontFamily: 'monospace',
    fontSize: '12px',
    maxWidth: '400px',
    minWidth: '300px',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px',
    paddingBottom: '8px',
    borderBottom: '1px solid #4a5568',
  };

  const titleStyle: React.CSSProperties = {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#90cdf4',
  };

  const closeButtonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: '#e2e8f0',
    cursor: 'pointer',
    fontSize: '16px',
    padding: '0',
    width: '20px',
    height: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const rowStyle: React.CSSProperties = {
    marginBottom: '8px',
    display: 'flex',
  };

  const labelStyle: React.CSSProperties = {
    color: '#a0aec0',
    minWidth: '80px',
    marginRight: '8px',
  };

  const valueStyle: React.CSSProperties = {
    color: '#e2e8f0',
    wordBreak: 'break-all',
  };

  return (
    <div style={baseStyle} data-loop-inspector-panel>
      <div style={headerStyle}>
        <div style={titleStyle}>Element Inspector</div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            style={closeButtonStyle}
            aria-label="Close"
          >
            ×
          </button>
        )}
      </div>

      <div>
        {elementInfo.component && (
          <div style={rowStyle}>
            <span style={labelStyle}>Component:</span>
            <span style={valueStyle}>{elementInfo.component}</span>
          </div>
        )}
        {elementInfo.file && (
          <div style={rowStyle}>
            <span style={labelStyle}>File:</span>
            <span style={valueStyle}>{elementInfo.file}</span>
          </div>
        )}
        {elementInfo.path && (
          <div style={rowStyle}>
            <span style={labelStyle}>Path:</span>
            <span style={valueStyle}>{elementInfo.path}</span>
          </div>
        )}
        {elementInfo.line && (
          <div style={rowStyle}>
            <span style={labelStyle}>Line:</span>
            <span style={valueStyle}>{elementInfo.line}</span>
          </div>
        )}
        {elementInfo.name && (
          <div style={rowStyle}>
            <span style={labelStyle}>Element:</span>
            <span style={valueStyle}>{elementInfo.name}</span>
          </div>
        )}
        {elementInfo.id && (
          <div style={rowStyle}>
            <span style={labelStyle}>ID:</span>
            <span style={valueStyle}>{elementInfo.id}</span>
          </div>
        )}
        {elementInfo.metadata && (
          <div style={rowStyle}>
            <span style={labelStyle}>Metadata:</span>
            <span style={valueStyle}>{elementInfo.metadata}</span>
          </div>
        )}
      </div>
    </div>
  );
}
