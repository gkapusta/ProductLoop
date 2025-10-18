import { useState, useRef, useEffect } from 'react';
import type { Request } from '../types';
import { authClient } from '../lib/auth-client';
import { LoginDialog } from './LoginDialog';
import { createAIAgent, type AIAgent } from '../lib/ai-agent';

interface CollabSidebarProps {
  requests: Request[];
  isOpen: boolean;
  onClose: () => void;
  currentRole: 'product-manager' | 'designer' | 'developer';
  onRoleChange: (role: 'product-manager' | 'designer' | 'developer') => void;
  onRequestClick: (requestId: string) => void;
  onFinalizeRequest: (requestId: string, sendTo: string) => void;
  onSendMessage: (requestId: string, message: string, aiResponse?: string) => void;
  onPriorityChange: (requestId: string, priority: 'low' | 'medium' | 'high') => void;
  onRequestSpecUpdate?: (requestId: string, requestSpec: string) => void;
  zIndex?: number;
  onWidthChange?: (width: number) => void;
  requestMode: boolean;
  onRequestModeChange: (enabled: boolean) => void;
}

export function CollabSidebar({
  requests,
  isOpen,
  onClose,
  currentRole,
  onRoleChange,
  onRequestClick,
  onFinalizeRequest,
  onSendMessage,
  onPriorityChange,
  onRequestSpecUpdate,
  zIndex = 1000000,
  onWidthChange,
  requestMode,
  onRequestModeChange,
}: CollabSidebarProps) {
  const [width, setWidth] = useState(480);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [detailTab, setDetailTab] = useState<'chat' | 'details'>('chat');
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showFinalizeModal, setShowFinalizeModal] = useState(false);
  const [sendToUser, setSendToUser] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const [aiAgent, setAiAgent] = useState<AIAgent | null>(null);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  // Use Better Auth session hook
  const { data: session, isPending } = authClient.useSession();

  // Check authentication when sidebar opens
  useEffect(() => {
    if (isOpen && !isPending && !session) {
      setShowLoginDialog(true);
    }
  }, [isOpen, session, isPending]);

  // Sync selected request with props when requests are updated
  useEffect(() => {
    if (selectedRequest) {
      const updatedRequest = requests.find((r) => r.id === selectedRequest.id);
      if (updatedRequest) {
        setSelectedRequest(updatedRequest);
      }
    }
  }, [requests]);

  // Initialize AI agent when a request is selected
  useEffect(() => {
    if (selectedRequest && (currentRole === 'PM' || currentRole === 'Designer')) {
      const agent = createAIAgent({
        role: currentRole,
        componentId: selectedRequest.componentId,
        requestTitle: selectedRequest.title,
        requestDescription: selectedRequest.description,
      });
      setAiAgent(agent);
    } else {
      setAiAgent(null);
    }
  }, [selectedRequest, currentRole]);

  // Handle resize
  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth >= 400 && newWidth <= 800) {
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

  const handleRequestSelect = (requestId: string) => {
    const request = requests.find((r) => r.id === requestId);
    if (request) {
      setSelectedRequest(request);
      setDetailTab('chat');
      onRequestClick(requestId);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedRequest || !messageInput.trim() || isSendingMessage) return;

    const userMessage = messageInput.trim();
    setMessageInput('');

    // If AI agent is available, get AI response first
    if (aiAgent) {
      setIsSendingMessage(true);

      try {
        // Get AI response
        const aiResponse = await aiAgent.sendMessage(
          userMessage,
          selectedRequest.chatHistory
        );

        // Send both user message and AI response through parent callback
        // The parent will update the request state
        onSendMessage(selectedRequest.id, userMessage, aiResponse);

        // Check if the AI response contains a refined requirement (for PM role)
        // Update requestSpec with the AI's refined version
        if (currentRole === 'PM' && onRequestSpecUpdate) {
          // The AI response is the refined requirement, so update the requestSpec
          onRequestSpecUpdate(selectedRequest.id, aiResponse);
        }
      } catch (error) {
        console.error('Error getting AI response:', error);
        // Still send user message even if AI fails
        onSendMessage(selectedRequest.id, userMessage);
      } finally {
        setIsSendingMessage(false);
      }
    } else {
      // No AI agent, just send the user message
      onSendMessage(selectedRequest.id, userMessage);
    }
  };

  const handleFinalizeClick = () => {
    setShowFinalizeModal(true);
  };

  const handleFinalizeConfirm = () => {
    if (!selectedRequest || !sendToUser) return;
    onFinalizeRequest(selectedRequest.id, sendToUser);
    setShowFinalizeModal(false);
    setSendToUser('');
  };

  const handleLoginSuccess = () => {
    setShowLoginDialog(false);
  };

  const handleSignOut = async () => {
    await authClient.signOut();
    setShowRoleDropdown(false);
  };

  // Get user display name and role
  const getUserInfo = () => {
    if (!session?.user) {
      return { name: 'Guest', role: currentRole, initial: 'G' };
    }

    const name = session.user.name || session.user.email || 'User';
    const roleMap: Record<string, string> = {
      'product-manager': 'PM',
      'designer': 'Designer',
      'developer': 'Developer',
    };
    const userType = (session.user as any)?.type;
    const role = (userType && roleMap[userType]) || currentRole;
    const initial = (name && name[0]?.toUpperCase()) || 'U';

    return { name, role, initial };
  };

  const userInfo = getUserInfo();

  if (!isOpen) return null;

  return (
    <>
      {/* Login Dialog */}
      {showLoginDialog && (
        <LoginDialog
          onClose={() => setShowLoginDialog(false)}
          onLoginSuccess={handleLoginSuccess}
          zIndex={zIndex + 20}
        />
      )}

      {/* Finalize Modal */}
      {showFinalizeModal && selectedRequest && (
        <>
          <div
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.3)',
              zIndex: zIndex + 10,
            }}
            onClick={() => setShowFinalizeModal(false)}
            data-loop-inspector-finalize-backdrop
          />
          <div
            style={{
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '500px',
              maxWidth: '90vw',
              backgroundColor: '#1a202c',
              color: '#e2e8f0',
              borderRadius: '8px',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
              border: '1px solid #2d3748',
              zIndex: zIndex + 11,
            }}
            data-loop-inspector-finalize-modal
          >
            {/* Modal Header */}
            <div style={{ padding: '20px', borderBottom: '1px solid #2d3748' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', margin: '0 0 4px 0' }}>
                Finalize Request Spec
              </h3>
              <p style={{ fontSize: '13px', color: '#a0aec0', margin: 0 }}>
                Review the request details and send to a collaborator
              </p>
            </div>

            {/* Modal Content */}
            <div style={{ padding: '20px' }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '11px', color: '#a0aec0', display: 'block', marginBottom: '4px' }}>
                  Title
                </label>
                <p style={{ fontSize: '13px', fontWeight: '500', margin: 0 }}>{selectedRequest.title}</p>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '11px', color: '#a0aec0', display: 'block', marginBottom: '4px' }}>
                  Author
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      backgroundColor: '#4a5568',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '11px',
                      fontWeight: '600',
                    }}
                  >
                    {selectedRequest.author[0]}
                  </div>
                  <span style={{ fontSize: '13px' }}>{selectedRequest.author}</span>
                  <span
                    style={{
                      padding: '2px 8px',
                      backgroundColor: '#2d3748',
                      borderRadius: '4px',
                      fontSize: '10px',
                      fontWeight: '500',
                    }}
                  >
                    {selectedRequest.authorRole}
                  </span>
                </div>
              </div>

              <div style={{ height: '1px', backgroundColor: '#2d3748', margin: '16px 0' }} />

              <div>
                <label style={{ fontSize: '13px', fontWeight: '500', display: 'block', marginBottom: '8px' }}>
                  Finalized Request Spec
                </label>
                <div
                  style={{
                    padding: '16px',
                    backgroundColor: 'rgba(159, 122, 234, 0.05)',
                    border: '1px solid rgba(159, 122, 234, 0.2)',
                    borderRadius: '6px',
                  }}
                >
                  <p style={{ fontSize: '13px', lineHeight: '1.6', margin: 0 }}>
                    {selectedRequest.requestSpec || selectedRequest.description}
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div
              style={{
                padding: '20px',
                borderTop: '1px solid #2d3748',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              <button
                onClick={() => setShowFinalizeModal(false)}
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'transparent',
                  border: '1px solid #4a5568',
                  borderRadius: '6px',
                  color: '#e2e8f0',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '13px', fontWeight: '500' }}>Send to</span>
                <select
                  value={sendToUser}
                  onChange={(e) => setSendToUser(e.target.value)}
                  style={{
                    padding: '10px 12px',
                    backgroundColor: '#2d3748',
                    border: '1px solid #4a5568',
                    borderRadius: '6px',
                    color: '#e2e8f0',
                    fontSize: '14px',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">Select user</option>
                  <option value="PM">Product Manager</option>
                  <option value="Designer">Product Designer</option>
                  <option value="Developer">Developer</option>
                </select>

                <button
                  onClick={handleFinalizeConfirm}
                  disabled={!sendToUser}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: sendToUser ? '#9f7aea' : '#4a5568',
                    border: 'none',
                    borderRadius: '6px',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: sendToUser ? 'pointer' : 'not-allowed',
                    opacity: sendToUser ? 1 : 0.5,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  📤 Send
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Main Sidebar */}
      <div
        ref={sidebarRef}
        data-loop-inspector-sidebar
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: `${width}px`,
          backgroundColor: 'rgba(26, 32, 44, 0.98)',
          backdropFilter: 'blur(12px)',
          color: '#e2e8f0',
          zIndex,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-2px 0 8px rgba(0, 0, 0, 0.3)',
          borderLeft: '1px solid #2d3748',
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
            backgroundColor: isResizing ? '#9f7aea' : 'transparent',
            transition: 'background-color 0.2s',
          }}
          onMouseDown={() => setIsResizing(true)}
          onMouseEnter={(e) => {
            if (!isResizing) {
              e.currentTarget.style.backgroundColor = 'rgba(159, 122, 234, 0.3)';
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
            padding: '16px 24px',
            borderBottom: '1px solid #2d3748',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ fontSize: '20px', fontWeight: '600', margin: 0 }}>Collaboration Hub</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Close Button */}
            <button
              onClick={onClose}
              style={{
                padding: '8px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '6px',
                color: '#a0aec0',
                fontSize: '20px',
                cursor: 'pointer',
                lineHeight: '1',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2d3748';
                e.currentTarget.style.color = '#e2e8f0';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = '#a0aec0';
              }}
              title="Close sidebar"
              aria-label="Close sidebar"
            >
              ×
            </button>
            {/* User Profile */}
            <div style={{ position: 'relative' }}>
              <button
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 12px',
                  backgroundColor: 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#e2e8f0',
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#2d3748';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: '#4a5568',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: '600',
                  }}
                >
                  {userInfo.initial}
                </div>
                <span
                  style={{
                    padding: '2px 8px',
                    backgroundColor: '#2d3748',
                    borderRadius: '4px',
                    fontSize: '11px',
                    fontWeight: '500',
                  }}
                >
                  {userInfo.role}
                </span>
              </button>

              {showRoleDropdown && (
                <>
                  <div
                    style={{
                      position: 'fixed',
                      inset: 0,
                      zIndex: 1,
                    }}
                    onClick={() => setShowRoleDropdown(false)}
                  />
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: '4px',
                      backgroundColor: '#1a202c',
                      border: '1px solid #2d3748',
                      borderRadius: '6px',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                      zIndex: 2,
                      minWidth: '200px',
                    }}
                  >
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid #2d3748' }}>
                      <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '2px' }}>
                        {userInfo.name}
                      </div>
                      {session?.user?.email && (
                        <div style={{ fontSize: '11px', color: '#718096' }}>
                          {session.user.email}
                        </div>
                      )}
                    </div>
                    {session ? (
                      <div style={{ padding: '8px 0' }}>
                        <button
                          onClick={handleSignOut}
                          style={{
                            width: '100%',
                            padding: '10px 16px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: '#e2e8f0',
                            fontSize: '13px',
                            textAlign: 'left',
                            cursor: 'pointer',
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#2d3748';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          Sign Out
                        </button>
                      </div>
                    ) : (
                      <div style={{ padding: '8px 0' }}>
                        {(['PM', 'Designer', 'Developer'] as const).map((role) => (
                          <button
                            key={role}
                            onClick={() => {
                              onRoleChange(role);
                              setShowRoleDropdown(false);
                            }}
                            style={{
                              width: '100%',
                              padding: '10px 16px',
                              backgroundColor: 'transparent',
                              border: 'none',
                              color: '#e2e8f0',
                              fontSize: '13px',
                              textAlign: 'left',
                              cursor: 'pointer',
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#2d3748';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent';
                            }}
                          >
                            {role === 'PM' ? 'Product Manager' : role}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Notifications */}
            <button
              style={{
                position: 'relative',
                padding: '8px',
                backgroundColor: 'transparent',
                border: 'none',
                borderRadius: '6px',
                color: '#a0aec0',
                fontSize: '16px',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#2d3748';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
              }}
            >
              🔔
              <span
                style={{
                  position: 'absolute',
                  top: '6px',
                  right: '6px',
                  width: '8px',
                  height: '8px',
                  backgroundColor: '#9f7aea',
                  borderRadius: '50%',
                }}
              />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          {selectedRequest ? (
            // Detail View
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
              {/* Breadcrumbs */}
              <div style={{ padding: '16px 24px', borderBottom: '1px solid #2d3748' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => setSelectedRequest(null)}
                    style={{
                      padding: '6px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      color: '#a0aec0',
                      fontSize: '16px',
                      cursor: 'pointer',
                      borderRadius: '4px',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#2d3748';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                    }}
                  >
                    ‹
                  </button>
                  <span style={{ fontSize: '13px', color: '#718096' }}>Requests</span>
                  <span style={{ fontSize: '13px', color: '#718096' }}>/</span>
                  <span style={{ fontSize: '13px', fontWeight: '500' }}>{selectedRequest.title}</span>
                </div>
              </div>

              {/* Tabs */}
              <div style={{ borderBottom: '1px solid #2d3748' }}>
                <div style={{ display: 'flex', paddingLeft: '24px' }}>
                  <button
                    onClick={() => setDetailTab('chat')}
                    style={{
                      padding: '12px 16px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderBottom: detailTab === 'chat' ? '2px solid #9f7aea' : '2px solid transparent',
                      color: detailTab === 'chat' ? '#e2e8f0' : '#718096',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                    }}
                  >
                    Chat
                  </button>
                  <button
                    onClick={() => setDetailTab('details')}
                    style={{
                      padding: '12px 16px',
                      backgroundColor: 'transparent',
                      border: 'none',
                      borderBottom: detailTab === 'details' ? '2px solid #9f7aea' : '2px solid transparent',
                      color: detailTab === 'details' ? '#e2e8f0' : '#718096',
                      fontSize: '13px',
                      fontWeight: '500',
                      cursor: 'pointer',
                    }}
                  >
                    Details
                  </button>
                </div>
              </div>

              {/* Tab Content */}
              {detailTab === 'chat' ? (
                // Chat Tab
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                  {/* Messages Area */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {/* Request Spec Block */}
                      <div
                        style={{
                          padding: '16px',
                          backgroundColor: 'rgba(159, 122, 234, 0.05)',
                          border: '1px solid rgba(159, 122, 234, 0.2)',
                          borderRadius: '6px',
                        }}
                      >
                        <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '8px' }}>
                          Request Spec
                        </div>
                        {selectedRequest.componentId && (
                          <div
                            style={{
                              padding: '8px 10px',
                              backgroundColor: '#2d3748',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontFamily: 'monospace',
                              color: '#90cdf4',
                              marginBottom: '12px',
                              wordBreak: 'break-all',
                            }}
                          >
                            {selectedRequest.componentId}
                          </div>
                        )}
                        <p style={{ fontSize: '13px', lineHeight: '1.6', margin: 0 }}>
                          {selectedRequest.requestSpec || selectedRequest.description}
                        </p>
                      </div>

                      {/* Chat Messages */}
                      {selectedRequest.chatHistory.map((msg, i) => (
                        <div key={i} style={{ display: 'flex', gap: '12px', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                          {msg.role === 'assistant' && (
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '50%',
                                backgroundColor: '#4a5568',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px',
                                fontWeight: '600',
                                flexShrink: 0,
                              }}
                            >
                              AI
                            </div>
                          )}
                          <div style={{ maxWidth: '75%' }}>
                            {msg.role === 'assistant' && (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <span style={{ fontSize: '13px', fontWeight: '500' }}>
                                  AI Assistant
                                </span>
                              </div>
                            )}
                            <div
                              style={{
                                padding: '10px 14px',
                                backgroundColor: msg.role === 'user' ? '#4a5568' : 'transparent',
                                borderRadius: '12px',
                                fontSize: '13px',
                                lineHeight: '1.6',
                              }}
                            >
                              {msg.content}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Chat Input */}
                  <div style={{ padding: '24px', borderTop: '1px solid #2d3748' }}>
                    <textarea
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Type your message... (Press Enter to send, Shift+Enter for new line)"
                      style={{
                        width: '100%',
                        minHeight: '80px',
                        padding: '12px',
                        backgroundColor: '#2d3748',
                        border: '1px solid #4a5568',
                        borderRadius: '6px',
                        color: '#e2e8f0',
                        fontSize: '14px',
                        resize: 'none',
                        marginBottom: '12px',
                        fontFamily: 'inherit',
                        boxSizing: 'border-box',
                      }}
                    />
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                      <button
                        style={{
                          padding: '8px 16px',
                          backgroundColor: 'transparent',
                          border: '1px solid #4a5568',
                          borderRadius: '6px',
                          color: '#e2e8f0',
                          fontSize: '13px',
                          cursor: 'pointer',
                        }}
                      >
                        📎 Attach
                      </button>
                      <button
                        style={{
                          padding: '8px 16px',
                          backgroundColor: 'transparent',
                          border: '1px solid #4a5568',
                          borderRadius: '6px',
                          color: '#e2e8f0',
                          fontSize: '13px',
                          cursor: 'pointer',
                        }}
                      >
                        📷 Screenshot
                      </button>
                      <button
                        onClick={handleSendMessage}
                        disabled={!messageInput.trim() || isSendingMessage}
                        style={{
                          flex: 1,
                          padding: '8px 16px',
                          backgroundColor: (messageInput.trim() && !isSendingMessage) ? '#9f7aea' : '#4a5568',
                          border: 'none',
                          borderRadius: '6px',
                          color: 'white',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: (messageInput.trim() && !isSendingMessage) ? 'pointer' : 'not-allowed',
                          opacity: (messageInput.trim() && !isSendingMessage) ? 1 : 0.5,
                        }}
                      >
                        {isSendingMessage ? '⏳ Sending...' : '📤 Send'}
                      </button>
                    </div>

                    <div style={{ height: '1px', backgroundColor: '#2d3748', margin: '16px 0' }} />

                    <button
                      onClick={handleFinalizeClick}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        backgroundColor: 'transparent',
                        border: '1px solid rgba(159, 122, 234, 0.5)',
                        borderRadius: '6px',
                        color: '#e2e8f0',
                        fontSize: '13px',
                        fontWeight: '500',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(159, 122, 234, 0.1)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      ✓ Finalize Request Spec
                    </button>
                  </div>
                </div>
              ) : (
                // Details Tab
                <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {/* Status and Priority */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                        <span style={{ fontSize: '13px', color: '#a0aec0' }}>Priority</span>
                        <select
                          value={selectedRequest.priority}
                          onChange={(e) => onPriorityChange(selectedRequest.id, e.target.value as 'low' | 'medium' | 'high')}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: selectedRequest.priority === 'high' ? '#7f1d1d' : selectedRequest.priority === 'medium' ? '#2d3748' : '#2d3748',
                            border: '1px solid #4a5568',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '500',
                            textTransform: 'uppercase',
                            color: '#e2e8f0',
                            cursor: 'pointer',
                          }}
                        >
                          <option value="low">LOW</option>
                          <option value="medium">MEDIUM</option>
                          <option value="high">HIGH</option>
                        </select>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '13px', color: '#a0aec0' }}>Status</span>
                        <span
                          style={{
                            padding: '4px 12px',
                            backgroundColor: '#2d3748',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '500',
                            textTransform: 'capitalize',
                          }}
                        >
                          {selectedRequest.status}
                        </span>
                      </div>
                    </div>

                    <div style={{ height: '1px', backgroundColor: '#2d3748' }} />

                    {/* Author and Assignee */}
                    <div>
                      <div style={{ marginBottom: '12px' }}>
                        <span style={{ fontSize: '13px', color: '#a0aec0', display: 'block', marginBottom: '8px' }}>
                          Created by
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              backgroundColor: '#4a5568',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '11px',
                              fontWeight: '600',
                            }}
                          >
                            {selectedRequest.author[0]}
                          </div>
                          <span style={{ fontSize: '13px' }}>{selectedRequest.author}</span>
                          <span
                            style={{
                              padding: '2px 8px',
                              backgroundColor: '#2d3748',
                              borderRadius: '4px',
                              fontSize: '10px',
                              fontWeight: '500',
                            }}
                          >
                            {selectedRequest.authorRole}
                          </span>
                        </div>
                      </div>
                      <div style={{ marginBottom: '12px' }}>
                        <span style={{ fontSize: '13px', color: '#a0aec0', display: 'block', marginBottom: '4px' }}>
                          Assigned to
                        </span>
                        <span style={{ fontSize: '13px' }}>{selectedRequest.assignee}</span>
                      </div>
                      <div>
                        <span style={{ fontSize: '13px', color: '#a0aec0', display: 'block', marginBottom: '4px' }}>
                          Created
                        </span>
                        <span style={{ fontSize: '13px', color: '#718096' }}>{selectedRequest.timestamp}</span>
                      </div>
                    </div>

                    <div style={{ height: '1px', backgroundColor: '#2d3748' }} />

                    {/* Component ID */}
                    {selectedRequest.componentId && (
                      <>
                        <div>
                          <span
                            style={{
                              fontSize: '13px',
                              fontWeight: '500',
                              display: 'block',
                              marginBottom: '12px',
                            }}
                          >
                            Component
                          </span>
                          <div
                            style={{
                              padding: '12px',
                              backgroundColor: '#2d3748',
                              borderRadius: '6px',
                              fontSize: '12px',
                              fontFamily: 'monospace',
                              color: '#90cdf4',
                              wordBreak: 'break-all',
                            }}
                          >
                            {selectedRequest.componentId}
                          </div>
                        </div>

                        <div style={{ height: '1px', backgroundColor: '#2d3748' }} />
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // List View
            <>
              <div style={{ padding: '24px', flexShrink: 0 }}>
                {/* Request Mode Toggle */}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '16px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '2px' }}>
                      Turn on Request Mode
                    </div>
                    <div style={{ fontSize: '11px', color: '#718096' }}>Click or drag to annotate</div>
                  </div>
                  <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '28px' }}>
                    <input
                      type="checkbox"
                      checked={requestMode}
                      onChange={(e) => onRequestModeChange(e.target.checked)}
                      style={{ opacity: 0, width: 0, height: 0 }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        cursor: 'pointer',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: requestMode ? '#9f7aea' : '#4a5568',
                        transition: '0.3s',
                        borderRadius: '28px',
                      }}
                    >
                      <span
                        style={{
                          position: 'absolute',
                          content: '',
                          height: '20px',
                          width: '20px',
                          left: requestMode ? '24px' : '4px',
                          bottom: '4px',
                          backgroundColor: 'white',
                          transition: '0.3s',
                          borderRadius: '50%',
                        }}
                      />
                    </span>
                  </label>
                </div>

                <div style={{ height: '1px', backgroundColor: '#2d3748', margin: '16px 0' }} />

                {/* Active Requests Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '13px', fontWeight: '500', margin: 0 }}>Active Requests</h3>
                  <span
                    style={{
                      padding: '4px 12px',
                      backgroundColor: '#2d3748',
                      borderRadius: '4px',
                      fontSize: '11px',
                      fontWeight: '500',
                    }}
                  >
                    {requests.length}
                  </span>
                </div>
              </div>

              {/* Requests List */}
              <div style={{ flex: 1, overflowY: 'auto', paddingLeft: '24px', paddingRight: '24px', paddingBottom: '24px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {requests.map((request) => (
                    <div
                      key={request.id}
                      onClick={() => handleRequestSelect(request.id)}
                      style={{
                        padding: '16px',
                        backgroundColor: '#1a202c',
                        border: '1px solid #2d3748',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        transition: 'border-color 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = '#9f7aea';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = '#2d3748';
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: '500', marginBottom: '4px' }}>
                            {request.title}
                          </div>
                          <div style={{ fontSize: '11px', color: '#718096' }}>
                            by {request.author} • {request.timestamp}
                          </div>
                        </div>
                        <span
                          style={{
                            padding: '4px 8px',
                            backgroundColor: request.priority === 'high' ? '#7f1d1d' : '#2d3748',
                            borderRadius: '4px',
                            fontSize: '10px',
                            fontWeight: '500',
                            textTransform: 'uppercase',
                            height: 'fit-content',
                          }}
                        >
                          {request.priority}
                        </span>
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              backgroundColor: '#4a5568',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '10px',
                              fontWeight: '600',
                            }}
                          >
                            {request.assignee[0]}
                          </div>
                          <span style={{ fontSize: '11px', color: '#718096' }}>→ {request.assignee}</span>
                        </div>
                        <span
                          style={{
                            padding: '4px 8px',
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

                      {request.elementInfo && (
                        <div style={{ fontSize: '11px', color: '#718096', marginTop: '8px' }}>
                          Element: {request.elementInfo.name}
                        </div>
                      )}
                    </div>
                  ))}

                  {requests.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '40px 20px', color: '#718096' }}>
                      <p style={{ fontSize: '13px', margin: 0 }}>No requests yet.</p>
                      <p style={{ fontSize: '11px', marginTop: '8px' }}>
                        Turn on Request Mode to create your first request.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
