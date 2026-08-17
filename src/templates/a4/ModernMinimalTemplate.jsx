/**
 * src/templates/a4/ModernMinimalTemplate.jsx  — "Modern Minimal" A4 template.
 *
 * Design language:
 *   • Thin 4px brand-color accent bar at the very top (the only strong colour).
 *   • Company name in large, light-weight (300) type — confident, airy.
 *   • Table with hairline bottom-borders only (no side/top borders) — open feel.
 *   • Totals right-aligned with a single underline rule — no boxing.
 *   • Generous whitespace everywhere; nothing competes with the content.
 *
 * Paper: 210mm × ≥297mm A4. Same inline-style mm-unit sizing convention as
 * DefaultTemplate so print dimensions are OS-consistent.
 */

import QRCode from '../../components/ui/QRCode.jsx'

const fmt = (n) => Number(n ?? 0).toFixed(2)

function ModernMinimalTemplate({ invoice = {}, company = {} }) {
  const {
    invoiceNumber = '', date = '', dueDate = '', status = 'draft',
    customer = {}, items = [],
    subtotal = 0, taxRate = 0, taxAmount = 0, discount = 0, grandTotal = 0,
    notes = '', termsAndConditions = '',
  } = invoice

  const {
    companyName = '', address = '', phone = '', email = '', website = '', taxId = '',
    brandPrimaryColor: primary = '#4F46E5',
    logoPath = '',
    bankDetails: bd = {},
  } = company

  const hairline = `1px solid #e2e8f0`

  return (
    <div style={{ width: '210mm', minHeight: '297mm', boxSizing: 'border-box', backgroundColor: '#fff', fontFamily: `${company.brandFont || 'system-ui'}, sans-serif`, color: '#0f172a', fontSize: '10pt', lineHeight: 1.6 }}>

      {/* ── Accent bar ─────────────────────────────────────────────────────── */}
      <div style={{ height: '4px', backgroundColor: primary, width: '100%' }} />

      <div style={{ padding: '16mm 20mm 20mm' }}>

        {/* ── Header ───────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12mm' }}>

          {/* Left: logo above company name + contact */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {logoPath && (
              <img
                src={`file://${logoPath}`} alt="logo"
                style={{
                  maxHeight: '18mm', maxWidth: '48mm',
                  objectFit: 'contain',
                  display: 'block',
                  marginBottom: '3mm',
                }}
              />
            )}
            <div style={{ fontSize: '22pt', fontWeight: 300, color: '#0f172a', letterSpacing: '-0.5px', marginBottom: '2mm', lineHeight: 1.1 }}>
              {companyName || 'Your Company'}
            </div>
            <div style={{ fontSize: '8.5pt', color: '#64748b', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
              {[address, phone, email, website, taxId && `Tax ID: ${taxId}`].filter(Boolean).join('\n')}
            </div>
          </div>

          {/* Right: INVOICE label + meta, top-aligned */}
          <div style={{ textAlign: 'right', fontSize: '8.5pt', flexShrink: 0 }}>
            <div style={{ fontSize: '22pt', fontWeight: 700, color: primary, marginBottom: '4mm', textTransform: 'uppercase', letterSpacing: '0.1em', lineHeight: 1 }}>
              INVOICE
            </div>
            {[['No.', invoiceNumber], ['Date', date], ['Due', dueDate]].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'flex-end', gap: '8mm', color: '#475569', marginBottom: '1mm' }}>
                <span style={{ color: '#94a3b8' }}>{l}</span>
                <span style={{ fontWeight: 600, color: '#0f172a', minWidth: '30mm', textAlign: 'right' }}>{v}</span>
              </div>
            ))}
            <div style={{ marginTop: '2mm', color: status === 'final' ? '#16a34a' : '#d97706', fontWeight: 700, textTransform: 'uppercase', fontSize: '8pt', letterSpacing: '0.06em' }}>
              {status === 'final' ? 'PAID' : 'DRAFT'}
            </div>
          </div>
        </div>

        {/* ── Bill To ──────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: '10mm' }}>
          <div style={{ fontSize: '7.5pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', marginBottom: '2mm' }}>Bill To</div>
          <div style={{ fontWeight: 600, fontSize: '10.5pt' }}>{customer.name}</div>
          <div style={{ color: '#475569', fontSize: '9pt', whiteSpace: 'pre-line' }}>{customer.address}</div>
          <div style={{ color: '#475569', fontSize: '9pt' }}>{[customer.phone, customer.email].filter(Boolean).join(' · ')}</div>
        </div>

        {/* ── Items table — hairline borders only ──────────────────────────── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '8mm', fontSize: '9pt' }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${primary}` }}>
              {[['#', '8mm', 'center'], ['Description', null, 'left'], ['Qty', '18mm', 'right'], ['Rate', '24mm', 'right'], ['Amount', '26mm', 'right']].map(([h, w, align]) => (
                <th key={h} style={{ padding: '2mm 2.5mm', textAlign: align, fontWeight: 700, fontSize: '7.5pt', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#64748b', width: w || undefined }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.id || idx} style={{ borderBottom: hairline }}>
                <td style={{ padding: '2.5mm 2.5mm', textAlign: 'center', color: '#94a3b8', fontSize: '8pt' }}>{item.serialNo || idx + 1}</td>
                <td style={{ padding: '2.5mm 2.5mm', color: '#334155' }}>{item.description}</td>
                <td style={{ padding: '2.5mm 2.5mm', textAlign: 'right', color: '#475569' }}>{item.quantity}</td>
                <td style={{ padding: '2.5mm 2.5mm', textAlign: 'right', color: '#475569' }}>{fmt(item.rate)}</td>
                <td style={{ padding: '2.5mm 2.5mm', textAlign: 'right', fontWeight: 600 }}>{fmt(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── Totals ───────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10mm' }}>
          <div style={{ width: '58mm', fontSize: '9pt' }}>
            {[['Subtotal', fmt(subtotal)], ...(discount > 0 ? [['Discount', `-${fmt(discount)}`]] : []), [`Tax (${taxRate}%)`, fmt(taxAmount)]].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '1mm 0', color: '#475569' }}>
                <span>{l}</span><span>{v}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2mm', paddingTop: '2mm', borderTop: `2px solid ${primary}`, fontWeight: 800, fontSize: '12pt', color: primary }}>
              <span>Total</span><span>{fmt(grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* ── Bank Details ─────────────────────────────────────────────────── */}
        {(bd.bankName || bd.accountNumber) && (
          <div style={{ marginBottom: '8mm', fontSize: '8.5pt', color: '#475569', borderTop: hairline, paddingTop: '4mm' }}>
            <div style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '7.5pt', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: '2mm' }}>Payment Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1mm 6mm' }}>
              {[['Bank', bd.bankName], ['Account Name', bd.accountName], ['Account No.', bd.accountNumber], ['SWIFT', bd.swiftCode], ['IBAN', bd.iban], ['Routing', bd.routingNumber], ['Sort Code', bd.sortCode]].filter(([, v]) => v).map(([l, v]) => (
                <div key={l} style={{ display: 'flex', gap: '2mm' }}>
                  <span style={{ color: '#94a3b8', minWidth: '22mm' }}>{l}:</span>
                  <span style={{ fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Notes & Terms ────────────────────────────────────────────────── */}
        {(notes || termsAndConditions) && (
          <div style={{ borderTop: hairline, paddingTop: '4mm', display: 'grid', gridTemplateColumns: notes && termsAndConditions ? '1fr 1fr' : '1fr', gap: '6mm', fontSize: '8.5pt', color: '#64748b' }}>
            {notes && <div><div style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '7.5pt', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: '1.5mm' }}>Notes</div><p style={{ whiteSpace: 'pre-line', margin: 0 }}>{notes}</p></div>}
            {termsAndConditions && <div><div style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '7.5pt', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: '1.5mm' }}>Terms</div><p style={{ whiteSpace: 'pre-line', margin: 0 }}>{termsAndConditions}</p></div>}
          </div>
        )}

        {/* ── QR Code footer ────────────────────────────────────────────────── */}
        {website && (
          <div style={{ borderTop: hairline, marginTop: '6mm', paddingTop: '4mm', display: 'flex', alignItems: 'center', gap: '4mm' }}>
            <QRCode url={website} size={64} />
            <div style={{ fontSize: '8pt', color: '#94a3b8' }}>
              <div style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '7.5pt', marginBottom: '1mm' }}>Visit us online</div>
              <div style={{ color: primary, fontWeight: 500 }}>{website}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default ModernMinimalTemplate
