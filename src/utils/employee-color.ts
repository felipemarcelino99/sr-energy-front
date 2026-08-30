/**
 * Paleta fixa e acessível (contraste com texto branco) usada para colorir
 * OSs no calendário por colaborador responsável.
 */
export const EMPLOYEE_COLOR_PALETTE = [
  '#2563eb', // blue
  '#059669', // emerald
  '#d97706', // amber
  '#db2777', // pink
  '#7c3aed', // violet
  '#0891b2', // cyan
  '#65a30d', // lime
  '#dc2626', // red
  '#4338ca', // indigo
  '#0d9488', // teal
]

/**
 * Mapeia um id de colaborador para uma cor determinística da paleta fixa
 * (hash simples por soma de char codes, módulo do tamanho da paleta).
 */
export function getEmployeeColor(employeeId: string): string {
  let hash = 0
  for (let i = 0; i < employeeId.length; i++) {
    hash += employeeId.charCodeAt(i)
  }
  return EMPLOYEE_COLOR_PALETTE[hash % EMPLOYEE_COLOR_PALETTE.length]
}
