/**
 * src/templates/pos/PosTemplate.jsx  — POS 80mm thermal receipt template.
 *
 * Paper & print spec:
 *   • Roll width: 80mm. Printable area: ~72mm (4mm margins each side).
 *   • CSS @page: { size: 80mm auto; margin: 3mm 4mm } — height auto-grows.
 *   • width: 100% with box padding so content never overflows the roll.
 *   • No background colours — thermal printers are black on white only.
 */

import QRCode from '../../components/ui/QRCode.jsx'

const fmtC = (n) =>
  Number(n ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/* ─── Dividers ───────────────────────────────────────────────────────────── */
const SolidRule = ({ thick = false, style = {} }) => (
  <div style={{
    borderTop: thick ? '2px solid #111' : '1px solid #333',
    margin: thick ? '3mm 0' : '2.5mm 0',
    ...style,
  }} />
)

const DashRule = ({ style = {} }) => (
  <div style={{ borderTop: '1px dashed #bbb', margin: '2.5mm 0', ...style }} />
)

/* ─── Section label ──────────────────────────────────────────────────────── */
const SectionLabel = ({ children }) => (
  <div style={{
    fontSize: '6.5pt', fontWeight: 800, letterSpacing: '0.12em',
    textTransform: 'uppercase', color: '#555', marginBottom: '1.5mm',
  }}>
    {children}
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
    description: (columnHeaders.description || 'Item').toUpperCase(),
    quantity:    (columnHeaders.quantity    || 'Qty').toUpperCase(),
    rate:        (columnHeaders.rate        || 'Rate').toUpperCase(),
    amount:      (columnHeaders.amount      || 'Amt').toUpperCase(),
  }

  const isPaid = status === 'final'
  const font   = "Arial, 'Helvetica Neue', Helvetica, sans-serif"

  /* ── bank detail row ── */
  const BankRow = ({ label, value }) =>
    value ? (
      <div style={{ display: 'flex', gap: '2mm', fontSize: '7.5pt', lineHeight: 1.6 }}>
        <span style={{ color: '#666', minWidth: '18mm', flexShrink: 0 }}>{label}:</span>
        <span style={{ fontWeight: 600, wordBreak: 'break-all' }}>{value}</span>
      </div>
    ) : null

  return (
    <>
      <style>{`
        @media print {
          @page { size: 80mm auto; margin: 3mm 4mm; }
          body  { margin: 0; padding: 0; }
        }
        * { box-sizing: border-box; }
      `}</style>

      {/* ── Outermost wrapper: 100% width, horizontal padding gives breathing room ── */}
      <div style={{
        width: '100%',
        maxWidth: '76mm',
        margin: '0 auto',
        backgroundColor: '#fff',
        color: '#111',
        fontFamily: font,
        fontSize: '8.5pt',
        lineHeight: 1.5,
        padding: '4mm 3mm 6mm',
      }}>

        {/* ════════════════════════════════════════════════════════════
            HEADER — logo  ·  company name  ·  contact
        ════════════════════════════════════════════════════════════ */}

        {/* Circular logo — always reserve space, show placeholder ring if no logo */}
        <div style={{ textAlign: 'center', marginBottom: '3mm' }}>
          {logoPath ? (
            <img
              src={`file://${logoPath}`} alt="logo"
              style={{
                width: '22mm', height: '22mm',
                borderRadius: '50%',
                border: '2.5px solid #111',
                objectFit: 'cover',
                display: 'inline-block',
              }}
            />
          ) : (
            /* Placeholder circle with first letter of company name */
            <div style={{
              width: '22mm', height: '22mm',
              borderRadius: '50%',
              border: '2.5px solid #111',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13pt',
              fontWeight: 900,
              color: '#111',
              lineHeight: 1,
            }}>
              {(companyName || 'C')[0].toUpperCase()}
            </div>
          )}
        </div>

        {/* Company name */}
        <div style={{
          textAlign: 'center', fontWeight: 900,
          fontSize: '13pt', letterSpacing: '0.02em',
          marginBottom: '1.5mm',
        }}>
          {companyName || 'Your Company'}
        </div>

        {/* Address */}
        {address && (
          <div style={{
            textAlign: 'center', fontSize: '7.5pt',
            color: '#444', whiteSpace: 'pre-line',
            marginBottom: '1mm',
          }}>
            {address}
          </div>
        )}

        {/* Phone */}
        {phone && (
          <div style={{ textAlign: 'center', fontSize: '7.5pt', color: '#444', marginBottom: '0.5mm' }}>
            {phone}
          </div>
        )}

        {/* Email */}
        {email && (
          <div style={{ textAlign: 'center', fontSize: '7.5pt', color: '#444', marginBottom: '0.5mm' }}>
            {email}
          </div>
        )}

        {/* Website */}
        {website && (
          <div style={{ textAlign: 'center', fontSize: '7.5pt', color: '#444', marginBottom: '1mm' }}>
            {website}
          </div>
        )}

        <SolidRule thick />

        {/* ════════════════════════════════════════════════════════════
            INVOICE TITLE + NUMBER + STATUS BADGE
        ════════════════════════════════════════════════════════════ */}
        <div style={{ textAlign: 'center', marginBottom: '1mm' }}>
          <div style={{
            fontWeight: 900, fontSize: '16pt',
            letterSpacing: '0.18em', textTransform: 'uppercase',
          }}>
            INVOICE
          </div>
          <div style={{ fontSize: '8pt', color: '#444', marginTop: '1mm', letterSpacing: '0.05em' }}>
            No. <strong>{invoiceNumber}</strong>
          </div>
          {/* Status badge */}
          <div style={{
            display: 'inline-block',
            marginTop: '2mm',
            padding: '0.8mm 4mm',
            border: `1.5px solid ${isPaid ? '#111' : '#999'}`,
            borderRadius: '2px',
            fontSize: '7pt',
            fontWeight: 700,
            letterSpacing: '0.1em',
            color: isPaid ? '#111' : '#888',
          }}>
            {isPaid ? 'PAID' : 'DRAFT'}
          </div>
        </div>

        <SolidRule />

        {/* ════════════════════════════════════════════════════════════
            BILLED TO  +  DATES  (side by side if both present)
        ════════════════════════════════════════════════════════════ */}
        <div style={{
          display: 'flex', gap: '3mm',
          marginBottom: '2.5mm',
        }}>
          {/* Billed To */}
          {customer.name && (
            <div style={{ flex: 1, minWidth: 0 }}>
              <SectionLabel>Billed To</SectionLabel>
              <div style={{ fontWeight: 700, fontSize: '8.5pt', marginBottom: '0.5mm' }}>
                {customer.name}
              </div>
              {customer.address && (
                <div style={{ fontSize: '7pt', color: '#555', whiteSpace: 'pre-line' }}>
                  {customer.address}
                </div>
              )}
              {customer.phone && (
                <div style={{ fontSize: '7pt', color: '#555' }}>{customer.phone}</div>
              )}
              {customer.email && (
                <div style={{ fontSize: '7pt', color: '#555', wordBreak: 'break-all' }}>
                  {customer.email}
                </div>
              )}
            </div>
          )}

          {/* Dates */}
          <div style={{ flexShrink: 0, textAlign: customer.name ? 'right' : 'center', width: customer.name ? 'auto' : '100%' }}>
            <SectionLabel>Date</SectionLabel>
            <div style={{ fontSize: '8pt', fontWeight: 600 }}>{date || '—'}</div>
            {dueDate && dueDate !== date && (
              <>
                <div style={{ fontSize: '6.5pt', color: '#666', marginTop: '1.5mm' }}>
                  <SectionLabel>Due Date</SectionLabel>
                </div>
                <div style={{ fontSize: '8pt', fontWeight: 600 }}>{dueDate}</div>
              </>
            )}
          </div>
        </div>

        <SolidRule />

        {/* ════════════════════════════════════════════════════════════
            ITEMS TABLE — percentage-based columns, never overflow
        ════════════════════════════════════════════════════════════ */}
        <table style={{
          width: '100%', borderCollapse: 'collapse',
          tableLayout: 'fixed', marginBottom: '0.5mm',
        }}>
          <colgroup>
            <col style={{ width: '44%' }} />
            <col style={{ width: '12%' }} />
            <col style={{ width: '20%' }} />
            <col style={{ width: '24%' }} />
          </colgroup>
          <thead>
            <tr>
              <th style={{
                textAlign: 'left', fontSize: '6.5pt', fontWeight: 800,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                paddingBottom: '1.5mm', borderBottom: '1.5px solid #111',
                color: '#333',
              }}>
                {hdrs.description}
              </th>
              <th style={{
                textAlign: 'center', fontSize: '6.5pt', fontWeight: 800,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                paddingBottom: '1.5mm', borderBottom: '1.5px solid #111',
                color: '#333',
              }}>
                {hdrs.quantity}
              </th>
              <th style={{
                textAlign: 'right', fontSize: '6.5pt', fontWeight: 800,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                paddingBottom: '1.5mm', borderBottom: '1.5px solid #111',
                color: '#333',
              }}>
                {hdrs.rate}
              </th>
              <th style={{
                textAlign: 'right', fontSize: '6.5pt', fontWeight: 800,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                paddingBottom: '1.5mm', borderBottom: '1.5px solid #111',
                color: '#333',
              }}>
                {hdrs.amount}
              </th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.id || idx}>
                <td style={{
                  padding: '1.8mm 1.5mm 1.8mm 0',
                  fontSize: '7.5pt', verticalAlign: 'top',
                  borderBottom: '0.5px solid #e0e0e0',
                  wordBreak: 'break-word',
                }}>
                  {item.description || '—'}
                </td>
                <td style={{
                  padding: '1.8mm 0', textAlign: 'center',
                  fontSize: '7.5pt', verticalAlign: 'top',
                  borderBottom: '0.5px solid #e0e0e0',
                }}>
                  {item.quantity}
                </td>
                <td style={{
                  padding: '1.8mm 0', textAlign: 'right',
                  fontSize: '7.5pt', verticalAlign: 'top',
                  borderBottom: '0.5px solid #e0e0e0',
                }}>
                  {fmtC(item.rate)}
                </td>
                <td style={{
                  padding: '1.8mm 0 1.8mm 1mm', textAlign: 'right',
                  fontSize: '7.5pt', fontWeight: 700, verticalAlign: 'top',
                  borderBottom: '0.5px solid #e0e0e0',
                }}>
                  {fmtC(item.amount)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ════════════════════════════════════════════════════════════
            TOTALS BLOCK
        ════════════════════════════════════════════════════════════ */}
        <div style={{ marginTop: '1mm', marginBottom: '0.5mm' }}>
          {/* Subtotal row — always show */}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: '7.5pt', color: '#555', padding: '0.8mm 0',
          }}>
            <span>Subtotal</span>
            <span>{fmtC(subtotal)}</span>
          </div>

          {discount > 0 && (
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: '7.5pt', color: '#555', padding: '0.8mm 0',
            }}>
              <span>Discount</span>
              <span>- {fmtC(discount)}</span>
            </div>
          )}

          {taxAmount > 0 && (
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              fontSize: '7.5pt', color: '#555', padding: '0.8mm 0',
            }}>
              <span>Tax ({taxRate}%)</span>
              <span>{fmtC(taxAmount)}</span>
            </div>
          )}
        </div>

        {/* Grand Total */}
        <SolidRule thick style={{ margin: '2mm 0 1.5mm' }} />
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
        }}>
          <span style={{ fontWeight: 900, fontSize: '10.5pt', letterSpacing: '0.05em' }}>
            TOTAL
          </span>
          <span style={{ fontWeight: 900, fontSize: '13pt' }}>
            {fmtC(grandTotal)}
          </span>
        </div>
        <SolidRule thick style={{ margin: '1.5mm 0 3mm' }} />

        {/* ════════════════════════════════════════════════════════════
            PAYMENT DETAILS
        ════════════════════════════════════════════════════════════ */}
        {(bd.bankName || bd.accountNumber || bd.iban || bd.routingNumber) && (
          <>
            <SectionLabel>Payment Details</SectionLabel>
            <div style={{
              border: '1px solid #ccc', borderRadius: '2px',
              padding: '2.5mm', marginBottom: '3mm',
            }}>
              <BankRow label="Bank"    value={bd.bankName} />
              <BankRow label="Acc Name" value={bd.accountName} />
              <BankRow label="Acc No"  value={bd.accountNumber} />
              <BankRow label="SWIFT"   value={bd.swiftCode} />
              <BankRow label="IBAN"    value={bd.iban} />
              <BankRow label="Routing" value={bd.routingNumber} />
              <BankRow label="Sort"    value={bd.sortCode} />
            </div>
          </>
        )}

        {/* ════════════════════════════════════════════════════════════
            QR CODE
        ════════════════════════════════════════════════════════════ */}
        {website && (
          <>
            <DashRule />
            <div style={{ textAlign: 'center', padding: '2mm 0 3mm' }}>
              <QRCode url={website} size={80} style={{ margin: '0 auto 2mm' }} />
              <div style={{ fontSize: '7pt', color: '#555', marginTop: '1.5mm' }}>
                Scan to visit us online
              </div>
              <div style={{ fontSize: '7pt', color: '#333', fontWeight: 600 }}>
                {website}
              </div>
            </div>
          </>
        )}

        {/* ════════════════════════════════════════════════════════════
            NOTES & TERMS
        ════════════════════════════════════════════════════════════ */}
        {(notes || termsAndConditions) && (
          <>
            <DashRule />
            {notes && (
              <>
                <SectionLabel>Notes</SectionLabel>
                <div style={{
                  fontSize: '7.5pt', color: '#444',
                  whiteSpace: 'pre-line', marginBottom: '2mm',
                }}>
                  {notes}
                </div>
              </>
            )}
            {termsAndConditions && (
              <>
                <SectionLabel>Terms &amp; Conditions</SectionLabel>
                <div style={{ fontSize: '7pt', color: '#555', whiteSpace: 'pre-line' }}>
                  {termsAndConditions}
                </div>
              </>
            )}
          </>
        )}

        {/* ════════════════════════════════════════════════════════════
            FOOTER
        ════════════════════════════════════════════════════════════ */}
        <SolidRule thick style={{ margin: '4mm 0 3mm' }} />
        <div style={{
          textAlign: 'center', fontSize: '8.5pt',
          fontWeight: 700, letterSpacing: '0.04em',
          marginBottom: '1mm',
        }}>
          Thank you for your business!
        </div>
        {companyName && (
          <div style={{ textAlign: 'center', fontSize: '7pt', color: '#666' }}>
            {companyName}
            {website && ` · ${website}`}
          </div>
        )}
      </div>
    </>
  )
}

export default PosTemplate
