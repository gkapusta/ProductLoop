import { useState, useEffect, useCallback } from 'react';
import type { ElementInfo } from '../types';
import { extractElementInfo, findNearestTaggedElement } from '../utils';

interface UseInspectorOptions {
  enabled?: boolean;
  attributePrefix?: string;
  onElementHover?: (info: ElementInfo | null) => void;
  onElementSelect?: (info: ElementInfo | null) => void;
}

export function useInspector({
  enabled = true,
  attributePrefix = 'data-dev',
  onElementHover,
  onElementSelect,
}: UseInspectorOptions = {}) {
  const [hoveredElement, setHoveredElement] = useState<HTMLElement | null>(null);
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null);
  const [hoveredInfo, setHoveredInfo] = useState<ElementInfo | null>(null);
  const [selectedInfo, setSelectedInfo] = useState<ElementInfo | null>(null);

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!enabled) {
        return;
      }

      const target = event.target as HTMLElement;

      // Ignore inspector's own elements
      if (
        target.hasAttribute('data-loop-inspector-highlight') ||
        target.hasAttribute('data-loop-inspector-panel') ||
        target.closest('[data-loop-inspector-panel]')
      ) {
        return;
      }

      const taggedElement = findNearestTaggedElement(target, attributePrefix);

      if (taggedElement !== hoveredElement) {
        setHoveredElement(taggedElement);

        if (taggedElement) {
          const info = extractElementInfo(taggedElement, attributePrefix);
          setHoveredInfo(info);
          onElementHover?.(info);
        } else {
          setHoveredInfo(null);
          onElementHover?.(null);
        }
      }
    },
    [enabled, attributePrefix, hoveredElement, onElementHover]
  );

  const handleClick = useCallback(
    (event: MouseEvent) => {
      if (!enabled) {
        return;
      }

      const target = event.target as HTMLElement;

      // Ignore inspector's own elements
      if (
        target.hasAttribute('data-loop-inspector-highlight') ||
        target.hasAttribute('data-loop-inspector-panel') ||
        target.closest('[data-loop-inspector-panel]')
      ) {
        return;
      }

      const taggedElement = findNearestTaggedElement(target, attributePrefix);

      if (taggedElement) {
        event.preventDefault();
        event.stopPropagation();

        setSelectedElement(taggedElement);
        const info = extractElementInfo(taggedElement, attributePrefix);
        setSelectedInfo(info);
        onElementSelect?.(info);
      }
    },
    [enabled, attributePrefix, onElementSelect]
  );

  useEffect(() => {
    if (!enabled) {
      setHoveredElement(null);
      setHoveredInfo(null);
      return;
    }

    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('click', handleClick, true);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove, true);
      document.removeEventListener('click', handleClick, true);
    };
  }, [enabled, handleMouseMove, handleClick]);

  const clearSelection = useCallback(() => {
    setSelectedElement(null);
    setSelectedInfo(null);
  }, []);

  return {
    hoveredElement,
    selectedElement,
    hoveredInfo,
    selectedInfo,
    clearSelection,
  };
}
