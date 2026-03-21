import { useEffect } from 'react'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useToastStore, type Toast } from '@/viewmodels/toast.viewmodel'

const ICONS = {
  success: <CheckCircle size={16} />,
  error: <XCircle size={16} />,
  warning: <AlertTriangle size={16} />,
  info: <Info size={16} />,
}

const ALERT_CLASSES = {
  success: 'alert-success',
  error: 'alert-error',
  warning: 'alert-warning',
  info: 'alert-info',
}

const AUTO_DISMISS_MS = 4000

function ToastItem({ toast }: { toast: Toast }) {
  const remove = useToastStore((s) => s.remove)

  useEffect(() => {
    const timer = setTimeout(() => remove(toast.id), AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [toast.id, remove])

  return (
    <div
      role="alert"
      className={`alert ${ALERT_CLASSES[toast.type]} shadow-lg flex items-center gap-3 py-3 px-4 min-w-72 max-w-sm`}
    >
      {ICONS[toast.type]}
      <span className="flex-1 text-sm">{toast.message}</span>
      <button
        aria-label="Fechar"
        className="btn btn-ghost btn-xs p-0"
        onClick={() => remove(toast.id)}
      >
        <X size={14} />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts)

  if (toasts.length === 0) return null

  return (
    <div className="toast toast-end toast-bottom z-50" aria-live="polite">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  )
}
