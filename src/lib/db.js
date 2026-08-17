/**
 * src/lib/db.js
 *
 * Renderer-side IPC bridge — thin wrappers over window.electronAPI.
 * All functions return Promises. Zustand stores call these functions;
 * nothing in the renderer touches ipcRenderer or Node APIs directly.
 *
 * window.electronAPI is injected by electron/preload.js via contextBridge.
 * If it is absent (e.g. running the renderer standalone in a browser for
 * component dev), calls will throw — which is intentional: this app is
 * Electron-only; browser-mode stubs would hide real bugs.
 */

const api = () => {
  if (!window.electronAPI) {
    throw new Error(
      '[db] window.electronAPI is not defined. ' +
      'Make sure the app is running inside Electron with the preload script loaded.'
    )
  }
  return window.electronAPI
}

// ── Company Profile ───────────────────────────────────────────────────────────

/** @returns {Promise<import('../store/useCompanyStore').CompanyProfile>} */
export const getCompanyProfile = () => api().company.get()

/** @param {import('../store/useCompanyStore').CompanyProfile} data */
export const setCompanyProfile = (data) => api().company.set(data)

// ── Invoices ──────────────────────────────────────────────────────────────────

/** @returns {Promise<import('../store/useInvoiceStore').Invoice[]>} */
export const getAllInvoices = () => api().invoices.getAll()

/**
 * @param {string} id
 * @returns {Promise<import('../store/useInvoiceStore').Invoice|null>}
 */
export const getInvoiceById = (id) => api().invoices.getById(id)

/** @param {import('../store/useInvoiceStore').Invoice} invoice */
export const createInvoice = (invoice) => api().invoices.create(invoice)

/** @param {import('../store/useInvoiceStore').Invoice} invoice */
export const updateInvoice = (invoice) => api().invoices.update(invoice)

/** @param {string} id */
export const deleteInvoice = (id) => api().invoices.delete(id)

// ── File Dialogs ──────────────────────────────────────────────────────────────

/**
 * Open a native file-open dialog filtered to image types.
 * @returns {Promise<string|null>} Absolute local file path, or null if cancelled.
 */
export const openImageDialog = () => api().dialog.openImage()

// ── PDF Export ────────────────────────────────────────────────────────────────

/**
 * Export an invoice as a PDF and prompt the user to choose a save location.
 * @param {object} invoice  The full invoice object (including templateId, paperSize).
 * @param {object} company  The company profile (logoPath, brandPrimaryColor, etc.).
 * @returns {Promise<{ saved: boolean, filePath?: string }>}
 */
export const exportPDF = (invoice, company) => {
  const filename = `invoice-${invoice.invoiceNumber || 'draft'}.pdf`
  return api().pdf.export({ invoice, company, filename })
}

// ── Direct Print ──────────────────────────────────────────────────────────────

/**
 * Open the native OS print dialog pre-configured for the invoice's paper size.
 * @param {object} invoice
 * @param {object} company
 * @returns {Promise<{ printed: boolean }>}
 */
export const printInvoice = (invoice, company) =>
  api().print.invoice({ invoice, company })
