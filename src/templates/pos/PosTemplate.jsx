/**
 * src/templates/pos/PosTemplate.jsx  — POS 80mm thermal receipt template.
 *
 * THIS IS NOT A SCALED-DOWN A4 TEMPLATE. It is a genuinely different layout:
 *
 * Paper & print spec:
 *   • Roll width: 80mm. Printable area: ~72mm (4mm margins each side).
 *   • CSS @page rule: { size: 80mm auto; margin: 2mm 4mm } — auto height
 *     so the PDF / print output grows with content, never clips.
 *   • The <style> block is embedded inside the component so it's present in
 *     the exported HTML that Electron's print API renders.
 *
 * Layout rules (matching real thermal receipt conventions):
 *   • Single column, everything left-aligned or centered.
 *   • No wide tables — items are stacked as two lines per row:
 *       Line 1: description
 *       Line 2: qty × rate = amount  (right-aligned)
 *   • Dashed separators (instead of box borders) between sections.
 *   • Small centered logo if logoPath is set (≤ 20mm tall).
 *   • Monospace-adjacent font (Courier New) for numerical alignment.
 *   • No background colours — thermal printers are black on white only.
 */

const DASH = '- '.repeat(18)  // ~72mm dashed separator line

const fmt = (n) => Number(n ?? 0).toFixed(2)

function PosTemplate({ invoice = {}, company = {} }) {
  const {
    invoiceNumber = '', date = '', dueDate = '', status = 'draft',
    customer = {}, items = [],
    subtotal = 0, taxRate = 0, taxAmount = 0, discount = 0, grandTotal = 0,
    notes = '', termsAndConditions = '',
  } = invoice

  const {
    companyName = '', address = '', phone = '', email = '',
    logoPath = '',
    bankDetails: bd = {},
  } = company

  const monoStyle = { fontFamily: "'Courier New', Courier, monospace" }

  const row = (label, value, bold = false) => (
    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', ...monoStyle, fontSize: '8.5pt', fontWeight: bold ? 700 : 400, marginBottom: '0.5mm' }}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  )

  return (
    <>
      {/*
        Embedded @page rule — this is the critical piece for correct paper sizing.
        When Electron calls webContents.print() or printToPDF() with this content:
          • size: 80mm auto  → sets roll width to exactly 80mm, height grows with content
          • margin: 2mm 4mm  → 4mm side margins give ~72mm printable width
        Do NOT change this to A4 — that would defeat the purpose of the POS layout.
      */}
      <style>{`
        @media print {
          @page { size: 80mm auto; margin: 2mm 4mm; }
          body   { margin: 0; padding: 0; }
        }
      `}</style>

      <div style={{ width: '72mm', boxSizing: 'border-box', backgroundColor: '#fff', color: '#000', fontSize: '9pt', fontFamily: "'Courier New', Courier, monospace", lineHeight: 1.4, padding: '2mm 0' }}>

        {/* ── Logo (optional, small, centred) ──────────────────────────── */}
        {logoPath && (
          <div style={{ textAlign: 'center', marginBottom: '2mm' }}>
            <img src={`file://${logoPath}`} alt="logo" style={{ maxHeight: '14mm', maxWidth: '40mm', objectFit: 'contain' }} />
          </div>
        )}

        {/* ── Company header — centred ──────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: '2mm' }}>
          <div style={{ fontWeight: 700, fontSize: '11pt', marginBottom: '1mm' }}>{companyName || 'Your Company'}</div>
          {address && <div style={{ fontSize: '8pt', whiteSpace: 'pre-line' }}>{address}</div>}
          {phone && <div style={{ fontSize: '8pt' }}>{phone}</div>}
          {email && <div style={{ fontSize: '8pt' }}>{email}</div>}
        </div>

        <div style={{ borderTop: '2px solid #000', marginBottom: '1.5mm' }} />

        {/* ── Invoice meta ─────────────────────────────────────────────── */}
        {row('INVOICE #', invoiceNumber)}
        {row('DATE', date)}
        {row('DUE', dueDate)}
        {row('STATUS', status.toUpperCase())}

        <div style={{ color: '#555', fontSize: '8pt', margin: '1.5mm 0' }}>{DASH}</div>

        {/* ── Bill To ──────────────────────────────────────────────────── */}
        {customer.name && (
          <>
            <div style={{ fontSize: '7.5pt', fontWeight: 700, marginBottom: '0.5mm' }}>BILL TO:</div>
            <div style={{ fontSize: '8.5pt', fontWeight: 600 }}>{customer.name}</div>
            {customer.address && <div style={{ fontSize: '8pt', whiteSpace: 'pre-line' }}>{customer.address}</div>}
            {customer.phone && <div style={{ fontSize: '8pt' }}>{customer.phone}</div>}
          </>
        )}

        <div style={{ color: '#555', fontSize: '8pt', margin: '1.5mm 0' }}>{DASH}</div>

        {/* ── Line items — stacked rows, no wide table ──────────────────── */}
        <div style={{ marginBottom: '1mm' }}>
          {items.map((item, idx) => (
            <div key={item.id || idx} style={{ marginBottom: '2mm' }}>
              {/* Row 1: serial + description */}
              <div style={{ fontWeight: 400, fontSize: '9pt' }}>
                {(item.serialNo || idx + 1)}. {item.description || '(no description)'}
              </div>
              {/* Row 2: qty × rate = amount, right-aligned */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', fontSize: '8.5pt', color: '#222', fontFamily: "'Courier New', monospace" }}>
                {item.quantity} × {fmt(item.rate)} = <strong style={{ marginLeft: '2mm' }}>{fmt(item.amount)}</strong>
              </div>
            </div>
          ))}
        </div>

        <div style={{ color: '#555', fontSize: '8pt', margin: '1.5mm 0' }}>{DASH}</div>

        {/* ── Totals ───────────────────────────────────────────────────── */}
        {row('Subtotal', fmt(subtotal))}
        {discount > 0 && row('Discount', `-${fmt(discount)}`)}
        {row(`Tax (${taxRate}%)`, fmt(taxAmount))}
        <div style={{ borderTop: '2px solid #000', margin: '1.5mm 0' }} />
        {row('TOTAL', fmt(grandTotal), true)}

        {/* ── Bank / Payment Details ────────────────────────────────────── */}
        {(bd.bankName || bd.accountNumber) && (
          <>
            <div style={{ color: '#555', fontSize: '8pt', margin: '1.5mm 0' }}>{DASH}</div>
            <div style={{ fontSize: '7.5pt', fontWeight: 700, marginBottom: '1mm' }}>PAYMENT DETAILS:</div>
            {[['Bank', bd.bankName], ['Acct Name', bd.accountName], ['Acct No.', bd.accountNumber], ['SWIFT', bd.swiftCode], ['IBAN', bd.iban]].filter(([, v]) => v).map(([l, v]) => (
              <div key={l} style={{ fontSize: '8pt', display: 'flex', gap: '2mm' }}>
                <span style={{ minWidth: '16mm', color: '#555' }}>{l}:</span>
                <span>{v}</span>
              </div>
            ))}
          </>
        )}

        {/* ── Notes ────────────────────────────────────────────────────── */}
        {notes && (
          <>
            <div style={{ color: '#555', fontSize: '8pt', margin: '1.5mm 0' }}>{DASH}</div>
            <div style={{ fontSize: '8pt', whiteSpace: 'pre-line' }}>{notes}</div>
          </>
        )}

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <div style={{ borderTop: '2px solid #000', margin: '2mm 0' }} />
        <div style={{ textAlign: 'center', fontSize: '8pt' }}>Thank you for your business!</div>
        <div style={{ borderTop: '1px solid #000', marginTop: '2mm' }} />
      </div>
    </>
  )
}

export default PosTemplate
