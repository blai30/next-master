import { Combobox as BaseCombobox } from '@base-ui/react/combobox'
import clsx from 'clsx/lite'
import { Check, ChevronDown, Search } from 'lucide-react'
import type { ReactNode } from 'react'

export type ComboboxItem = {
  value: string
  label: string
}

type ComboboxProps = {
  items: ComboboxItem[]
  value: string[]
  onValueChange: (values: string[]) => void
  placeholder?: string
  name?: string
  className?: string
  iconLimit?: number
  // Dropdown row content (icon + label)
  renderItem?: (item: ComboboxItem) => ReactNode
  // Compact glyph shown in the trigger summary (defaults to renderItem)
  renderSummary?: (item: ComboboxItem) => ReactNode
}

// The trigger is a fixed-size button so the popup anchor never changes size. Width
// comes from the consumer's className (e.g. a fixed w-* with shrink-0); no w-full here
// so it can't collide with that and let the button size to its content.
const triggerClass =
  'flex h-9 items-center gap-2 overflow-hidden rounded-lg border border-zinc-950/10 bg-transparent px-3 text-left text-base/6 text-zinc-950 transition-colors hover:border-zinc-950/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-500 sm:text-sm/6 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:border-white/20'

// Fixed width matching the anchor; the search row is sticky and the list scrolls,
// so the popover never moves or changes width as the list filters.
const popupClass =
  'isolate flex max-h-[min(20rem,var(--available-height))] w-[var(--anchor-width)] flex-col overflow-hidden rounded-xl bg-white/90 shadow-lg ring-1 ring-zinc-950/10 backdrop-blur-xl transition-opacity data-ending-style:opacity-0 data-starting-style:opacity-0 dark:bg-zinc-800/90 dark:ring-white/10'

const itemClass =
  'grid cursor-default grid-cols-[1rem_1fr] items-center gap-x-2 rounded-lg py-1.5 pr-3 pl-1.5 text-base/6 text-zinc-950 outline-none select-none data-highlighted:bg-zinc-200 data-highlighted:text-black sm:text-sm/6 dark:text-white dark:data-highlighted:bg-zinc-700 dark:data-highlighted:text-white'

export function Combobox({
  items,
  value,
  onValueChange,
  placeholder,
  name,
  className,
  iconLimit = 4,
  renderItem,
  renderSummary,
}: ComboboxProps) {
  const selectedItems = items.filter((item) => value.includes(item.value))

  return (
    <BaseCombobox.Root
      multiple
      items={items}
      value={selectedItems}
      onValueChange={(next) => onValueChange(next.map((item) => item.value))}
      itemToStringLabel={(item) => item.label}
      name={name}
    >
      <BaseCombobox.Trigger className={clsx(triggerClass, className)}>
        <BaseCombobox.Value>
          {(selected: ComboboxItem[]) => {
            if (selected.length === 0) {
              return <span className="min-w-0 flex-1 truncate text-zinc-500">{placeholder}</span>
            }
            // Icon: a row of compact glyphs plus an overflow count.
            if (renderSummary) {
              const visible = selected.slice(0, iconLimit)
              const hidden = selected.length - visible.length
              return (
                <span className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
                  {visible.map((item) => (
                    <span key={item.value} className="shrink-0" aria-label={item.label}>
                      {renderSummary(item)}
                    </span>
                  ))}
                  {hidden > 0 && (
                    <span className="shrink-0 text-zinc-500 dark:text-zinc-400">{`+${hidden}`}</span>
                  )}
                </span>
              )
            }
            // Text: the single label (ellipsis-truncated) or a count.
            const text = selected.length === 1 ? selected[0].label : `${selected.length} selected`
            return <span className="min-w-0 flex-1 truncate">{text}</span>
          }}
        </BaseCombobox.Value>
        <BaseCombobox.Icon className="shrink-0 text-zinc-500 dark:text-zinc-400">
          <ChevronDown size={16} />
        </BaseCombobox.Icon>
      </BaseCombobox.Trigger>
      <BaseCombobox.Portal>
        <BaseCombobox.Positioner
          side="bottom"
          align="start"
          sideOffset={4}
          positionMethod="fixed"
          collisionAvoidance={{ side: 'none', align: 'none' }}
          className="z-50"
        >
          <BaseCombobox.Popup className={popupClass}>
            <div className="relative border-b border-zinc-950/5 p-1 dark:border-white/5">
              <Search
                size={16}
                className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-zinc-500"
              />
              <BaseCombobox.Input
                placeholder="Search..."
                className="w-full rounded-md bg-transparent py-1.5 pr-2 pl-8 text-base/6 text-zinc-950 placeholder:text-zinc-500 focus:outline-none sm:text-sm/6 dark:text-white"
              />
            </div>
            <div className="overflow-y-auto p-1">
              <BaseCombobox.Empty className="text-sm text-zinc-500">
                <div className="px-3 py-2">No matches</div>
              </BaseCombobox.Empty>
              <BaseCombobox.List>
                {(item: ComboboxItem) => (
                  <BaseCombobox.Item key={item.value} value={item} className={itemClass}>
                    <BaseCombobox.ItemIndicator className="col-start-1 flex items-center justify-center">
                      <Check size={16} />
                    </BaseCombobox.ItemIndicator>
                    <span className="col-start-2 flex min-w-0 items-center gap-2 truncate">
                      {renderItem ? renderItem(item) : item.label}
                    </span>
                  </BaseCombobox.Item>
                )}
              </BaseCombobox.List>
            </div>
          </BaseCombobox.Popup>
        </BaseCombobox.Positioner>
      </BaseCombobox.Portal>
    </BaseCombobox.Root>
  )
}
