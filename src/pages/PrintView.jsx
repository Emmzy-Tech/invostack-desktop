/**
 * src/pages/PrintView.jsx
 *
 * Headless renderer — only ever loaded inside the hidden BrowserWindow that
 * the main process creates for PDF export and direct printing.
 *
 * Flow:
 *   1. Parse the `?token=` query parameter from the URL hash.
 *   2. Fetch the invoice + company payload from the main process via IPC.
 *   3. Resolve the correct template component from the registry.
 *   4. Inject the correct @page CSS rule (A4 or 80mm POS).
 *   5. Render the template, then signal `print:ready:<token>` so the main
 *      process knows it's safe to call printToPDF() or print().
 *
 * The component deliberately has no InvoStack UI chrome — no sidebar, toolbar,
 * or navigation. Only the raw invoice template is rendered.
 */

import { useEffect, useState } from 'react'
import { getTemplate } from '../lib/templates.js'

/**
 * Inject a <style> tag with the correct @page rule for the paper size.
 * Called once on mount, after the payload is known.
 */
function injectPageStyle(paperSize) {
  const existing = document.getElementById('__invostack_page_style__')
  if (existing) existing.remove()

  const style = document.createElement('style')
  style.id = '__invostack_page_style__'

  if (paperSize === 'POS80') {
    // 80mm wide, height follows content.
    style.textContent = `
      @page { size: 80mm auto; margin: 0; }
      body  { margin: 0; background: #fff; }
    `
  } else {
    // Standard A4 portrait.
    style.textContent = `
      @page { size: A4 portrait; margin: 0; }
      body  { margin: 0; background: #fff; }
    `
  }

  document.head.appendChild(style)
}

export default function PrintView() {
  const [payload, setPayload] = useState(null)
  const [error, setError]     = useState(null)

  useEffect(() => {
    // Extract ?token= from the hash portion of the URL.
    // HashRouter gives us a URL like: file://…/index.html#/print?token=abc123
    const hash   = window.location.hash          // e.g. "#/print?token=abc123"
    const search = hash.includes('?') ? hash.split('?')[1] : ''
    const params = new URLSearchParams(search)
    const token  = params.get('token')

    if (!token) {
      setError('No token in URL — this page must be opened by the main process.')
      return
    }

    // Fetch the print payload the main process stored for this token.
    window.electronAPI.print.getPayload(token).then((data) => {
      if (!data) {
        setError(`No payload found for token: ${token}`)
        return
      }

      injectPageStyle(data.invoice?.paperSize)
      setPayload({ ...data, token })
    })
  }, [])

  // Signal readiness after the component tree has painted.
  useEffect(() => {
    if (!payload) return

    // requestAnimationFrame ensures Chromium has actually painted the template
    // before we tell the main process to capture the PDF / open the print dialog.
    const raf = requestAnimationFrame(() => {
      window.electronAPI.print.ready(payload.token)
    })

    return () => cancelAnimationFrame(raf)
  }, [payload])

  if (error) {
    return (
      <div style={{ fontFamily: 'monospace', padding: '2rem', color: '#dc2626' }}>
        <strong>PrintView error:</strong> {error}
      </div>
    )
  }

  if (!payload) {
    // Show nothing while loading — the hidden window is invisible anyway.
    return null
  }

  const { Component } = getTemplate(payload.invoice.templateId)

  return <Component invoice={payload.invoice} company={payload.company} />
}
