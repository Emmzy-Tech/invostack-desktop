/**
 * src/templates/pos/PosTemplate.jsx  — POS 80mm thermal receipt template.
 *
 * Paper & print spec:
 *   • Roll width: 80mm. Printable area: ~72mm (4mm margins each side).
 *   • CSS @page: { size: 80mm auto; margin: 2mm 4mm } — height auto-grows.
 *   • No background colours — thermal printers print black on white only.
 *
 * Design:
 *   • Clean header block: logo → company name → contact row → bold divider.
 *   • Receipt-style meta table (INVOICE #, DATE, DUE, STATUS).
 *   • Itemised table with description + right-aligned amount on same line
 *     (fits 72mm comfortably without wrapping on most items).
 *   • Totals block with double-rule grand total for visual weight.
 *   • Payment details, notes, then a QR code when website is set.
 *   • "Thank you" sign-off centred at bottom.
 */

import QRCode from '../../components/ui/QRCode.jsx'

const fmt = (n) => Number(n ?? 0).toFixed(2)

/* Solid rule helpers */
const Rule = ({ thick = false }) => (
  <div style={{ borderTop: thick ? '2px solid #000' : '1px dashed #aaa', margin: '2mm 0' }} />
)

/* Single key-value row, monospaced */
const MetaRow = ({ label, value, bold = false }) => (
  <div style={{
    display: 'flex', justifyContent: 'space-between',
    fontFamily: "'Courier New', Courier, monospace",
    fontSize: '8pt', fontWeight: bold ? 700 : 400,
    marginBottom: '0.8mm',
  }}>
    <span style={{ color: bold ? '#000' : '#444' }}>{label}</span>
    <span>{value}</span>
  </div>
)

function PosTemplate({ invoice = {}, company = {} }) {
  const {
    invoiceNumber = '', date = '', dueDate = '', status = 'draft',
    customer = {}, items = [],
    subtotal = 0, taxRate = 0, taxAmount = 0, discount = 0, grandTotal = 0,
    notes = '', termsAndConditions = '',
    columnHeaders = {},
  } = invoice

  const {
    companyName = '', address = '', phone = '', email = '', website = '',
    logoPath = '',
    bankDetails: bd = {},
  } = company

  const hdrs = {
    description: columnHeaders.description || 'Description',
    quantity:    columnHeaders.quantity    || 'Qty',
    rate:        columnHeaders.rate        || 'Rate',
    amount:      columnHeaders.amount      || 'Amt',
  }

  const statusLabel = status === 'final' ? 'PAID / FINAL' : 'DRAFT'

  return (
    <>
      <style>{`
        @media print {
          @page { size: 80mm auto; margin: 2mm 4mm; }
          body  { margin: 0; padding: 0; }
        }
      `}</style>

      <div style={{
        width: '72mm', boxSizing: 'border-box',
        backgroundColor: '#fff', color: '#000',
        fontFamily: "'Courier New', Courier, monospace",
        fontSize: '9pt', lineHeight: 1.45,
        padding: '3mm 0 4mm',
      }}>

        {/* ── Logo ─────────────────────────────────────────────────── */}
        {logoPath && (
          <div style={{ textAlign: 'center', marginBottom: '2mm' }}>
            <img
              src={`file://${logoPath}`} alt="logo"
              style={{ maxHeight: '16mm', maxWidth: '44mm', objectFit: 'contain' }}
            />
          </div>
        )}

        {/* ── Company header ───────────────────────────────────────── */}
        <div style={{ textAlign: 'center', marginBottom: '2.5mm' }}>
          <div style={{ fontWeight: 900, fontSize: '12pt', letterSpacing: '0.03em', marginBottom: '1mm' }}>
            {companyName || 'Your Company'}
          </div>
          {address && (
            <div style={{ fontSize: '7.5pt', color: '#444', whiteSpace: 'pre-line', marginBottom: '0.5mm' }}>
              {address}
            </div>
          )}
          {/* Contact line: phone · email */}
          {(phone || email) && (
            <div style={{ fontSize: '7.5pt', color: '#444' }}>
              {[phone, email].filter(Boolean).join('  ·  ')}
            </div>
          )}
          {website && (
            <div style={{ fontSize: '7.5pt', color: '#444', marginTop: '0.5mm' }}>
              {website}
            </div>
          )}
        </div>

        <Rule thick />

        {/* ── Invoice meta ─────────────────────────────────────────── */}
        <div style={{ marginBottom: '1.5mm' }}>
          <MetaRow label="INVOICE #" value={invoiceNumber} bold />
          <MetaRow label="DATE"      value={date} />
          <MetaRow label="DUE DATE"  value={dueDate} />
          <MetaRow label="STATUS"    value={statusLabel} />
        </div>

        {/* ── Bill To ──────────────────────────────────────────────── */}
        {customer.name && (
          <>
            <Rule />
            <div style={{ fontSize: '7pt', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '1mm' }}>
              BILL TO:
            </div>
            <div style={{ fontSize: '8.5pt', fontWeight: 700, marginBottom: '0.5mm' }}>{customer.name}</div>
            {customer.address && (
              <div style={{ fontSize: '7.5pt', color: '#444', whiteSpace: 'pre-line' }}>{customer.address}</div>
            )}
            {customer.phone && <div style={{ fontSize: '7.5pt', color: '#444' }}>{customer.phone}</div>}
            {customer.email && <div style={{ fontSize: '7.5pt', color: '#444' }}>{customer.email}</div>}
          </>
        )}

        <Rule />

        {/* ── Items table header ───────────────────────────────────── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontSize: '7pt', fontWeight: 700, letterSpacing: '0.06em',
          borderBottom: '1px solid #000', paddingBottom: '1mm', marginBottom: '1mm',
        }}>
          <span style={{ flex: 1 }}>{hdrs.description.toUpperCase()}</span>
          <span style={{ minWidth: '18mm', textAlign: 'right' }}>{hdrs.amount.toUpperCase()}</span>
        </div>

        {/* ── Items ────────────────────────────────────────────────── */}
        <div style={{ marginBottom: '1.5mm' }}>
          {items.map((item, idx) => (
            <div key={item.id || idx} style={{ marginBottom: '2mm' }}>
              {/* Description row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '8.5pt' }}>
                <span style={{ flex: 1, paddingRight: '2mm' }}>
                  {(item.serialNo || idx + 1)}. {item.description || '—'}
                </span>
                <span style={{ minWidth: '18mm', textAlign: 'right', fontWeight: 600 }}>
                  {fmt(item.amount)}
                </span>
              </div>
              {/* Qty × Rate sub-line */}
              <div style={{ fontSize: '7.5pt', color: '#555', paddingLeft: '3mm' }}>
                {item.quantity} {hdrs.quantity.toLowerCase()} × {fmt(item.rate)}
              </div>
            </div>
          ))}
        </div>

        <Rule />

        {/* ── Totals ───────────────────────────────────────────────── */}
        <MetaRow label="Subtotal" value={fmt(subtotal)} />
        {discount > 0 && <MetaRow label="Discount" value={`-${fmt(discount)}`} />}
        <MetaRow label={`Tax (${taxRate}%)`} value={fmt(taxAmount)} />

        <div style={{ borderTop: '2px solid #000', margin: '1.5mm 0' }} />

        {/* Grand total — large, prominent */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          fontWeight: 900, fontSize: '11pt', marginBottom: '0.5mm',
        }}>
          <span>TOTAL</span>
          <span>{fmt(grandTotal)}</span>
        </div>

        <div style={{ borderTop: '2px solid #000', marginBottom: '1.5mm' }} />

        {/* ── Bank / Payment Details ────────────────────────────────── */}
        {(bd.bankName || bd.accountNumber) && (
          <>
            <div style={{ fontSize: '7pt', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '1mm' }}>
              PAYMENT DETAILS:
            </div>
            {[
              ['Bank',     bd.bankName],
              ['Acct',     bd.accountName],
              ['Acct No.', bd.accountNumber],
              ['SWIFT',    bd.swiftCode],
              ['IBAN',     bd.iban],
              ['Routing',  bd.routingNumber],
              ['Sort',     bd.sortCode],
            ].filter(([, v]) => v).map(([l, v]) => (
              <div key={l} style={{ display: 'flex', fontSize: '7.5pt', marginBottom: '0.5mm' }}>
                <span style={{ minWidth: '14mm', color: '#555' }}>{l}:</span>
                <span style={{ fontWeight: 600 }}>{v}</span>
              </div>
            ))}
            <Rule />
          </>
        )}

        {/* ── Notes ────────────────────────────────────────────────── */}
        {notes && (
          <>
            <div style={{ fontSize: '7.5pt', color: '#444', whiteSpace: 'pre-line', marginBottom: '1.5mm' }}>
              {notes}
            </div>
            <Rule />
          </>
        )}

        {/* ── Terms ────────────────────────────────────────────────── */}
        {termsAndConditions && (
          <>
            <div style={{ fontSize: '7pt', fontWeight: 700, letterSpacing: '0.08em', marginBottom: '0.5mm' }}>
              TERMS:
            </div>
            <div style={{ fontSize: '7pt', color: '#555', whiteSpace: 'pre-line', marginBottom: '1.5mm' }}>
              {termsAndConditions}
            </div>
            <Rule />
          </>
        )}

        {/* ── QR Code + website label ───────────────────────────────── */}
        {website && (
          <div style={{ textAlign: 'center', marginBottom: '2mm' }}>
            <QRCode url={website} size={80} style={{ margin: '0 auto 1.5mm' }} />
            <div style={{ fontSize: '7pt', color: '#444' }}>{website}</div>
          </div>
        )}

        {/* ── Footer sign-off ───────────────────────────────────────── */}
        <Rule thick />
        <div style={{ textAlign: 'center', fontSize: '8.5pt', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '1mm' }}>
          Thank you for your business!
        </div>
        <Rule />
      </div>
    </>
  )
}

export default PosTemplate
