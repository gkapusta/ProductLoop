import { useEffect, useState } from 'react';
import type { HighlightStyle } from '../types';
import { getElementBounds } from '../utils';

interface HighlighterProps {
  targetElement: HTMLElement | null;
  color?: string;
  zIndex?: number;
}

export function Highlighter({
  targetElement,
  color = 'rgba(66, 153, 225, 0.5)',
  zIndex = 999999,
}: HighlighterProps) {
  const [style, setStyle] = useState<HighlightStyle | null>(null);

  useEffect(() => {
    if (!targetElement) {
      setStyle(null);
      return;
    }

    const updatePosition = () => {
      const bounds = getElementBounds(targetElement);
      setStyle({
        position: 'fixed',
        top: bounds.top,
        left: bounds.left,
        width: bounds.width,
        height: bounds.height,
        pointerEvents: 'none',
        zIndex,
        border: `2px solid ${color}`,
        backgroundColor: color,
        transition: 'all 0.1s ease-out',
      });
    };

    updatePosition();

    // Update on scroll or resize
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
    };
  }, [targetElement, color, zIndex]);

  if (!style) {
    return null;
  }

  return <div style={style} data-loop-inspector-highlight />;
}
