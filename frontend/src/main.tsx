import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { StyleSheetManager } from 'styled-components';

import App from './App';
import './index.css';
import { GlobalStyles } from './styles/GlobalStyles';
import { ToastProvider } from './contexts/ToastContext';

const container = document.getElementById('root');
if (!container) throw new Error('Failed to find the root element');

const root = createRoot(container);

root.render(
  <React.StrictMode>
    <StyleSheetManager disableCSSOMInjection>
      <HelmetProvider>
        <BrowserRouter>
          <ToastProvider>
            <GlobalStyles />
            <App />
          </ToastProvider>
        </BrowserRouter>
      </HelmetProvider>
    </StyleSheetManager>
  </React.StrictMode>
);
