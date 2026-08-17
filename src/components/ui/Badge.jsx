import clsx from 'clsx'

/**
 * src/components/ui/Badge.jsx
 * Small inline status tag used in the invoice list.
 */
const VARIANTS = {
  draft:   'bg-amber-50  text-amber-700  border-amber-200',
  final:   'bg-green-50  text-green-700  border-green-200',
  default: 'bg-slate-100 text-slate-600  border-slate-200',
}

function Badge({ label, variant = 'default', className }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border capitalize',
        VARIANTS[variant] ?? VARIANTS.default,
        className
      )}
    >
      {label}
    </span>
  )
}

export default Badge
