import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import SplashGate from './components/SplashGate';
import { NetworkProvider } from './lib/network';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NetworkProvider>
      <BrowserRouter>
        <SplashGate />
        <App />
      </BrowserRouter>
    </NetworkProvider>
  </React.StrictMode>,
);
