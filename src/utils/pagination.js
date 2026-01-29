/**
 * Pagination utilities
 */

/**
 * Calculate skip value from page number
 * @param {number} page - Page number (0-indexed)
 * @param {number} pageSize - Items per page
 * @returns {number} Skip value
 */
export function calculateSkip(page, pageSize) {
  return page * pageSize
}

/**
 * Check if there are more pages
 * @param {number} currentCount - Current number of items loaded
 * @param {number} pageSize - Items per page
 * @returns {boolean} True if there are more pages
 */
export function hasMorePages(currentCount, pageSize) {
  return currentCount >= pageSize
}

/**
 * Format date for display
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date string
 */
export function formatDate(date) {
  if (!date) return ''
  const d = new Date(date)
  return d.toLocaleDateString('pt-BR')
}

/**
 * Format currency
 * @param {number} value - Value to format
 * @returns {string} Formatted currency string
 */
export function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}
