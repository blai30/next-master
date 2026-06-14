import clsx from 'clsx/lite'

import { DamageClassIcon, TypeIcon } from '@/components/icons'
import { Combobox, type ComboboxItem } from '@/components/ui/Combobox'
import { DAMAGE_CLASSES, type DamageClassKey } from '@/lib/domain/damage-class'
import { TYPE_KEYS, type TypeKey } from '@/lib/domain/types'

export type FilterOption = {
  label: string
  value: string
}

export type FilterConfig = {
  label: string
  options: FilterOption[]
  values: string[]
  onChange: (values: string | string[]) => void
}

type FilterBarProps = {
  filters: FilterConfig[]
  className?: string
}

const typeKeySet = new Set<string>(TYPE_KEYS)
const damageClassKeySet = new Set<string>(Object.keys(DAMAGE_CLASSES))

function optionIcon(item: ComboboxItem) {
  if (typeKeySet.has(item.value)) {
    return <TypeIcon variant={item.value as TypeKey} size="small" className="shrink-0" />
  }
  if (damageClassKeySet.has(item.value)) {
    return (
      <DamageClassIcon variant={item.value as DamageClassKey} size="small" className="shrink-0" />
    )
  }
  return null
}

function renderOption(item: ComboboxItem) {
  return (
    <span className="flex items-center gap-1.5">
      {optionIcon(item)}
      {item.label}
    </span>
  )
}

// Compact trigger glyph for icon-backed filters (types, damage classes)
function renderSummary(item: ComboboxItem) {
  return optionIcon(item)
}

function hasIcons(filter: FilterConfig) {
  return filter.options.some(
    (option) => typeKeySet.has(option.value) || damageClassKeySet.has(option.value)
  )
}

export default function FilterBar({ filters, className }: FilterBarProps) {
  return (
    <div className={clsx('flex flex-wrap gap-2', className)}>
      {filters.map((filter) => (
        <Combobox
          key={filter.label}
          name={filter.label}
          placeholder={filter.label}
          items={filter.options}
          value={filter.values}
          onValueChange={filter.onChange}
          renderItem={renderOption}
          renderSummary={hasIcons(filter) ? renderSummary : undefined}
          className="w-44 shrink-0"
        />
      ))}
    </div>
  )
}
