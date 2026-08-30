import api from '@/services/api'
import type { Document, DocumentEntityType } from '@/models/document.model'

export async function fetchDocuments(
  entityType: DocumentEntityType,
  entityId: string
): Promise<Document[]> {
  const { data } = await api.get<Document[]>('/documents', {
    params: { entityType, entityId },
  })
  return data
}

export async function uploadDocument(
  entityType: DocumentEntityType,
  entityId: string,
  file: File,
  label?: string
): Promise<Document> {
  const form = new FormData()
  form.append('file', file)
  form.append('entityType', entityType)
  form.append('entityId', entityId)
  if (label) form.append('label', label)
  const { data } = await api.post<Document>('/documents', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function linkLegacyDocument(
  entityType: DocumentEntityType,
  entityId: string,
  driveUrl: string,
  note: string,
  label?: string
): Promise<Document> {
  const { data } = await api.post<Document>('/documents/link-legacy', {
    entityType,
    entityId,
    driveUrl,
    note,
    label,
  })
  return data
}

export async function generateReport(jobId: string): Promise<{ documentId: string }> {
  const { data } = await api.post<{ documentId: string }>(`/documents/generate-report/${jobId}`)
  return data
}

export async function getDocumentUrl(id: string): Promise<string> {
  const { data } = await api.get<{ url: string }>(`/documents/${id}/url`)
  return data.url
}
