import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Edit2, Copy, Trash2, FileText, Search, X,
         TrendingUp, Clock, CheckCircle2, DollarSign } from 'lucide-react'
import useInvoiceStore from '../store/useInvoiceStore.js'
import useCompanyStore from '../store/useCompanyStore.js'

function StatusBadge({ status }) {
  const cfg = status === 'final'
    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
    : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cfg}`}>
      {status === 'final' ? <CheckCircle2 size={10} /> : <Clock size={10} />}
      {status === 'final' ? 'Final' : 'Draft'}
    </span>
  )
}

function Avatar({ name }) {
  const initials = (name || '?').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  const colors = ['bg-violet-100 text-violet-700','bg-blue-100 text-blue-700',
                  'bg-emerald-100 text-emerald-700','bg-rose-100 text-rose-700',
                  'bg-amber-100 text-amber-700']
  const color = colors[(name?.charCodeAt(0) || 0) % colors.length]
  return (
    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${color}`}>
      {initials}
    </div>
  )
}

function InvoiceList() {
  const navigate = useNavigate()
  const { invoices, deleteInvoice, duplicateInvoice, isLoading } = useInvoiceStore()
  const { profile } = useCompanyStore()

  const [query,        setQuery]  = useState('')
  const [statusFilter, setStatus] = useState('all')
  const [dateFrom,  setDateFrom]  = useState('')
  const [dateTo,    setDateTo]    = useState('')
  const hasFilters = query || statusFilter !== 'all' || dateFrom || dateTo

  const currency = profile?.invoiceTemplate?.currency || 'NGN'

  // Stats
  const totalRevenue = invoices.filter(i => i.status === 'final')
                               .reduce((s, i) => s + (i.grandTotal || 0), 0)
  const drafts = invoices.filter(i => i.status === 'draft').length
  const finals = invoices.filter(i => i.status === 'final').length

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    return [...invoices].reverse().filter((inv) => {
      if (q) {
        const num  = (inv.invoiceNumber || '').toLowerCase()
        const name = (inv.customer?.name || '').toLowerCase()
        if (!num.includes(q) && !name.includes(q)) return false
      }
      if (statusFilter !== 'all' && inv.status !== statusFilter) return false
      if (dateFrom && inv.date && inv.date < dateFrom) return false
      if (dateTo   && inv.date && inv.date > dateTo)   return false
      return true
    })
  }, [invoices, query, statusFilter, dateFrom, dateTo])

  const clearFilters = () => { setQuery(''); setStatus('all'); setDateFrom(''); setDateTo('') }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this invoice? This cannot be undone.')) return
    await deleteInvoice(id)
  }
  const handleDuplicate = async (id) => {
    const copy = await duplicateInvoice(id)
    if (copy) navigate(`/invoices/${copy.id}`)
  }

  const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div className="flex flex-col h-full overflow-hidden">

      {/* ── Top header bar ───────────────────────────────────────────────── */}
      <div className="shrink-0 px-8 pt-7 pb-0 bg-gray-50">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {invoices.length} invoice{invoices.length !== 1 ? 's' : ''} · {currency}
            </p>
          </div>
          <button
            onClick={() => navigate('/invoices/new')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold
                       transition-all duration-150 hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}
          >
            <Plus size={16} strokeWidth={2.5} /> New Invoice
          </button>
        </div>

        {/* ── Stat cards ───────────────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: 'Total Invoices', value: invoices.length, icon: FileText,     color: 'text-violet-600', bg: 'bg-violet-50' },
            { label: 'Total Revenue',  value: `${fmt(totalRevenue)}`, icon: DollarSign,  color: 'text-emerald-600', bg: 'bg-emerald-50', money: true },
            { label: 'Finalized',      value: finals,          icon: CheckCircle2, color: 'text-blue-600',    bg: 'bg-blue-50' },
            { label: 'Drafts',         value: drafts,          icon: Clock,        color: 'text-amber-600',   bg: 'bg-amber-50' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <div key={label} className="card p-5">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{label}</p>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${bg}`}>
                  <Icon size={15} className={color} />
                </div>
              </div>
              <p className={`text-2xl font-bold ${color} tabular`}>{value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main content ─────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-8 pb-8">

        {isLoading && (
          <div className="text-center py-20 text-gray-400 text-sm">Loading…</div>
        )}

        {!isLoading && invoices.length === 0 && (
          <div className="card flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-2xl bg-violet-50 flex items-center justify-center mb-4">
              <FileText size={28} className="text-violet-400" />
            </div>
            <h2 className="text-lg font-bold text-gray-800 mb-1">No invoices yet</h2>
            <p className="text-gray-400 text-sm mb-6">Create your first invoice to get started.</p>
            <button
              onClick={() => navigate('/invoices/new')}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white text-sm font-semibold
                         transition-all hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}
            >
              <Plus size={15} /> New Invoice
            </button>
          </div>
        )}

        {!isLoading && invoices.length > 0 && (
          <div className="card overflow-hidden">
            {/* Table toolbar */}
            <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-gray-100">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Search invoice # or customer…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="inp pl-8"
                />
              </div>
              <select value={statusFilter} onChange={(e) => setStatus(e.target.value)} className="inp w-36">
                <option value="all">All statuses</option>
                <option value="draft">Draft</option>
                <option value="final">Final</option>
              </select>
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="inp w-36" />
              <span className="text-gray-300">–</span>
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="inp w-36" />
              {hasFilters && (
                <button onClick={clearFilters}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1.5 rounded-lg hover:bg-red-50">
                  <X size={12} /> Clear
                </button>
              )}
              <span className="ml-auto text-xs text-gray-400">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
            </div>

            {filtered.length === 0 ? (
              <div className="py-16 text-center text-gray-400 text-sm">
                No invoices match your filters.{' '}
                <button onClick={clearFilters} className="text-violet-500 hover:underline font-medium">Clear</button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-widest">Invoice</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-widest">Customer</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-widest">Date</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-widest">Due</th>
                      <th className="px-5 py-3 text-right text-xs font-semibold text-gray-400 uppercase tracking-widest">Total</th>
                      <th className="px-5 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-widest">Status</th>
                      <th className="px-5 py-3"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((inv) => (
                      <tr key={inv.id}
                        className="group hover:bg-violet-50/40 transition-colors cursor-pointer"
                        onClick={() => navigate(`/invoices/${inv.id}`)}>
                        <td className="px-5 py-3.5">
                          <span className="font-mono font-semibold text-violet-600 text-xs bg-violet-50 px-2 py-0.5 rounded-md">
                            {inv.invoiceNumber}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={inv.customer?.name} />
                            <span className="font-medium text-gray-800">
                              {inv.customer?.name || <span className="text-gray-300 font-normal">—</span>}
                            </span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 text-gray-500">{inv.date || '—'}</td>
                        <td className="px-5 py-3.5 text-gray-500">{inv.dueDate || '—'}</td>
                        <td className="px-5 py-3.5 text-right font-bold text-gray-800 tabular">
                          {fmt(inv.grandTotal)}
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusBadge status={inv.status} />
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="flex justify-end gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                               onClick={(e) => e.stopPropagation()}>
                            <button onClick={() => navigate(`/invoices/${inv.id}`)} title="Edit"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-violet-600 hover:bg-violet-50 transition-colors">
                              <Edit2 size={14} />
                            </button>
                            <button onClick={() => handleDuplicate(inv.id)} title="Duplicate"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors">
                              <Copy size={14} />
                            </button>
                            <button onClick={() => handleDelete(inv.id)} title="Delete"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default InvoiceList
