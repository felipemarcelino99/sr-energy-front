import { useEffect } from 'react'
import { useChecklistStore } from '@/viewmodels/checklist.viewmodel'

interface Props {
  jobId: string
  phase?: 'pre_work' | 'pre_report'
  readOnly?: boolean
}

export function JobChecklistTab({ jobId, phase, readOnly = false }: Props) {
  const { items, loading, error, checkedCount, fetchChecklist, toggleItem } = useChecklistStore()

  useEffect(() => {
    fetchChecklist(jobId, phase)
  }, [jobId, phase, fetchChecklist])

  if (loading) {
    return (
      <div data-testid="checklist-loading" className="flex justify-center py-8">
        <span className="loading loading-spinner loading-md" />
      </div>
    )
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>
  }

  if (items.length === 0) {
    return (
      <div data-testid="checklist-empty" className="text-center text-base-content/50 py-8">
        Nenhum item no checklist
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <p data-testid="checklist-progress" className="text-sm text-base-content/60">
        {checkedCount}/{items.length} itens verificados
      </p>

      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <li
            key={item.id}
            data-testid={`checklist-item-${item.id}`}
            className="flex items-center gap-3"
          >
            <input
              type="checkbox"
              className="checkbox checkbox-sm"
              checked={item.checked}
              disabled={readOnly}
              onChange={() => !readOnly && toggleItem(jobId, item.id, !item.checked)}
            />
            <span className={item.checked ? 'line-through text-base-content/40' : ''}>
              {item.tool.name}
            </span>
            {item.checked && item.checkedAt && (
              <span className="text-xs text-base-content/30">
                {new Date(item.checkedAt).toLocaleString('pt-BR')}
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
