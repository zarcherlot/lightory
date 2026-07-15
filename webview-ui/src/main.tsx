import './index.css';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import App from './App.tsx';
import { BlueprintWorkbench } from './design-lab/BlueprintWorkbench.tsx';

const isBlueprintDesignLab = window.location.pathname.endsWith(
  '/design-lab/blueprint-workbench',
);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isBlueprintDesignLab ? <BlueprintWorkbench /> : <App />}
  </StrictMode>,
);
