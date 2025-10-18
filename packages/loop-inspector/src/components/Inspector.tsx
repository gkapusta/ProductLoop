import { useState, useEffect } from 'react';
import type { InspectorConfig, Request, ElementInfo } from '../types';
import { useInspector } from '../hooks/useInspector';
import { extractElementInfo, findNearestTaggedElement, getComponentId } from '../utils';
import { Highlighter } from './Highlighter';
import { InfoPanel } from './InfoPanel';
import { RequestPopup } from './RequestPopup';
import { CollabSidebar } from './CollabSidebar';
import { authClient } from '../lib/auth-client';

export function Inspector({
  enabled: initialEnabled = true,
  attributePrefix = 'data-dev',
  highlightColor = 'rgba(66, 153, 225, 0.5)',
  zIndex = 999999,
  onElementSelect,
  currentRole: initialRole = 'PM',
  onRequestCreate,
  onRequestUpdate,
}: InspectorConfig) {
  const [isEnabled] = useState(initialEnabled);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(0);
  const [requestMode, setRequestMode] = useState(false);
  const [currentRole, setCurrentRole] = useState(initialRole);
  const [requests, setRequests] = useState<Request[]>([]);
  const [cursorPosition, setCursorPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Request mode selection state
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragEnd, setDragEnd] = useState<{ x: number; y: number } | null>(null);
  const [showRequestPopup, setShowRequestPopup] = useState(false);
  const [selectedElementForRequest, setSelectedElementForRequest] = useState<ElementInfo | null>(null);
  const [requestPopupPosition, setRequestPopupPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Use Better Auth session hook
  const { data: session } = authClient.useSession();

  const { hoveredElement, hoveredInfo, clearSelection } = useInspector({
    enabled: isEnabled && requestMode,
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

  // Close sidebar when request mode is enabled
  useEffect(() => {
    if (requestMode) {
      setIsSidebarOpen(false);
    }
  }, [requestMode]);

  // Track cursor position when in request mode
  useEffect(() => {
    if (!requestMode) return;

    const handleMouseMove = (e: MouseEvent) => {
      setCursorPosition({ x: e.clientX, y: e.clientY });
    };

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [requestMode]);

  // Handle request mode mouse events
  const handleRequestModeMouseDown = (e: MouseEvent) => {
    if (!requestMode) return;

    // Ignore clicks on inspector elements
    const target = e.target as HTMLElement;
    if (
      target.closest('[data-loop-inspector-sidebar]') ||
      target.closest('[data-loop-inspector-toggle]') ||
      target.closest('[data-loop-inspector-popup]') ||
      target.closest('[data-loop-inspector-open-button]')
    ) {
      return;
    }

    const x = e.clientX;
    const y = e.clientY;

    setDragStart({ x, y });
    setIsDragging(true);
  };

  const handleRequestModeMouseMove = (e: MouseEvent) => {
    if (!isDragging || !dragStart) return;

    const x = e.clientX;
    const y = e.clientY;

    setDragEnd({ x, y });
  };

  const handleRequestModeMouseUp = (e: MouseEvent) => {
    if (!requestMode || !dragStart) return;

    const endX = e.clientX;
    const endY = e.clientY;

    // Check if it was a click (minimal drag) or actual drag
    const isDragAction = Math.abs(endX - dragStart.x) > 5 || Math.abs(endY - dragStart.y) > 5;

    // Get element at point and find nearest tagged element
    const elementAtPoint = document.elementFromPoint(endX, endY) as HTMLElement;
    const taggedElement = findNearestTaggedElement(elementAtPoint, attributePrefix);

    // Extract element info using utility function
    let elementInfo: ElementInfo;

    if (taggedElement) {
      const extracted = extractElementInfo(taggedElement, attributePrefix);
      elementInfo = extracted || {
        id: 'unknown',
        name: taggedElement.tagName,
        path: '',
        line: '',
        file: '',
        component: taggedElement.tagName,
        element: taggedElement,
      };
    } else {
      elementInfo = {
        id: 'unknown',
        name: elementAtPoint?.tagName || 'Unknown',
        path: '',
        line: '',
        file: '',
        component: elementAtPoint?.tagName || 'Unknown',
        element: elementAtPoint,
      };
    }

    // Add position coordinates
    elementInfo.x = dragStart.x;
    elementInfo.y = dragStart.y;

    if (isDragAction && dragEnd) {
      // Drag selection
      const x = Math.min(dragStart.x, endX);
      const y = Math.min(dragStart.y, endY);
      const width = Math.abs(endX - dragStart.x);
      const height = Math.abs(endY - dragStart.y);

      elementInfo.x = x;
      elementInfo.y = y;
      elementInfo.width = width;
      elementInfo.height = height;
    }

    setSelectedElementForRequest(elementInfo);
    setRequestPopupPosition({ x: endX, y: endY });
    setShowRequestPopup(true);
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

  // Handle Escape key to cancel Request Mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && requestMode) {
        setRequestMode(false);
        setIsDragging(false);
        setDragStart(null);
        setDragEnd(null);
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [requestMode]);

  useEffect(() => {
    if (requestMode) {
      document.addEventListener('mousedown', handleRequestModeMouseDown);
      document.addEventListener('mousemove', handleRequestModeMouseMove);
      document.addEventListener('mouseup', handleRequestModeMouseUp);

      return () => {
        document.removeEventListener('mousedown', handleRequestModeMouseDown);
        document.removeEventListener('mousemove', handleRequestModeMouseMove);
        document.removeEventListener('mouseup', handleRequestModeMouseUp);
      };
    }
  }, [requestMode, isDragging, dragStart, dragEnd]);

  const handleRequestSave = (data: { title: string; description: string }) => {
    if (!selectedElementForRequest) return;

    // Get user info from session or use fallback
    const userName = session?.user?.name || session?.user?.email ||
      (currentRole === 'PM' ? 'Sarah Chen' : currentRole === 'Designer' ? 'Alex Kim' : 'Mike Ross');

    const roleMap: Record<string, string> = {
      'product_manager': 'PM',
      'designer': 'Designer',
      'developer': 'Developer',
    };
    const userType = (session?.user as any)?.type;
    const userRole = (userType && roleMap[userType]) || currentRole;

    const newRequest: Request = {
      id: Date.now().toString(),
      x: selectedElementForRequest.x || 0,
      y: selectedElementForRequest.y || 0,
      width: selectedElementForRequest.width,
      height: selectedElementForRequest.height,
      elementInfo: selectedElementForRequest,
      componentId: getComponentId(selectedElementForRequest),
      title: data.title,
      description: data.description,
      priority: 'medium',
      author: userName,
      authorRole: userRole,
      assignee: 'All',
      timestamp: 'Just now',
      status: 'pending',
      chatHistory: [
        {
          role: 'user',
          content: data.description,
        },
        {
          role: 'assistant',
          content: 'Do you want me to help you refine this request further?',
        },
      ],
      requestSpec: data.description,
    };

    setRequests((prev) => [...prev, newRequest]);
    setShowRequestPopup(false);
    setSelectedElementForRequest(null);
    setRequestMode(false);
    setIsSidebarOpen(true);

    onRequestCreate?.(newRequest);
  };

  const handleFinalizeRequest = (requestId: string, sendTo: string) => {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          const updated = { ...r, assignee: sendTo, status: 'in-review' as const };
          onRequestUpdate?.(updated);
          return updated;
        }
        return r;
      })
    );
  };

  const handleSendMessage = (requestId: string, message: string) => {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          const updated = {
            ...r,
            chatHistory: [
              ...r.chatHistory,
              {
                role: 'user' as const,
                content: message,
              },
              {
                role: 'assistant' as const,
                content: 'I understand. Let me help you refine this further...',
              },
            ],
          };
          onRequestUpdate?.(updated);
          return updated;
        }
        return r;
      })
    );
  };

  const handlePriorityChange = (requestId: string, priority: 'low' | 'medium' | 'high') => {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id === requestId) {
          const updated = { ...r, priority };
          onRequestUpdate?.(updated);
          return updated;
        }
        return r;
      })
    );
  };

  const handleRequestModeChange = (enabled: boolean) => {
    setRequestMode(enabled);
    if (enabled) {
      setIsSidebarOpen(false);
    }
  };

  const selectionBox =
    isDragging && dragStart && dragEnd && requestMode
      ? {
          left: Math.min(dragStart.x, dragEnd.x),
          top: Math.min(dragStart.y, dragEnd.y),
          width: Math.abs(dragEnd.x - dragStart.x),
          height: Math.abs(dragEnd.y - dragStart.y),
        }
      : null;

  return (
    <>
      {/* Request Mode Overlay */}
      {requestMode && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: zIndex - 1,
            cursor: 'crosshair',
            backgroundColor: 'rgba(66, 153, 225, 0.05)',
            pointerEvents: 'none',
          }}
          data-loop-inspector-request-overlay
        >
          {selectionBox && (
            <div
              style={{
                position: 'fixed',
                left: selectionBox.left,
                top: selectionBox.top,
                width: selectionBox.width,
                height: selectionBox.height,
                border: '2px solid #9f7aea',
                backgroundColor: 'rgba(159, 122, 234, 0.1)',
                pointerEvents: 'none',
              }}
            />
          )}
        </div>
      )}

      {/* Request Popup */}
      {showRequestPopup && selectedElementForRequest && (
        <RequestPopup
          elementInfo={selectedElementForRequest}
          position={requestPopupPosition}
          currentRole={currentRole}
          onClose={() => {
            setShowRequestPopup(false);
            setSelectedElementForRequest(null);
            setRequestMode(false);
          }}
          onSave={handleRequestSave}
          zIndex={zIndex + 2}
        />
      )}

      {isEnabled && requestMode && !showRequestPopup && (
        <>
          <Highlighter targetElement={hoveredElement} color={highlightColor} zIndex={zIndex} />
          <InfoPanel
            elementInfo={hoveredInfo}
            position="cursor"
            cursorX={cursorPosition.x}
            cursorY={cursorPosition.y}
            zIndex={zIndex + 1}
          />
        </>
      )}

      {/* Collaboration Sidebar */}
      <CollabSidebar
        requests={requests}
        isOpen={isSidebarOpen}
        onClose={() => {
          setIsSidebarOpen(false);
          clearSelection();
        }}
        currentRole={currentRole}
        onRoleChange={setCurrentRole}
        onRequestClick={() => {}}
        onFinalizeRequest={handleFinalizeRequest}
        onSendMessage={handleSendMessage}
        onPriorityChange={handlePriorityChange}
        onWidthChange={setSidebarWidth}
        zIndex={zIndex + 3}
        requestMode={requestMode}
        onRequestModeChange={handleRequestModeChange}
      />

      {/* Open Product Loop Button */}
      {!isSidebarOpen && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            e.preventDefault();
            setIsSidebarOpen(true);
            if (requestMode) {
              setRequestMode(false);
              setIsDragging(false);
              setDragStart(null);
              setDragEnd(null);
            }
          }}
          onMouseDown={(e) => {
            e.stopPropagation();
          }}
          onMouseUp={(e) => {
            e.stopPropagation();
          }}
          style={{
            position: 'fixed',
            top: 24,
            right: 24,
            zIndex: zIndex + 2,
            padding: '12px 24px',
            backgroundColor: '#9f7aea',
            border: 'none',
            borderRadius: '8px',
            color: 'white',
            fontSize: '14px',
            fontWeight: '500',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(159, 122, 234, 0.3)',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#805ad5';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 16px rgba(159, 122, 234, 0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#9f7aea';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(159, 122, 234, 0.3)';
          }}
          title="Open Product Loop"
          aria-label="Open Product Loop"
          data-loop-inspector-open-button
        >
          Open Product Loop
        </button>
      )}
    </>
  );
}
