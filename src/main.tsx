import {createRoot} from 'react-dom/client';
import App from './App.tsx';
// Fonts are bundled with the app (no Google Fonts or other third-party requests).
import '@fontsource/plus-jakarta-sans/400.css';
import '@fontsource/plus-jakarta-sans/500.css';
import '@fontsource/plus-jakarta-sans/600.css';
import '@fontsource/plus-jakarta-sans/700.css';
import '@fontsource/plus-jakarta-sans/800.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/600.css';
import '@fontsource/source-serif-4/400.css';
import '@fontsource/source-serif-4/600.css';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);
