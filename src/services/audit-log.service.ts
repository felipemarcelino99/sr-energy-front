import api from '@/services/api'
import type { AuditEntityType, AuditEvent } from '@/models/audit-log.model'

export async function fetchAuditLog(
  entityType: AuditEntityType,
  entityId: string
): Promise<AuditEvent[]> {
  const { data } = await api.get<AuditEvent[]>('/audit-log', {
    params: { entityType, entityId },
  })
  return data
}
