import { Tabs as BaseTabs } from '@base-ui/react/tabs'
import clsx from 'clsx/lite'
import type { ComponentPropsWithoutRef } from 'react'

export const TabsRoot = BaseTabs.Root

export function TabsList({ className, ...props }: ComponentPropsWithoutRef<typeof BaseTabs.List>) {
  return (
    <BaseTabs.List {...props} className={clsx('flex flex-row items-center gap-1', className)} />
  )
}

export function Tab({ className, ...props }: ComponentPropsWithoutRef<typeof BaseTabs.Tab>) {
  return (
    <BaseTabs.Tab
      {...props}
      className={clsx(
        'rounded-md p-1.5 outline-none hover:inset-ring-2 hover:inset-ring-zinc-300 data-active:bg-zinc-300 dark:hover:inset-ring-zinc-700 dark:data-active:bg-zinc-700',
        className
      )}
    />
  )
}
