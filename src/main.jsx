import { StrictMode } from 'react'
import { hydrateRoot, createRoot } from 'react-dom/client'
import './css/main.css'
import App from './App.jsx'

const rootElement = document.getElementById('root');

// Check if the app should be hydrated (i.e., if it was prerendered)
if (rootElement.hasChildNodes()) {
  // Use hydrateRoot for prerendered content
  hydrateRoot(
    rootElement,
    <StrictMode>
      <App />
    </StrictMode>
  );
} else {
  // Use createRoot for normal rendering
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}
