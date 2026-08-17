/**
 * electron/store.js
 *
 * Lightweight JSON file-backed store for the Electron main process.
 * Replaces electron-store to avoid ESM/CJS compatibility headaches.
 * Data is written to app.getPath('userData') — the OS-appropriate location:
 *   macOS:   ~/Library/Application Support/invostack/<name>.json
 *   Windows: %APPDATA%\invostack\<name>.json
 *   Linux:   ~/.config/invostack/<name>.json
 */

import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { app } from 'electron'

export default class Store {
  /**
   * @param {string} name  Base filename (without .json extension).
   */
  constructor(name = 'config') {
    // userData path is only available after app 'ready' — call new Store() inside
    // app.whenReady() or after the ready event fires.
    this._path = join(app.getPath('userData'), `${name}.json`)
    this._data = this._load()
  }

  _load() {
    try {
      return JSON.parse(readFileSync(this._path, 'utf8'))
    } catch {
      // File doesn't exist yet (first run) — start with empty object.
      return {}
    }
  }

  _save() {
    try {
      writeFileSync(this._path, JSON.stringify(this._data, null, 2), 'utf8')
    } catch (err) {
      console.error('[Store] Failed to persist data:', err)
    }
  }

  /** Read a top-level key, returning defaultValue when absent. */
  get(key, defaultValue = undefined) {
    return Object.prototype.hasOwnProperty.call(this._data, key)
      ? this._data[key]
      : defaultValue
  }

  /** Write a top-level key and flush to disk immediately. */
  set(key, value) {
    this._data[key] = value
    this._save()
  }

  delete(key) {
    delete this._data[key]
    this._save()
  }

  clear() {
    this._data = {}
    this._save()
  }
}
