# InvoStack

Offline-first desktop invoice generator. Single-company, fully local — no server, no cloud, no telemetry.

## Tech Stack

- **Electron** — desktop shell, native file system & print access
- **React 18 + Vite** — UI and fast dev loop
- **Tailwind CSS** — styling
- **Zustand** — app state management
- **Custom JSON store** — file-backed local persistence via Electron's `userData` directory

## Development

```bash
# Install dependencies
npm install

# Start dev server + Electron window
npm run dev
```

The Vite dev server starts on `http://localhost:5173` and Electron opens automatically, pointing at that URL.

## Build distributable installers

```bash
# Compile renderer + bundle Electron main process, then package
npm run dist
```

Installers are output to `release/`:
- **Windows** — NSIS installer (`.exe`)
- **macOS** — DMG (`.dmg`)
- **Linux** — AppImage (`.AppImage`)

## Project Structure

```
invostack-desktop/
├── electron/
│   ├── main.js          # Electron main process, IPC handlers
│   ├── preload.js       # contextBridge API exposed to renderer
│   └── store.js         # Simple JSON file-backed store (no external DB)
├── src/
│   ├── components/
│   │   ├── invoice/     # CustomerForm, LineItemsTable, TotalsSection
│   │   ├── layout/      # AppShell, Sidebar
│   │   └── ui/          # Button, Input, Badge
│   ├── lib/
│   │   ├── calculations.js   # Pure invoice math (amounts, totals)
│   │   ├── invoiceNumber.js  # Format-pattern invoice number renderer
│   │   └── db.js             # IPC bridge: renderer → main process
│   ├── pages/
│   │   ├── InvoiceList.jsx   # Invoice history (view/edit/duplicate/delete)
│   │   └── InvoiceEditor.jsx # Invoice creation & editing
│   ├── store/
│   │   ├── useInvoiceStore.js   # Zustand store for invoices
│   │   └── useCompanyStore.js   # Zustand store for company profile
│   └── templates/
│       ├── a4/              # A4 invoice templates
│       └── pos/             # 80mm POS/thermal templates (Phase 2)
└── build/icons/             # App icons (.ico, .icns, .png sizes)
```

## Phases

| Phase | Status | Description |
|-------|--------|-------------|
| 1 | ✅ Done | Foundation — invoice engine, calculations, history |
| 2 | Planned | Branding, company profile, POS template, multi-template |
| 3 | Planned | PDF export, direct print, packaging, final QA |
