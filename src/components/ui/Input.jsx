import clsx from 'clsx'

/**
 * src/components/ui/Input.jsx
 *
 * Labelled input wrapper used throughout the settings and invoice forms.
 * Keeps label + input + error message co-located so the DOM structure is
 * consistent and accessible (htmlFor ↔ id pairing).
 */
function Input({
  label,
  id,
  error,
  hint,
  className,
  inputClassName,
  ...props
}) {
  const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

  return (
    <div className={clsx('flex flex-col gap-1', className)}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-slate-700"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={clsx(
          'w-full px-3 py-2 rounded-lg border text-sm text-slate-800 bg-white',
          'placeholder:text-slate-400',
          'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent',
          'disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed',
          'transition-shadow duration-150',
          error ? 'border-red-400 focus:ring-red-400' : 'border-slate-300',
          inputClassName
        )}
        {...props}
      />
      {hint && !error && (
        <p className="text-xs text-slate-400">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}

export default Input
