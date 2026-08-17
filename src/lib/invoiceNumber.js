/**
 * src/lib/invoiceNumber.js
 *
 * Invoice number format-pattern renderer.
 *
 * Supported tokens (case-sensitive):
 *   {YYYY}  → 4-digit year           e.g. 2025
 *   {YY}    → 2-digit year           e.g. 25
 *   {MM}    → 2-digit month (01–12)
 *   {DD}    → 2-digit day   (01–31)
 *   {0}     → sequence, no padding   e.g. 42
 *   {00}    → sequence, min 2 chars  e.g. 42
 *   {0000}  → sequence, min 4 chars  e.g. 0042
 *   (any run of zeros — length = minimum digit width)
 *
 * Example patterns:
 *   "INV-{YYYY}-{0000}"  →  "INV-2025-0042"
 *   "RC/{YY}{MM}-{000}"  →  "RC/2504-042"
 */

import { v4 as uuidv4 } from 'uuid'

/**
 * Generate a new UUIDv4 for use as an invoice's internal ID.
 * @returns {string}
 */
export function generateId() {
  return uuidv4()
}

/**
 * Render a format pattern into a concrete invoice number string.
 *
 * @param {string} format      Pattern string, e.g. "INV-{YYYY}-{0000}"
 * @param {number} sequence    Current sequence integer, e.g. 42
 * @param {Date}   [date]      Reference date; defaults to today.
 * @returns {string}
 */
export function renderInvoiceNumber(
  format = 'INV-{YYYY}-{0000}',
  sequence = 1,
  date = new Date()
) {
  const yyyy = String(date.getFullYear())
  const yy = yyyy.slice(-2)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')

  return format
    .replace('{YYYY}', yyyy)
    .replace('{YY}', yy)
    .replace('{MM}', mm)
    .replace('{DD}', dd)
    // Replace {0}, {00}, {000}, … with the sequence zero-padded to that width.
    .replace(/\{(0+)\}/g, (_match, zeros) =>
      String(sequence).padStart(zeros.length, '0')
    )
}

/**
 * Preview what the next invoice number will look like given a company profile.
 * Useful for the settings screen live-preview without consuming the sequence.
 *
 * @param {object} profile  CompanyProfile with invoiceNumberFormat & nextInvoiceSequence
 * @returns {string}
 */
export function previewNextInvoiceNumber(profile) {
  return renderInvoiceNumber(
    profile.invoiceNumberFormat || 'INV-{YYYY}-{0000}',
    profile.nextInvoiceSequence || 1
  )
}
