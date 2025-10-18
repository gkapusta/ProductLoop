# @product-loop/inspector

## Project Overview

React element inspector and highlighter package for components tagged with custom data attributes by `@product-loop/loop-tagger`. Provides visual debugging tools similar to React DevTools for inspecting element source locations, component names, and metadata.

## Architecture

### Core Components

1. **Inspector** (`src/components/Inspector.tsx`)
   - Main component that users add to their app
   - Manages enabled/disabled state
   - Renders Highlighter, InfoPanel, and toggle button
   - Orchestrates all sub-components

2. **Highlighter** (`src/components/Highlighter.tsx`)
   - Displays visual overlay on hovered elements
   - Tracks element bounds and updates on scroll/resize
   - Configurable color and z-index
   - Uses fixed positioning for accurate overlay

3. **InfoPanel** (`src/components/InfoPanel.tsx`)
   - Shows detailed information about selected element
   - Displays: component name, file path, line number, element name, ID, metadata
   - Configurable position (top-left, top-right, bottom-left, bottom-right)
   - Dark theme UI with monospace font

4. **useInspector Hook** (`src/hooks/useInspector.ts`)
   - Custom React hook for element detection and interaction
   - Handles mousemove events to detect hovered elements
   - Handles click events to select elements
   - Provides hover and selection state management
   - Ignores inspector's own DOM elements

### Utilities

- **extractElementInfo** - Extracts data-dev-* attributes from an element
- **findNearestTaggedElement** - Walks up DOM tree to find nearest tagged element
- **getElementBounds** - Returns element's bounding rectangle

### Data Flow

1. User hovers over element → mousemove event
2. `useInspector` finds nearest tagged element
3. Extracts element info from data attributes
4. Updates `hoveredElement` state
5. `Highlighter` renders overlay at element position
6. User clicks element → click event
7. Updates `selectedInfo` state
8. `InfoPanel` displays element details

## Custom Attributes

The inspector detects elements with these attributes (default prefix `data-dev-`):

- `data-dev-id` - Unique identifier (path:line:column)
- `data-dev-name` - Element tag name
- `data-dev-path` - Source file path
- `data-dev-line` - Line number in source
- `data-dev-file` - Filename only
- `data-dev-component` - Component/element name
- `data-dev-metadata` - Optional JSON metadata

## Build System

### Package Manager
Use `bun` for all operations (aligned with monorepo setup)

### Commands
- `bun install` - Install dependencies
- `bun run build` - Build package using tsup
- `bun run dev` - Build in watch mode
- `bun run type-check` - Type check without emitting files

### Build Configuration

**tsup.config.ts:**
- Entry: `src/index.ts`
- Format: ESM only
- Generates: `.js`, `.d.ts`, `.js.map`
- Externals: `react`, `react-dom` (peer dependencies)
- Target: ES2020

**tsconfig.json:**
- JSX: `react-jsx` (modern JSX transform)
- Module: ESNext with bundler resolution
- Strict mode enabled
- Generates declarations and source maps

## Integration with loop-tagger

The inspector reads attributes added by the loop-tagger Vite plugin:

```typescript
// vite.config.ts
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

Then in your React app:

```tsx
// App.tsx
import { Inspector } from '@product-loop/inspector';

function App() {
  return (
    <>
      <Inspector />
      {/* Your components */}
    </>
  );
}
```

## Key Features

1. **Hover Detection** - Automatically highlights elements on hover
2. **Click Selection** - Click to lock selection and view details
3. **Smart Parent Finding** - Finds nearest tagged parent if child isn't tagged
4. **Inspector Isolation** - Ignores its own DOM elements to prevent feedback loops
5. **Responsive** - Updates highlight on scroll/resize
6. **Configurable** - Colors, position, z-index, attribute prefix
7. **Callbacks** - Custom handlers for hover and selection events

## TypeScript Types

```typescript
interface ElementInfo {
  id: string;
  name: string;
  path: string;
  line: string;
  file: string;
  component: string;
  metadata?: string;
  element: HTMLElement;
}

interface InspectorConfig {
  enabled?: boolean;
  attributePrefix?: string;
  highlightColor?: string;
  overlayPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  zIndex?: number;
  onElementSelect?: (info: ElementInfo) => void;
}
```

## Performance Considerations

- Event listeners use capture phase (`true`) for early interception
- Highlight position updates throttled by browser's animation frame
- Inspector elements use `pointer-events: none` to avoid blocking interactions
- Minimal re-renders through state management
- Only active when `enabled` prop is true

## Development Guidelines

1. **Event Handling** - Always check for inspector's own elements to prevent loops
2. **Type Safety** - Use strict TypeScript checks, handle nulls explicitly
3. **Accessibility** - Use semantic HTML, ARIA labels on buttons
4. **Performance** - Minimize DOM queries, use refs where appropriate
5. **Styling** - Inline styles for portability (no external CSS dependencies)

## Common Use Cases

1. **Development Debugging** - Quickly find component source files
2. **Visual Regression Testing** - Verify element positions and bounds
3. **Component Documentation** - Show component metadata in Storybook
4. **Education** - Teach React component hierarchy and rendering
5. **Code Navigation** - Click element → open file in editor (with custom callback)

## Known Limitations

- Only works with elements that have data attributes (requires loop-tagger)
- Requires React 18+
- Highlight overlay uses fixed positioning (may not work in transformed containers)
- No support for Shadow DOM elements
- Inspector's own elements must be at document root level

## Future Enhancements

- Keyboard shortcuts for toggling inspector
- Export element tree as JSON
- Filter elements by component name or file path
- Integration with editor protocols (open file at line)
- Multiple selection support
- History of inspected elements
- Screenshot captured element with annotations
