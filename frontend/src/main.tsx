import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';

import App from './App';
import { GlobalStyles } from './styles/GlobalStyles';
import { ToastProvider } from './contexts/ToastContext';

// Clear any existing styled-components style tags to prevent conflicts
const existingStyleTags = document.querySelectorAll('style[data-styled]');
existingStyleTags.forEach(tag => tag.remove());

const container = document.getElementById('root');
if (!container) throw new Error('Failed to find the root element');

const root = createRoot(container);

root.render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <ToastProvider>
          <GlobalStyles />
          <App />
        </ToastProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
