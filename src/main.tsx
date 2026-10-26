import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import '@fontsource/vazirmatn/400.css';
import '@fontsource/vazirmatn/500.css';
import '@fontsource/vazirmatn/700.css';
import './brand/brand-fonts.generated.css';
import './styles/global.css';
import './styles/dashboard.css';
import { App } from './app/App';

const root = document.getElementById('root');
if (!root) throw new Error('عنصر root پیدا نشد');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
