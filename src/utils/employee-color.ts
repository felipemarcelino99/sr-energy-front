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
 * Sub-plano 05 (épico ajustes-cliente-2026-09): a cor agora vem cadastrada
 * no banco (`employee.color`, escolhida no cadastro — ver EmployeeForm). O
 * hash por id da paleta fixa vira só um fallback, usado quando a cor ainda
 * não está disponível no objeto em mãos (ex.: id solto vindo de uma relação
 * que ainda não embute a cor).
 */
export function getEmployeeColor(employee: { id: string; color?: string | null }): string {
  if (employee.color) return employee.color

  let hash = 0
  for (let i = 0; i < employee.id.length; i++) {
    hash += employee.id.charCodeAt(i)
  }
  return EMPLOYEE_COLOR_PALETTE[hash % EMPLOYEE_COLOR_PALETTE.length]
}

/**
 * Resolve a cor de um funcionário só pelo id, usando um índice id→cor real
 * (ver `buildEmployeeColorIndex` em schedule.viewmodel.ts) e caindo pro hash
 * determinístico de `getEmployeeColor` quando o id não está no índice.
 */
export function resolveEmployeeColor(id: string, colorIndex: Map<string, string>): string {
  return colorIndex.get(id) ?? getEmployeeColor({ id })
}
