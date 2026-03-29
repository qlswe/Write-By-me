import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import './i18n';
import { ErrorBoundary } from './components/ErrorBoundary';

console.log('%c АХА BY WBM-STATIC ', 'color: #C3A6E6; font-weight: bold; font-size: 24px; font-family: monospace; border: 1px solid #C3A6E6; border-radius: 4px; padding: 4px;');

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
