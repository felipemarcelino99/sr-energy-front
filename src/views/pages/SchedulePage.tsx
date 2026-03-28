import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useScheduleStore } from '@/viewmodels/schedule.viewmodel'
import { useEmployeeStore } from '@/viewmodels/employee.viewmodel'
import { CalendarToolbar } from '@/views/components/CalendarToolbar'
import { CalendarLegend } from '@/views/components/CalendarLegend'
import { CalendarGrid } from '@/views/components/CalendarGrid'
import { DayDetailPanel } from '@/views/components/DayDetailPanel'

export function SchedulePage() {
  const navigate = useNavigate()
  const {
    load, currentMonth, setCurrentMonth,
    selectedDate, setSelectedDate,
    employeeFilter, setEmployeeFilter,
    groupedByDate,
  } = useScheduleStore()

  const { employees, load: loadEmployees } = useEmployeeStore()

  useEffect(() => {
    load()
    loadEmployees()
  }, [load, loadEmployees])

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

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Agenda de Funcionários</h1>

      <CalendarToolbar
        year={year}
        month={month}
        employees={employees}
        employeeFilter={employeeFilter}
        onPrev={goToPrev}
        onNext={goToNext}
        onToday={goToToday}
        onEmployeeFilter={setEmployeeFilter}
        onNewEvent={() => navigate('/schedule/new')}
      />

      <CalendarLegend />

      <CalendarGrid
        year={year}
        month={month}
        groupedEntries={grouped}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      <DayDetailPanel
        date={selectedDate}
        entries={selectedDate ? (grouped.get(selectedDate) ?? []) : []}
        onJobClick={(id) => navigate(`/jobs/${id}`)}
        onEventClick={(id) => navigate(`/schedule/${id}`)}
      />
    </div>
  )
}
