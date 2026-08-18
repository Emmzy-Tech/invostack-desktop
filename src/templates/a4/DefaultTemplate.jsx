/**
 * src/templates/a4/DefaultTemplate.jsx
 *
 * "Default" A4 invoice template — clean, professional layout.
 *
 * Dimensions & print accuracy:
 *   This component is sized to exactly 210mm × ≥297mm (A4) using inline styles.
 *   When printed via Electron's webContents.print() in Phase 3, the CSS rule:
 *     @page { size: A4 portrait; margin: 0; }
 *   combined with the 20mm padding on this element produces a ~170mm × 257mm
 *   printable content area — standard A4 letterhead dimensions.
 *
 *   Avoid using Tailwind utility classes for dimensions here; mm units in inline
 *   styles are the only reliable way to guarantee exact paper sizing across OSes.
 *
 * Multi-page: if items overflow beyond 257mm, the browser/OS print engine will
 *   automatically create additional pages. Headers/footers repeat via CSS
 *   (thead/tfoot display:table-header-group — enforced by the browser).
 */

import QRCode from '../../components/ui/QRCode.jsx'
import { formatCurrency } from '../../lib/calculations.js'

function DefaultTemplate({ invoice = {}, company = {} }) {
  const {
    invoiceNumber = '', date = '', dueDate = '', status = 'draft',
    customer = {}, items = [],
    subtotal = 0, taxRate = 0, taxAmount = 0, discount = 0, grandTotal = 0,
    notes = '', termsAndConditions = '',
    currency = 'NGN',
  } = invoice

  const fmt = (n) => formatCurrency(n, currency)

  const {
    companyName = '', address = '', phone = '', email = '', website = '', taxId = '',
    brandPrimaryColor = '#4F46E5',
    logoPath = '',
    bankDetails = {},
  } = company

  const primary = brandPrimaryColor

  return (
    <div
      style={{
        width: '210mm',
        minHeight: '297mm',
        padding: '20mm',
        boxSizing: 'border-box',
        backgroundColor: '#ffffff',
        color: '#1e293b',
        fontFamily: company.brandFont ? `${company.brandFont}, sans-serif` : 'sans-serif',
        fontSize: '10pt',
        lineHeight: 1.5,
      }}
    >
      {/* ── Header: company left, invoice meta right ───────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10mm' }}>

        {/* Company block — logo + name stacked, left-aligned */}
        <div style={{ maxWidth: '55%', display: 'flex', flexDirection: 'column', gap: '0' }}>
          {logoPath && (
            <img
              src={`file://${logoPath}`} alt="logo"
              style={{
                maxHeight: '20mm', maxWidth: '52mm',
                objectFit: 'contain',
                display: 'block',
                marginBottom: '3mm',
              }}
            />
          )}
          <div style={{ fontSize: '20pt', fontWeight: 800, color: primary, marginBottom: '1.5mm', lineHeight: 1.2 }}>
            {companyName || 'Your Company'}
          </div>
          {address && (
            <div style={{ color: '#64748b', fontSize: '9pt', whiteSpace: 'pre-line', marginBottom: '0.5mm' }}>{address}</div>
          )}
          {(phone || email) && (
            <div style={{ color: '#64748b', fontSize: '9pt' }}>
              {[phone, email].filter(Boolean).join(' · ')}
            </div>
          )}
          {website && <div style={{ color: '#64748b', fontSize: '9pt' }}>{website}</div>}
          {taxId && <div style={{ color: '#64748b', fontSize: '9pt' }}>Tax ID: {taxId}</div>}
        </div>

        {/* Invoice meta block — right-aligned, vertically centered with company block */}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: '22pt', fontWeight: 900, color: primary, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '4mm', lineHeight: 1 }}>
            INVOICE
          </div>
          <table style={{ marginLeft: 'auto', fontSize: '9pt', borderCollapse: 'collapse' }}>
            <tbody>
              {[
                ['Invoice #', invoiceNumber],
                ['Date',      date],
                ['Due Date',  dueDate],
              ].map(([label, value]) => (
                <tr key={label}>
                  <td style={{ paddingRight: '5mm', paddingBottom: '1mm', color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', fontSize: '8pt', letterSpacing: '0.05em', textAlign: 'right' }}>
                    {label}
                  </td>
                  <td style={{ paddingBottom: '1mm', fontWeight: label === 'Invoice #' || label === 'Due Date' ? 700 : 400, color: '#1e293b', textAlign: 'right' }}>
                    {value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Bill To ─────────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: '8mm', padding: '4mm 5mm', backgroundColor: `${primary}12`, borderLeft: `4px solid ${primary}`, borderRadius: '4px' }}>
        <div style={{ fontSize: '8pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: '1mm' }}>
          Bill To
        </div>
        {customer.name && <div style={{ fontWeight: 700, fontSize: '11pt' }}>{customer.name}</div>}
        {customer.address && <div style={{ color: '#475569', fontSize: '9pt', whiteSpace: 'pre-line' }}>{customer.address}</div>}
        {(customer.phone || customer.email) && (
          <div style={{ color: '#475569', fontSize: '9pt' }}>
            {[customer.phone, customer.email].filter(Boolean).join(' · ')}
          </div>
        )}
      </div>

      {/* ── Line items table ─────────────────────────────────────────────────── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6mm', fontSize: '9pt' }}>
        <thead>
          <tr style={{ backgroundColor: primary, color: '#ffffff' }}>
            {['#', 'Description', 'Qty', 'Rate', 'Amount'].map((h, i) => (
              <th key={h} style={{
                padding: '2.5mm 3mm',
                textAlign: i >= 2 ? 'right' : i === 0 ? 'center' : 'left',
                fontWeight: 700, fontSize: '8pt', textTransform: 'uppercase', letterSpacing: '0.06em',
                width: i === 0 ? '8mm' : i >= 2 ? '22mm' : undefined,
              }}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items.map((item, idx) => (
            <tr key={item.id || idx} style={{ backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc', borderBottom: '1px solid #f1f5f9' }}>
              <td style={{ padding: '2mm 3mm', textAlign: 'center', color: '#94a3b8', fontSize: '8pt' }}>{item.serialNo || idx + 1}</td>
              <td style={{ padding: '2mm 3mm', color: '#334155' }}>{item.description}</td>
              <td style={{ padding: '2mm 3mm', textAlign: 'right', color: '#475569' }}>{item.quantity}</td>
              <td style={{ padding: '2mm 3mm', textAlign: 'right', color: '#475569' }}>{fmt(item.rate)}</td>
              <td style={{ padding: '2mm 3mm', textAlign: 'right', fontWeight: 600 }}>{fmt(item.amount)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ── Totals ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8mm' }}>
        <div style={{ width: '62mm', fontSize: '9pt' }}>
          {[
            ['Subtotal', fmt(subtotal), '#475569', false],
            ...(discount > 0 ? [['Discount', `-${fmt(discount)}`, '#dc2626', false]] : []),
            [`Tax (${taxRate}%)`, fmt(taxAmount), '#475569', false],
          ].map(([label, value, color]) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '1mm 0', color: '#475569' }}>
              <span>{label}</span>
              <span style={{ color, fontWeight: 500 }}>{value}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '2.5mm 0', borderTop: `2px solid ${primary}`, marginTop: '1mm', color: primary, fontWeight: 800, fontSize: '12pt' }}>
            <span>Total</span>
            <span>{fmt(grandTotal)}</span>
          </div>
        </div>
      </div>

      {/* ── Bank / Payment Details ───────────────────────────────────────────── */}
      {(bankDetails.bankName || bankDetails.accountNumber) && (
        <div style={{ marginBottom: '6mm', padding: '4mm 5mm', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '4px', fontSize: '9pt' }}>
          <div style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '8pt', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: '2mm' }}>
            Payment Details
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1mm 4mm', color: '#475569' }}>
            {[
              ['Bank',         bankDetails.bankName],
              ['Account Name', bankDetails.accountName],
              ['Account No.',  bankDetails.accountNumber],
              ['SWIFT',        bankDetails.swiftCode],
              ['IBAN',         bankDetails.iban],
              ['Routing No.',  bankDetails.routingNumber],
              ['Sort Code',    bankDetails.sortCode],
            ].filter(([, v]) => v).map(([label, value]) => (
              <div key={label} style={{ display: 'flex', gap: '2mm' }}>
                <span style={{ color: '#94a3b8', minWidth: '22mm' }}>{label}:</span>
                <span style={{ fontWeight: 500 }}>{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Notes & Terms ────────────────────────────────────────────────────── */}
      {(notes || termsAndConditions) && (
        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '5mm', display: 'grid', gridTemplateColumns: notes && termsAndConditions ? '1fr 1fr' : '1fr', gap: '5mm', fontSize: '8.5pt', color: '#475569' }}>
          {notes && (
            <div>
              <div style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '7.5pt', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: '1.5mm' }}>Notes</div>
              <p style={{ whiteSpace: 'pre-line', margin: 0 }}>{notes}</p>
            </div>
          )}
          {termsAndConditions && (
            <div>
              <div style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '7.5pt', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: '1.5mm' }}>Terms &amp; Conditions</div>
              <p style={{ whiteSpace: 'pre-line', margin: 0 }}>{termsAndConditions}</p>
            </div>
          )}
        </div>
      )}

      {/* ── QR Code footer ───────────────────────────────────────────────────── */}
      {website && (
        <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '6mm', paddingTop: '5mm', display: 'flex', alignItems: 'center', gap: '5mm' }}>
          <QRCode url={website} size={64} />
          <div style={{ fontSize: '8pt', color: '#94a3b8' }}>
            <div style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '1mm' }}>Visit us online</div>
            <div style={{ color: primary, fontWeight: 600 }}>{website}</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default DefaultTemplate
