import type { CalendarEntry } from '@/models/schedule.model'
import { DayCell } from './DayCell'
import { toLocalDateString } from '@/utils/date'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

// Visão Semana (passo 3): 7 colunas — uma por dia — cada uma com a lista
// vertical de chips, reaproveitando o mesmo `DayCell` do mês (sem o
// esmaecimento de "fora do mês", que não se aplica aqui).
const MIN_ROW_HEIGHT = '12rem'

interface Props {
  anchor: Date
  groupedEntries: Map<string, CalendarEntry[]>
  employeeColors: Map<string, string>
  selectedDate: string | null
  onSelectDate: (date: string) => void
  onDoubleClick?: (date?: string | null) => void
}

export function CalendarWeekView({
  anchor,
  groupedEntries,
  employeeColors,
  selectedDate,
  onSelectDate,
  onDoubleClick,
}: Props) {
  const today = toLocalDateString(new Date())
  const start = new Date(anchor)
  start.setDate(start.getDate() - start.getDay())

  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start)
    d.setDate(d.getDate() + i)
    return { date: toLocalDateString(d), day: d.getDate() }
  })

  return (
    <div className="flex flex-col">
      <div className="grid grid-cols-7 gap-1 mb-1 text-center text-[11px] text-base-content/40 font-semibold">
        {WEEKDAYS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div
        className="grid grid-cols-7 gap-1"
        style={{ gridAutoRows: `minmax(${MIN_ROW_HEIGHT}, auto)` }}
      >
        {days.map(({ date, day }) => (
          <DayCell
            key={date}
            date={date}
            dayNumber={day}
            isToday={date === today}
            isCurrentMonth
            isSelected={date === selectedDate}
            entries={groupedEntries.get(date) ?? []}
            employeeColors={employeeColors}
            onClick={onSelectDate}
            onDoubleClick={onDoubleClick}
          />
        ))}
      </div>
    </div>
  )
}
