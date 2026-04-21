import { useState } from 'react'
import type { MachineJob } from '@/models/machine.model'
import { MapPin, Wrench, Zap, ChevronDown, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatDate } from '@/utils/date'

interface Props {
  jobs: MachineJob[]
  loading: boolean
}

function JobTable({ jobs, navigate }: { jobs: MachineJob[]; navigate: (path: string) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="table table-sm">
        <thead>
          <tr className="border-base-300 text-xs text-base-content/40 uppercase tracking-wider">
            <th className="font-semibold">Funcionário</th>
            <th className="font-semibold">Data</th>
            <th className="font-semibold">Local</th>
            <th className="font-semibold">Tipo</th>
          </tr>
        </thead>
        <tbody>
          {jobs.map((job) => (
            <tr
              key={job.id}
              className="border-base-300 hover:bg-base-300/30 transition-colors cursor-pointer"
              onClick={() => navigate(`/jobs/${job.id}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && navigate(`/jobs/${job.id}`)}
            >
              <td className="font-medium">{job.employeeName}</td>
              <td className="text-base-content/60 num">{formatDate(job.scheduledDate)}</td>
              <td>
                <span className="flex items-center gap-1 text-base-content/60">
                  <MapPin size={12} />
                  {job.city}/{job.state}
                </span>
              </td>
              <td>
                <span className={`badge badge-sm gap-1 ${job.jobType === 'maintenance' ? 'badge-warning' : 'badge-info'}`}>
                  {job.jobType === 'maintenance'
                    ? <><Wrench size={10} /> Manutenção</>
                    : <><Zap size={10} /> Implementação</>
                  }
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ClientGroup({ name, jobs, navigate }: { name: string; jobs: MachineJob[]; navigate: (path: string) => void }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="border border-base-300 rounded-lg overflow-hidden">
      <button
        className="w-full flex items-center gap-2 px-4 py-2 bg-base-200 text-sm font-semibold hover:bg-base-300/50 transition-colors"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        {name}
        <span className="ml-auto text-xs font-normal text-base-content/50">{jobs.length} OS</span>
      </button>
      {open && <JobTable jobs={jobs} navigate={navigate} />}
    </div>
  )
}

export function MachineJobHistory({ jobs, loading }: Props) {
  const navigate = useNavigate()
  const [searchEmployee, setSearchEmployee] = useState('')
  const [filterClient, setFilterClient] = useState('')
  const [filterCity, setFilterCity] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterDate, setFilterDate] = useState('')

  const hasClientData = jobs.some((j) => j.clientName)

  const filtered = jobs.filter((j) => {
    if (searchEmployee && !j.employeeName.toLowerCase().includes(searchEmployee.toLowerCase())) return false
    if (filterClient && !(j.clientName ?? '').toLowerCase().includes(filterClient.toLowerCase())) return false
    if (filterCity && !j.city.toLowerCase().includes(filterCity.toLowerCase())) return false
    if (filterType && j.jobType !== filterType) return false
    if (filterDate && j.scheduledDate !== filterDate) return false
    return true
  })

  if (loading) {
    return (
      <div className="flex flex-col gap-3 animate-pulse">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-16 bg-base-300 rounded-lg" />
        ))}
      </div>
    )
  }

  if (jobs.length === 0) {
    return (
      <p className="text-sm text-base-content/40 py-8 text-center">
        Nenhuma OS realizada nesta máquina.
      </p>
    )
  }

  const groupedByClient = hasClientData
    ? filtered.reduce<Record<string, MachineJob[]>>((acc, job) => {
        const key = job.clientName ?? 'Sem cliente'
        acc[key] = acc[key] ? [...acc[key], job] : [job]
        return acc
      }, {})
    : null

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="Buscar funcionário…"
          className="input input-bordered input-sm w-44"
          value={searchEmployee}
          onChange={(e) => setSearchEmployee(e.target.value)}
        />
        {hasClientData && (
          <input
            type="text"
            placeholder="Filtrar cliente…"
            className="input input-bordered input-sm w-40"
            value={filterClient}
            onChange={(e) => setFilterClient(e.target.value)}
          />
        )}
        <input
          type="text"
          placeholder="Filtrar cidade…"
          className="input input-bordered input-sm w-36"
          value={filterCity}
          onChange={(e) => setFilterCity(e.target.value)}
        />
        <select
          className="select select-bordered select-sm"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
        >
          <option value="">Todos os tipos</option>
          <option value="maintenance">Manutenção</option>
          <option value="implementation">Implementação</option>
        </select>
        <input
          type="date"
          className="input input-bordered input-sm"
          value={filterDate}
          onChange={(e) => setFilterDate(e.target.value)}
        />
      </div>

      {filtered.length === 0 && (
        <p className="text-sm text-base-content/40 py-4 text-center">Nenhuma OS encontrada com os filtros aplicados.</p>
      )}

      {filtered.length > 0 && (
        groupedByClient
          ? (
            <div className="flex flex-col gap-2">
              {Object.entries(groupedByClient).map(([client, clientJobs]) => (
                <ClientGroup key={client} name={client} jobs={clientJobs} navigate={navigate} />
              ))}
            </div>
          )
          : <JobTable jobs={filtered} navigate={navigate} />
      )}
    </div>
  )
}
