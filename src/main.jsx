import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Spotify OAuth must use the same origin as the redirect URI (127.0.0.1, not localhost).
if (window.location.hostname === 'localhost') {
  const port = window.location.port || '5173';
  window.location.replace(
    `http://127.0.0.1:${port}${window.location.pathname}${window.location.search}${window.location.hash}`,
  );
} else {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}
