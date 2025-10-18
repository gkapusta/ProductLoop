import React, {useEffect, useState} from 'react';
import type {ElementInfo} from '../types';
import {orpc} from "../utils/orpc";
import {useMutation} from "@tanstack/react-query";
import { createAIAgent, type AIAgent } from '../lib/ai-agent';

type RequestType = 'feature' | 'bug' | 'improvement' | 'idea';
type Priority = 'low' | 'medium' | 'high' | 'critical';

interface CreateRequestInput {
  title: string;
  description: string;
  type: RequestType;
  priority?: Priority;
  elementInfo?: {
    elementId?: string;
    elementName?: string;
    elementPath?: string;
    elementLine?: string;
    elementFile?: string;
    elementComponent?: string;
    elementMetadata?: Record<string, unknown>;
    positionX?: number;
    positionY?: number;
    width?: number;
    height?: number;
  };
  screenshotUrl?: string;
  pageUrl?: string;
}

interface RequestPopupProps {
  elementInfo: ElementInfo;
  position: { x: number; y: number };
  currentRole?: 'product-manager' | 'designer' | 'developer';
  onClose: () => void;
  onSave?: (data: CreateRequestInput) => Promise<void>;
  zIndex?: number;
}

export function RequestPopup(
  {
    elementInfo,
    position,
    currentRole = 'designer',
    onClose,
    onSave,
    zIndex = 1000001,
  }: RequestPopupProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [aiAgent, setAiAgent] = useState<AIAgent | null>(null);

  // Initialize AI agent if role is PM or Designer
  useEffect(() => {
    if (currentRole === 'product-manager' || currentRole === 'designer') {
      const agent = createAIAgent({
        role: currentRole,
        componentId: elementInfo.component,
        requestTitle: title,
        requestDescription: description,
      });
      setAiAgent(agent);
    } else {
      setAiAgent(null);
    }
  }, [currentRole, elementInfo.component]);

  const [requestType, setRequestType] = useState<RequestType>('feature');
  const [priority, setPriority] = useState<Priority>('medium');
  const [error, setError] = useState<string | null>(null);

  const {mutateAsync: createRequest, isPending: isSaving} = useMutation(orpc.productRequest.create.mutationOptions());

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

  const handleGenerateDescription = async () => {
    if (!title.trim() || !aiAgent) {
      return;
    }

    setIsGeneratingDescription(true);

    try {
      // Generate a brief description based on the title
      const prompt = `Based on this request title: "${title}", generate a brief but clear description of what should be done. Focus on making it actionable and concise (2-3 sentences). Only return the description, nothing else.`;

      const generatedDescription = await aiAgent.sendMessage(prompt, []);
      setDescription(generatedDescription.trim());
    } catch (error) {
      console.error('Error generating description:', error);
      // Keep original content on error
    } finally {
      setIsGeneratingDescription(false);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !description.trim()) {
      return;
    }

    setError(null);

    try {
      const requestData: CreateRequestInput = {
        title: title.trim(),
        description: description.trim(),
        type: requestType,
        priority,
        elementInfo: {
          elementId: elementInfo.id,
          elementName: elementInfo.name,
          elementPath: elementInfo.path,
          elementLine: elementInfo.line,
          elementFile: elementInfo.file,
          elementComponent: elementInfo.component,
          elementMetadata: elementInfo.metadata ? JSON.parse(elementInfo.metadata) : undefined,
          positionX: elementInfo.x,
          positionY: elementInfo.y,
          width: elementInfo.width,
          height: elementInfo.height,
        },
        pageUrl: window.location.href,
      };

      // Use oRPC mutation to create request
      await createRequest(requestData);

      // Call onSave callback if provided (for additional handling)
      if (onSave) {
        await onSave(requestData);
      }

      // Close popup on success
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save request');
    }
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
          <div style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
            <h3 style={{fontSize: '16px', fontWeight: '600', margin: 0}}>New Request</h3>
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
          <div style={{display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px'}}>
            <span
              style={{
                display: 'inline-block',
                padding: '2px 8px',
                backgroundColor: '#2d3748',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: '500',
                textTransform: 'capitalize',
              }}
            >
              {currentRole.replace('_', ' ')}
            </span>
            <span style={{fontSize: '11px', color: '#718096'}}>
              {elementInfo.name} • {elementInfo.width ? 'Area selected' : 'Point selected'}
            </span>
          </div>
        </div>

        {/* Content */}
        <div style={{padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px'}}>
          {/* Request Type and Priority */}
          <div style={{display: 'flex', gap: '12px'}}>
            <div style={{flex: 1}}>
              <label style={{fontSize: '13px', fontWeight: '500', display: 'block', marginBottom: '8px'}}>
                Type
              </label>
              <select
                value={requestType}
                onChange={(e) => setRequestType(e.target.value as RequestType)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#2d3748',
                  border: '1px solid #4a5568',
                  borderRadius: '6px',
                  color: '#e2e8f0',
                  fontSize: '14px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="feature">Feature</option>
                <option value="bug">Bug</option>
                <option value="improvement">Improvement</option>
                <option value="idea">Idea</option>
              </select>
            </div>
            <div style={{flex: 1}}>
              <label style={{fontSize: '13px', fontWeight: '500', display: 'block', marginBottom: '8px'}}>
                Priority
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#2d3748',
                  border: '1px solid #4a5568',
                  borderRadius: '6px',
                  color: '#e2e8f0',
                  fontSize: '14px',
                  outline: 'none',
                  cursor: 'pointer',
                }}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Title Field */}
          <div>
            <label style={{ fontSize: '13px', fontWeight: '500', marginBottom: '8px', display: 'block' }}>Title</label>
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
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px'}}>
              <label style={{fontSize: '13px', fontWeight: '500'}}>Brief Intro / Description</label>
              <button
                onClick={handleGenerateDescription}
                disabled={isGeneratingDescription || !title.trim() || !aiAgent}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9f7aea',
                  fontSize: '11px',
                  cursor: (isGeneratingDescription || !title.trim() || !aiAgent) ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  padding: '4px 8px',
                  opacity: (isGeneratingDescription || !title.trim() || !aiAgent) ? 0.5 : 1,
                }}
              >
                ✨ {isGeneratingDescription ? 'Generating...' : 'AI Assist'}
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

          {/* Error Message */}
          {error && (
            <div
              style={{
                padding: '10px 12px',
                backgroundColor: '#742a2a',
                border: '1px solid #fc8181',
                borderRadius: '6px',
                color: '#fed7d7',
                fontSize: '13px',
              }}
            >
              {error}
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={!title.trim() || !description.trim() || isSaving}
            style={{
              width: '100%',
              padding: '10px 20px',
              backgroundColor: !title.trim() || !description.trim() || isSaving ? '#4a5568' : '#9f7aea',
              border: 'none',
              borderRadius: '6px',
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              cursor: !title.trim() || !description.trim() || isSaving ? 'not-allowed' : 'pointer',
              opacity: !title.trim() || !description.trim() || isSaving ? 0.5 : 1,
            }}
            onMouseEnter={(e) => {
              if (title.trim() && description.trim() && !isSaving) {
                e.currentTarget.style.backgroundColor = '#805ad5';
              }
            }}
            onMouseLeave={(e) => {
              if (title.trim() && description.trim() && !isSaving) {
                e.currentTarget.style.backgroundColor = '#9f7aea';
              }
            }}
          >
            {isSaving ? 'Saving...' : 'Save Request'}
          </button>
        </div>
      </div>
    </>
  );
}
