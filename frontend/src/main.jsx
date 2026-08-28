import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import { ComparisonProvider } from './context/ComparisonContext';
import './index.css';
import { setupGlobalFrontendMonitoring } from './utils/monitoring';

setupGlobalFrontendMonitoring();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <ComparisonProvider>
          <App />
        </ComparisonProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
