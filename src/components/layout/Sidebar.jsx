import { NavLink, useNavigate } from 'react-router-dom'
import { ReceiptText, Settings, Plus, LayoutDashboard } from 'lucide-react'
import useInvoiceStore from '../../store/useInvoiceStore.js'

const NAV = [
  { to: '/invoices', icon: LayoutDashboard, label: 'Dashboard', end: true },
  { to: '/settings', icon: Settings,        label: 'Settings',  end: false },
]

function Sidebar() {
  const navigate = useNavigate()
  const invoices = useInvoiceStore((s) => s.invoices)

  const total   = invoices.length
  const drafts  = invoices.filter((i) => i.status === 'draft').length
  const finals  = invoices.filter((i) => i.status === 'final').length

  return (
    <aside className="no-print w-60 shrink-0 flex flex-col h-full select-none"
      style={{ background: 'linear-gradient(180deg,#1e1b4b 0%,#0f0e2a 100%)' }}>

      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
          <ReceiptText size={16} className="text-white" />
        </div>
        <div>
          <p className="text-white font-bold text-sm leading-tight">InvoStack</p>
          <p className="text-violet-400 text-xs">Invoice Manager</p>
        </div>
      </div>

      {/* New Invoice */}
      <div className="px-4 pb-4">
        <button
          onClick={() => navigate('/invoices/new')}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl
                     text-white text-sm font-semibold transition-all duration-150
                     hover:opacity-90 active:scale-95"
          style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}
        >
          <Plus size={16} strokeWidth={2.5} />
          New Invoice
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-0.5">
        {NAV.map(({ to, icon: Icon, label, end }) => (
          <NavLink key={to} to={to} end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-violet-300/70 hover:text-white hover:bg-white/5'
              }`
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Stats */}
      <div className="mx-4 mb-4 rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.05)' }}>
        <p className="text-violet-400 text-xs font-semibold uppercase tracking-widest mb-3">Overview</p>
        <div className="grid grid-cols-3 gap-2 text-center">
          {[['Total', total, 'text-white'], ['Draft', drafts, 'text-amber-400'], ['Final', finals, 'text-emerald-400']].map(([lbl, val, cls]) => (
            <div key={lbl}>
              <p className={`text-lg font-bold ${cls}`}>{val}</p>
              <p className="text-violet-400 text-xs">{lbl}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-white/5 text-xs text-violet-500">
        v0.1.0
      </div>
    </aside>
  )
}

export default Sidebar
