import clsx from 'clsx'

/**
 * src/components/ui/Button.jsx
 *
 * Polymorphic button component with variant + size presets.
 * Keeps the entire button surface area in one place so visual tweaks
 * propagate everywhere without hunting through page components.
 */

const VARIANTS = {
  primary:  'bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white shadow-sm',
  secondary:'bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-700',
  danger:   'bg-red-600 hover:bg-red-700 active:bg-red-800 text-white shadow-sm',
  ghost:    'hover:bg-slate-100 active:bg-slate-200 text-slate-600',
  outline:  'border border-slate-300 hover:bg-slate-50 active:bg-slate-100 text-slate-700',
}

const SIZES = {
  xs: 'px-2.5 py-1 text-xs gap-1',
  sm: 'px-3   py-1.5 text-sm gap-1.5',
  md: 'px-4   py-2   text-sm gap-2',
  lg: 'px-5   py-2.5 text-base gap-2',
}

function Button({
  variant = 'primary',
  size = 'md',
  className,
  disabled,
  children,
  ...props
}) {
  return (
    <button
      className={clsx(
        'inline-flex items-center justify-center rounded-lg font-medium',
        'transition-colors duration-150',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        VARIANTS[variant] ?? VARIANTS.primary,
        SIZES[size] ?? SIZES.md,
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  )
}

export default Button
