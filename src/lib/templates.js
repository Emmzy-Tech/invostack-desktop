/**
 * src/lib/templates.js
 *
 * Central registry of all available invoice templates.
 * Importing this module is the single source of truth for template metadata.
 * The InvoiceEditor uses it to populate the template picker dropdown and
 * to resolve which component to render in preview mode.
 *
 * Adding a new template:
 *   1. Create the component in src/templates/a4/ or src/templates/pos/
 *   2. Import it below and add an entry to TEMPLATES.
 *   3. The rest of the app picks it up automatically.
 */

import DefaultTemplate      from '../templates/a4/DefaultTemplate.jsx'
import ModernMinimalTemplate from '../templates/a4/ModernMinimalTemplate.jsx'
import BoldHeaderTemplate    from '../templates/a4/BoldHeaderTemplate.jsx'
import PosTemplate           from '../templates/pos/PosTemplate.jsx'

/**
 * @typedef {object} TemplateDefinition
 * @property {string}   id          Stable key used as invoice.templateId
 * @property {string}   name        User-facing label shown in the picker
 * @property {string}   description One-line description for the picker tooltip
 * @property {'A4'|'POS80'} paperSize  Which paper format this template targets
 * @property {React.FC} Component   The React component that renders the invoice
 */

/** @type {Record<string, TemplateDefinition>} */
export const TEMPLATES = {
  'default-a4': {
    id:          'default-a4',
    name:        'Classic',
    description: 'Timeless letterhead — logo left, invoice meta right, full table borders.',
    paperSize:   'A4',
    Component:   DefaultTemplate,
  },
  'modern-minimal-a4': {
    id:          'modern-minimal-a4',
    name:        'Modern Minimal',
    description: 'Thin accent bar, open hairline table, maximum whitespace.',
    paperSize:   'A4',
    Component:   ModernMinimalTemplate,
  },
  'bold-header-a4': {
    id:          'bold-header-a4',
    name:        'Bold Header',
    description: 'Full-width brand-color header, white type, high-contrast grand total.',
    paperSize:   'A4',
    Component:   BoldHeaderTemplate,
  },
  'pos-80mm': {
    id:          'pos-80mm',
    name:        'POS Receipt (80mm)',
    description: 'Compact thermal receipt — 72mm column, stacked item rows, @page 80mm auto.',
    paperSize:   'POS80',
    Component:   PosTemplate,
  },
}

/** All A4 templates as an array — useful for populating a picker. */
export const A4_TEMPLATES = Object.values(TEMPLATES).filter((t) => t.paperSize === 'A4')

/** All POS templates as an array. */
export const POS_TEMPLATES = Object.values(TEMPLATES).filter((t) => t.paperSize === 'POS80')

/**
 * Safely resolve a template definition by id.
 * Falls back to the Classic template if the id is unknown, so the UI
 * never crashes on a stale invoice.templateId from an older app version.
 *
 * @param {string} id
 * @returns {TemplateDefinition}
 */
export function getTemplate(id) {
  return TEMPLATES[id] ?? TEMPLATES['default-a4']
}

/**
 * Return the first available template for a given paper size.
 * Used when the paper size toggle changes to auto-select a sensible default.
 *
 * @param {'A4'|'POS80'} paperSize
 * @returns {TemplateDefinition}
 */
export function defaultTemplateForSize(paperSize) {
  const matches = Object.values(TEMPLATES).filter((t) => t.paperSize === paperSize)
  return matches[0] ?? TEMPLATES['default-a4']
}
