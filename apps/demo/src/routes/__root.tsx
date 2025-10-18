import { createRootRoute, Outlet } from '@tanstack/react-router'
import { Inspector } from '@product-loop/inspector';

export const Route = createRootRoute({
  component: () => (
    <>
      <Inspector
        enabled={process.env.NODE_ENV === 'development'}
        attributePrefix="data-dev"
        highlightColor="rgba(66, 153, 225, 0.5)"
        currentRole="PM"
        onElementSelect={(info) => {
          console.log('Selected element:', info);
        }}
        onRequestCreate={(request) => {
          console.log('Request created:', request);
        }}
        onRequestUpdate={(request) => {
          console.log('Request updated:', request);
        }}
      />
      <Outlet />
    </>
  ),
})
