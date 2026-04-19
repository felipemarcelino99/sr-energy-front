import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useScheduleStore } from '@/viewmodels/schedule.viewmodel'
import { useEmployeeStore } from '@/viewmodels/employee.viewmodel'
import { cancelJob } from '@/services/job.service'
import { cancelScheduleEvent } from '@/services/schedule.service'
import { CalendarToolbar } from '@/views/components/CalendarToolbar'
import { CalendarLegend } from '@/views/components/CalendarLegend'
import { CalendarGrid } from '@/views/components/CalendarGrid'
import { DayDetailPanel } from '@/views/components/DayDetailPanel'
import { ScheduleEventModal } from '@/views/components/ScheduleEventModal'

interface ScheduleWidgetProps {
  readOnly?: boolean
  employeeId?: string
}

export function ScheduleWidget({ readOnly = false, employeeId }: ScheduleWidgetProps) {
  const navigate = useNavigate()
  const {
    load, loading, currentMonth, setCurrentMonth,
    selectedDate, setSelectedDate,
    employeeFilter, setEmployeeFilter,
    groupedByDate,
  } = useScheduleStore()

  const { employees, load: loadEmployees } = useEmployeeStore()

  const [modalOpen, setModalOpen] = useState(false)
  const [modalDate, setModalDate] = useState<string | null>(null)

  useEffect(() => {
    load()
    if (!readOnly) loadEmployees()
  }, [load, loadEmployees, readOnly])

  useEffect(() => {
    if (employeeId) setEmployeeFilter(employeeId)
  }, [employeeId, setEmployeeFilter])

  const grouped = groupedByDate()
  const { year, month } = currentMonth

  const goToPrev = () => {
    const d = new Date(year, month - 2, 1)
    setCurrentMonth({ year: d.getFullYear(), month: d.getMonth() + 1 })
  }

  const goToNext = () => {
    const d = new Date(year, month, 1)
    setCurrentMonth({ year: d.getFullYear(), month: d.getMonth() + 1 })
  }

  const goToToday = () => {
    const now = new Date()
    setCurrentMonth({ year: now.getFullYear(), month: now.getMonth() + 1 })
  }

  const openModal = (date: string | null = null) => {
    setModalDate(date)
    setModalOpen(true)
  }

  return (
    <div className="card bg-base-200 border border-base-300">
      <div className="card-body gap-3">
        <h2 className="text-xs font-semibold text-base-content/40 uppercase tracking-wider">
          Agenda de Funcionários
        </h2>

        <CalendarToolbar
          year={year}
          month={month}
          employees={employees}
          employeeFilter={employeeFilter}
          onPrev={goToPrev}
          onNext={goToNext}
          onToday={goToToday}
          onMonthSelect={(y, m) => setCurrentMonth({ year: y, month: m })}
          onEmployeeFilter={setEmployeeFilter}
          onNewEvent={() => openModal()}
          readOnly={readOnly}
        />

        <CalendarLegend />

        <div className="relative">
          <CalendarGrid
            year={year}
            month={month}
            groupedEntries={grouped}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onDoubleClick={readOnly ? undefined : openModal}
          />
          {loading && (
            <div className="absolute inset-0 bg-base-200/70 flex items-center justify-center rounded-lg">
              <span className="loading loading-spinner loading-md text-primary" />
            </div>
          )}
        </div>

        <DayDetailPanel
          date={selectedDate}
          entries={selectedDate ? (grouped.get(selectedDate) ?? []) : []}
          readOnly={readOnly}
          onJobEdit={readOnly ? undefined : (id) => navigate(`/jobs/${id}/edit`)}
          onJobCancel={readOnly ? undefined : async (id) => { await cancelJob(id); await load() }}
          onEventCancel={readOnly ? undefined : async (id) => { await cancelScheduleEvent(id); await load() }}
        />
      </div>

      {!readOnly && (
        <ScheduleEventModal
          open={modalOpen}
          initialDate={modalDate}
          employees={employees}
          onClose={() => setModalOpen(false)}
        />
      )}
    </div>
  )
}
