/**
 * Datas de calendário no fuso local (Brasil).
 * `new Date('YYYY-MM-DD')` usa meia-noite UTC e desloca um dia ao exibir/salvar no BR.
 */

/**
 * Interpreta string YYYY-MM-DD (ex.: input type="date") como dia de calendário no fuso local.
 * @param {string|Date|null|undefined} value
 * @returns {Date|null}
 */
export function parseLocalDateInput(value) {
  if (value == null || value === '') return null
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value
  }
  const s = String(value).trim()
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s)
  if (m) {
    const y = Number(m[1])
    const month = Number(m[2]) - 1
    const day = Number(m[3])
    const d = new Date(y, month, day, 12, 0, 0, 0)
    return isNaN(d.getTime()) ? null : d
  }
  const d = new Date(s)
  return isNaN(d.getTime()) ? null : d
}

/** Valor para input type="date" (YYYY-MM-DD no calendário local). */
export function toYYYYMMDDLocal(date) {
  if (!date) return ''
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return ''
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${day}`
}

export function startOfLocalDay(value) {
  const d = parseLocalDateInput(value)
  if (!d) return null
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
}

export function endOfLocalDay(value) {
  const d = parseLocalDateInput(value)
  if (!d) return null
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
}

/**
 * Início do dia local para filtros (dateFrom).
 * @param {Date|string|null|undefined} value
 */
export function parseFilterDateFrom(value) {
  if (value == null || value === '') return null
  if (value instanceof Date && !isNaN(value.getTime())) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 0, 0, 0, 0)
  }
  const s = typeof value === 'string' ? value.trim() : String(value)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return startOfLocalDay(s)
  const d = new Date(value)
  if (isNaN(d.getTime())) return null
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
}

/**
 * Fim do dia local para filtros (dateTo inclusivo).
 * @param {Date|string|null|undefined} value
 */
export function parseFilterDateTo(value) {
  if (value == null || value === '') return null
  if (value instanceof Date && !isNaN(value.getTime())) {
    return new Date(value.getFullYear(), value.getMonth(), value.getDate(), 23, 59, 59, 999)
  }
  const s = typeof value === 'string' ? value.trim() : String(value)
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return endOfLocalDay(s)
  const d = new Date(value)
  if (isNaN(d.getTime())) return null
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
}

/**
 * String YYYY-MM-DD ou valor para gravar no Parse como Date no dia correto no Brasil.
 * @param {Date|string|null|undefined} value
 * @returns {Date|null}
 */
export function parseDateForStorage(value) {
  if (value == null || value === '') return null
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : value
  }
  if (typeof value === 'string') {
    const t = value.trim()
    if (/^\d{4}-\d{2}-\d{2}$/.test(t)) {
      return parseLocalDateInput(t)
    }
  }
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d
}

/** Exibição dd-mm-aa (padrão brasileiro, ano com 2 dígitos). */
export function formatDateBR(date) {
  if (!date) return ''
  const d = date instanceof Date ? date : new Date(date)
  if (isNaN(d.getTime())) return ''
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const yy = String(d.getFullYear()).slice(-2)
  return `${day}-${month}-${yy}`
}
