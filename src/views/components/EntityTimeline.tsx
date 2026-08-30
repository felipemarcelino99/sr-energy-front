import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { fetchAuditLog } from '@/services/audit-log.service'
import { fetchDocuments } from '@/services/document.service'
import { fetchEmployees } from '@/services/employee.service'
import type { AuditEntityType } from '@/models/audit-log.model'

interface Props {
  entityType: AuditEntityType
  entityId: string
}

interface TimelineItem {
  id: string
  createdAt: string
  label: string
  actorName?: string
  kind: 'audit' | 'document'
}

/** Labels amigáveis para ações conhecidas do audit-log. Ação desconhecida cai no fallback genérico. */
const ACTION_LABELS: Record<string, string> = {
  'contract.accepted': 'Contrato aceito',
  'contract.rejected': 'Contrato rejeitado',
  'document.attached': 'Documento anexado',
  'document.linked': 'Documento vinculado (legado)',
  'document.accessed': 'Documento acessado',
}

function auditLabel(action: string): string {
  return ACTION_LABELS[action] ?? `Evento: ${action}`
}

function documentLabel(storageKind: string, label?: string): string {
  if (label) return `Documento: ${label}`
  return storageKind === 'drive_link' ? 'Documento vinculado (legado)' : 'Documento anexado'
}

/**
 * Linha do tempo combinada de audit-log + documentos para uma entidade
 * (contrato ou OS). Resolve actorId → nome do colaborador via uma única
 * chamada a fetchEmployees, evitando N+1.
 */
export function EntityTimeline({ entityType, entityId }: Props) {
  const auditQuery = useQuery({
    queryKey: ['audit-log', entityType, entityId],
    queryFn: () => fetchAuditLog(entityType, entityId),
  })
  const documentsQuery = useQuery({
    queryKey: ['documents', entityType, entityId],
    queryFn: () => fetchDocuments(entityType, entityId),
  })
  const employeesQuery = useQuery({
    queryKey: ['employees'],
    queryFn: fetchEmployees,
    staleTime: 5 * 60 * 1000,
  })

  const nameByActorId = useMemo(() => {
    const map = new Map<string, string>()
    for (const emp of employeesQuery.data ?? []) {
      map.set(emp.id, emp.name)
      if (emp.userId) map.set(emp.userId, emp.name)
    }
    return map
  }, [employeesQuery.data])

  const events = useMemo(() => auditQuery.data ?? [], [auditQuery.data])
  const documents = useMemo(() => documentsQuery.data ?? [], [documentsQuery.data])

  // Documento já representado por um evento de audit-log (ex.: metadata.documentId)
  // não é duplicado na timeline. Não é crítico deduplicar perfeitamente — o
  // importante é nunca esconder informação.
  const auditedDocumentIds = useMemo(() => {
    const ids = new Set<string>()
    for (const ev of events) {
      const docId = ev.metadata?.documentId
      if (typeof docId === 'string') ids.add(docId)
    }
    return ids
  }, [events])

  const items: TimelineItem[] = useMemo(() => {
    const auditItems: TimelineItem[] = events.map((ev) => ({
      id: `audit-${ev.id}`,
      createdAt: ev.createdAt,
      label: auditLabel(ev.action),
      actorName: nameByActorId.get(ev.actorId),
      kind: 'audit',
    }))

    const documentItems: TimelineItem[] = documents
      .filter((doc) => !auditedDocumentIds.has(doc.id))
      .map((doc) => ({
        id: `document-${doc.id}`,
        createdAt: doc.createdAt,
        label: documentLabel(doc.storageKind, doc.label),
        actorName: doc.uploadedBy ? nameByActorId.get(doc.uploadedBy) : undefined,
        kind: 'document',
      }))

    return [...auditItems, ...documentItems].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    )
  }, [events, documents, auditedDocumentIds, nameByActorId])

  const loading = auditQuery.isLoading || documentsQuery.isLoading
  const error = auditQuery.isError || documentsQuery.isError

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <span className="loading loading-spinner loading-md" />
      </div>
    )
  }

  if (error) {
    return <div className="alert alert-error text-sm">Erro ao carregar histórico.</div>
  }

  if (items.length === 0) {
    return <p className="text-base-content/50 py-4 text-sm">Nenhum evento registrado ainda.</p>
  }

  return (
    <ul className="timeline timeline-vertical" aria-label="Linha do tempo">
      {items.map((item, idx) => (
        <li key={item.id}>
          {idx > 0 && <hr />}
          <div className="timeline-start text-xs text-base-content/50 whitespace-nowrap">
            {new Date(item.createdAt).toLocaleString('pt-BR')}
          </div>
          <div className="timeline-middle">
            <span
              className={`badge badge-xs ${item.kind === 'document' ? 'badge-info' : 'badge-neutral'}`}
              aria-hidden="true"
            />
          </div>
          <div className="timeline-end timeline-box">
            <p className="text-sm font-medium">{item.label}</p>
            {item.actorName && <p className="text-xs text-base-content/50">{item.actorName}</p>}
          </div>
          {idx < items.length - 1 && <hr />}
        </li>
      ))}
    </ul>
  )
}
