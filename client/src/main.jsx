import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { I18nProvider } from './i18n/index.jsx';
import MotionProvider from './design/Motion.jsx';
import App from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <I18nProvider>
      <MotionProvider>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </MotionProvider>
    </I18nProvider>
  </React.StrictMode>,
);
