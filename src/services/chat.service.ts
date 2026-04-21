import api from '@/services/api'

export async function sendMessage(machineId: string, message: string): Promise<string> {
  const { data } = await api.post<{ answer: string }>('/chat', { machineId, message })
  return data.answer
}

export async function compareQuery(machineIds: string[], message: string): Promise<string> {
  const { data } = await api.post<{ answer: string }>('/chat/compare', { machineIds, message })
  return data.answer
}

export async function saveCuratedAnswer(
  machineId: string,
  question: string,
  answer: string
): Promise<void> {
  await api.post('/chat/curate', { machineId, question, answer })
}

export async function deleteCuratedAnswer(id: string): Promise<void> {
  await api.delete(`/chat/curate/${id}`)
}
