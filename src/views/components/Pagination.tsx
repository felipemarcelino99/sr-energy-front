interface PaginationProps {
  page: number
  totalPages: number
  onGoTo: (page: number) => void
}

export function Pagination({ page, totalPages, onGoTo }: PaginationProps) {
  if (totalPages <= 1) return null

  return (
    <div className="flex items-center justify-between mt-4">
      <span className="text-sm text-base-content/50">
        Página {page} de {totalPages}
      </span>
      <div className="join">
        <button
          className="join-item btn btn-sm"
          onClick={() => onGoTo(page - 1)}
          disabled={page === 1}
        >
          Anterior
        </button>
        <button
          className="join-item btn btn-sm"
          onClick={() => onGoTo(page + 1)}
          disabled={page === totalPages}
        >
          Próxima
        </button>
      </div>
    </div>
  )
}
