/**
 * electron/main.js
 *
 * Electron main process — creates the BrowserWindow, wires up IPC handlers
 * for persistent storage, and manages the app lifecycle.
 *
 * Security posture:
 *   - contextIsolation: true  (renderer can't access Node directly)
 *   - nodeIntegration: false  (all Node access via preload contextBridge only)
 *   - webSecurity: true       (default, keeps file:// ↔ http:// isolation)
 */

import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { writeFileSync } from 'node:fs'
import Store from './store.js'

// ESM-safe __dirname (vite-plugin-electron compiles main.js as ESM)
const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)

// ── Print payload store ────────────────────────────────────────────────────────
// Holds the invoice + company data the hidden print/PDF window needs to render.
// Keyed by a random token so concurrent exports don't collide.
const printPayloads = new Map()

/**
 * Create a hidden BrowserWindow that loads the /print route.
 * Returns the window; the caller is responsible for destroying it.
 *
 * Windows note: Chromium's compositor does not paint into a window that has
 * never been shown, so requestAnimationFrame in the renderer stalls forever on
 * Windows when show:false is used.  We work around this by showing the window
 * off-screen (position -10000,-10000) so Chromium actually composites a frame,
 * then rely on the ready-signal / setTimeout fallback in PrintView.jsx to fire
 * the print:ready IPC before we call print() / printToPDF().
 */
function createPrintWindow(token) {
  const isWindows = process.platform === 'win32'

  const win = new BrowserWindow({
    width:  1200,
    height: 900,
    // On Windows we must show the window (off-screen) so the compositor paints.
    // On macOS/Linux show:false works fine because the offscreen compositor runs.
    show: isWindows,
    x: isWindows ? -10000 : undefined,
    y: isWindows ? -10000 : undefined,
    skipTaskbar: true,        // never appear in the Windows taskbar
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  const printHash = `#/print?token=${token}`

  if (process.env.VITE_DEV_SERVER_URL) {
    const base = process.env.VITE_DEV_SERVER_URL.replace(/\/$/, '')
    win.loadURL(`${base}/${printHash}`)
  } else {
    win.loadFile(join(app.getAppPath(), 'dist/index.html'), { hash: `/print?token=${token}` })
  }

  return win
}

// ── Stores (initialised after app ready so getPath('userData') is available) ──
let companyStore
let invoiceStore

function initStores() {
  companyStore = new Store('company')
  invoiceStore = new Store('invoices')
  // Ensure the invoices array key exists on first run.
  if (!invoiceStore.get('list')) {
    invoiceStore.set('list', [])
  }
}

// ── Window ────────────────────────────────────────────────────────────────────
function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 620,
    title: 'InvoStack',
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  // In dev, vite-plugin-electron sets VITE_DEV_SERVER_URL automatically.
  // In production, app.getAppPath() resolves correctly inside an asar archive.
  if (process.env.VITE_DEV_SERVER_URL) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL)
    win.webContents.openDevTools()
  } else {
    win.loadFile(join(app.getAppPath(), 'dist/index.html'))
  }
}

// ── IPC: Company Profile ──────────────────────────────────────────────────────
ipcMain.handle('company:get', () => {
  return companyStore.get('profile', {})
})

ipcMain.handle('company:set', (_event, data) => {
  companyStore.set('profile', data)
  return true
})

// ── IPC: Invoices ─────────────────────────────────────────────────────────────
ipcMain.handle('invoices:getAll', () => {
  return invoiceStore.get('list', [])
})

ipcMain.handle('invoices:getById', (_event, id) => {
  const list = invoiceStore.get('list', [])
  return list.find((inv) => inv.id === id) ?? null
})

ipcMain.handle('invoices:create', (_event, invoice) => {
  const list = invoiceStore.get('list', [])
  list.push(invoice)
  invoiceStore.set('list', list)
  return invoice
})

ipcMain.handle('invoices:update', (_event, invoice) => {
  const list = invoiceStore.get('list', [])
  const idx = list.findIndex((inv) => inv.id === invoice.id)
  if (idx === -1) throw new Error(`Invoice not found: ${invoice.id}`)
  list[idx] = invoice
  invoiceStore.set('list', list)
  return invoice
})

ipcMain.handle('invoices:delete', (_event, id) => {
  const list = invoiceStore.get('list', [])
  invoiceStore.set('list', list.filter((inv) => inv.id !== id))
  return true
})

// ── IPC: Print payload exchange ───────────────────────────────────────────────
// The print window calls this to fetch its own render data.
ipcMain.handle('print:getPayload', (_event, token) => {
  const payload = printPayloads.get(token) ?? null
  return payload
})

// ── IPC: PDF export ───────────────────────────────────────────────────────────
ipcMain.handle('pdf:export', async (_event, { invoice, company, filename }) => {
  const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  printPayloads.set(token, { invoice, company })

  const win = createPrintWindow(token)

  try {
    // Wait for the print window to signal it has finished rendering.
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Print window timed out (10 s)'))
      }, 10_000)

      ipcMain.once(`print:ready:${token}`, () => {
        clearTimeout(timeout)
        resolve()
      })
    })

    const isPOS = invoice.paperSize === 'POS80'

    // Build printToPDF options. preferCSSPageSize lets @page rules drive dimensions.
    const pdfOptions = isPOS
      ? {
          preferCSSPageSize: true,   // honour @page { size: 80mm auto }
          printBackground: true,
          margins: { marginType: 'none' },
        }
      : {
          preferCSSPageSize: false,
          pageSize: 'A4',
          landscape: false,
          printBackground: true,
          margins: { marginType: 'none' },
        }

    const pdfBuffer = await win.webContents.printToPDF(pdfOptions)

    // Ask the user where to save.
    const { canceled, filePath } = await dialog.showSaveDialog({
      title: 'Save Invoice PDF',
      defaultPath: filename || `invoice-${invoice.invoiceNumber || 'draft'}.pdf`,
      filters: [{ name: 'PDF', extensions: ['pdf'] }],
    })

    if (canceled || !filePath) return { saved: false }

    writeFileSync(filePath, pdfBuffer)
    return { saved: true, filePath }
  } finally {
    printPayloads.delete(token)
    win.destroy()
  }
})

// ── IPC: Direct print (native OS print dialog) ────────────────────────────────
ipcMain.handle('print:invoice', async (_event, { invoice, company }) => {
  const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`
  printPayloads.set(token, { invoice, company })

  const win = createPrintWindow(token)

  try {
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Print window timed out (10 s)'))
      }, 10_000)

      ipcMain.once(`print:ready:${token}`, () => {
        clearTimeout(timeout)
        resolve()
      })
    })

    const isPOS = invoice.paperSize === 'POS80'

    // Build print options.
    // NOTE: On Windows, passing pageSize:undefined throws an internal Chromium
    // error.  For POS we omit pageSize entirely and let the CSS @page rule drive
    // the dimensions; for A4 we set it explicitly.
    const printOptions = {
      silent: false,          // always show the native OS print dialog
      printBackground: true,
      margins: { marginType: 'none' },
      ...(isPOS ? {} : { pageSize: 'A4' }),
    }

    // Open the native OS print dialog.
    await new Promise((resolve, reject) => {
      win.webContents.print(printOptions, (success, errorType) => {
        // 'cancelled' means the user closed the dialog — not an error.
        if (!success && errorType !== 'cancelled') {
          reject(new Error(`Print failed: ${errorType}`))
        } else {
          resolve()
        }
      })
    })

    return { printed: true }
  } finally {
    printPayloads.delete(token)
    win.destroy()
  }
})

// ── IPC: File Dialog (Phase 2 — logo upload) ─────────────────────────────────
ipcMain.handle('dialog:openImage', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: 'Select Company Logo',
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'svg', 'webp'] }],
    properties: ['openFile'],
  })
  return canceled ? null : filePaths[0]
})

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  initStores()
  createWindow()

  app.on('activate', () => {
    // macOS: re-create window when dock icon is clicked and no windows are open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  // On macOS, apps conventionally stay open until the user quits explicitly.
  if (process.platform !== 'darwin') app.quit()
})
