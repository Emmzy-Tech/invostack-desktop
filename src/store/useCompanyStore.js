/**
 * src/store/useCompanyStore.js
 *
 * Zustand store for the company profile / branding settings.
 * The profile is loaded once at app start and saved on every explicit save action.
 * Defaults represent a sensible first-run state so the invoice editor is usable
 * even before the owner has filled in their details.
 */

import { create } from 'zustand'
import * as db from '../lib/db.js'

/** @typedef {object} BankDetails */
/** @typedef {object} CompanyProfile */

/**
 * The invoice template stores the owner's saved defaults for every new invoice.
 * When the user creates a new invoice these values are pre-filled so they never
 * have to re-configure the same fields on every invoice.
 */
export const DEFAULT_INVOICE_TEMPLATE = {
  // Column header labels — fully customisable
  columnHeaders: {
    serialNo:    '#',
    description: 'Description',
    quantity:    'Qty',
    rate:        'Rate',
    amount:      'Amount',
  },
  // Default financial settings
  taxRate:  0,
  discount: 0,
  currency: 'USD',
  // Default text blocks
  notes:              '',
  termsAndConditions: '',
  // Paper & template
  templateId: 'default-a4',
  paperSize:  'A4',
}

export const DEFAULT_PROFILE = {
  logoPath: '',
  companyName: '',
  address: '',
  phone: '',
  email: '',
  website: '',
  taxId: '',
  brandPrimaryColor: '#7C3AED',
  brandSecondaryColor: '#0F172A',
  brandFont: 'Inter',
  bankDetails: {
    bankName: '',
    accountName: '',
    accountNumber: '',
    swiftCode: '',
    iban: '',
    routingNumber: '',
    sortCode: '',
  },
  defaultTemplateId: 'default-a4',
  invoiceNumberFormat: 'INV-{YYYY}-{0000}',
  nextInvoiceSequence: 1,
  invoiceTemplate: { ...DEFAULT_INVOICE_TEMPLATE },
}

const useCompanyStore = create((set, get) => ({
  profile: { ...DEFAULT_PROFILE },
  isLoading: false,
  isDirty: false, // true when in-memory profile differs from last saved state
  error: null,

  // ── Load ────────────────────────────────────────────────────────────────────
  loadProfile: async () => {
    set({ isLoading: true, error: null })
    try {
      const saved = await db.getCompanyProfile()
      set({
        profile: { ...DEFAULT_PROFILE, ...saved },
        isLoading: false,
        isDirty: false,
      })
    } catch (err) {
      set({ error: err.message, isLoading: false })
    }
  },

  // ── Edit (in-memory only) ───────────────────────────────────────────────────
  updateProfile: (updates) => {
    set((s) => ({
      profile: { ...s.profile, ...updates },
      isDirty: true,
    }))
  },

  updateBankDetails: (updates) => {
    set((s) => ({
      profile: {
        ...s.profile,
        bankDetails: { ...s.profile.bankDetails, ...updates },
      },
      isDirty: true,
    }))
  },

  updateInvoiceTemplate: (updates) => {
    set((s) => ({
      profile: {
        ...s.profile,
        invoiceTemplate: {
          ...DEFAULT_INVOICE_TEMPLATE,
          ...s.profile.invoiceTemplate,
          ...updates,
          // Deep-merge columnHeaders
          columnHeaders: {
            ...DEFAULT_INVOICE_TEMPLATE.columnHeaders,
            ...(s.profile.invoiceTemplate?.columnHeaders || {}),
            ...(updates.columnHeaders || {}),
          },
        },
      },
      isDirty: true,
    }))
  },

  // ── Save to disk ────────────────────────────────────────────────────────────
  saveProfile: async () => {
    try {
      await db.setCompanyProfile(get().profile)
      set({ isDirty: false })
      return true
    } catch (err) {
      set({ error: err.message })
      return false
    }
  },

  /**
   * Consume one invoice number from the sequence.
   * Call this after a new invoice's number has been committed (Finalize).
   */
  incrementSequence: async () => {
    const updated = {
      ...get().profile,
      nextInvoiceSequence: (get().profile.nextInvoiceSequence || 1) + 1,
    }
    set({ profile: updated })
    await db.setCompanyProfile(updated)
  },

  clearError: () => set({ error: null }),
}))

export default useCompanyStore
