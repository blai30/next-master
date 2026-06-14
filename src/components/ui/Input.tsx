import clsx from 'clsx/lite'
import type { ComponentPropsWithoutRef } from 'react'
import { forwardRef } from 'react'

export function InputGroup({ children, className }: ComponentPropsWithoutRef<'span'>) {
  return (
    <span
      data-slot="control"
      className={clsx(
        'relative isolate block',
        'has-[[data-slot=icon]:first-child]:[&_input]:pl-10 sm:has-[[data-slot=icon]:first-child]:[&_input]:pl-8',
        '*:data-[slot=icon]:pointer-events-none *:data-[slot=icon]:absolute *:data-[slot=icon]:top-3 *:data-[slot=icon]:z-10 *:data-[slot=icon]:size-5 sm:*:data-[slot=icon]:top-2.5 sm:*:data-[slot=icon]:size-4',
        '[&>[data-slot=icon]:first-child]:left-3 sm:[&>[data-slot=icon]:first-child]:left-2.5',
        '*:data-[slot=icon]:text-zinc-500 dark:*:data-[slot=icon]:text-zinc-400',
        className
      )}
    >
      {children}
    </span>
  )
}

export const Input = forwardRef<HTMLInputElement, ComponentPropsWithoutRef<'input'>>(function Input(
  { className, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      {...props}
      className={clsx(
        'relative block w-full appearance-none rounded-lg px-3 py-2 text-base/6 sm:py-1.5 sm:text-sm/6',
        'border border-zinc-950/10 bg-transparent text-zinc-950 placeholder:text-zinc-500 hover:border-zinc-950/20',
        'dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:border-white/20',
        'transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500',
        className
      )}
    />
  )
})
