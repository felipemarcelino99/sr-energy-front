import { Fragment, type ReactNode } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type OnChangeFn,
} from '@tanstack/react-table'
import { Button } from './Button'

interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T, any>[] // eslint-disable-line @typescript-eslint/no-explicit-any -- TValue varies per column
  sorting: SortingState
  onSortingChange: OnChangeFn<SortingState>
  /** Omit `page`/`onPageChange` to render every row without pagination. */
  page?: number
  pageSize?: number
  onPageChange?: (page: number) => void
  getRowId?: (row: T) => string
  onRowClick?: (row: T) => void
  isRowExpanded?: (row: T) => boolean
  renderExpandedRow?: (row: T) => ReactNode
  emptyMessage?: string
  /** Fixed max height for the scroll area (header/footer stay sticky). Defaults to a flexible container. */
  className?: string
}

function sortIcon(dir: false | 'asc' | 'desc') {
  if (dir === 'asc') return ' ↑'
  if (dir === 'desc') return ' ↓'
  return ' ↕'
}

export function DataTable<T>({
  data,
  columns,
  sorting,
  onSortingChange,
  page,
  pageSize = 10,
  onPageChange,
  getRowId,
  onRowClick,
  isRowExpanded,
  renderExpandedRow,
  emptyMessage = 'Nenhum registro encontrado.',
  className,
}: DataTableProps<T>) {
  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getRowId: getRowId ? (row) => getRowId(row) : undefined,
    columnResizeMode: 'onChange',
    enableSortingRemoval: true,
  })

  const sortedRows = table.getSortedRowModel().rows
  const paginated = page !== undefined && onPageChange !== undefined
  const totalPages = paginated ? Math.max(1, Math.ceil(sortedRows.length / pageSize)) : 1
  const safePage = paginated ? Math.min(Math.max(1, page), totalPages) : 1
  const start = (safePage - 1) * pageSize
  const pageRows = paginated ? sortedRows.slice(start, start + pageSize) : sortedRows

  if (data.length === 0) {
    return <div className="text-center text-base-content/50 py-10">{emptyMessage}</div>
  }

  return (
    <div className={`flex flex-col ${className ?? ''}`.trim()}>
      <div className="overflow-auto min-h-0" style={{ maxHeight: '65vh' }}>
        <table className="table table-zebra w-full">
          <thead className="sticky top-0 z-10">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const canSort = header.column.getCanSort()
                  return (
                    <th
                      key={header.id}
                      className={canSort ? 'sortable relative' : 'relative'}
                      style={{ width: header.getSize(), position: 'relative' }}
                      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                      {canSort && sortIcon(header.column.getIsSorted())}
                      {header.column.getCanResize() && (
                        <span
                          onMouseDown={header.getResizeHandler()}
                          onTouchStart={header.getResizeHandler()}
                          role="separator"
                          aria-orientation="vertical"
                          className="absolute top-0 right-0 h-full w-1 cursor-col-resize select-none touch-none"
                          style={{ userSelect: 'none' }}
                        />
                      )}
                    </th>
                  )
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {pageRows.map((row) => {
              const original = row.original
              const expanded = isRowExpanded?.(original) ?? false
              return (
                <Fragment key={row.id}>
                  <tr
                    key={row.id}
                    className={onRowClick ? 'hover cursor-pointer' : 'hover'}
                    onClick={onRowClick ? () => onRowClick(original) : undefined}
                    role={onRowClick ? 'button' : undefined}
                    tabIndex={onRowClick ? 0 : undefined}
                    onKeyDown={
                      onRowClick
                        ? (e) => {
                            if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
                              e.preventDefault()
                              onRowClick(original)
                            }
                          }
                        : undefined
                    }
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} style={{ width: cell.column.getSize() }}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                  </tr>
                  {expanded && renderExpandedRow && (
                    <tr key={`${row.id}-expanded`}>
                      <td colSpan={columns.length} className="bg-base-200 px-4 py-3">
                        {renderExpandedRow(original)}
                      </td>
                    </tr>
                  )}
                </Fragment>
              )
            })}
          </tbody>
        </table>
      </div>
      {paginated && totalPages > 1 && onPageChange && (
        <div className="sticky bottom-0 flex items-center justify-between p-3 border-t border-base-300 bg-base-200">
          <span className="text-sm text-base-content/50">
            Página {safePage} de {totalPages}
          </span>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPageChange(safePage - 1)}
              disabled={safePage === 1}
            >
              Anterior
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onPageChange(safePage + 1)}
              disabled={safePage === totalPages}
            >
              Próxima
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
