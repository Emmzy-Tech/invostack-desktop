import { useEffect } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import AppShell from './components/layout/AppShell.jsx'
import InvoiceList from './pages/InvoiceList.jsx'
import InvoiceEditor from './pages/InvoiceEditor.jsx'
import Settings from './pages/Settings.jsx'
import PrintView from './pages/PrintView.jsx'
import useInvoiceStore from './store/useInvoiceStore.js'
import useCompanyStore from './store/useCompanyStore.js'

/**
 * Root application component.
 *
 * The /print route is intentionally placed OUTSIDE <AppShell> so the hidden
 * BrowserWindow gets only the bare invoice template — no sidebar or chrome.
 * All other routes are wrapped in AppShell as normal.
 */
function App() {
  const loadInvoices = useInvoiceStore((s) => s.loadInvoices)
  const loadProfile  = useCompanyStore((s) => s.loadProfile)
  const location     = useLocation()

  const isPrintRoute = location.pathname === '/print'

  useEffect(() => {
    // Skip store hydration in the headless print window — it doesn't need it.
    if (isPrintRoute) return
    loadProfile()
    loadInvoices()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Render the print view without any UI chrome.
  if (isPrintRoute) {
    return (
      <Routes>
        <Route path="/print" element={<PrintView />} />
      </Routes>
    )
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/invoices" replace />} />
        <Route path="/invoices" element={<InvoiceList />} />
        <Route path="/invoices/new" element={<InvoiceEditor />} />
        <Route path="/invoices/:id" element={<InvoiceEditor />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </AppShell>
  )
}

export default App
