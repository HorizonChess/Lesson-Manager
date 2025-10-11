import * as React from 'react'
import { cn } from '../../lib/utils'

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: string
}

const baseSelect =
  'surface-input flex h-10 w-full rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 disabled:cursor-not-allowed disabled:opacity-50'

const errorState = 'border-red-500 dark:border-red-400 focus:border-red-400 focus:ring-red-400/40'

const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, error, children, ...props }, ref) => (
    <div className="w-full">
      <select
        ref={ref}
        className={cn(baseSelect, error && errorState, className)}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  )
)

Select.displayName = 'Select'

export { Select }
