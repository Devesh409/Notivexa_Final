import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

window.addEventListener('error', (event) => {
  console.error("Window Error:", event.error || event.message);
  const existing = document.getElementById('fatal-error-overlay');
  if (!existing && document.body) {
    const errorBox = document.createElement('div');
    errorBox.id = 'fatal-error-overlay';
    errorBox.style.cssText = 'position:fixed;inset:0;background:#fff;color:#b91c1c;padding:32px;font-family:monospace;z-index:999999;overflow:auto;';
    errorBox.innerHTML = `
      <h2 style="font-size:20px;font-weight:bold;margin-bottom:12px;">Application Load Error</h2>
      <p style="margin-bottom:16px;">${event.message || 'An error occurred while loading the app'}</p>
      <pre style="background:#fee2e2;padding:16px;border-radius:8px;font-size:12px;white-space:pre-wrap;">${event.error?.stack || ''}</pre>
    `;
    document.body.appendChild(errorBox);
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find element with id 'root'");
}

const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <App />
  </StrictMode>
);

