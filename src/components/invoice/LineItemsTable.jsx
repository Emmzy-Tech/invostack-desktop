import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import { Plus, Trash2, ChevronUp, ChevronDown, List, Pencil, Check } from 'lucide-react'
import { calcItemAmount } from '../../lib/calculations.js'

function renumber(items) {
  return items.map((item, idx) => ({ ...item, serialNo: idx + 1 }))
}

/**
 * Numeric input that stores value as a string while focused so the user can
 * freely delete and retype. Commits the parsed number on blur.
 */
function NumInput({ value, onChange, className = '' }) {
  const [raw, setRaw] = useState(null) // null = not focused

  const display = raw !== null ? raw : (value === 0 ? '' : String(value))

  return (
    <input
      type="text"
      inputMode="decimal"
      value={display}
      placeholder="0"
      onFocus={() => setRaw(value === 0 ? '' : String(value))}
      onChange={(e) => setRaw(e.target.value)}
      onBlur={() => {
        const n = parseFloat(raw)
        onChange(isNaN(n) ? 0 : n)
        setRaw(null)
      }}
      className={`w-full bg-transparent text-sm text-gray-800 focus:outline-none
                  focus:ring-1 focus:ring-violet-400 rounded px-1 py-0.5 text-right tabular ${className}`}
    />
  )
}

/**
 * Editable column header — double-click (or pencil icon) to rename.
 */
function EditableHeader({ value, onChange, className = '' }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft]     = useState(value)

  const commit = () => {
    onChange(draft.trim() || value)
    setEditing(false)
  }

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input
          autoFocus
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
          className={`bg-white border border-violet-400 rounded px-1.5 py-0.5 text-xs font-semibold
                      text-gray-700 focus:outline-none w-full ${className}`}
        />
        <button onClick={commit} className="text-violet-500 hover:text-violet-700">
          <Check size={12} />
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => { setDraft(value); setEditing(true) }}
      className="group/hdr flex items-center gap-1 text-left hover:text-violet-600 transition-colors"
      title="Click to rename column"
    >
      <span>{value}</span>
      <Pencil size={10} className="opacity-0 group-hover/hdr:opacity-100 transition-opacity text-violet-400" />
    </button>
  )
}

function LineItemsTable({ items = [], columnHeaders = {}, onChange, onHeaderChange }) {
  const hdrs = {
    serialNo:    columnHeaders.serialNo    || '#',
    description: columnHeaders.description || 'Description',
    quantity:    columnHeaders.quantity    || 'Qty',
    rate:        columnHeaders.rate        || 'Rate',
    amount:      columnHeaders.amount      || 'Amount',
  }

  const addRow = () => {
    onChange(renumber([
      ...items,
      { id: uuidv4(), serialNo: 0, description: '', quantity: 1, rate: 0, amount: 0 },
    ]))
  }

  const removeRow = (id) => {
    if (items.length <= 1) return
    onChange(renumber(items.filter((item) => item.id !== id)))
  }

  const updateRow = (id, field, rawValue) => {
    onChange(
      items.map((item) => {
        if (item.id !== id) return item
        const updated = { ...item, [field]: rawValue }
        updated.amount = calcItemAmount(updated.quantity, updated.rate)
        return updated
      })
    )
  }

  const moveRow = (idx, direction) => {
    const next = [...items]
    const target = idx + direction
    if (target < 0 || target >= next.length) return
    ;[next[idx], next[target]] = [next[target], next[idx]]
    onChange(renumber(next))
  }

  const cellBase = 'w-full bg-transparent text-sm text-gray-800 focus:outline-none ' +
    'focus:ring-1 focus:ring-violet-400 rounded px-1 py-0.5 transition-shadow'

  return (
    <section className="card overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
          <List size={14} className="text-violet-600" />
        </div>
        <h2 className="section-label">Line Items</h2>
        <span className="ml-auto text-xs text-gray-400 italic">Click any column header to rename it</span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm min-w-[560px]">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-100 text-xs text-gray-400 uppercase tracking-widest">
              <th className="w-12 px-2 py-2.5"></th>
              <th className="w-8 px-3 py-2.5 text-left font-semibold">
                <EditableHeader value={hdrs.serialNo} onChange={(v) => onHeaderChange?.({ serialNo: v })} />
              </th>
              <th className="px-3 py-2.5 text-left font-semibold">
                <EditableHeader value={hdrs.description} onChange={(v) => onHeaderChange?.({ description: v })} />
              </th>
              <th className="w-24 px-3 py-2.5 text-right font-semibold">
                <EditableHeader value={hdrs.quantity} onChange={(v) => onHeaderChange?.({ quantity: v })} className="text-right" />
              </th>
              <th className="w-28 px-3 py-2.5 text-right font-semibold">
                <EditableHeader value={hdrs.rate} onChange={(v) => onHeaderChange?.({ rate: v })} className="text-right" />
              </th>
              <th className="w-28 px-3 py-2.5 text-right font-semibold">
                <EditableHeader value={hdrs.amount} onChange={(v) => onHeaderChange?.({ amount: v })} className="text-right" />
              </th>
              <th className="w-10 px-2 py-2.5"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {items.map((item, idx) => (
              <tr key={item.id} className="group hover:bg-violet-50/30 transition-colors">

                {/* Reorder */}
                <td className="px-1 py-1.5 text-center">
                  <div className="flex flex-col items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => moveRow(idx, -1)} disabled={idx === 0}
                      className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-20">
                      <ChevronUp size={13} />
                    </button>
                    <button onClick={() => moveRow(idx, 1)} disabled={idx === items.length - 1}
                      className="p-0.5 text-gray-400 hover:text-gray-700 disabled:opacity-20">
                      <ChevronDown size={13} />
                    </button>
                  </div>
                </td>

                {/* Serial */}
                <td className="px-3 py-2 text-gray-400 text-xs font-mono">{item.serialNo}</td>

                {/* Description */}
                <td className="px-3 py-2">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => updateRow(item.id, 'description', e.target.value)}
                    placeholder="Item description"
                    className={cellBase}
                  />
                </td>

                {/* Quantity */}
                <td className="px-3 py-2">
                  <NumInput value={item.quantity} onChange={(v) => updateRow(item.id, 'quantity', v)} />
                </td>

                {/* Rate */}
                <td className="px-3 py-2">
                  <NumInput value={item.rate} onChange={(v) => updateRow(item.id, 'rate', v)} />
                </td>

                {/* Amount — derived */}
                <td className="px-3 py-2 text-right font-semibold text-gray-800 tabular">
                  {Number(item.amount || 0).toFixed(2)}
                </td>

                {/* Delete */}
                <td className="px-2 py-1.5">
                  <button onClick={() => removeRow(item.id)} disabled={items.length <= 1}
                    title="Remove row"
                    className="opacity-0 group-hover:opacity-100 transition-opacity
                               p-1 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 disabled:opacity-10">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 border-t border-gray-100">
        <button onClick={addRow}
          className="flex items-center gap-2 text-sm text-violet-600 font-semibold
                     hover:text-violet-800 transition-colors py-1 px-2 rounded-lg hover:bg-violet-50">
          <Plus size={15} strokeWidth={2.5} />
          Add Item
        </button>
      </div>
    </section>
  )
}

export default LineItemsTable
