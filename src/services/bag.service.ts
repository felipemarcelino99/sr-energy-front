import api from '@/services/api'
import type { Bag, BagFormData } from '@/models/bag.model'

export async function fetchBags(): Promise<Bag[]> {
  const { data } = await api.get<Bag[]>('/bags')
  return data
}

export async function fetchBag(id: string): Promise<Bag> {
  const { data } = await api.get<Bag>(`/bags/${id}`)
  return data
}

export async function createBag(formData: BagFormData): Promise<Bag> {
  const { data } = await api.post<Bag>('/bags', formData)
  return data
}

export async function updateBag(id: string, formData: Partial<BagFormData>): Promise<Bag> {
  const { data } = await api.put<Bag>(`/bags/${id}`, formData)
  return data
}

export async function removeBag(id: string): Promise<void> {
  await api.delete(`/bags/${id}`)
}

export async function uploadCertificate(bagId: string, file: File, expiryDate: string): Promise<Bag> {
  const form = new FormData()
  form.append('file', file)
  form.append('expiryDate', expiryDate)
  const { data } = await api.post<Bag>(`/bags/${bagId}/certificates`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function removeCertificate(bagId: string, certId: string): Promise<Bag> {
  const { data } = await api.delete<Bag>(`/bags/${bagId}/certificates/${certId}`)
  return data
}
