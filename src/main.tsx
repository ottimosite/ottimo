import { StrictMode } from 'react'; import { createRoot } from 'react-dom/client'; import { BrowserRouter } from 'react-router-dom'; import App from './App'; import './styles/global.css'; import './styles/overrides.css'; import './styles/menu-overrides.css'; import './styles/concepts.css'; import './styles/lead-home.css'; import './styles/audit-overview.css'; import './styles/audit-expansion.css'; import './styles/standards.css'; import './styles/performance-metrics.css'; import './styles/onboarding.css'; import './styles/quality.css'
createRoot(document.getElementById('root')!).render(<StrictMode><BrowserRouter><App/></BrowserRouter></StrictMode>)

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => undefined))
