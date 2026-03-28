import { useNavigate } from 'react-router-dom'
import type { Employee } from '@/models/employee.model'

const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']

interface Props {
  year: number
  month: number
  employees: Employee[]
  employeeFilter: string | null
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onEmployeeFilter: (id: string | null) => void
}

export function CalendarToolbar({ year, month, employees, employeeFilter, onPrev, onNext, onToday, onEmployeeFilter }: Props) {
  const navigate = useNavigate()

  return (
    <div className="flex items-center justify-between mb-3">
      <div className="flex items-center gap-2">
        <button className="btn btn-sm btn-ghost" onClick={onPrev}>◀</button>
        <span className="font-semibold text-sm">{MONTH_NAMES[month - 1]} {year}</span>
        <button className="btn btn-sm btn-ghost" onClick={onNext}>▶</button>
        <button className="btn btn-sm btn-outline ml-2" onClick={onToday}>Hoje</button>
      </div>
      <div className="flex items-center gap-2">
        <select
          className="select select-sm select-bordered w-44"
          value={employeeFilter ?? ''}
          onChange={(e) => onEmployeeFilter(e.target.value || null)}
        >
          <option value="">Todos os funcionários</option>
          {employees.map((emp) => (
            <option key={emp.id} value={emp.id}>{emp.name}</option>
          ))}
        </select>
        <button className="btn btn-sm btn-primary" onClick={() => navigate('/schedule/new')}>
          + Novo Evento
        </button>
      </div>
    </div>
  )
}
