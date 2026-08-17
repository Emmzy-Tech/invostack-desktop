/**
 * electron/preload.js
 *
 * Runs in the renderer's context but with Node.js access.
 * Uses contextBridge to expose a typed, safe API surface to React.
 * The renderer never touches ipcRenderer directly — all calls go through
 * window.electronAPI, keeping Node/Electron internals sandboxed.
 */

import { contextBridge, ipcRenderer } from 'electron'

// Helper: wraps ipcRenderer.invoke so we don't repeat the pattern everywhere.
const invoke = (channel, ...args) => ipcRenderer.invoke(channel, ...args)

contextBridge.exposeInMainWorld('electronAPI', {
  // ── Company Profile ───────────────────────────────────────────────────────
  company: {
    /** @returns {Promise<CompanyProfile>} */
    get: () => invoke('company:get'),
    /** @param {CompanyProfile} data @returns {Promise<boolean>} */
    set: (data) => invoke('company:set', data),
  },

  // ── Invoices ──────────────────────────────────────────────────────────────
  invoices: {
    /** @returns {Promise<Invoice[]>} */
    getAll: () => invoke('invoices:getAll'),
    /** @param {string} id @returns {Promise<Invoice|null>} */
    getById: (id) => invoke('invoices:getById', id),
    /** @param {Invoice} invoice @returns {Promise<Invoice>} */
    create: (invoice) => invoke('invoices:create', invoice),
    /** @param {Invoice} invoice @returns {Promise<Invoice>} */
    update: (invoice) => invoke('invoices:update', invoice),
    /** @param {string} id @returns {Promise<boolean>} */
    delete: (id) => invoke('invoices:delete', id),
  },

  // ── File dialogs ──────────────────────────────────────────────────────────
  dialog: {
    /** Opens a native file-open dialog filtered to image files.
     *  @returns {Promise<string|null>} Absolute local path or null if cancelled. */
    openImage: () => invoke('dialog:openImage'),
  },

  // ── PDF export ────────────────────────────────────────────────────────────
  pdf: {
    /**
     * Export the current invoice as a PDF and prompt the user to save it.
     * @param {{ invoice: object, company: object, filename: string }} opts
     * @returns {Promise<{ saved: boolean, filePath?: string }>}
     */
    export: (opts) => invoke('pdf:export', opts),
  },

  // ── Direct print ──────────────────────────────────────────────────────────
  print: {
    /**
     * Open the native OS print dialog pre-configured for the invoice's paper size.
     * @param {{ invoice: object, company: object }} opts
     * @returns {Promise<{ printed: boolean }>}
     */
    invoice: (opts) => invoke('print:invoice', opts),

    /**
     * Called by the hidden PrintView window once the template has rendered.
     * @param {string} token  The unique token for this export operation.
     */
    ready: (token) => ipcRenderer.send(`print:ready:${token}`),

    /**
     * Fetch the invoice + company payload for this token.
     * @param {string} token
     * @returns {Promise<{ invoice: object, company: object }|null>}
     */
    getPayload: (token) => invoke('print:getPayload', token),
  },
})
