import api from '@/services/api'
import type { EquipmentRental, EquipmentRentalFormData } from '@/models/equipment-rental.model'

export async function fetchEquipmentRentals(): Promise<EquipmentRental[]> {
  const { data } = await api.get<EquipmentRental[]>('/equipment-rentals')
  return data
}

export async function fetchEquipmentRental(id: string): Promise<EquipmentRental> {
  const { data } = await api.get<EquipmentRental>(`/equipment-rentals/${id}`)
  return data
}

export async function createEquipmentRental(formData: EquipmentRentalFormData): Promise<EquipmentRental> {
  const { data } = await api.post<EquipmentRental>('/equipment-rentals', formData)
  return data
}

export async function updateEquipmentRental(id: string, formData: Partial<EquipmentRentalFormData>): Promise<EquipmentRental> {
  const { data } = await api.put<EquipmentRental>(`/equipment-rentals/${id}`, formData)
  return data
}

export async function removeEquipmentRental(id: string): Promise<void> {
  await api.delete(`/equipment-rentals/${id}`)
}
