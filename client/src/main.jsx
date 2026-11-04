import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { I18nProvider } from './i18n/index.jsx';
import { ComfortProvider } from './lib/comfort.jsx';
import MotionProvider from './design/Motion.jsx';
import { router } from './App.jsx';
import ErrorBoundary from './components/layout/ErrorBoundary.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <ComfortProvider>
        <I18nProvider>
          <MotionProvider>
            <RouterProvider router={router} future={{ v7_startTransition: true }} />
          </MotionProvider>
        </I18nProvider>
      </ComfortProvider>
    </ErrorBoundary>
  </React.StrictMode>,
);

/*
 * Installable app + offline "My bookings". Production only: a service worker
 * in development caches stale modules and makes hot reload lie. Registered
 * after load so it never competes with the first paint.
 */
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
