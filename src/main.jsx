import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App.jsx'
import './index.css'

/**
 * HashRouter is used instead of BrowserRouter because Electron loads the
 * renderer from a file:// URL in production. file:// origins don't support
 * the HTML5 History API, so path-based routing would 404 on reload.
 * HashRouter routes everything through the URL hash (e.g. /#/invoices/new),
 * which works correctly in both dev (Vite dev server) and production builds.
 */
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>
)
