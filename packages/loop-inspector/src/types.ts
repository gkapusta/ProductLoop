export interface ElementInfo {
  id: string;
  name: string;
  path: string;
  line: string;
  file: string;
  component: string;
  metadata?: string;
  element: HTMLElement;
}

export interface InspectorConfig {
  enabled?: boolean;
  attributePrefix?: string;
  highlightColor?: string;
  overlayPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  zIndex?: number;
  onElementSelect?: (info: ElementInfo) => void;
}

export interface HighlightStyle {
  position: 'fixed';
  top: number;
  left: number;
  width: number;
  height: number;
  pointerEvents: 'none';
  zIndex: number;
  border: string;
  backgroundColor: string;
  transition: string;
}
