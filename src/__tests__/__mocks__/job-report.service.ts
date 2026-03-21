export const submitReport = jest.fn().mockResolvedValue({})
export const uploadEvidence = jest.fn().mockResolvedValue({ id: 'e1', reportId: 'r1', url: '', mimeType: 'image/jpeg', fileName: 'test.jpg', type: 'image' })
export const fetchReport = jest.fn().mockResolvedValue(null)
