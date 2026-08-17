/**
 * src/store/useInvoiceStore.js
 *
 * Zustand store for all invoice state.
 * Persistence is handled by the Electron main process (via IPC / db.js).
 * This store holds the in-memory working copy and syncs to disk on every
 * mutation.
 */

import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import * as db from '../lib/db.js'
import { recalcInvoice } from '../lib/calculations.js'
import { renderInvoiceNumber } from '../lib/invoiceNumber.js'

/** Build a fresh blank invoice pre-filled from the company profile + saved template. */
function makeBlankInvoice(profile = {}) {
  const today = new Date()
  const due = new Date(today)
  due.setDate(due.getDate() + 30)

  // Pull saved template defaults so the user never has to re-configure them.
  const tpl = profile.invoiceTemplate || {}

  return {
    id: uuidv4(),
    invoiceNumber: renderInvoiceNumber(
      profile.invoiceNumberFormat || 'INV-{YYYY}-{0000}',
      profile.nextInvoiceSequence || 1
    ),
    date:    today.toISOString().split('T')[0],
    dueDate: due.toISOString().split('T')[0],
    customer: { name: '', address: '', phone: '', email: '' },
    items: [
      { id: uuidv4(), serialNo: 1, description: '', quantity: 1, rate: 0, amount: 0 },
    ],
    subtotal:  0,
    taxRate:   tpl.taxRate   ?? 0,
    taxAmount: 0,
    discount:  tpl.discount  ?? 0,
    grandTotal: 0,
    currency:   tpl.currency || 'USD',
    notes:              tpl.notes              || '',
    termsAndConditions: tpl.termsAndConditions || '',
    columnHeaders: {
      serialNo:    tpl.columnHeaders?.serialNo    || '#',
      description: tpl.columnHeaders?.description || 'Description',
      quantity:    tpl.columnHeaders?.quantity    || 'Qty',
      rate:        tpl.columnHeaders?.rate        || 'Rate',
      amount:      tpl.columnHeaders?.amount      || 'Amount',
    },
    templateId: tpl.templateId || profile.defaultTemplateId || 'default-a4',
    paperSize:  tpl.paperSize  || 'A4',
    status: 'draft',
  }
}

const useInvoiceStore = create((set, get) => ({
  /** All persisted invoices (loaded at app start). */
  invoices: [],
  /** The invoice currently open in the editor (not yet necessarily saved). */
  currentInvoice: null,
  isLoading: false,
  error: null,

  // ── Load ────────────────────────────────────────────────────────────────────
  loadInvoices: async () => {
    set({ isLoading: true, error: null })
    try {
      const invoices = await db.getAllInvoices()
      set({ invoices: invoices || [], isLoading: false })
    } catch (err) {
      set({ error: err.message, isLoading: false })
    }
  },

  // ── New invoice ─────────────────────────────────────────────────────────────
  /** Initialise an unsaved blank invoice based on the current company profile. */
  initNewInvoice: (profile) => {
    const invoice = makeBlankInvoice(profile)
    set({ currentInvoice: invoice })
    return invoice
  },

  // ── Open existing ───────────────────────────────────────────────────────────
  openInvoice: async (id) => {
    // Prefer in-memory copy to avoid a round-trip.
    const cached = get().invoices.find((inv) => inv.id === id)
    if (cached) { set({ currentInvoice: { ...cached } }); return cached }
    try {
      const invoice = await db.getInvoiceById(id)
      set({ currentInvoice: invoice })
      return invoice
    } catch (err) {
      set({ error: err.message })
      return null
    }
  },

  // ── Edit ────────────────────────────────────────────────────────────────────
  /**
   * Merge updates into currentInvoice and immediately recalculate all totals.
   * Accepts any subset of Invoice fields (items, taxRate, discount, etc.).
   */
  updateCurrentInvoice: (updates) => {
    set((state) => ({
      currentInvoice: recalcInvoice({ ...state.currentInvoice, ...updates }),
    }))
  },

  // ── Save ────────────────────────────────────────────────────────────────────
  saveCurrentInvoice: async (asFinal = false) => {
    const invoice = get().currentInvoice
    if (!invoice) return null
    const toSave = asFinal ? { ...invoice, status: 'final' } : { ...invoice }

    try {
      const isNew = !get().invoices.some((inv) => inv.id === toSave.id)
      if (isNew) {
        await db.createInvoice(toSave)
        set((s) => ({ invoices: [...s.invoices, toSave], currentInvoice: toSave }))
      } else {
        await db.updateInvoice(toSave)
        set((s) => ({
          invoices: s.invoices.map((inv) => (inv.id === toSave.id ? toSave : inv)),
          currentInvoice: toSave,
        }))
      }
      return toSave
    } catch (err) {
      set({ error: err.message })
      return null
    }
  },

  // ── Delete ──────────────────────────────────────────────────────────────────
  deleteInvoice: async (id) => {
    try {
      await db.deleteInvoice(id)
      set((s) => ({
        invoices: s.invoices.filter((inv) => inv.id !== id),
        currentInvoice: s.currentInvoice?.id === id ? null : s.currentInvoice,
      }))
    } catch (err) {
      set({ error: err.message })
    }
  },

  // ── Duplicate ───────────────────────────────────────────────────────────────
  duplicateInvoice: async (id) => {
    const src = get().invoices.find((inv) => inv.id === id)
    if (!src) return null
    const copy = {
      ...src,
      id: uuidv4(),
      status: 'draft',
      invoiceNumber: `${src.invoiceNumber}-COPY`,
      date: new Date().toISOString().split('T')[0],
    }
    try {
      await db.createInvoice(copy)
      set((s) => ({ invoices: [...s.invoices, copy] }))
      return copy
    } catch (err) {
      set({ error: err.message })
      return null
    }
  },

  clearCurrentInvoice: () => set({ currentInvoice: null }),
  clearError: () => set({ error: null }),
}))

export default useInvoiceStore
