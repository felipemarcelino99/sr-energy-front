import api from '@/services/api'
import type { Client, ClientFormData } from '@/models/client.model'

export async function fetchClients(): Promise<Client[]> {
  const { data } = await api.get<Client[]>('/clients')
  return data
}

export async function fetchClient(id: string): Promise<Client> {
  const { data } = await api.get<Client>(`/clients/${id}`)
  return data
}

export async function fetchClientsBySearch(q: string): Promise<Client[]> {
  const { data } = await api.get<Client[]>('/clients', { params: { search: q } })
  return data
}

export async function createClient(formData: ClientFormData): Promise<Client> {
  const { data } = await api.post<Client>('/clients', formData)
  return data
}

export async function updateClient(id: string, formData: Partial<ClientFormData>): Promise<Client> {
  const { data } = await api.put<Client>(`/clients/${id}`, formData)
  return data
}

export async function removeClient(id: string): Promise<void> {
  await api.delete(`/clients/${id}`)
}
