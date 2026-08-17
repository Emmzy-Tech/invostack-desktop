import Sidebar from './Sidebar.jsx'

/**
 * Top-level layout wrapper.
 * Sidebar is fixed-width on the left; the main content area scrolls independently.
 * Both columns span the full viewport height so the app never scrolls at the
 * body level — only the content pane scrolls.
 */
function AppShell({ children }) {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      <Sidebar />
      <main className="flex-1 overflow-y-auto min-w-0">
        {children}
      </main>
    </div>
  )
}

export default AppShell
