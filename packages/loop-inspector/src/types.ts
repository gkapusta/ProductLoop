export interface ElementInfo {
  id: string;
  name: string;
  path: string;
  line: string;
  file: string;
  component: string;
  metadata?: string;
  element: HTMLElement;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface Request {
  id: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  elementInfo?: ElementInfo;
  componentId?: string; // Format: path:line:column (e.g., src/components/ui/card.tsx:12:4)
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  author: string;
  authorRole: 'PM' | 'Designer' | 'Developer';
  assignee: string;
  timestamp: string;
  status: 'pending' | 'in-review' | 'approved' | 'rejected';
  chatHistory: ChatMessage[];
  attachedFiles?: string[];
  requestSpec: string;
}

export interface InspectorConfig {
  enabled?: boolean;
  attributePrefix?: string;
  highlightColor?: string;
  overlayPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  zIndex?: number;
  onElementSelect?: (info: ElementInfo) => void;
  currentRole?: 'PM' | 'Designer' | 'Developer';
  onRequestCreate?: (request: Request) => void;
  onRequestUpdate?: (request: Request) => void;
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
