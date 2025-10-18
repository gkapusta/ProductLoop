# @product-loop/inspector

A React element inspector and highlighter for loop-tagged components. Similar to React DevTools, this package provides visual debugging tools for elements tagged with custom data attributes by [@product-loop/loop-tagger](../loop-tagger).

## Features

- 🔍 **Visual Element Inspection** - Hover over any tagged element to see a highlight overlay
- 📍 **Source Location** - Click elements to view their source file, line number, and component name
- 🎨 **Customizable Appearance** - Configure colors, position, and z-index
- ⚡ **Zero Runtime Cost** - Only active when enabled, no performance impact when disabled
- 🎯 **Smart Detection** - Automatically finds the nearest tagged parent element
- 🚀 **TypeScript Support** - Full type definitions included

## Installation

```bash
bun install @product-loop/inspector
```

## Quick Start

### Basic Usage

```tsx
import { Inspector } from '@product-loop/inspector';

function App() {
  return (
    <>
      <Inspector />
      {/* Your app components */}
    </>
  );
}
```

### With Configuration

```tsx
import { Inspector } from '@product-loop/inspector';

function App() {
  return (
    <>
      <Inspector
        enabled={process.env.NODE_ENV === 'development'}
        attributePrefix="data-dev"
        highlightColor="rgba(66, 153, 225, 0.5)"
        overlayPosition="top-right"
        onElementSelect={(info) => {
          console.log('Selected element:', info);
        }}
      />
      {/* Your app components */}
    </>
  );
}
```

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `enabled` | `boolean` | `true` | Enable/disable the inspector |
| `attributePrefix` | `string` | `'data-dev'` | Prefix for data attributes to detect |
| `highlightColor` | `string` | `'rgba(66, 153, 225, 0.5)'` | Color of the highlight overlay |
| `overlayPosition` | `'top-left' \| 'top-right' \| 'bottom-left' \| 'bottom-right'` | `'top-right'` | Position of the info panel |
| `zIndex` | `number` | `999999` | Z-index for inspector elements |
| `onElementSelect` | `(info: ElementInfo) => void` | `undefined` | Callback when element is clicked |

## Advanced Usage

### Using the Hook Directly

```tsx
import { useInspector } from '@product-loop/inspector';

function MyCustomInspector() {
  const { hoveredElement, hoveredInfo, selectedInfo, clearSelection } = useInspector({
    enabled: true,
    attributePrefix: 'data-dev',
    onElementHover: (info) => {
      console.log('Hovering:', info);
    },
    onElementSelect: (info) => {
      console.log('Selected:', info);
    },
  });

  return (
    <div>
      {hoveredInfo && <div>Hovering: {hoveredInfo.component}</div>}
      {selectedInfo && (
        <div>
          <div>Selected: {selectedInfo.component}</div>
          <button type="button" onClick={clearSelection}>Clear</button>
        </div>
      )}
    </div>
  );
}
```

### Custom Components

```tsx
import { Highlighter, InfoPanel } from '@product-loop/inspector';
import { useState } from 'react';

function CustomInspector() {
  const [element, setElement] = useState<HTMLElement | null>(null);
  const [info, setInfo] = useState<ElementInfo | null>(null);

  return (
    <>
      <Highlighter
        targetElement={element}
        color="rgba(255, 0, 0, 0.3)"
        zIndex={999999}
      />
      <InfoPanel
        elementInfo={info}
        position="bottom-left"
        onClose={() => setInfo(null)}
      />
    </>
  );
}
```

### Utility Functions

```tsx
import {
  extractElementInfo,
  findNearestTaggedElement,
  getElementBounds
} from '@product-loop/inspector';

// Extract info from a tagged element
const element = document.getElementById('my-element');
const info = extractElementInfo(element, 'data-dev');

// Find the nearest tagged parent
const target = event.target as HTMLElement;
const taggedElement = findNearestTaggedElement(target, 'data-dev');

// Get element bounds for positioning
const bounds = getElementBounds(element);
```

## How It Works

The inspector detects elements that have been tagged by `@product-loop/loop-tagger` with custom data attributes:

- `data-dev-id` - Unique identifier (path:line:column)
- `data-dev-name` - Element name
- `data-dev-path` - Source file path
- `data-dev-line` - Line number in source
- `data-dev-file` - Filename
- `data-dev-component` - Component name
- `data-dev-metadata` - Optional metadata

When you hover over tagged elements, the inspector:
1. Finds the nearest element with data attributes
2. Shows a highlight overlay
3. On click, displays detailed information in an info panel

## Integration with loop-tagger

First, configure the Vite plugin to tag your components:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import loopTagger from '@product-loop/loop-tagger';

export default defineConfig({
  plugins: [
    loopTagger({
      enabled: process.env.NODE_ENV === 'development',
      attributePrefix: 'data-dev',
    }),
    react(),
  ],
});
```

Then add the inspector to your app:

```tsx
// App.tsx
import { Inspector } from '@product-loop/inspector';

function App() {
  return (
    <>
      {process.env.NODE_ENV === 'development' && <Inspector />}
      {/* Your components */}
    </>
  );
}
```

## TypeScript

Full TypeScript support with type definitions included:

```typescript
import type {
  ElementInfo,
  InspectorConfig,
  HighlightStyle
} from '@product-loop/inspector';

const config: InspectorConfig = {
  enabled: true,
  attributePrefix: 'data-dev',
  highlightColor: 'rgba(66, 153, 225, 0.5)',
};
```

## Browser Compatibility

Works in all modern browsers that support:
- ES2020
- React 18+
- DOM APIs (getBoundingClientRect, addEventListener)

## Development

```bash
# Install dependencies
bun install

# Build
bun run build

# Build in watch mode
bun run dev

# Type check
bun run type-check
```

## License

MIT
