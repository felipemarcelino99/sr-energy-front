import api from '@/services/api'

export async function sendMessage(machineId: string, message: string): Promise<string> {
  const { data } = await api.post<{ answer: string }>('/chat', { machineId, message })
  return data.answer
}
