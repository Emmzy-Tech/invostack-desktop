/**
 * src/lib/calculations.js
 *
 * Pure, side-effect-free invoice math functions.
 * All monetary arithmetic uses toFixed(2) rounding to avoid floating-point
 * drift (e.g. 0.1 + 0.2 = 0.30000000000000004). Values are stored as JS
 * numbers, not strings — round only at the display/format boundary.
 *
 * Tax is applied AFTER the flat discount is subtracted from the subtotal,
 * which is the most common real-world formula:
 *   taxable = subtotal − discount
 *   tax     = taxable × (taxRate / 100)
 *   total   = taxable + tax
 */

/**
 * Compute the Amount for a single line item.
 * @param {number|string} quantity
 * @param {number|string} rate
 * @returns {number} Rounded to 2 decimal places.
 */
export function calcItemAmount(quantity, rate) {
  const qty = parseFloat(quantity) || 0
  const rt = parseFloat(rate) || 0
  return parseFloat((qty * rt).toFixed(2))
}

/**
 * Compute invoice-level totals from an array of items plus adjustments.
 * @param {Array<{quantity: number, rate: number}>} items
 * @param {number|string} taxRate   Percentage value (e.g. 10 means 10%).
 * @param {number|string} discount  Flat deduction applied before tax.
 * @returns {{ subtotal: number, taxAmount: number, grandTotal: number }}
 */
export function calcTotals(items = [], taxRate = 0, discount = 0) {
  const subtotal = parseFloat(
    items.reduce((sum, item) => sum + calcItemAmount(item.quantity, item.rate), 0).toFixed(2)
  )
  const discountAmt = parseFloat(parseFloat(discount).toFixed(2)) || 0
  const taxable = parseFloat(Math.max(0, subtotal - discountAmt).toFixed(2))
  const taxAmount = parseFloat(((taxable * (parseFloat(taxRate) || 0)) / 100).toFixed(2))
  const grandTotal = parseFloat((taxable + taxAmount).toFixed(2))

  return { subtotal, taxAmount, grandTotal }
}

/**
 * Re-derive every calculated field on a full invoice object.
 * Immutable — returns a new object, never mutates the input.
 * @param {object} invoice
 * @returns {object} New invoice with updated item amounts + totals.
 */
export function recalcInvoice(invoice) {
  const items = (invoice.items || []).map((item) => ({
    ...item,
    amount: calcItemAmount(item.quantity, item.rate),
  }))

  const { subtotal, taxAmount, grandTotal } = calcTotals(
    items,
    invoice.taxRate,
    invoice.discount
  )

  return { ...invoice, items, subtotal, taxAmount, grandTotal }
}

/**
 * Maps ISO 4217 currency codes to their display symbols.
 * Intl.NumberFormat uses full code text (e.g. "NGN 1,500.00") for currencies
 * that the en-US locale doesn't recognise by symbol, so we resolve symbols
 * explicitly here and format the number separately.
 */
const CURRENCY_SYMBOLS = {
  NGN: '₦',
  USD: '$',
  EUR: '€',
  GBP: '£',
  GHS: '₵',
  KES: 'KSh',
  ZAR: 'R',
  CAD: 'CA$',
  AUD: 'A$',
  INR: '₹',
  JPY: '¥',
  CNY: '¥',
  AED: 'د.إ',
  SAR: '﷼',
}

/**
 * Format a number with the correct currency symbol.
 * @param {number} value
 * @param {string} [currency='NGN']
 */
export function formatCurrency(value, currency = 'NGN') {
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency
  const number = Number(value ?? 0).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${symbol}${number}`
}
