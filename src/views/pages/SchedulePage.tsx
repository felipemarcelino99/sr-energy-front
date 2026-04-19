import { ScheduleWidget } from '@/views/components/ScheduleWidget'

export function SchedulePage() {
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Agenda de Funcionários</h1>
      <ScheduleWidget />
    </div>
  )
}
