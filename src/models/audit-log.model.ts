export type AuditEntityType = 'contract' | 'job'

export interface AuditEvent {
  id: string
  entityType: AuditEntityType
  entityId: string
  actorId: string
  action: string
  metadata?: Record<string, unknown>
  createdAt: string
}
