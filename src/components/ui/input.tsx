import * as React from 'react'
import { cn } from '../../lib/utils'

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string
}

const baseInput =
  'surface-input flex h-10 w-full rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50'

const errorState = 'border-red-500 dark:border-red-400 focus:border-red-400 focus:ring-red-400/40'

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, ...props }, ref) => (
    <div className="w-full">
      <input
        ref={ref}
        className={cn(baseInput, error && errorState, className)}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  )
)

Input.displayName = 'Input'

export { Input }
