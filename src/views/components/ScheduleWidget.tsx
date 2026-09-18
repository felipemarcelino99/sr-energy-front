import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useEmployeeStore } from '@/viewmodels/employee.viewmodel'
import { cancelJob } from '@/services/job.service'
import { cancelScheduleEvent } from '@/services/schedule.service'
import {
  computeRange,
  navigateAnchor,
  eventsMonthParam,
  useCalendarJobs,
  useScheduleEventsQuery,
  groupEntriesByDate,
  uniqueEmployeesFromJobs,
  uniqueEmployeesFromEntries,
  buildEmployeeColorIndex,
  calendarJobsQueryKey,
  scheduleEventsQueryKey,
} from '@/viewmodels/schedule.viewmodel'
import type { CalendarView } from '@/models/schedule.model'
import { CalendarToolbar } from '@/views/components/CalendarToolbar'
import { CalendarLegend } from '@/views/components/CalendarLegend'
import { CalendarGrid } from '@/views/components/CalendarGrid'
import { CalendarWeekView } from '@/views/components/CalendarWeekView'
import { DayDetailPanel } from '@/views/components/DayDetailPanel'
import { ScheduleEventModal } from '@/views/components/ScheduleEventModal'
import { useUrlState } from '@/hooks/useUrlState'
import { toLocalDateString } from '@/utils/date'

interface ScheduleWidgetProps {
  readOnly?: boolean
  /**
   * Id do funcionário logado. Em modo `readOnly` (agenda da equipe, no
   * dashboard do funcionário — passo 5), não filtra a agenda (o funcionário
   * vê a de todo mundo) — só decide se a OS abre em "Ver detalhes" (é dele)
   * ou fica sem ação (é de outro colaborador).
   */
  currentEmployeeId?: string
}

const VALID_VIEWS: CalendarView[] = ['day', 'week', 'month']

function isCalendarView(value: string): value is CalendarView {
  return (VALID_VIEWS as string[]).includes(value)
}

export function ScheduleWidget({ readOnly = false, currentEmployeeId }: ScheduleWidgetProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  // Passo 1/3: visão, data âncora e filtro de colaborador vivem na URL — não
  // no zustand (compartilhável, sobrevive a reload, sem "grudar" entre telas).
  const [rawView, setRawView] = useUrlState('view', 'month')
  const view = isCalendarView(rawView) ? rawView : 'month'
  const [dateParam, setDateParam] = useUrlState('date', toLocalDateString(new Date()))
  const [employeeFilterParam, setEmployeeFilterParam] = useUrlState('employee', '')
  const employeeFilter = employeeFilterParam || null

  const anchor = new Date(dateParam + 'T00:00:00')
  const range = computeRange(view, anchor)

  const { jobs, isLoading: jobsLoading } = useCalendarJobs(range)
  const { events, isLoading: eventsLoading } = useScheduleEventsQuery(eventsMonthParam(range))
  const loading = jobsLoading || eventsLoading

  const { employees, load: loadEmployees } = useEmployeeStore()

  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalDate, setModalDate] = useState<string | null>(null)

  // `useEmployeeStore` é infra existente (fora do escopo deste sub-plano —
  // sub-plano 05) e continua zustand imperativo, não useQuery. Usado só
  // pelo dropdown de filtro e pelo modal de novo evento, ambos escondidos em
  // modo readOnly.
  useEffect(() => {
    if (!readOnly) loadEmployees()
  }, [readOnly, loadEmployees])

  const grouped = groupEntriesByDate(jobs, events, range, employeeFilter)
  // Feedback do usuário: cor de chip/evento é sempre a do funcionário, nunca
  // por tipo — este índice resolve a cor real (quando conhecida) de
  // qualquer id de colaborador citado num evento (Folga/Férias/etc).
  const employeeColors = buildEmployeeColorIndex(uniqueEmployeesFromJobs(jobs), employees)
  // A legenda mostra quem tem OS OU evento no período — não só quem tem OS
  // (um funcionário só de férias, sem nenhuma OS no mês, sumia da legenda e
  // do nome exibido no evento — feedback do usuário).
  const legendEmployees = uniqueEmployeesFromEntries(jobs, events, employeeColors)

  const goTo = (nextAnchor: Date) => setDateParam(toLocalDateString(nextAnchor))
  const goToPrev = () => goTo(navigateAnchor(view, anchor, -1))
  const goToNext = () => goTo(navigateAnchor(view, anchor, 1))
  const goToMonth = (year: number, month: number) =>
    setDateParam(`${year}-${String(month).padStart(2, '0')}-01`)

  const openModal = (date: string | null = null) => {
    setModalDate(date)
    setModalOpen(true)
  }

  const invalidateCalendar = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: calendarJobsQueryKey(range) }),
      queryClient.invalidateQueries({ queryKey: scheduleEventsQueryKey(eventsMonthParam(range)) }),
    ])
  }

  const handleJobEdit = readOnly ? undefined : (id: string) => navigate(`/jobs/${id}/edit`)
  const handleJobCancel = readOnly
    ? undefined
    : async (id: string) => {
        await cancelJob(id)
        await invalidateCalendar()
      }
  const handleEventCancel = readOnly
    ? undefined
    : async (id: string) => {
        await cancelScheduleEvent(id)
        await invalidateCalendar()
      }

  return (
    <div className="flex flex-col gap-2 h-full min-h-0">
      <CalendarToolbar
        title="Agenda de Funcionários"
        view={view}
        anchor={anchor}
        employees={employees}
        employeeFilter={employeeFilter}
        onViewChange={(v) => setRawView(v)}
        onPrev={goToPrev}
        onNext={goToNext}
        onMonthSelect={goToMonth}
        onEmployeeFilter={(id) => setEmployeeFilterParam(id ?? '')}
        onNewEvent={() => openModal()}
        readOnly={readOnly}
      />

      <CalendarLegend employees={legendEmployees} />

      <div className="relative flex-1 min-h-0">
        {view === 'month' && (
          <CalendarGrid
            year={anchor.getFullYear()}
            month={anchor.getMonth() + 1}
            groupedEntries={grouped}
            employeeColors={employeeColors}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onDoubleClick={readOnly ? undefined : openModal}
          />
        )}

        {view === 'week' && (
          <CalendarWeekView
            anchor={anchor}
            groupedEntries={grouped}
            employeeColors={employeeColors}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
            onDoubleClick={readOnly ? undefined : openModal}
          />
        )}

        {view === 'day' &&
          ((grouped.get(range.from)?.length ?? 0) === 0 ? (
            <p className="text-sm text-base-content/40 py-8 text-center">
              Nenhuma OS ou evento neste dia
            </p>
          ) : (
            <DayDetailPanel
              date={range.from}
              entries={grouped.get(range.from) ?? []}
              employeeColors={employeeColors}
              readOnly={readOnly}
              currentEmployeeId={currentEmployeeId}
              onJobEdit={handleJobEdit}
              onJobCancel={handleJobCancel}
              onEventCancel={handleEventCancel}
            />
          ))}

        {loading && (
          <div className="absolute inset-0 bg-base-200/70 flex items-center justify-center rounded-lg">
            <span className="loading loading-spinner loading-md text-primary" />
          </div>
        )}

        {/* Painel de detalhes do dia: bottom sheet por cima da grade inteira
            (nunca empurra o layout nem cria scroll na página — feedback do
            usuário após o sub-plano 06 deixar as células crescerem
            livremente). O backdrop cobre o container todo (mesma altura
            reservada pro `flex-1` acima, não só o conteúdo da grade), então
            nenhuma célula fica com a borda cortada no meio pelo painel. O
            cabeçalho do painel é sticky — o botão de fechar fica sempre
            visível mesmo com a lista rolando internamente. */}
        {view !== 'day' && selectedDate && (grouped.get(selectedDate)?.length ?? 0) > 0 && (
          <>
            <div
              className="absolute inset-0 z-10 bg-base-300/50"
              onClick={() => setSelectedDate(null)}
              aria-hidden="true"
            />
            <div className="absolute inset-x-0 bottom-0 z-20 max-h-[22rem] overflow-y-auto rounded-t-lg shadow-lg animate-slide-up-in">
              <DayDetailPanel
                date={selectedDate}
                entries={grouped.get(selectedDate) ?? []}
                employeeColors={employeeColors}
                readOnly={readOnly}
                currentEmployeeId={currentEmployeeId}
                onJobEdit={handleJobEdit}
                onJobCancel={handleJobCancel}
                onEventCancel={handleEventCancel}
                onClose={() => setSelectedDate(null)}
              />
            </div>
          </>
        )}
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
