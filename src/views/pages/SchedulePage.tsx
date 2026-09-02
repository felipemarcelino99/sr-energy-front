import { ScheduleWidget } from '@/views/components/ScheduleWidget'
import { usePageHeader } from '@/hooks/usePageHeader'

export function SchedulePage() {
  usePageHeader('Agenda de Funcionários')

  return (
    <div className="flex flex-col gap-5">
      <ScheduleWidget />
    </div>
  )
}
