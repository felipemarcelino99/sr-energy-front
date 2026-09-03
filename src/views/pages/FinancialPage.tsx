import { useEffect, useMemo, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import type { SortingState, ColumnDef } from '@tanstack/react-table'
import { formatDate } from '@/utils/date'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import type { PieLabel } from 'recharts/types/polar/Pie'

const CATEGORIES = [
  'Serviços',
  'Materiais',
  'Equipamentos',
  'Combustível',
  'Manutenção',
  'Salários',
  'Impostos',
  'Outros',
]
import { useTransactionStore } from '@/viewmodels/transaction.viewmodel'
import { FinancialSummaryCards } from '@/views/components/FinancialSummaryCards'
import { transactionSchema } from '@/models/transaction.model'
import type { Transaction, TransactionFormData, TransactionType } from '@/models/transaction.model'
import { usePageHeader } from '@/hooks/usePageHeader'
import { useUrlState } from '@/hooks/useUrlState'
import { DataTable } from '@/views/components/ui/DataTable'

const PIE_COLORS = ['#22c55e', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899']

const RADIAN = Math.PI / 180
const renderCustomLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: {
  cx: number
  cy: number
  midAngle: number
  innerRadius: number
  outerRadius: number
  percent: number
}) => {
  if (percent <= 0.05) return null
  const r = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + r * Math.cos(-midAngle * RADIAN)
  const y = cy + r * Math.sin(-midAngle * RADIAN)
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}

export function FinancialPage() {
  const { load, filtered, remove, create, summary, monthly, filters, setFilters, loading, error } =
    useTransactionStore()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    type: 'credit',
    amount: '',
    description: '',
    category: '',
    destination: '',
    date: '',
  })
  const [formErrors, setFormErrors] = useState<Record<string, string>>({})
  const [typeParam, setTypeParam] = useUrlState('type', '')
  const [monthParam, setMonthParam] = useUrlState('month', '')
  const [sorting, setSorting] = useState<SortingState>([])

  usePageHeader('Financeiro')

  useEffect(() => {
    load()
    // Seed store filters from the URL so a refresh preserves the selected type/month.
    setFilters({
      type: (typeParam as TransactionType) || undefined,
      month: monthParam || undefined,
    })
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
    setForm({
      type: 'credit',
      amount: '',
      description: '',
      category: '',
      destination: '',
      date: '',
    })
  }

  async function handleDelete() {
    if (!deleteId) return
    await remove(deleteId)
    setDeleteId(null)
  }

  const columns = useMemo<ColumnDef<Transaction>[]>(
    () => [
      {
        accessorKey: 'date',
        header: 'Data',
        cell: ({ row }) => formatDate(row.original.date),
      },
      {
        accessorKey: 'type',
        header: 'Tipo',
        cell: ({ row }) => (
          <span
            className={`badge ${row.original.type === 'credit' ? 'badge-success' : 'badge-error'}`}
          >
            {row.original.type === 'credit' ? 'Entrada' : 'Saída'}
          </span>
        ),
      },
      {
        accessorKey: 'description',
        header: 'Descrição',
        enableSorting: false,
      },
      {
        accessorKey: 'category',
        header: 'Categoria',
      },
      {
        id: 'destination',
        accessorFn: (t) => t.destination ?? '—',
        header: 'Destino',
        enableSorting: false,
      },
      {
        accessorKey: 'amount',
        header: 'Valor',
        cell: ({ row }) => (
          <span
            className={`text-right font-medium block ${row.original.type === 'credit' ? 'text-success' : 'text-error'}`}
          >
            {row.original.type === 'debit' ? '−' : '+'}
            {row.original.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        ),
      },
      {
        id: 'actions',
        header: '',
        enableSorting: false,
        cell: ({ row }) => (
          <button
            className="btn btn-ghost btn-xs text-error"
            onClick={(e) => {
              e.stopPropagation()
              setDeleteId(row.original.id)
            }}
            title="Excluir"
          >
            <Trash2 size={13} />
          </button>
        ),
      },
    ],
    []
  )

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-end">
        <button
          className="btn btn-primary btn-sm gap-1"
          onClick={() => setShowForm(true)}
          title="Novo lançamento"
        >
          <Plus size={14} /> Novo Lançamento
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
          value={typeParam}
          onChange={(e) => {
            const next = e.target.value
            setTypeParam(next)
            setFilters({ ...filters, type: (next as TransactionType) || undefined })
          }}
        >
          <option value="">Todos os tipos</option>
          <option value="credit">Entradas</option>
          <option value="debit">Saídas</option>
        </select>

        <input
          type="month"
          className="input input-bordered input-sm"
          value={monthParam}
          onChange={(e) => {
            const next = e.target.value
            setMonthParam(next)
            setFilters({ ...filters, month: next || undefined })
          }}
        />
      </div>

      {/* Charts */}
      {monthlyData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="card bg-base-200 border border-base-300">
            <div className="card-body gap-3">
              <h2 className="text-sm font-semibold text-base-content/40 uppercase tracking-wider">
                Evolução Mensal
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colorCredits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorDebits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    formatter={(v) =>
                      typeof v === 'number'
                        ? v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                        : String(v)
                    }
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="credits"
                    stroke="#22c55e"
                    fill="url(#colorCredits)"
                    name="Entradas"
                  />
                  <Area
                    type="monotone"
                    dataKey="debits"
                    stroke="#ef4444"
                    fill="url(#colorDebits)"
                    name="Saídas"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {pieData.length > 0 && (
            <div className="card bg-base-200 border border-base-300">
              <div className="card-body gap-3">
                <h2 className="text-sm font-semibold text-base-content/40 uppercase tracking-wider">
                  Por Categoria
                </h2>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    {}
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      labelLine={false}
                      label={renderCustomLabel as unknown as PieLabel}
                    >
                      {pieData.map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Transaction list */}
      {loading && (
        <div className="flex justify-center py-8">
          <span className="loading loading-spinner loading-lg" />
        </div>
      )}
      {error && <div className="alert alert-error">{error}</div>}

      {!loading && transactions.length === 0 && (
        <div className="text-center text-base-content/50 py-8">Nenhuma transação encontrada.</div>
      )}

      {!loading && transactions.length > 0 && (
        <div className="card bg-base-200 border border-base-300 overflow-hidden">
          <DataTable<Transaction>
            data={transactions}
            columns={columns}
            sorting={sorting}
            onSortingChange={setSorting}
            getRowId={(t) => t.id}
            emptyMessage="Nenhuma transação encontrada."
          />
        </div>
      )}

      {/* New transaction form modal */}
      {showForm && (
        <div className="modal modal-open">
          <div className="modal-box max-w-md max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-4">Novo Lançamento</h3>
            <form onSubmit={handleCreate} className="flex flex-col gap-3" noValidate>
              <fieldset className="fieldset gap-1">
                <label className="label text-xs" htmlFor="tx-type">
                  Tipo
                </label>
                <select
                  id="tx-type"
                  className="select select-bordered w-full"
                  value={form.type}
                  onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))}
                >
                  <option value="credit">Entrada (Crédito)</option>
                  <option value="debit">Saída (Débito)</option>
                </select>
              </fieldset>

              <fieldset className="fieldset gap-1">
                <label className="label text-xs" htmlFor="tx-amount">
                  Valor (R$)
                </label>
                <input
                  id="tx-amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  className={`input input-bordered w-full ${formErrors.amount ? 'input-error' : ''}`}
                  value={form.amount}
                  onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                />
                {formErrors.amount && <p className="text-error text-xs">{formErrors.amount}</p>}
              </fieldset>

              <fieldset className="fieldset gap-1">
                <label className="label text-xs" htmlFor="tx-desc">
                  Descrição
                </label>
                <input
                  id="tx-desc"
                  type="text"
                  className={`input input-bordered w-full ${formErrors.description ? 'input-error' : ''}`}
                  value={form.description}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                />
                {formErrors.description && (
                  <p className="text-error text-xs">{formErrors.description}</p>
                )}
              </fieldset>

              <fieldset className="fieldset gap-1">
                <label className="label text-xs" htmlFor="tx-cat">
                  Categoria
                </label>
                <select
                  id="tx-cat"
                  className={`select select-bordered w-full ${formErrors.category ? 'select-error' : ''}`}
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                >
                  <option value="">Selecione uma categoria</option>
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
                {formErrors.category && <p className="text-error text-xs">{formErrors.category}</p>}
              </fieldset>

              <fieldset className="fieldset gap-1">
                <label className="label text-xs" htmlFor="tx-dest">
                  Destino <span className="opacity-40">(opcional)</span>
                </label>
                <input
                  id="tx-dest"
                  type="text"
                  className="input input-bordered w-full"
                  value={form.destination}
                  onChange={(e) => setForm((p) => ({ ...p, destination: e.target.value }))}
                />
              </fieldset>

              <fieldset className="fieldset gap-1">
                <label className="label text-xs" htmlFor="tx-date">
                  Data
                </label>
                <input
                  id="tx-date"
                  type="date"
                  className={`input input-bordered w-full ${formErrors.date ? 'input-error' : ''}`}
                  value={form.date}
                  onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
                />
                {formErrors.date && <p className="text-error text-xs">{formErrors.date}</p>}
              </fieldset>

              <div className="modal-action mt-2">
                <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {deleteId && (
        <div className="modal modal-open">
          <div className="modal-box max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg">Confirmar exclusão</h3>
            <p className="py-4">Tem certeza que deseja excluir esta transação?</p>
            <div className="modal-action">
              <button className="btn btn-ghost" onClick={() => setDeleteId(null)}>
                Cancelar
              </button>
              <button className="btn btn-error" onClick={handleDelete}>
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
