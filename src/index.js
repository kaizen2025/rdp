// src/index.js - MISE À JOUR POUR REACT 18

import React from 'react';
import { createRoot } from 'react-dom/client'; // Import de createRoot
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Nouvelle méthode de rendu pour React 18
const container = document.getElementById('root');
const root = createRoot(container);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

reportWebVitals();