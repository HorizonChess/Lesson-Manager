import * as React from 'react'
import { cn } from '../../lib/utils'

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: string
}

const baseTextarea =
  'surface-input flex min-h-[80px] w-full rounded-lg px-3 py-2 text-slate-900 dark:text-slate-100 placeholder:text-slate-500 dark:placeholder:text-slate-400 disabled:cursor-not-allowed disabled:opacity-50 resize-vertical'

const errorState = 'border-red-500 dark:border-red-400 focus:border-red-400 focus:ring-red-400/40'

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, error, ...props }, ref) => (
    <div className="w-full">
      <textarea
        ref={ref}
        className={cn(baseTextarea, error && errorState, className)}
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}
    </div>
  )
)

Textarea.displayName = 'Textarea'

export { Textarea }
