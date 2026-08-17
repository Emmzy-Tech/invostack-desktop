/**
 * src/templates/a4/BoldHeaderTemplate.jsx  — "Bold Header" A4 template.
 *
 * Design language:
 *   • Full-width solid color header band (brand primary) — maximum visual impact.
 *   • Company name, contact info, and invoice meta all live in the header in white.
 *   • Logo (if set) appears top-right of the header.
 *   • Body uses a clean table with alternating row tints derived from the brand color.
 *   • Grand Total box is filled with the brand color (white text) — eye-catching.
 *   • Suitable for companies that want their brand color to dominate the page.
 *
 * Paper: 210mm × ≥297mm A4 with mm inline styles for cross-OS print accuracy.
 */

import QRCode from '../../components/ui/QRCode.jsx'

const fmt = (n) => Number(n ?? 0).toFixed(2)

function BoldHeaderTemplate({ invoice = {}, company = {} }) {
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

  // Derive a slightly darker shade for secondary header elements from the primary.
  // Using rgba overlay is simpler and avoids hex manipulation.
  const headerOverlay = 'rgba(0,0,0,0.15)'
  const rowTint = `${primary}0D` // ~5% opacity tint for alternating rows

  return (
    <div style={{ width: '210mm', minHeight: '297mm', boxSizing: 'border-box', backgroundColor: '#fff', fontFamily: `${company.brandFont || 'system-ui'}, sans-serif`, color: '#0f172a', fontSize: '10pt', lineHeight: 1.5 }}>

      {/* ── Full-width header band ───────────────────────────────────────── */}
      <div style={{ backgroundColor: primary, padding: '10mm 12mm', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>

        {/* Company block — left */}
        <div style={{ color: 'white' }}>
          <div style={{ fontSize: '20pt', fontWeight: 900, letterSpacing: '-0.5px', marginBottom: '2mm' }}>
            {companyName || 'Your Company'}
          </div>
          <div style={{ fontSize: '8pt', opacity: 0.82, lineHeight: 1.8, whiteSpace: 'pre-line' }}>
            {[address, phone && `☏ ${phone}`, email && `✉ ${email}`, website, taxId && `Tax ID: ${taxId}`].filter(Boolean).join('\n')}
          </div>
        </div>

        {/* Invoice meta + optional logo — right */}
        <div style={{ textAlign: 'right', color: 'white' }}>
          {logoPath && (
            <img
              src={`file://${logoPath}`}
              alt="logo"
              style={{ maxHeight: '18mm', maxWidth: '40mm', objectFit: 'contain', marginBottom: '3mm', display: 'block', marginLeft: 'auto' }}
            />
          )}
          <div style={{ fontSize: '18pt', fontWeight: 900, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '2mm', opacity: 0.95 }}>
            Invoice
          </div>
          <div style={{ fontSize: '8pt', opacity: 0.85, lineHeight: 1.9 }}>
            <div><span style={{ opacity: 0.7 }}>No. </span><strong>{invoiceNumber}</strong></div>
            <div><span style={{ opacity: 0.7 }}>Date </span>{date}</div>
            <div><span style={{ opacity: 0.7 }}>Due  </span><strong>{dueDate}</strong></div>
          </div>
          <div style={{ marginTop: '1.5mm', fontSize: '8pt', fontWeight: 700, textTransform: 'capitalize', backgroundColor: headerOverlay, display: 'inline-block', padding: '0.5mm 2.5mm', borderRadius: '3px' }}>
            {status}
          </div>
        </div>
      </div>

      <div style={{ padding: '8mm 12mm 12mm' }}>

        {/* ── Bill To ──────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: '8mm', padding: '4mm 5mm', border: `1.5px solid ${primary}`, borderRadius: '6px' }}>
          <div style={{ fontSize: '7.5pt', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: primary, marginBottom: '1.5mm' }}>Bill To</div>
          <div style={{ fontWeight: 700, fontSize: '11pt' }}>{customer.name}</div>
          <div style={{ color: '#475569', fontSize: '9pt', whiteSpace: 'pre-line' }}>{customer.address}</div>
          <div style={{ color: '#475569', fontSize: '9pt' }}>{[customer.phone, customer.email].filter(Boolean).join(' · ')}</div>
        </div>

        {/* ── Items table ──────────────────────────────────────────────────── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '6mm', fontSize: '9pt' }}>
          <thead>
            <tr style={{ backgroundColor: primary, color: 'white' }}>
              {[['#', '8mm', 'center'], ['Description', null, 'left'], ['Qty', '18mm', 'right'], ['Rate', '24mm', 'right'], ['Amount', '26mm', 'right']].map(([h, w, align]) => (
                <th key={h} style={{ padding: '2.5mm 3mm', textAlign: align, fontWeight: 700, fontSize: '8pt', textTransform: 'uppercase', letterSpacing: '0.06em', width: w || undefined }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.id || idx} style={{ backgroundColor: idx % 2 === 1 ? rowTint : '#fff', borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '2.5mm 3mm', textAlign: 'center', color: '#94a3b8', fontSize: '8pt' }}>{item.serialNo || idx + 1}</td>
                <td style={{ padding: '2.5mm 3mm', color: '#334155' }}>{item.description}</td>
                <td style={{ padding: '2.5mm 3mm', textAlign: 'right', color: '#475569' }}>{item.quantity}</td>
                <td style={{ padding: '2.5mm 3mm', textAlign: 'right', color: '#475569' }}>{fmt(item.rate)}</td>
                <td style={{ padding: '2.5mm 3mm', textAlign: 'right', fontWeight: 600 }}>{fmt(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── Totals — Grand Total in a filled primary box ─────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '8mm' }}>
          <div style={{ width: '62mm', fontSize: '9pt' }}>
            {[['Subtotal', fmt(subtotal)], ...(discount > 0 ? [['Discount', `-${fmt(discount)}`]] : []), [`Tax (${taxRate}%)`, fmt(taxAmount)]].map(([l, v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '1.2mm 0', color: '#475569', borderBottom: '1px solid #f1f5f9' }}>
                <span>{l}</span><span>{v}</span>
              </div>
            ))}
            {/* Grand Total — filled box */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2mm', padding: '3mm 4mm', backgroundColor: primary, color: 'white', borderRadius: '5px', fontWeight: 800, fontSize: '13pt' }}>
              <span>Total</span><span>{fmt(grandTotal)}</span>
            </div>
          </div>
        </div>

        {/* ── Bank Details ─────────────────────────────────────────────────── */}
        {(bd.bankName || bd.accountNumber) && (
          <div style={{ marginBottom: '6mm', padding: '4mm 5mm', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '5px', fontSize: '8.5pt' }}>
            <div style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '7.5pt', letterSpacing: '0.08em', color: primary, marginBottom: '2mm' }}>Payment Details</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1mm 4mm', color: '#475569' }}>
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
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '4mm', display: 'grid', gridTemplateColumns: notes && termsAndConditions ? '1fr 1fr' : '1fr', gap: '6mm', fontSize: '8.5pt', color: '#64748b' }}>
            {notes && <div><div style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '7.5pt', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: '1.5mm' }}>Notes</div><p style={{ whiteSpace: 'pre-line', margin: 0 }}>{notes}</p></div>}
            {termsAndConditions && <div><div style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '7.5pt', letterSpacing: '0.08em', color: '#94a3b8', marginBottom: '1.5mm' }}>Terms</div><p style={{ whiteSpace: 'pre-line', margin: 0 }}>{termsAndConditions}</p></div>}
          </div>
        )}

        {/* ── QR Code footer ────────────────────────────────────────────────── */}
        {website && (
          <div style={{ borderTop: '1px solid #e2e8f0', marginTop: '6mm', paddingTop: '4mm', display: 'flex', alignItems: 'center', gap: '4mm' }}>
            <QRCode url={website} size={64} style={{ borderRadius: '4px', border: `2px solid ${primary}`, padding: '2px' }} />
            <div style={{ fontSize: '8pt' }}>
              <div style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', fontSize: '7.5pt', color: '#94a3b8', marginBottom: '1mm' }}>Visit us online</div>
              <div style={{ color: primary, fontWeight: 700 }}>{website}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default BoldHeaderTemplate
