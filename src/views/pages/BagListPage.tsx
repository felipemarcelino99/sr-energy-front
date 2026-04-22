import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { useBagStore } from '@/viewmodels/bag.viewmodel'
import { isCertificateExpiringSoon, isCertificateExpired } from '@/models/bag.model'
import { toast } from '@/viewmodels/toast.viewmodel'
import { useSortableTable, sortIcon } from '@/hooks/useSortableTable'
import { MultiSelect } from '@/views/components/MultiSelect'

const CERT_STATUS_OPTIONS = ['Válido', 'Vencendo', 'Vencido', 'Sem certificado']

function getBagCertStatus(bag: { calibrationCertificates: Array<{ expiryDate: string }> }): string {
  if (bag.calibrationCertificates.length === 0) return 'Sem certificado'
  if (bag.calibrationCertificates.some((c) => isCertificateExpired(c.expiryDate))) return 'Vencido'
  if (bag.calibrationCertificates.some((c) => isCertificateExpiringSoon(c.expiryDate))) return 'Vencendo'
  return 'Válido'
}

export function BagListPage() {
  const { load, filtered, remove, loading, error, search, setSearch } = useBagStore()
  const bags = filtered()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [certFilter, setCertFilter] = useState<string[]>([])
  const navigate = useNavigate()

  useEffect(() => { load() }, [load])

  const localFiltered = useMemo(() => {
    if (certFilter.length === 0) return bags
    return bags.filter((b) => certFilter.includes(getBagCertStatus(b)))
  }, [bags, certFilter])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { sorted, sort, toggle } = useSortableTable(localFiltered as any[])

  async function handleDelete() {
    if (!deleteId) return
    await remove(deleteId)
    setDeleteId(null)
    toast.success('Mala excluída com sucesso.')
  }

  const hasFilters = search !== '' || certFilter.length > 0

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-tight">Malas</h1>
        <Link to="/bags/new" className="btn btn-primary btn-sm gap-1">
          <Plus size={14} /> Nova Mala
        </Link>
      </div>

      {/* Filter bar */}
      <div className="filter-bar bg-base-200 border border-base-300 rounded-lg p-4 flex flex-wrap gap-3 items-center">
        <input
          type="text"
          className="input input-bordered input-sm"
          placeholder="Buscar por nome ou modelo…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ minWidth: 200 }}
        />
        <MultiSelect
          options={CERT_STATUS_OPTIONS}
          value={certFilter}
          onChange={setCertFilter}
          placeholder="Status de certificado"
        />
        {hasFilters && (
          <button className="btn btn-ghost btn-sm" onClick={() => { setSearch(''); setCertFilter([]) }}>
            Limpar filtros
          </button>
        )}
        <span className="ml-auto text-xs text-base-content/40">{sorted.length} registro(s)</span>
      </div>

      {loading && <div className="flex justify-center py-12"><span className="loading loading-spinner loading-lg" /></div>}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && (
        <div className="card bg-base-200 border border-base-300 overflow-hidden">
          {sorted.length === 0 ? (
            <div className="text-center text-base-content/50 py-10">Nenhuma mala encontrada.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table table-zebra w-full">
                <thead>
                  <tr>
                    <th className="sortable" onClick={() => toggle('name')}>Nome{sortIcon(sort.key === 'name' ? sort.dir : null)}</th>
                    <th className="sortable" onClick={() => toggle('model')}>Modelo{sortIcon(sort.key === 'model' ? sort.dir : null)}</th>
                    <th className="sortable" onClick={() => toggle('quantity')}>Qtd.{sortIcon(sort.key === 'quantity' ? sort.dir : null)}</th>
                    <th>Certificados</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {sorted.map((b: any) => {
                    const certStatus = getBagCertStatus(b)
                    const isExpired = certStatus === 'Vencido'
                    const isExpiring = certStatus === 'Vencendo'
                    return (
                      <tr key={b.id} className="hover cursor-pointer" onClick={() => navigate(`/bags/${b.id}/edit`)}>
                        <td className="font-medium">
                          {(isExpiring || isExpired) && (
                            <AlertTriangle size={14} className={`inline mr-1 ${isExpired ? 'text-error' : 'text-warning'}`} />
                          )}
                          {b.name}
                        </td>
                        <td>{b.model}</td>
                        <td>{b.quantity}</td>
                        <td>
                          {b.calibrationCertificates.length === 0
                            ? <span className="text-base-content/30 text-xs">—</span>
                            : <span className={`badge badge-sm ${isExpired ? 'badge-error' : isExpiring ? 'badge-warning' : 'badge-success'}`}>{certStatus}</span>
                          }
                        </td>
                        <td onClick={(e) => e.stopPropagation()} className="flex gap-2">
                          <Link to={`/bags/${b.id}/edit`} className="btn btn-ghost btn-xs" title="Editar"><Pencil size={13} /></Link>
                          <button className="btn btn-ghost btn-xs text-error" onClick={() => setDeleteId(b.id)} title="Excluir"><Trash2 size={13} /></button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {deleteId && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Confirmar exclusão</h3>
            <p className="py-4">Tem certeza que deseja excluir esta mala?</p>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>Cancelar</button>
              <button className="btn btn-error" onClick={handleDelete}>Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
