import { useEffect, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Eye, EyeOff, Save, CheckCircle, ArrowLeft, FileText,
  Printer, Download, Calendar, Hash, LayoutTemplate,
} from 'lucide-react'
import useInvoiceStore from '../store/useInvoiceStore.js'
import useCompanyStore from '../store/useCompanyStore.js'
import CustomerForm from '../components/invoice/CustomerForm.jsx'
import LineItemsTable from '../components/invoice/LineItemsTable.jsx'
import TotalsSection from '../components/invoice/TotalsSection.jsx'
import { A4_TEMPLATES, POS_TEMPLATES, getTemplate, defaultTemplateForSize } from '../lib/templates.js'
import { exportPDF, printInvoice } from '../lib/db.js'

function InvoiceEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [showPreview, setShowPreview] = useState(false)
  const [isSaving,    setIsSaving]    = useState(false)
  const [saveError,   setSaveError]   = useState(null)
  const [isExporting, setIsExporting] = useState(false)
  const [isPrinting,  setIsPrinting]  = useState(false)

  const { currentInvoice, initNewInvoice, openInvoice, updateCurrentInvoice, saveCurrentInvoice } =
    useInvoiceStore()
  const { profile, updateInvoiceTemplate } = useCompanyStore()

  useEffect(() => {
    if (id) openInvoice(id)
    else    initNewInvoice(profile)
  }, [id]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = useCallback(async (asFinal = false) => {
    setIsSaving(true); setSaveError(null)
    try {
      const saved = await saveCurrentInvoice(asFinal)
      if (!saved) throw new Error('Save returned null.')
      if (!id && saved.id) navigate(`/invoices/${saved.id}`, { replace: true })
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setIsSaving(false)
    }
  }, [id, navigate, saveCurrentInvoice])

  const handleExportPDF = useCallback(async () => {
    setIsExporting(true); setSaveError(null)
    try {
      const result = await exportPDF(currentInvoice, profile)
      if (!result.saved) return
    } catch (err) {
      setSaveError(`PDF export failed: ${err.message}`)
    } finally { setIsExporting(false) }
  }, [currentInvoice, profile])

  const handlePrint = useCallback(async () => {
    setIsPrinting(true); setSaveError(null)
    try {
      await printInvoice(currentInvoice, profile)
    } catch (err) {
      setSaveError(`Print failed: ${err.message}`)
    } finally { setIsPrinting(false) }
  }, [currentInvoice, profile])

  /**
   * When the user renames a column header in LineItemsTable we persist the
   * change both on the current invoice AND to the global template so all new
   * invoices inherit the new label.
   */
  const handleHeaderChange = useCallback((patch) => {
    const merged = { ...currentInvoice.columnHeaders, ...patch }
    updateCurrentInvoice({ columnHeaders: merged })
    updateInvoiceTemplate({ columnHeaders: merged })
  }, [currentInvoice, updateCurrentInvoice, updateInvoiceTemplate])

  if (!currentInvoice) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 text-sm">
        Loading…
      </div>
    )
  }

  const statusColor = currentInvoice.status === 'final'
    ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200'
    : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'

  return (
    <div className="flex flex-col h-full">

      {/* ── Toolbar ──────────────────────────────────────────────────────────── */}
      <header className="no-print shrink-0 flex items-center justify-between
                         px-6 py-3.5 bg-white border-b border-gray-100">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate('/invoices')}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            title="Back"
          >
            <ArrowLeft size={16} />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-gray-900 truncate">
                {id ? 'Edit Invoice' : 'New Invoice'}
              </h1>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${statusColor}`}>
                {currentInvoice.status === 'final' ? 'Final' : 'Draft'}
              </span>
            </div>
            <p className="text-xs text-gray-400 font-mono">{currentInvoice.invoiceNumber}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {saveError && (
            <p className="text-xs text-red-500 max-w-xs truncate" title={saveError}>{saveError}</p>
          )}

          {/* Preview toggle */}
          <button
            onClick={() => setShowPreview((p) => !p)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                       text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          >
            {showPreview ? <EyeOff size={14} /> : <Eye size={14} />}
            {showPreview ? 'Edit' : 'Preview'}
          </button>

          <span className="w-px h-5 bg-gray-200" />

          <button onClick={handlePrint} disabled={isPrinting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
                       text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors disabled:opacity-50">
            <Printer size={14} />
            {isPrinting ? 'Printing…' : 'Print'}
          </button>

          <button onClick={handleExportPDF} disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200
                       text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50">
            <Download size={14} />
            {isExporting ? 'Exporting…' : 'PDF'}
          </button>

          <span className="w-px h-5 bg-gray-200" />

          <button onClick={() => handleSave(false)} disabled={isSaving}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200
                       text-gray-700 hover:border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50">
            <Save size={14} />
            {isSaving ? 'Saving…' : 'Save Draft'}
          </button>

          <button onClick={() => handleSave(true)} disabled={isSaving}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold text-white
                       transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
            <CheckCircle size={14} />
            Finalize
          </button>
        </div>
      </header>

      {/* ── Content ──────────────────────────────────────────────────────────── */}
      {showPreview ? (
        <div
          className="flex-1 overflow-auto"
          style={{ background: '#cbd5e1' }}
        >
          {(() => {
            const { Component, paperSize } = getTemplate(currentInvoice.templateId)
            const isPOS = paperSize === 'POS80' || currentInvoice.paperSize === 'POS80'

            if (isPOS) {
              /* POS: natural width (~76mm ≈ 287px at 96dpi), centred, full height scrollable */
              return (
                <div style={{ minHeight: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '32px 24px' }}>
                  <div style={{ background: '#fff', boxShadow: '0 8px 40px rgba(0,0,0,0.18)', borderRadius: '4px' }}>
                    <Component invoice={currentInvoice} company={profile} />
                  </div>
                </div>
              )
            }

            /* A4: scale to fit the preview pane width so it's always fully visible */
            return (
              <div style={{ minHeight: '100%', display: 'flex', justifyContent: 'center', alignItems: 'flex-start', padding: '32px 24px' }}>
                {/* Scale wrapper: A4 is 794px wide at 96dpi (210mm).
                    We let the browser shrink it via zoom so it always fits. */}
                <div
                  style={{
                    /* Use zoom (supported in Chromium/Electron) to scale the
                       fixed-width A4 template down to fit the available pane.
                       calc accounts for the 48px horizontal padding above.    */
                    zoom: 'min(1, calc((100vw - 240px - 48px) / 794px))',
                    transformOrigin: 'top center',
                    background: '#fff',
                    boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
                    borderRadius: '4px',
                    /* Keep the wrapper exactly as wide as the A4 content (794px)
                       so the shadow/background don't bleed outside the template. */
                    width: 'fit-content',
                    lineHeight: 1,
                  }}
                >
                  <Component invoice={currentInvoice} company={profile} />
                </div>
              </div>
            )
          })()}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto" style={{ background: '#f8fafc' }}>
          <div className="max-w-4xl mx-auto px-6 py-6 space-y-4">

            {/* ── Invoice meta row ── */}
            <section className="card p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
                  <FileText size={14} className="text-violet-600" />
                </div>
                <h2 className="section-label">Invoice Details</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1">
                    <Hash size={11} className="text-gray-400" /> Invoice Number
                  </label>
                  <input
                    type="text"
                    value={currentInvoice.invoiceNumber}
                    onChange={(e) => updateCurrentInvoice({ invoiceNumber: e.target.value })}
                    className="inp font-mono"
                    placeholder="INV-2025-0001"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1">
                    <Calendar size={11} className="text-gray-400" /> Invoice Date
                  </label>
                  <input type="date" value={currentInvoice.date}
                    onChange={(e) => updateCurrentInvoice({ date: e.target.value })}
                    className="inp" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 flex items-center gap-1">
                    <Calendar size={11} className="text-gray-400" /> Due Date
                  </label>
                  <input type="date" value={currentInvoice.dueDate}
                    onChange={(e) => updateCurrentInvoice({ dueDate: e.target.value })}
                    className="inp" />
                </div>
              </div>
            </section>

            {/* ── Template & Paper ── */}
            <section className="card p-6">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-7 h-7 rounded-lg bg-violet-50 flex items-center justify-center">
                  <LayoutTemplate size={14} className="text-violet-600" />
                </div>
                <h2 className="section-label">Template &amp; Paper</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Paper Size</label>
                  <div className="flex rounded-xl overflow-hidden border border-gray-200 w-fit">
                    {[{ v: 'A4', label: 'A4' }, { v: 'POS80', label: '80mm POS' }].map(({ v, label }) => (
                      <button key={v}
                        onClick={() => {
                          const def = defaultTemplateForSize(v)
                          updateCurrentInvoice({ paperSize: v, templateId: def.id })
                        }}
                        className={`px-4 py-2 text-sm font-semibold transition-all ${
                          currentInvoice.paperSize === v
                            ? 'text-white'
                            : 'bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                        style={currentInvoice.paperSize === v
                          ? { background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' } : {}}>
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Template</label>
                  <select
                    value={currentInvoice.templateId || 'default-a4'}
                    onChange={(e) => updateCurrentInvoice({ templateId: e.target.value })}
                    className="inp">
                    {(currentInvoice.paperSize === 'POS80' ? POS_TEMPLATES : A4_TEMPLATES).map((t) => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">{getTemplate(currentInvoice.templateId)?.description}</p>
                </div>
              </div>
            </section>

            {/* ── Customer ── */}
            <CustomerForm
              customer={currentInvoice.customer}
              onChange={(customer) => updateCurrentInvoice({ customer })}
            />

            {/* ── Line Items ── */}
            <LineItemsTable
              items={currentInvoice.items}
              columnHeaders={currentInvoice.columnHeaders}
              onChange={(items) => updateCurrentInvoice({ items })}
              onHeaderChange={handleHeaderChange}
            />

            {/* ── Totals ── */}
            <TotalsSection
              subtotal={currentInvoice.subtotal}
              taxRate={currentInvoice.taxRate}
              taxAmount={currentInvoice.taxAmount}
              discount={currentInvoice.discount}
              grandTotal={currentInvoice.grandTotal}
              currency={currentInvoice.currency || profile?.invoiceTemplate?.currency || 'NGN'}
              onChangeTaxRate={(taxRate) => updateCurrentInvoice({ taxRate })}
              onChangeDiscount={(discount) => updateCurrentInvoice({ discount })}
            />

            {/* ── Notes & Terms ── */}
            <section className="card p-6">
              <h2 className="section-label mb-5">Notes &amp; Terms</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Notes</label>
                  <textarea
                    value={currentInvoice.notes}
                    onChange={(e) => updateCurrentInvoice({ notes: e.target.value })}
                    rows={4} placeholder="Additional notes visible to the client…"
                    className="inp resize-none" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5">Terms &amp; Conditions</label>
                  <textarea
                    value={currentInvoice.termsAndConditions}
                    onChange={(e) => updateCurrentInvoice({ termsAndConditions: e.target.value })}
                    rows={4} placeholder="Payment terms, late fees…"
                    className="inp resize-none" />
                </div>
              </div>
            </section>

            {/* ── Bottom save bar ── */}
            <div className="flex justify-end gap-3 pb-6">
              <button onClick={() => handleSave(false)} disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold
                           border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50">
                <Save size={15} />
                {isSaving ? 'Saving…' : 'Save Draft'}
              </button>
              <button onClick={() => handleSave(true)} disabled={isSaving}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white
                           transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#7c3aed,#4f46e5)' }}>
                <CheckCircle size={15} />
                Finalize Invoice
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InvoiceEditor
