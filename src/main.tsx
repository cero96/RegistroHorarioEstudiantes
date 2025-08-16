// src/main.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { setupIonicReact } from '@ionic/react';

/* ===== Estilos base de Ionic ===== */
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* ===== Utilidades opcionales ===== */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

/* ===== Tus estilos globales ===== */
import './theme/variables.css'; // si tienes variables personalizadas

setupIonicReact();


const container = document.getElementById('root')!;
const root = createRoot(container);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
