import { useState } from 'react'
import type { Employee } from '@/models/employee.model'
import type { CalendarView } from '@/models/schedule.model'
import { MONTH_NAMES, rangeLabel } from '@/viewmodels/schedule.viewmodel'

const VIEW_OPTIONS: { value: CalendarView; label: string }[] = [
  { value: 'day', label: 'Dia' },
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mês' },
]

interface Props {
  title?: string
  view: CalendarView
  anchor: Date
  employees: Employee[]
  employeeFilter: string | null
  onViewChange: (view: CalendarView) => void
  onPrev: () => void
  onNext: () => void
  onMonthSelect?: (year: number, month: number) => void
  onEmployeeFilter: (id: string | null) => void
  onNewEvent: () => void
  readOnly?: boolean
}

export function CalendarToolbar({
  title,
  view,
  anchor,
  employees,
  employeeFilter,
  onViewChange,
  onPrev,
  onNext,
  onMonthSelect,
  onEmployeeFilter,
  onNewEvent,
  readOnly = false,
}: Props) {
  const currentYear = anchor.getFullYear()
  const currentMonth = anchor.getMonth() + 1
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerYear, setPickerYear] = useState(currentYear)

  return (
    <div className="flex items-center justify-between flex-wrap gap-2">
      <div className="flex items-center gap-2 flex-wrap">
        {title && (
          <span className="text-xs font-semibold text-base-content/40 uppercase tracking-wider mr-2">
            {title}
          </span>
        )}

        <div className="join" role="group" aria-label="Visão do calendário">
          {VIEW_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`btn btn-sm join-item ${view === opt.value ? 'btn-primary' : 'btn-ghost'}`}
              aria-pressed={view === opt.value}
              onClick={() => onViewChange(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Navegação de período. O rótulo central ("Setembro 2026") é o
            próprio seletor de mês/ano — clicar nele abre um mini calendário
            (ano + grade de meses) direto, sem <select> nativo no meio do
            caminho (feedback do usuário). */}
        <button
          className="btn btn-sm btn-ghost ml-2"
          onClick={onPrev}
          aria-label="Período anterior"
        >
          ◀
        </button>
        {onMonthSelect ? (
          <div className="relative">
            <button
              type="button"
              className="btn btn-sm btn-ghost font-semibold min-w-[9rem]"
              onClick={() => {
                if (pickerOpen) {
                  setPickerOpen(false)
                } else {
                  setPickerYear(currentYear)
                  setPickerOpen(true)
                }
              }}
              aria-haspopup="true"
              aria-expanded={pickerOpen}
            >
              {rangeLabel(view, anchor)}
            </button>
            {pickerOpen && (
              <div className="absolute z-30 top-full left-1/2 -translate-x-1/2 mt-1 p-3 bg-base-100 border border-base-300 rounded-lg shadow-lg w-56">
                <div className="flex items-center justify-between mb-2">
                  <button
                    type="button"
                    className="btn btn-xs btn-ghost"
                    onClick={() => setPickerYear((y) => y - 1)}
                    aria-label="Ano anterior"
                  >
                    ◀
                  </button>
                  <span className="font-semibold text-sm">{pickerYear}</span>
                  <button
                    type="button"
                    className="btn btn-xs btn-ghost"
                    onClick={() => setPickerYear((y) => y + 1)}
                    aria-label="Próximo ano"
                  >
                    ▶
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {MONTH_NAMES.map((name, i) => {
                    const monthNum = i + 1
                    const isSelected = pickerYear === currentYear && monthNum === currentMonth
                    return (
                      <button
                        key={name}
                        type="button"
                        className={`btn btn-xs ${isSelected ? 'btn-primary' : 'btn-ghost'}`}
                        onClick={() => {
                          onMonthSelect(pickerYear, monthNum)
                          setPickerOpen(false)
                        }}
                      >
                        {name.slice(0, 3)}
                      </button>
                    )
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <span className="font-semibold text-sm min-w-[9rem] text-center">
            {rangeLabel(view, anchor)}
          </span>
        )}
        <button className="btn btn-sm btn-ghost" onClick={onNext} aria-label="Próximo período">
          ▶
        </button>
      </div>
      {!readOnly && (
        <div className="flex items-center gap-2">
          <select
            className="select select-sm select-bordered w-44"
            value={employeeFilter ?? ''}
            onChange={(e) => onEmployeeFilter(e.target.value || null)}
          >
            <option value="">Todos os funcionários</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name}
              </option>
            ))}
          </select>
          <button className="btn btn-sm btn-primary" onClick={onNewEvent}>
            + Novo Evento
          </button>
        </div>
      )}
    </div>
  )
}
