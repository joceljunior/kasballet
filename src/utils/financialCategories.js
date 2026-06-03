/** Categorias padrão — usadas para seed inicial no Back4App. */
export const DEFAULT_FINANCIAL_CATEGORIES = [
  { type: 'entrada', code: 'mensalidade', label: 'Mensalidade', requiresStudent: true, requiresTeacher: false, requiresDescription: false, systemBehavior: 'mensalidade', sortOrder: 1 },
  { type: 'entrada', code: 'pagamento_semestral', label: 'Pagamento Semestral', requiresStudent: true, requiresTeacher: false, requiresDescription: false, systemBehavior: 'pagamento_semestral', sortOrder: 2 },
  { type: 'entrada', code: 'pagamento_anual', label: 'Pagamento Anual', requiresStudent: true, requiresTeacher: false, requiresDescription: false, systemBehavior: 'pagamento_anual', sortOrder: 3 },
  { type: 'entrada', code: 'rematricula', label: 'Rematrícula', requiresStudent: true, requiresTeacher: false, requiresDescription: false, systemBehavior: null, sortOrder: 4 },
  { type: 'entrada', code: 'taxa_participacao', label: 'Taxa de Participação', requiresStudent: true, requiresTeacher: false, requiresDescription: false, systemBehavior: null, sortOrder: 5 },
  { type: 'entrada', code: 'figurino', label: 'Figurino', requiresStudent: true, requiresTeacher: false, requiresDescription: false, systemBehavior: null, sortOrder: 6 },
  { type: 'entrada', code: 'vendas', label: 'Vendas', requiresStudent: false, requiresTeacher: false, requiresDescription: true, systemBehavior: null, sortOrder: 7 },
  { type: 'entrada', code: 'outros', label: 'Outros', requiresStudent: false, requiresTeacher: false, requiresDescription: true, systemBehavior: null, sortOrder: 8 },
  { type: 'saida', code: 'pagamento', label: 'Pagamento', requiresStudent: false, requiresTeacher: true, requiresDescription: false, systemBehavior: 'pagamento_professora', sortOrder: 1 },
  { type: 'saida', code: 'contas', label: 'Contas', requiresStudent: false, requiresTeacher: false, requiresDescription: true, systemBehavior: null, sortOrder: 2 },
  { type: 'saida', code: 'compras', label: 'Compras', requiresStudent: false, requiresTeacher: false, requiresDescription: true, systemBehavior: null, sortOrder: 3 },
  { type: 'saida', code: 'impostos', label: 'Impostos', requiresStudent: false, requiresTeacher: false, requiresDescription: true, systemBehavior: null, sortOrder: 4 },
  { type: 'saida', code: 'outros', label: 'Outros', requiresStudent: false, requiresTeacher: false, requiresDescription: true, systemBehavior: null, sortOrder: 5 }
]

export function slugifyCategoryCode(label) {
  return String(label || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 50)
}

export function isCategoryActive(category) {
  return category?.get('active') !== false
}

export function categoryToOption(category) {
  return {
    value: category.get('code'),
    label: category.get('label'),
    type: category.get('type'),
    requiresStudent: !!category.get('requiresStudent'),
    requiresTeacher: !!category.get('requiresTeacher'),
    requiresDescription: !!category.get('requiresDescription'),
    systemBehavior: category.get('systemBehavior') || null
  }
}

export function getCategoriesForType(categories, type, { activeOnly = true } = {}) {
  return categories
    .filter((c) => c.get('type') === type && (!activeOnly || isCategoryActive(c)))
    .sort((a, b) => (a.get('sortOrder') || 0) - (b.get('sortOrder') || 0) || String(a.get('label')).localeCompare(String(b.get('label'))))
    .map(categoryToOption)
}

export function getFilterCategoryOptions(categories, type, { activeOnly = true } = {}) {
  if (type === 'entrada' || type === 'saida') {
    return getCategoriesForType(categories, type, { activeOnly })
  }
  const entrada = getCategoriesForType(categories, 'entrada', { activeOnly }).map((s) =>
    s.value === 'outros' ? { ...s, label: 'Outros (entrada)' } : s
  )
  const saida = getCategoriesForType(categories, 'saida', { activeOnly }).map((s) =>
    s.value === 'outros' ? { ...s, label: 'Outros (saída)' } : s
  )
  return [...entrada, ...saida]
}

export function findCategoryByCode(categories, type, code) {
  if (!code) return null
  const matches = categories.filter((c) => c.get('code') === code)
  if (type) return matches.find((c) => c.get('type') === type) || null
  return matches[0] || null
}

export function getCategoryLabel(categories, type, code) {
  const cat = findCategoryByCode(categories, type, code)
  if (cat) return cat.get('label')
  const any = findCategoryByCode(categories, null, code)
  return any?.get('label') || code || '—'
}

export function findCategoryByBehavior(categories, behavior) {
  return categories.find((c) => c.get('systemBehavior') === behavior && isCategoryActive(c)) || null
}

export function getBehaviorCode(categories, behavior) {
  return findCategoryByBehavior(categories, behavior)?.get('code') || null
}

export function isCategoryValidForType(categories, type, code) {
  if (!code) return true
  if (type === 'entrada' || type === 'saida') {
    return !!findCategoryByCode(categories, type, code)
  }
  return !!findCategoryByCode(categories, null, code)
}
