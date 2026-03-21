import { useEffect, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { formatDate } from '@/utils/date'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts'
import { useTransactionStore } from '@/viewmodels/transaction.viewmodel'
import { FinancialSummaryCards } from '@/views/components/FinancialSummaryCards'
import { transactionSchema } from '@/models/transaction.model'
import type { TransactionFormData, TransactionType } from '@/models/transaction.model'

const PIE_COLORS = ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899']

export function FinancialPage() {
  const { load, filtered, remove, create, summary, monthly, filters, setFilters, loading, error } = useTransactionStore()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ type: 'credit', amount: '', description: '', category: '', destination: '', date: '' })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})

  useEffect(() => { load() }, [load])

  const transactions = filtered()
  const fin = summary()
  const monthlyData = monthly()

  // Category distribution for pie chart
  const categoryMap = new Map<string, number>()
  for (const t of transactions) {
    categoryMap.set(t.category, (categoryMap.get(t.category) ?? 0) + t.amount)
  }
  const pieData = Array.from(categoryMap.entries()).map(([name, value]) => ({ name, value }))

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    const result = transactionSchema.safeParse({ ...form })
    if (!result.success) {
      const errs: Record<string, string> = {}
      for (const issue of result.error.issues) errs[String(issue.path[0])] = issue.message
      setFormErrors(errs)
      return
    }
    setFormErrors({})
    await create(result.data as TransactionFormData)
    setShowForm(false)
    setForm({ type: 'credit', amount: '', description: '', category: '', destination: '', date: '' })
  }

  async function handleDelete() {
    if (!deleteId) return
    await remove(deleteId)
    setDeleteId(null)
  }

  return (
    <div className="p-6 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Financeiro</h1>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(true)} title="Novo lançamento">
          <Plus size={14} />
        </button>
      </div>

      {/* Summary cards */}
      <FinancialSummaryCards
        totalCredits={fin.totalCredits}
        totalDebits={fin.totalDebits}
        balance={fin.balance}
      />

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          className="select select-bordered select-sm"
          value={filters.type ?? ''}
          onChange={(e) => setFilters({ ...filters, type: (e.target.value as TransactionType) || undefined })}
        >
          <option value="">Todos os tipos</option>
          <option value="credit">Entradas</option>
          <option value="debit">Saídas</option>
        </select>

        <input
          type="month"
          className="input input-bordered input-sm"
          value={filters.month ?? ''}
          onChange={(e) => setFilters({ ...filters, month: e.target.value || undefined })}
        />
      </div>

      {/* Charts */}
      {monthlyData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card bg-base-200 p-4">
            <h2 className="font-semibold mb-3">Evolução Mensal</h2>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v) => (typeof v === 'number' ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : String(v))} />
                <Legend />
                <Line type="monotone" dataKey="credits" stroke="#22c55e" name="Entradas" />
                <Line type="monotone" dataKey="debits" stroke="#ef4444" name="Saídas" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {pieData.length > 0 && (
            <div className="card bg-base-200 p-4">
              <h2 className="font-semibold mb-3">Por Categoria</h2>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {pieData.map((_, index) => (
                      <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {/* Transaction list */}
      {loading && <div className="flex justify-center py-8"><span className="loading loading-spinner loading-lg" /></div>}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && transactions.length === 0 && (
        <div className="text-center text-base-content/50 py-8">Nenhuma transação encontrada.</div>
      )}

      {!loading && transactions.length > 0 && (
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th>Data</th>
                <th>Tipo</th>
                <th>Descrição</th>
                <th>Categoria</th>
                <th>Destino</th>
                <th className="text-right">Valor</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td>{formatDate(t.date)}</td>
                  <td>
                    <span className={`badge ${t.type === 'credit' ? 'badge-success' : 'badge-error'}`}>
                      {t.type === 'credit' ? 'Entrada' : 'Saída'}
                    </span>
                  </td>
                  <td>{t.description}</td>
                  <td>{t.category}</td>
                  <td>{t.destination ?? '—'}</td>
                  <td className={`text-right font-medium ${t.type === 'credit' ? 'text-success' : 'text-error'}`}>
                    {t.type === 'debit' ? '−' : '+'}
                    {t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                  </td>
                  <td>
                    <button className="btn btn-ghost btn-xs text-error" onClick={() => setDeleteId(t.id)} title="Excluir">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New transaction form modal */}
      {showForm && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md">
            <h3 className="font-bold text-lg mb-4">Novo Lançamento</h3>
            <form onSubmit={handleCreate} className="flex flex-col gap-3" noValidate>
              <fieldset className="fieldset gap-1">
                <label className="label text-xs" htmlFor="tx-type">Tipo</label>
                <select id="tx-type" className="select select-bordered w-full" value={form.type}
                  onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}>
                  <option value="credit">Entrada (Crédito)</option>
                  <option value="debit">Saída (Débito)</option>
                </select>
              </fieldset>

              <fieldset className="fieldset gap-1">
                <label className="label text-xs" htmlFor="tx-amount">Valor (R$)</label>
                <input id="tx-amount" type="number" min="0.01" step="0.01"
                  className={`input input-bordered w-full ${formErrors.amount ? 'input-error' : ''}`}
                  value={form.amount}
                  onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} />
                {formErrors.amount && <p className="text-error text-xs">{formErrors.amount}</p>}
              </fieldset>

              <fieldset className="fieldset gap-1">
                <label className="label text-xs" htmlFor="tx-desc">Descrição</label>
                <input id="tx-desc" type="text"
                  className={`input input-bordered w-full ${formErrors.description ? 'input-error' : ''}`}
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
                {formErrors.description && <p className="text-error text-xs">{formErrors.description}</p>}
              </fieldset>

              <fieldset className="fieldset gap-1">
                <label className="label text-xs" htmlFor="tx-cat">Categoria</label>
                <input id="tx-cat" type="text"
                  className={`input input-bordered w-full ${formErrors.category ? 'input-error' : ''}`}
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} />
                {formErrors.category && <p className="text-error text-xs">{formErrors.category}</p>}
              </fieldset>

              <fieldset className="fieldset gap-1">
                <label className="label text-xs" htmlFor="tx-dest">Destino <span className="opacity-40">(opcional)</span></label>
                <input id="tx-dest" type="text" className="input input-bordered w-full"
                  value={form.destination}
                  onChange={(e) => setForm((p) => ({ ...p, destination: e.target.value }))} />
              </fieldset>

              <fieldset className="fieldset gap-1">
                <label className="label text-xs" htmlFor="tx-date">Data</label>
                <input id="tx-date" type="date"
                  className={`input input-bordered w-full ${formErrors.date ? 'input-error' : ''}`}
                  value={form.date}
                  onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
                {formErrors.date && <p className="text-error text-xs">{formErrors.date}</p>}
              </fieldset>

              <div className="modal-action mt-2">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">Confirmar exclusão</h3>
            <p className="py-4">Tem certeza que deseja excluir esta transação?</p>
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
