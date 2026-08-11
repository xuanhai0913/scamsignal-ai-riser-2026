import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {installAiStudioFrameCompatibilityGuard} from './aistudio-frame-compat';
import './index.css';

installAiStudioFrameCompatibilityGuard();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
