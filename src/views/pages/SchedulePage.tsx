import { ScheduleWidget } from '@/views/components/ScheduleWidget'

export function SchedulePage() {
  return (
    <div className="flex flex-col gap-5">
      <h1 className="text-xl font-bold tracking-tight">Agenda de Funcionários</h1>
      <ScheduleWidget />
    </div>
  )
}
