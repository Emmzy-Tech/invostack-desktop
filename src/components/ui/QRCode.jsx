/**
 * src/components/ui/QRCode.jsx
 *
 * Offline QR code renderer using the `qrcode` npm package.
 * Generates a data-URL PNG synchronously and renders it as an <img>.
 * Renders nothing when `url` is empty/falsy.
 *
 * Props:
 *   url    {string}  The URL to encode. Renders nothing if falsy.
 *   size   {number}  Pixel size for the generated QR image (default 128).
 *   style  {object}  Extra inline styles applied to the <img>.
 */

import { useState, useEffect } from 'react'
import QRCodeLib from 'qrcode'

function QRCode({ url = '', size = 128, style = {} }) {
  const [dataUrl, setDataUrl] = useState(null)

  useEffect(() => {
    if (!url) { setDataUrl(null); return }

    let cancelled = false
    QRCodeLib.toDataURL(url, {
      width: size,
      margin: 1,
      color: { dark: '#000000', light: '#ffffff' },
      errorCorrectionLevel: 'M',
    })
      .then((du) => { if (!cancelled) setDataUrl(du) })
      .catch(() => { if (!cancelled) setDataUrl(null) })

    return () => { cancelled = true }
  }, [url, size])

  if (!url || !dataUrl) return null

  return (
    <img
      src={dataUrl}
      alt={`QR code for ${url}`}
      width={size}
      height={size}
      style={{ display: 'block', imageRendering: 'pixelated', ...style }}
    />
  )
}

export default QRCode
