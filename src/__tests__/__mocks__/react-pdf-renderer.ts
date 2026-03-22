export const pdf = jest.fn().mockResolvedValue({ toBlob: jest.fn().mockResolvedValue(new Blob()) })
export const Document = ({ children }: { children: React.ReactNode }) => children
export const Page = ({ children }: { children: React.ReactNode }) => children
export const Text = ({ children }: { children: React.ReactNode }) => children
export const View = ({ children }: { children: React.ReactNode }) => children
export const Image = () => null
export const StyleSheet = { create: (styles: object) => styles }
export const Font = { register: jest.fn() }
