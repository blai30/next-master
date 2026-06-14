import {
  columnFilteringFeature,
  createFilteredRowModel,
  createPaginatedRowModel,
  createSortedRowModel,
  filterFns,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  sortFns,
  tableFeatures,
  useTable,
  type ColumnDef,
  type RowData,
} from '@tanstack/react-table'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, type ReactNode } from 'react'

import Pagination from '@/components/compounds/Pagination'
import FilterBar, { type FilterOption } from '@/components/shared/FilterBar'
import SearchBar from '@/components/shared/SearchBar'
import SortBar, { type SortDirection, type SortOption } from '@/components/shared/SortBar'
import { useUrlSync } from '@/lib/hooks/useUrlSync'
import { useVersionGroup } from '@/lib/stores/version-group'

export const cardGridFeatures = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowPaginationFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  paginatedRowModel: createPaginatedRowModel(),
  sortedRowModel: createSortedRowModel(),
  filterFns,
  sortFns,
})

const DEFAULT_PAGE = 1

export type CardGridFilter<T> = {
  id: string
  label: string
  options: FilterOption[] | ((data: T[], active: Record<string, string[]>) => FilterOption[])
  // URL query parameter key.
  param: string
}

export type CardGridSort = {
  options: SortOption<string>[]
  defaultKey: string
}

type CardGridProps<T extends RowData> = {
  data: T[]
  columns: ColumnDef<typeof cardGridFeatures, T>[]
  renderCard: (item: T) => ReactNode
  getKey: (item: T) => string
  itemsPerPage: number
  gridClassName: string
  filters?: CardGridFilter<T>[]
  sort?: CardGridSort
  // Pre-filter by global version group.
  versionGroupPredicate?: (item: T, versionGroup: string) => boolean
}

const readParam = (key: string): string | null => {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get(key)
}

export default function CardGrid<T extends RowData>({
  data,
  columns,
  renderCard,
  getKey,
  itemsPerPage,
  gridClassName,
  filters = [],
  sort,
  versionGroupPredicate,
}: CardGridProps<T>) {
  const { versionGroup } = useVersionGroup()

  const rows = versionGroupPredicate
    ? data.filter((item) => versionGroupPredicate(item, versionGroup))
    : data

  const table = useTable({
    features: cardGridFeatures,
    columns,
    data: rows,
    // Defaults only; the URL is applied after mount (see effect) to match the
    // param-less server render and avoid a hydration mismatch.
    initialState: {
      globalFilter: '',
      sorting: sort ? [{ id: sort.defaultKey, desc: false }] : [],
      columnFilters: [],
      pagination: { pageIndex: 0, pageSize: itemsPerPage },
    },
    autoResetPageIndex: false,
  })

  const { globalFilter, sorting, columnFilters, pagination } = table.state

  // Two-pass seeding: restore q/sort/dir/filters/page from the URL once, after hydration.
  useEffect(() => {
    const search = readParam('q')
    if (search) table.setGlobalFilter(search)

    if (sort) {
      const key = readParam('sort')
      const dir = readParam('dir')
      if (key || dir) table.setSorting([{ id: key ?? sort.defaultKey, desc: dir === 'desc' }])
    }

    const seededFilters = filters
      .map((filter) => ({
        id: filter.id,
        value: readParam(filter.param)?.split(',').filter(Boolean) ?? [],
      }))
      .filter((entry) => entry.value.length > 0)
    if (seededFilters.length > 0) table.setColumnFilters(seededFilters)

    const page = Number(readParam('p'))
    if (page > DEFAULT_PAGE) table.setPageIndex(page - 1)
  }, [])

  const activeFilterValues: Record<string, string[]> = Object.fromEntries(
    filters.map((filter) => [
      filter.id,
      (columnFilters.find((entry) => entry.id === filter.id)?.value as string[]) ?? [],
    ])
  )

  // Keep URL params in sync with table state.
  useUrlSync(
    () => ({
      search: globalFilter,
      ...(sort
        ? {
            sortKey: sorting[0]?.id ?? sort.defaultKey,
            sortDirection: sorting[0]?.desc ? 'desc' : 'asc',
          }
        : {}),
      ...Object.fromEntries(filters.map((filter) => [filter.param, activeFilterValues[filter.id]])),
      currentPage: pagination.pageIndex + 1,
    }),
    {
      search: { key: 'q', defaultValue: '' },
      ...(sort
        ? {
            sortKey: { key: 'sort', defaultValue: sort.defaultKey },
            sortDirection: { key: 'dir', defaultValue: 'asc' },
          }
        : {}),
      ...Object.fromEntries(filters.map((filter) => [filter.param, { key: filter.param }])),
      currentPage: { key: 'p', defaultValue: DEFAULT_PAGE },
    },
    [globalFilter, sorting, columnFilters, pagination]
  )

  // Clamp page index to valid range when data or filters change, to avoid showing empty page.
  const pageCount = table.getPageCount()
  useEffect(() => {
    if (pageCount > 0 && pagination.pageIndex > pageCount - 1) {
      table.setPageIndex(pageCount - 1)
    }
  }, [pageCount, pagination.pageIndex, table])

  const handleSearchChange = (value: string) => {
    table.setGlobalFilter(value)
    table.firstPage()
  }
  const handleFilterChange = (id: string) => (values: string | string[]) => {
    const next = Array.isArray(values) ? values : [values]
    table.setColumnFilters((prev) => {
      const rest = prev.filter((entry) => entry.id !== id)
      return next.length > 0 ? [...rest, { id, value: next }] : rest
    })
    table.firstPage()
  }
  const handleSortKeyChange = (key: string) => {
    table.setSorting([{ id: key || sort!.defaultKey, desc: sorting[0]?.desc ?? false }])
    table.firstPage()
  }
  const handleSortDirectionChange = (dir: SortDirection) => {
    table.setSorting([{ id: sorting[0]?.id ?? sort!.defaultKey, desc: dir === 'desc' }])
    table.firstPage()
  }
  const handlePageChange = (page: number) => {
    table.setPageIndex(page - 1)
  }

  const filterConfigs = filters.map((filter) => ({
    label: filter.label,
    options:
      typeof filter.options === 'function'
        ? filter.options(rows, activeFilterValues)
        : filter.options,
    values: activeFilterValues[filter.id],
    onChange: handleFilterChange(filter.id),
  }))

  const pageRows = table.getRowModel().rows
  const hasResults = table.getFilteredRowModel().rows.length > 0
  const totalPages = pageCount
  const currentPage = pagination.pageIndex + 1

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col items-center gap-4 lg:flex-row">
        <SearchBar value={globalFilter} onChangeAction={handleSearchChange} />
        {(filterConfigs.length > 0 || sort) && (
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            {filterConfigs.length > 0 && <FilterBar filters={filterConfigs} />}
            {sort && (
              <SortBar
                sortKey={sorting[0]?.id ?? sort.defaultKey}
                sortDirection={sorting[0]?.desc ? 'desc' : 'asc'}
                sortKeys={sort.options}
                onSortKeyChangeAction={handleSortKeyChange}
                onSortDirectionChangeAction={handleSortDirectionChange}
              />
            )}
          </div>
        )}
      </div>
      <div className="xs:gap-8 flex flex-col gap-4">
        {!hasResults ? (
          <div className="flex flex-col items-center justify-center gap-2 py-12 text-zinc-500 dark:text-zinc-400">
            <span className="text-lg font-medium">No results found</span>
            <span className="text-sm font-normal">Check filters and/or version group dropdown</span>
          </div>
        ) : (
          <>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChangeAction={handlePageChange}
            />
            <div className="relative">
              <AnimatePresence mode="wait">
                <motion.ul
                  className={gridClassName}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: { staggerChildren: 0.01, delayChildren: 0.01 },
                    },
                    exit: { opacity: 0, transition: { duration: 0.01 } },
                  }}
                  key={currentPage}
                >
                  {pageRows.map((row) => (
                    <motion.li
                      key={getKey(row.original)}
                      layoutId={`card-${getKey(row.original)}`}
                      layout
                      className="col-span-1"
                      variants={{
                        hidden: { opacity: 0, y: 16 },
                        visible: {
                          opacity: 1,
                          y: 0,
                          transition: { type: 'spring', bounce: 0.1, duration: 0.5 },
                        },
                      }}
                      transition={{
                        layout: { type: 'spring', bounce: 0.1, duration: 0.6 },
                      }}
                    >
                      {renderCard(row.original)}
                    </motion.li>
                  ))}
                </motion.ul>
              </AnimatePresence>
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChangeAction={handlePageChange}
            />
          </>
        )}
      </div>
    </div>
  )
}
