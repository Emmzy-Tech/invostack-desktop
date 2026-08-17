import { useState } from 'react'
import { Calculator } from 'lucide-react'

/**
 * String-based number input to allow full delete-and-retype behaviour.
 * The parent receives a real number only on blur.
 */
function NumInput({ value, onChange, suffix, className = '' }) {
  const [raw, setRaw] = useState(null)
  const display = raw !== null ? raw : (value === 0 ? '' : String(value))

  return (
    <span className="inline-flex items-center gap-1">
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
        className={`w-20 px-2 py-1 border border-gray-200 rounded-lg text-sm text-right tabular
                    bg-white focus:outline-none focus:ring-2 focus:ring-violet-500
                    focus:border-transparent transition-all ${className}`}
      />
      {suffix && <span className="text-gray-400 text-sm">{suffix}</span>}
    </span>
  )
}

function TotalsSection({
  subtotal = 0,
  taxRate = 0,
  taxAmount = 0,
  discount = 0,
  grandTotal = 0,
  currency = 'USD',
  onChangeTaxRate,
  onChangeDiscount,
}) {
  const fmt = (n) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const row = 'flex items-center justify-between text-sm text-gray-600 py-1.5'

  return (
    <section className="card p-6">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
          <Calculator size={14} className="text-violet-600" />
        </div>
        <h2 className="section-label">Totals</h2>
      </div>

      <div className="max-w-sm ml-auto space-y-1">
        <div className={row}>
          <span className="text-gray-500">Subtotal</span>
          <span className="font-semibold tabular text-gray-800">{fmt(subtotal)}</span>
        </div>

        <div className={row}>
          <span className="flex items-center gap-2 text-gray-500">
            Discount
            <NumInput value={discount} onChange={onChangeDiscount} />
          </span>
          <span className="font-semibold tabular text-red-500">−{fmt(discount)}</span>
        </div>

        <div className={row}>
          <span className="flex items-center gap-2 text-gray-500">
            Tax
            <NumInput value={taxRate} onChange={onChangeTaxRate} suffix="%" />
          </span>
          <span className="font-semibold tabular text-gray-800">{fmt(taxAmount)}</span>
        </div>

        <div className="pt-4 mt-2 border-t-2 border-violet-100 flex justify-between items-center">
          <span className="font-bold text-gray-800 text-base">Grand Total</span>
          <div className="text-right">
            <span className="text-2xl font-extrabold tabular"
              style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {fmt(grandTotal)}
            </span>
            <span className="block text-xs text-gray-400 mt-0.5">{currency}</span>
          </div>
        </div>
      </div>
    </section>
  )
}

export default TotalsSection
