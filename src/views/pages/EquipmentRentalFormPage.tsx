import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useEquipmentRentalStore } from '@/viewmodels/equipment-rental.viewmodel'
import { useContractStore } from '@/viewmodels/contract.viewmodel'
import { useBagStore } from '@/viewmodels/bag.viewmodel'
import { equipmentRentalSchema } from '@/models/equipment-rental.model'
import { fetchEquipmentRental } from '@/services/equipment-rental.service'
import { toast } from '@/viewmodels/toast.viewmodel'

export function EquipmentRentalFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const { create, update } = useEquipmentRentalStore()
  const { contracts, load: loadContracts } = useContractStore()
  const { bags, load: loadBags } = useBagStore()

  const [form, setForm] = useState({ contractId: '', bagId: '', startDate: '', endDate: '', value: '0' })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadContracts()
    loadBags()
    if (!id) return
    fetchEquipmentRental(id).then((r) => {
      setForm({ contractId: r.contractId, bagId: r.bagId, startDate: r.startDate, endDate: r.endDate, value: String(r.value) })
    })
  }, [id, loadContracts, loadBags])

  function set_(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = equipmentRentalSchema.safeParse({ ...form, value: Number(form.value) })
    if (!result.success) {
      const errs: Record<string, string> = {}
      for (const issue of result.error.issues) {
        errs[String(issue.path[0])] = issue.message
      }
      setErrors(errs)
      return
    }
    setErrors({})
    setLoading(true)
    try {
      if (isEditing && id) {
        await update(id, result.data)
        toast.success('Locação atualizada com sucesso.')
      } else {
        await create(result.data)
        toast.success('Locação criada com sucesso.')
      }
      navigate('/equipment-rentals')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">{isEditing ? 'Editar Locação' : 'Nova Locação'}</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
        <div className="form-control">
          <label className="label"><span className="label-text">Contrato</span></label>
          <select
            className={`select select-bordered ${errors.contractId ? 'select-error' : ''}`}
            value={form.contractId}
            onChange={(e) => set_('contractId', e.target.value)}
          >
            <option value="">Selecionar contrato…</option>
            {contracts.map((c) => (
              <option key={c.id} value={c.id}>{c.clientName}</option>
            ))}
          </select>
          {errors.contractId && <span className="text-error text-sm mt-1">{errors.contractId}</span>}
        </div>

        <div className="form-control">
          <label className="label"><span className="label-text">Mala</span></label>
          <select
            className={`select select-bordered ${errors.bagId ? 'select-error' : ''}`}
            value={form.bagId}
            onChange={(e) => set_('bagId', e.target.value)}
          >
            <option value="">Selecionar mala…</option>
            {bags.map((b) => (
              <option key={b.id} value={b.id}>{b.name} — {b.model}</option>
            ))}
          </select>
          {errors.bagId && <span className="text-error text-sm mt-1">{errors.bagId}</span>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="form-control">
            <label className="label"><span className="label-text">Data de início</span></label>
            <input
              type="date"
              className={`input input-bordered ${errors.startDate ? 'input-error' : ''}`}
              value={form.startDate}
              onChange={(e) => set_('startDate', e.target.value)}
            />
            {errors.startDate && <span className="text-error text-sm mt-1">{errors.startDate}</span>}
          </div>
          <div className="form-control">
            <label className="label"><span className="label-text">Data de fim</span></label>
            <input
              type="date"
              className={`input input-bordered ${errors.endDate ? 'input-error' : ''}`}
              value={form.endDate}
              onChange={(e) => set_('endDate', e.target.value)}
            />
            {errors.endDate && <span className="text-error text-sm mt-1">{errors.endDate}</span>}
          </div>
        </div>

        <div className="form-control">
          <label className="label"><span className="label-text">Valor (R$)</span></label>
          <input
            type="number"
            min={0}
            step="0.01"
            className={`input input-bordered ${errors.value ? 'input-error' : ''}`}
            value={form.value}
            onChange={(e) => set_('value', e.target.value)}
          />
          {errors.value && <span className="text-error text-sm mt-1">{errors.value}</span>}
        </div>

        <div className="flex gap-3 mt-2">
          <button type="button" className="btn btn-ghost" onClick={() => navigate('/equipment-rentals')}>Cancelar</button>
          <button type="submit" className="btn btn-primary flex-1" disabled={loading}>
            {loading ? <span className="loading loading-spinner loading-sm" /> : isEditing ? 'Salvar' : 'Criar'}
          </button>
        </div>
      </form>
    </div>
  )
}
