import type { MachineJob } from '@/models/machine.model'
import { MapPin, Wrench, Zap } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { formatDate } from '@/utils/date'

interface Props {
  jobs: MachineJob[]
  loading: boolean
}

export function MachineJobHistory({ jobs, loading }: Props) {
  const navigate = useNavigate()
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
        Nenhum trabalho realizado nesta máquina.
      </p>
    )
  }

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
