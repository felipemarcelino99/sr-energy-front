import { useEffect, useState } from 'react'
import { getMachineOverview } from '@/services/machine.service'

interface Props {
  machineId: string
}

export function MachineOverview({ machineId }: Props) {
  const [overview, setOverview] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    getMachineOverview(machineId)
      .then(setOverview)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [machineId])

  if (loading) return <div className="skeleton h-32 w-full rounded-lg" />
  if (error) return <p className="text-error text-sm">{error}</p>
  if (!overview) return null

  return (
    <div className="prose prose-sm max-w-none">
      {overview.split('\n').map((line, i) => (
        <p key={i}>{line}</p>
      ))}
    </div>
  )
}
