import type { ElementInfo } from './types';

export function getComponentId(elementInfo: ElementInfo | null | undefined): string {
  if (!elementInfo) return 'Unknown';

  // If we have the id attribute, it's already in the format path:line:column
  if (elementInfo.id && elementInfo.id !== 'unknown') {
    return elementInfo.id;
  }

  // Otherwise construct from available parts
  const parts: string[] = [];

  if (elementInfo.path) {
    parts.push(elementInfo.path);
  } else if (elementInfo.file) {
    parts.push(elementInfo.file);
  }

  if (elementInfo.line) {
    parts.push(elementInfo.line);
  }

  return parts.length > 0 ? parts.join(':') : `${elementInfo.component || elementInfo.name || 'Unknown'}`;
}

export function extractElementInfo(
  element: HTMLElement,
  attributePrefix = 'data-dev'
): ElementInfo | null {
  const id = element.getAttribute(`${attributePrefix}-id`);
  const name = element.getAttribute(`${attributePrefix}-name`);
  const path = element.getAttribute(`${attributePrefix}-path`);
  const line = element.getAttribute(`${attributePrefix}-line`);
  const file = element.getAttribute(`${attributePrefix}-file`);
  const component = element.getAttribute(`${attributePrefix}-component`);
  const metadata = element.getAttribute(`${attributePrefix}-metadata`);

  // Element must have at least an ID or path to be considered tagged
  if (!id && !path) {
    return null;
  }

  return {
    id: id ?? '',
    name: name ?? '',
    path: path ?? '',
    line: line ?? '',
    file: file ?? '',
    component: component ?? '',
    metadata: metadata ?? undefined,
    element,
  };
}

export function getElementBounds(element: HTMLElement): DOMRect {
  return element.getBoundingClientRect();
}

export function findNearestTaggedElement(
  target: HTMLElement,
  attributePrefix = 'data-dev'
): HTMLElement | null {
  let current: HTMLElement | null = target;

  while (current && current !== document.body) {
    const hasAttribute =
      current.hasAttribute(`${attributePrefix}-id`) ||
      current.hasAttribute(`${attributePrefix}-path`);

    if (hasAttribute) {
      return current;
    }

    current = current.parentElement;
  }

  return null;
}
