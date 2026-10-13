import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './css/main.css'
import App from './App.jsx'

const rootElement = document.getElementById('root');

// The generated SEO shell is static fallback content, not server-rendered React.
// Mount the interactive app normally; React replaces the fallback on first render.
createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
