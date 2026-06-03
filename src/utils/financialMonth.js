/** YYYY-MM do mês atual (calendário local). */
export function currentMonthKey(date = new Date()) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}`
}

/** Mês anterior em YYYY-MM. */
export function previousMonthKey(monthKey) {
  const [y, m] = monthKey.split('-').map(Number)
  const d = new Date(y, m - 2, 1)
  return currentMonthKey(d)
}

/** Nome do mês em português, ex.: "junho de 2026". */
export function formatMonthLabel(monthKey) {
  const [y, m] = monthKey.split('-').map(Number)
  if (!y || !m) return monthKey
  const label = new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function formatMoney(v) {
  const n = Number(v)
  return isNaN(n) ? '0,00' : n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

/** Variação de B em relação a A (B - A). */
export function monthVariation(valueA, valueB) {
  const a = Number(valueA) || 0
  const b = Number(valueB) || 0
  const delta = b - a
  let percent = 0
  if (a === 0) {
    percent = b === 0 ? 0 : 100
  } else {
    percent = (delta / Math.abs(a)) * 100
  }
  return { delta, percent }
}
