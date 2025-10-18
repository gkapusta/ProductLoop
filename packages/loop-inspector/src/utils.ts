import type { ElementInfo } from './types';

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
