export { Inspector } from './components/Inspector';
export { Highlighter } from './components/Highlighter';
export { InfoPanel } from './components/InfoPanel';
export { RequestPopup } from './components/RequestPopup';
export { CollabSidebar } from './components/CollabSidebar';
export { RequestMarker } from './components/RequestMarker';
export { useInspector } from './hooks/useInspector';
export type { ElementInfo, InspectorConfig, HighlightStyle, Request, ChatMessage } from './types';
export { extractElementInfo, findNearestTaggedElement, getElementBounds, getComponentId } from './utils';
