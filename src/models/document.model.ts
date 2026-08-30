export type DocumentEntityType = 'contract' | 'job'
export type DocumentStorageKind = 'internal' | 'drive_link'

export interface Document {
  id: string
  entityType: DocumentEntityType
  entityId: string
  storageKind: DocumentStorageKind
  label?: string
  fileName?: string
  driveUrl?: string
  note?: string
  uploadedBy?: string
  createdAt: string
  updatedAt?: string
}
