import { useState, useCallback } from 'react'
import { Save, Building2, Palette, Landmark, Hash, LayoutTemplate } from 'lucide-react'
import useCompanyStore, { DEFAULT_INVOICE_TEMPLATE } from '../store/useCompanyStore.js'
import { openImageDialog } from '../lib/db.js'
import { previewNextInvoiceNumber } from '../lib/invoiceNumber.js'
import Button from '../components/ui/Button.jsx'

/**
 * src/pages/Settings.jsx
 *
 * Company profile / branding settings — tabbed interface.
 * All edits are in-memory (isDirty flag) until the user clicks "Save Changes".
 * This prevents accidental partial saves mid-edit.
 *
 * Tabs:
 *   1. Company Info    — name, address, contact, tax ID
 *   2. Brand & Logo    — logo upload + preview, color pickers, font selector
 *   3. Bank Details    — payment / bank account fields
 *   4. Invoice Format  — number pattern editor, live preview, default template
 */

const TABS = [
  { id: 'company',  label: 'Company Info',    Icon: Building2      },
  { id: 'brand',    label: 'Brand & Logo',    Icon: Palette        },
  { id: 'bank',     label: 'Bank Details',    Icon: Landmark       },
  { id: 'invoice',  label: 'Invoice Format',  Icon: Hash           },
  { id: 'template', label: 'Invoice Template',Icon: LayoutTemplate },
]

const SYSTEM_FONTS = [
  'Inter', 'Arial', 'Helvetica', 'Georgia',
  'Times New Roman', 'Trebuchet MS', 'Courier New',
]

function Field({ label, hint, children }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm font-medium text-slate-700">{label}</label>
      {children}
      {hint && <p className="text-xs text-slate-400">{hint}</p>}
    </div>
  )
}

function TextInput({ value, onChange, placeholder, type = 'text', mono = false }) {
  return (
    <input
      type={type}
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3 py-2 border border-slate-300 rounded-lg text-sm
                  focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow
                  ${mono ? 'font-mono' : ''}`}
    />
  )
}

function TextArea({ value, onChange, placeholder, rows = 3 }) {
  return (
    <textarea
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm resize-none
                 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
    />
  )
}

export default function Settings() {
  const { profile, updateProfile, updateBankDetails, updateInvoiceTemplate, saveProfile, isDirty } = useCompanyStore()
  const [activeTab, setActiveTab] = useState('company')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const up = useCallback((field) => (val) => updateProfile({ [field]: val }), [updateProfile])
  const upBank = useCallback((field) => (val) => updateBankDetails({ [field]: val }), [updateBankDetails])
  const upTpl  = useCallback((patch) => updateInvoiceTemplate(patch), [updateInvoiceTemplate])
  const upTplHeader = useCallback((field) => (val) => updateInvoiceTemplate({ columnHeaders: { [field]: val } }), [updateInvoiceTemplate])

  const handleSave = async () => {
    setSaving(true)
    const ok = await saveProfile()
    setSaving(false)
    if (ok) { setSaved(true); setTimeout(() => setSaved(false), 2500) }
  }

  const handleLogoUpload = async () => {
    const path = await openImageDialog()
    if (path) updateProfile({ logoPath: path })
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-slate-200 shrink-0">
        <div>
          <h1 className="text-lg font-bold text-slate-900">Settings</h1>
          <p className="text-sm text-slate-400">Company profile, branding &amp; invoice preferences</p>
        </div>
        <Button onClick={handleSave} disabled={!isDirty || saving}>
          <Save size={15} />
          {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
        </Button>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* ── Tab sidebar ───────────────────────────────────────────────────── */}
        <nav className="w-48 shrink-0 bg-slate-50 border-r border-slate-200 py-4 overflow-y-auto">
          {TABS.map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2.5 w-full px-4 py-2.5 text-sm font-medium transition-colors
                ${activeTab === id
                  ? 'bg-indigo-50 text-indigo-700 border-r-2 border-indigo-600'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white'}`}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </nav>

        {/* ── Tab content ───────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-2xl space-y-6">

            {/* ── Company Info ────────────────────────────────────────────── */}
            {activeTab === 'company' && (
              <>
                <SectionTitle>Company Information</SectionTitle>
                <Card>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Company Name">
                      <TextInput value={profile.companyName} onChange={up('companyName')} placeholder="Acme Corp Ltd." />
                    </Field>
                    <Field label="Tax / VAT ID">
                      <TextInput value={profile.taxId} onChange={up('taxId')} placeholder="GB123456789" />
                    </Field>
                    <Field label="Email">
                      <TextInput value={profile.email} onChange={up('email')} placeholder="hello@acme.com" type="email" />
                    </Field>
                    <Field label="Phone">
                      <TextInput value={profile.phone} onChange={up('phone')} placeholder="+1 234 567 8900" />
                    </Field>
                    <Field label="Website">
                      <TextInput value={profile.website} onChange={up('website')} placeholder="https://acme.com" />
                    </Field>
                    <div className="col-span-2">
                      <Field label="Address" hint="Multi-line address appears on all invoices.">
                        <TextArea value={profile.address} onChange={up('address')} placeholder={'123 Main Street\nCity, State ZIP\nCountry'} rows={3} />
                      </Field>
                    </div>
                  </div>
                </Card>
              </>
            )}

            {/* ── Brand & Logo ─────────────────────────────────────────────── */}
            {activeTab === 'brand' && (
              <>
                <SectionTitle>Brand &amp; Logo</SectionTitle>

                {/* Logo upload */}
                <Card>
                  <p className="text-sm font-semibold text-slate-700 mb-3">Company Logo</p>
                  <div className="flex items-center gap-4">
                    <div className="w-28 h-20 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 flex items-center justify-center overflow-hidden">
                      {profile.logoPath ? (
                        <img src={`file://${profile.logoPath}`} alt="Logo" className="max-w-full max-h-full object-contain p-1" />
                      ) : (
                        <span className="text-xs text-slate-400 text-center px-2">No logo set</span>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" onClick={handleLogoUpload}>
                        Choose Image…
                      </Button>
                      {profile.logoPath && (
                        <Button variant="ghost" size="sm" onClick={() => updateProfile({ logoPath: '' })}>
                          Remove
                        </Button>
                      )}
                      <p className="text-xs text-slate-400">PNG, JPG, SVG or WEBP.<br />Stored as a local file path.</p>
                    </div>
                  </div>
                </Card>

                {/* Colors */}
                <Card>
                  <p className="text-sm font-semibold text-slate-700 mb-4">Brand Colors</p>
                  <div className="grid grid-cols-2 gap-6">
                    <Field label="Primary Color" hint="Used for headers, totals, and accents.">
                      <div className="flex items-center gap-2">
                        <input type="color" value={profile.brandPrimaryColor || '#4F46E5'} onChange={(e) => updateProfile({ brandPrimaryColor: e.target.value })} className="w-10 h-10 rounded-lg border border-slate-300 cursor-pointer p-0.5" />
                        <TextInput value={profile.brandPrimaryColor} onChange={up('brandPrimaryColor')} placeholder="#4F46E5" mono />
                      </div>
                    </Field>
                    <Field label="Secondary Color" hint="Used for background tints and accents.">
                      <div className="flex items-center gap-2">
                        <input type="color" value={profile.brandSecondaryColor || '#0F172A'} onChange={(e) => updateProfile({ brandSecondaryColor: e.target.value })} className="w-10 h-10 rounded-lg border border-slate-300 cursor-pointer p-0.5" />
                        <TextInput value={profile.brandSecondaryColor} onChange={up('brandSecondaryColor')} placeholder="#0F172A" mono />
                      </div>
                    </Field>
                  </div>
                </Card>

                {/* Font */}
                <Card>
                  <Field label="Brand Font" hint="Applied to all invoice templates. Must be installed on this machine.">
                    <select
                      value={profile.brandFont || 'Inter'}
                      onChange={(e) => updateProfile({ brandFont: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      style={{ fontFamily: profile.brandFont }}
                    >
                      {SYSTEM_FONTS.map((f) => (
                        <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
                      ))}
                    </select>
                  </Field>
                  {/* Live preview */}
                  <div className="mt-4 p-4 bg-slate-50 rounded-lg border border-slate-200" style={{ fontFamily: profile.brandFont || 'Inter' }}>
                    <p className="text-lg font-bold text-slate-800">Your Company Name</p>
                    <p className="text-sm text-slate-500">Invoice preview with {profile.brandFont || 'Inter'} font</p>
                    <p className="text-sm text-indigo-600 font-semibold mt-1">Grand Total: 1,250.00</p>
                  </div>
                </Card>
              </>
            )}

            {/* ── Bank Details ──────────────────────────────────────────────── */}
            {activeTab === 'bank' && (
              <>
                <SectionTitle>Bank &amp; Payment Details</SectionTitle>
                <Card>
                  <div className="grid grid-cols-2 gap-4">
                    <Field label="Bank Name">
                      <TextInput value={profile.bankDetails?.bankName} onChange={upBank('bankName')} placeholder="First National Bank" />
                    </Field>
                    <Field label="Account Name">
                      <TextInput value={profile.bankDetails?.accountName} onChange={upBank('accountName')} placeholder="Acme Corp Ltd." />
                    </Field>
                    <Field label="Account Number">
                      <TextInput value={profile.bankDetails?.accountNumber} onChange={upBank('accountNumber')} placeholder="00123456" mono />
                    </Field>
                    <Field label="SWIFT / BIC">
                      <TextInput value={profile.bankDetails?.swiftCode} onChange={upBank('swiftCode')} placeholder="FNBAUS3N" mono />
                    </Field>
                    <Field label="IBAN" hint="International transfers.">
                      <TextInput value={profile.bankDetails?.iban} onChange={upBank('iban')} placeholder="GB29 NWBK 6016 1331 9268 19" mono />
                    </Field>
                    <Field label="Routing Number" hint="US ACH transfers.">
                      <TextInput value={profile.bankDetails?.routingNumber} onChange={upBank('routingNumber')} placeholder="026009593" mono />
                    </Field>
                    <Field label="Sort Code" hint="UK bank transfers.">
                      <TextInput value={profile.bankDetails?.sortCode} onChange={upBank('sortCode')} placeholder="04-00-04" mono />
                    </Field>
                  </div>
                </Card>
              </>
            )}

            {/* ── Invoice Format ────────────────────────────────────────────── */}
            {activeTab === 'invoice' && (
              <>
                <SectionTitle>Invoice Numbering &amp; Format</SectionTitle>
                <Card>
                  <Field
                    label="Invoice Number Format"
                    hint="Tokens: {YYYY} year, {YY} 2-digit year, {MM} month, {DD} day, {0000} zero-padded sequence."
                  >
                    <TextInput
                      value={profile.invoiceNumberFormat}
                      onChange={up('invoiceNumberFormat')}
                      placeholder="INV-{YYYY}-{0000}"
                      mono
                    />
                  </Field>

                  {/* Live preview */}
                  <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-100">
                    <p className="text-xs text-indigo-400 font-semibold uppercase tracking-widest mb-1">Next invoice number preview</p>
                    <p className="text-2xl font-bold font-mono text-indigo-700">
                      {previewNextInvoiceNumber(profile)}
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <Field label="Next Sequence Number" hint="Auto-increments when you finalize an invoice.">
                      <TextInput
                        type="number"
                        value={profile.nextInvoiceSequence}
                        onChange={(v) => updateProfile({ nextInvoiceSequence: parseInt(v) || 1 })}
                        placeholder="1"
                        mono
                      />
                    </Field>
                  </div>
                </Card>

                <Card>
                  <Field label="Default Template" hint="Applied to new invoices; can be overridden per invoice.">
                    <select
                      value={profile.defaultTemplateId || 'default-a4'}
                      onChange={(e) => updateProfile({ defaultTemplateId: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="default-a4">Classic (A4)</option>
                      <option value="modern-minimal-a4">Modern Minimal (A4)</option>
                      <option value="bold-header-a4">Bold Header (A4)</option>
                      <option value="pos-80mm">POS Receipt (80mm)</option>
                    </select>
                  </Field>
                </Card>
              </>
            )}

            {/* ── Invoice Template ──────────────────────────────────────────── */}
            {activeTab === 'template' && (() => {
              const tpl = { ...DEFAULT_INVOICE_TEMPLATE, ...profile.invoiceTemplate,
                columnHeaders: { ...DEFAULT_INVOICE_TEMPLATE.columnHeaders, ...profile.invoiceTemplate?.columnHeaders } }
              return (
                <>
                  <SectionTitle>Invoice Template Defaults</SectionTitle>
                  <p className="text-sm text-slate-500 -mt-3">
                    These values are pre-filled on every new invoice. You can still override them per-invoice.
                  </p>

                  {/* Column header labels */}
                  <Card>
                    <p className="text-sm font-semibold text-slate-700 mb-4">Line Item Column Headers</p>
                    <p className="text-xs text-slate-400 mb-4">
                      Customise the labels shown in the line items table. For example, rename "Qty" to "Hours".
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        ['serialNo',    '#',           'Serial / #'],
                        ['description', 'Description', 'Description'],
                        ['quantity',    'Qty',         'Quantity / Unit'],
                        ['rate',        'Rate',        'Rate / Price'],
                        ['amount',      'Amount',      'Amount / Total'],
                      ].map(([key, placeholder, label]) => (
                        <Field key={key} label={label}>
                          <TextInput
                            value={tpl.columnHeaders[key]}
                            onChange={(v) => updateInvoiceTemplate({ columnHeaders: { [key]: v } })}
                            placeholder={placeholder}
                          />
                        </Field>
                      ))}
                    </div>
                  </Card>

                  {/* Financial defaults */}
                  <Card>
                    <p className="text-sm font-semibold text-slate-700 mb-4">Financial Defaults</p>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Default Tax Rate (%)" hint="Pre-filled on new invoices.">
                        <TextInput
                          type="number"
                          value={tpl.taxRate}
                          onChange={(v) => upTpl({ taxRate: parseFloat(v) || 0 })}
                          placeholder="0"
                        />
                      </Field>
                      <Field label="Default Discount" hint="Flat amount deducted before tax.">
                        <TextInput
                          type="number"
                          value={tpl.discount}
                          onChange={(v) => upTpl({ discount: parseFloat(v) || 0 })}
                          placeholder="0"
                        />
                      </Field>
                      <Field label="Currency" hint="Symbol shown on all invoices and receipts.">
                        <select
                          value={tpl.currency || 'NGN'}
                          onChange={(e) => upTpl({ currency: e.target.value })}
                          className="inp"
                        >
                          {[
                            ['NGN', '₦  Nigerian Naira (NGN)'],
                            ['USD', '$  US Dollar (USD)'],
                            ['EUR', '€  Euro (EUR)'],
                            ['GBP', '£  British Pound (GBP)'],
                            ['GHS', '₵  Ghanaian Cedi (GHS)'],
                            ['KES', 'KSh  Kenyan Shilling (KES)'],
                            ['ZAR', 'R  South African Rand (ZAR)'],
                            ['CAD', 'CA$  Canadian Dollar (CAD)'],
                            ['AUD', 'A$  Australian Dollar (AUD)'],
                            ['INR', '₹  Indian Rupee (INR)'],
                            ['JPY', '¥  Japanese Yen (JPY)'],
                            ['CNY', '¥  Chinese Yuan (CNY)'],
                            ['AED', 'د.إ  UAE Dirham (AED)'],
                            ['SAR', '﷼  Saudi Riyal (SAR)'],
                          ].map(([code, label]) => (
                            <option key={code} value={code}>{label}</option>
                          ))}
                        </select>
                      </Field>
                    </div>
                  </Card>

                  {/* Default text */}
                  <Card>
                    <p className="text-sm font-semibold text-slate-700 mb-4">Default Notes &amp; Terms</p>
                    <div className="grid grid-cols-2 gap-4">
                      <Field label="Notes" hint="Shown at the bottom of every new invoice.">
                        <TextArea
                          value={tpl.notes}
                          onChange={(v) => upTpl({ notes: v })}
                          placeholder="Thank you for your business!"
                          rows={4}
                        />
                      </Field>
                      <Field label="Terms &amp; Conditions">
                        <TextArea
                          value={tpl.termsAndConditions}
                          onChange={(v) => upTpl({ termsAndConditions: v })}
                          placeholder="Payment due within 30 days…"
                          rows={4}
                        />
                      </Field>
                    </div>
                  </Card>
                </>
              )
            })()}

          </div>
        </div>
      </div>
    </div>
  )
}

function SectionTitle({ children }) {
  return <h2 className="text-base font-bold text-slate-800">{children}</h2>
}

function Card({ children }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      {children}
    </div>
  )
}
