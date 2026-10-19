import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

const rootEl = document.getElementById('root');
if (!rootEl) {
  document.body.innerHTML =
    '<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0d0408;color:#fffdf8;font-family:Georgia,serif;text-align:center;padding:2rem"><p>“Where Love Takes Flight” could not start.<br />Please reload the page.</p></div>';
  throw new Error('Root element #root not found');
}

createRoot(rootEl).render(<App />);
