import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router';
import './styles.css';
import App from './App';
import Providers from '@/components/Providers';
import Login from '@/src/renderer/Login';


const container = document.getElementById('root');

if (!container) {
  throw new Error('Root element not found');
}

const root = createRoot(container);

root.render(
  <React.StrictMode>
    <HashRouter>
      <Routes>
        <Route element={<Providers />} > 
          <Route path="/" element={<App />} />
          <Route path="/login" element={<Login />} />
        </Route>
      </Routes>
    </HashRouter>
  </React.StrictMode>
);

