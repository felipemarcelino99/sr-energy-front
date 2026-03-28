import { EVENT_TYPE_COLORS, EVENT_TYPE_LABELS, JOB_COLOR } from '@/models/schedule.model'
import type { ScheduleEventType } from '@/models/schedule.model'

const EVENT_TYPES: ScheduleEventType[] = ['day_off', 'vacation', 'training', 'medical_leave']

export function CalendarLegend() {
  return (
    <div className="flex flex-wrap gap-4 mb-3 text-[11px]">
      <span className="flex items-center gap-1.5">
        <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: JOB_COLOR }} />
        Trabalho
      </span>
      {EVENT_TYPES.map((type) => (
        <span key={type} className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-sm inline-block" style={{ backgroundColor: EVENT_TYPE_COLORS[type] }} />
          {EVENT_TYPE_LABELS[type]}
        </span>
      ))}
    </div>
  )
}
