import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App';
import './index.css';

const root = document.getElementById('root');
if (!root) throw new Error('Root element not found');

// Hydrate when the page was pre-rendered by SSG (children.length > 0 means real HTML elements).
// Fall back to createRoot for dynamic routes and local development.
if (root.children.length > 0) {
  hydrateRoot(
    root,
    <StrictMode>
      <App />
    </StrictMode>
  );
} else {
  createRoot(root).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
