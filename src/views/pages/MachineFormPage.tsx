import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { MachineForm } from '@/views/components/MachineForm'
import { MachineJobHistory } from '@/views/components/MachineJobHistory'
import { MachineDocumentsTab } from '@/views/components/MachineDocumentsTab'
import { useMachineStore } from '@/viewmodels/machine.viewmodel'
import { useToolStore } from '@/viewmodels/tool.viewmodel'
import type { MachineFormData, MachineJob } from '@/models/machine.model'
import { fetchMachine, fetchMachineJobs } from '@/services/machine.service'
import type { Machine } from '@/models/machine.model'
import { toast } from '@/viewmodels/toast.viewmodel'

type Tab = 'details' | 'history' | 'tools' | 'documents'

export function MachineFormPage() {
  const { id } = useParams<{ id: string }>()
  const isEditing = Boolean(id)
  const navigate = useNavigate()
  const { create, update, uploadManual } = useMachineStore()
  const {
    tools,
    machineTools,
    machineToolsLoading,
    fetchTools,
    fetchMachineTools,
    addMachineTool,
    removeMachineTool,
  } = useToolStore()

  const [activeTab, setActiveTab] = useState<Tab>('details')
  const [initialData, setInitialData] = useState<Partial<MachineFormData> | undefined>(undefined)
  const [loading, setLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(isEditing)
  const [jobs, setJobs] = useState<MachineJob[]>([])
  const [jobsLoading, setJobsLoading] = useState(false)

  const [selectedToolId, setSelectedToolId] = useState('')
  const [toolQty, setToolQty] = useState(1)

  useEffect(() => {
    if (!isEditing || !id) return
    setFetchLoading(true)
    fetchMachine(id)
      .then((m: Machine) => {
        setInitialData({
          name: m.name,
          brand: m.brand,
          model: m.model,
          serialNumber: m.serialNumber,
          year: m.year,
          manualUrl: m.manualUrl,
        })
      })
      .finally(() => setFetchLoading(false))
  }, [id, isEditing])

  useEffect(() => {
    if (!isEditing || !id || activeTab !== 'history') return
    setJobsLoading(true)
    fetchMachineJobs(id)
      .then(setJobs)
      .finally(() => setJobsLoading(false))
  }, [id, isEditing, activeTab])

  useEffect(() => {
    if (!isEditing || !id || activeTab !== 'tools') return
    fetchMachineTools(id)
    fetchTools('active')
  }, [id, isEditing, activeTab])

  async function handleSubmit(data: MachineFormData, manualFile?: File) {
    setLoading(true)
    try {
      if (isEditing && id) {
        await update(id, data)
        if (manualFile) await uploadManual(id, manualFile)
      } else {
        await create(data)
      }
      toast.success(isEditing ? 'Máquina atualizada com sucesso.' : 'Máquina criada com sucesso.')
      navigate('/machines')
    } finally {
      setLoading(false)
    }
  }

  async function handleRemoveTool(toolId: string) {
    if (!id) return
    await removeMachineTool(id, toolId)
    fetchMachineTools(id)
    toast.success('Ferramenta removida.')
  }

  async function handleAddTool() {
    if (!id || !selectedToolId) return
    await addMachineTool(id, selectedToolId, toolQty)
    setSelectedToolId('')
    setToolQty(1)
    fetchMachineTools(id)
    toast.success('Ferramenta adicionada com sucesso.')
  }

  if (fetchLoading) {
    return (
      <div className="flex justify-center py-16">
        <span className="loading loading-spinner loading-lg" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button className="btn btn-ghost btn-sm btn-circle" onClick={() => navigate('/machines')}>
            <ArrowLeft size={16} />
          </button>
          <h1 className="text-xl font-bold tracking-tight">
            {isEditing ? `Editar Máquina${initialData?.name ? ` — ${initialData.name}` : ''}` : 'Nova Máquina'}
          </h1>
        </div>
        {activeTab === 'details' && (
          <div className="flex gap-2">
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigate('/machines')}>Cancelar</button>
            <button type="submit" form="machine-form" className="btn btn-primary btn-sm" disabled={loading}>
              {loading ? <span className="loading loading-spinner loading-xs" /> : isEditing ? 'Salvar' : 'Criar'}
            </button>
          </div>
        )}
      </div>

      {isEditing && (
        <div role="tablist" className="tabs tabs-bordered">
          <button role="tab" className={`tab ${activeTab === 'details' ? 'tab-active' : ''}`} onClick={() => setActiveTab('details')}>Dados</button>
          <button role="tab" className={`tab ${activeTab === 'history' ? 'tab-active' : ''}`} onClick={() => setActiveTab('history')}>Histórico de OS</button>
          <button role="tab" className={`tab ${activeTab === 'tools' ? 'tab-active' : ''}`} onClick={() => setActiveTab('tools')}>Ferramentas</button>
          <button role="tab" className={`tab ${activeTab === 'documents' ? 'tab-active' : ''}`} onClick={() => setActiveTab('documents')}>Manuais</button>
        </div>
      )}

      {activeTab === 'details' && (
        <div className="card bg-base-200 border border-base-300">
          <div className="card-body">
            <MachineForm initialData={initialData} onSubmit={handleSubmit} loading={loading} formId="machine-form" hideButtons />
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <MachineJobHistory jobs={jobs} loading={jobsLoading} />
      )}

      {activeTab === 'documents' && id && (
        <MachineDocumentsTab machineId={id} />
      )}

      {activeTab === 'tools' && (
        <div className="card bg-base-200 border border-base-300">
          <div className="card-body gap-4">
            {machineToolsLoading ? (
              <div className="flex justify-center py-8" data-testid="machine-tools-loading">
                <span className="loading loading-spinner loading-md" />
              </div>
            ) : (
              <>
                {machineTools.length === 0 ? (
                  <p className="text-base-content/50 py-4 text-sm">Nenhuma ferramenta associada</p>
                ) : (
                  <div className="overflow-x-auto -mx-5">
                    <table className="table table-zebra w-full">
                      <thead>
                        <tr>
                          <th>Nome</th>
                          <th>Quantidade necessária</th>
                          <th>Ações</th>
                        </tr>
                      </thead>
                      <tbody>
                        {machineTools.map((mt) => (
                          <tr key={mt.id}>
                            <td>{mt.tool.name}</td>
                            <td>{mt.quantityRequired}</td>
                            <td>
                              <button className="btn btn-ghost btn-xs text-error" onClick={() => handleRemoveTool(mt.toolId)}>Remover</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="border-t border-base-300 pt-4">
                  <p className="text-sm font-semibold mb-3">Adicionar Ferramenta</p>
                  <div className="flex flex-wrap gap-3 items-end">
                    <div className="flex flex-col gap-1">
                      <label className="label text-xs font-medium text-base-content/60" htmlFor="tool-select">Ferramenta</label>
                      <select id="tool-select" aria-label="Ferramenta" className="select select-bordered select-sm" value={selectedToolId} onChange={(e) => setSelectedToolId(e.target.value)}>
                        <option value="">Selecionar ferramenta...</option>
                        {tools.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="label text-xs font-medium text-base-content/60" htmlFor="tool-qty">Quantidade</label>
                      <input id="tool-qty" aria-label="Quantidade necessária" type="number" className="input input-bordered input-sm w-24" min={1} value={toolQty} onChange={(e) => setToolQty(Number(e.target.value))} />
                    </div>
                    <button className="btn btn-primary btn-sm" onClick={handleAddTool} disabled={!selectedToolId}>Adicionar</button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
