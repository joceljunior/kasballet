import { slugifyCategoryCode } from './financialCategories.js'

/** Categorias padrão — seed inicial no Back4App. */
export const DEFAULT_ITEM_CATEGORIES = [
  {
    code: 'roupas',
    label: 'Roupas',
    attributeFields: [
      { key: 'tamanho', label: 'Tamanho', type: 'alphanumeric', options: ['PP', 'P', 'M', 'G', 'GG', 'XG'] }
    ],
    sortOrder: 1
  },
  {
    code: 'calcados',
    label: 'Calçados',
    attributeFields: [
      { key: 'tamanho', label: 'Tamanho', type: 'numeric', options: ['28', '30', '32', '34', '35', '36', '37', '38', '39', '40'] }
    ],
    sortOrder: 2
  },
  {
    code: 'acessorios',
    label: 'Acessórios',
    attributeFields: [],
    sortOrder: 3
  }
]

export { slugifyCategoryCode }

export function isItemCategoryActive(category) {
  return category?.get('active') !== false
}

export function normalizeAttributeFields(fields) {
  if (!Array.isArray(fields)) return []
  return fields
    .map((field) => {
      const label = String(field?.label || '').trim()
      if (!label) return null
      const key = field.key ? String(field.key).trim() : slugifyCategoryCode(label)
      if (!key) return null
      const type = ['alphanumeric', 'numeric', 'text'].includes(field.type) ? field.type : 'text'
      const options = Array.isArray(field.options)
        ? field.options.map((o) => String(o).trim()).filter(Boolean)
        : String(field.options || '')
            .split(',')
            .map((o) => o.trim())
            .filter(Boolean)
      return { key, label, type, options }
    })
    .filter(Boolean)
}

export function categoryToOption(category) {
  return {
    value: category.get('code'),
    label: category.get('label'),
    attributeFields: normalizeAttributeFields(category.get('attributeFields'))
  }
}

export function getCategoryOptions(categories, { activeOnly = true } = {}) {
  return categories
    .filter((c) => !activeOnly || isItemCategoryActive(c))
    .sort((a, b) => (a.get('sortOrder') || 0) - (b.get('sortOrder') || 0) || String(a.get('label')).localeCompare(String(b.get('label'))))
    .map(categoryToOption)
}

export function findCategoryByCode(categories, code) {
  if (!code) return null
  return categories.find((c) => c.get('code') === code) || null
}

export function getCategoryLabel(categories, code) {
  const cat = findCategoryByCode(categories, code)
  return cat?.get('label') || code || '—'
}

export function getProductGroupKey(product) {
  const category = product.get('categoryCode') || product.get('category') || ''
  const name = String(product.get('name') || '').trim().toLowerCase()
  return `${category}::${name}`
}

export function matchesProductCategory(product, categoryCode, categoryLabel = null) {
  const code = String(product.get('categoryCode') || '').trim()
  const legacy = String(product.get('category') || '').trim()
  const targets = [...new Set([categoryCode, categoryLabel]
    .filter(Boolean)
    .map((v) => String(v).trim().toLowerCase()))]
  if (targets.length === 0) return true
  const values = [code, legacy].filter(Boolean).map((v) => v.toLowerCase())
  return values.some((v) => targets.includes(v))
}

export function groupProducts(products) {
  const map = new Map()
  for (const product of products) {
    const key = getProductGroupKey(product)
    if (!map.has(key)) {
      map.set(key, {
        key,
        name: product.get('name'),
        categoryCode: product.get('categoryCode') || product.get('category') || '',
        products: [],
        totalStock: 0,
        minPrice: Infinity,
        maxPrice: -Infinity,
        photo: null,
        hasInactive: false,
        variantCount: 0
      })
    }
    const group = map.get(key)
    group.products.push(product)
    group.variantCount += 1
    group.totalStock += Number(product.get('stockQuantity')) || 0
    const price = Number(product.get('price')) || 0
    if (price < group.minPrice) group.minPrice = price
    if (price > group.maxPrice) group.maxPrice = price
    if (!group.photo) {
      const photo = product.get('photo')
      if (photo?.url?.()) group.photo = photo
    }
    if (product.get('active') === false) group.hasInactive = true
  }
  return Array.from(map.values())
    .map((g) => ({
      ...g,
      minPrice: g.minPrice === Infinity ? 0 : g.minPrice,
      maxPrice: g.maxPrice === -Infinity ? 0 : g.maxPrice
    }))
    .sort((a, b) => String(a.name).localeCompare(String(b.name)))
}

export function formatProductAttributes(product, category = null) {
  const attrs = product.get('attributes') || {}
  const fields = category ? normalizeAttributeFields(category.get('attributeFields')) : []
  if (fields.length === 0) {
    const entries = Object.entries(attrs).filter(([, v]) => v != null && String(v).trim())
    return entries.map(([k, v]) => `${k}: ${v}`).join(', ')
  }
  return fields
    .map((f) => {
      const val = attrs[f.key]
      if (val == null || !String(val).trim()) return null
      return `${f.label}: ${val}`
    })
    .filter(Boolean)
    .join(', ')
}

export function formatProductDisplayName(product, category = null) {
  const name = product.get('name') || ''
  const attrsText = formatProductAttributes(product, category)
  return attrsText ? `${name} (${attrsText})` : name
}

export function validateAttributeValue(type, value) {
  const str = String(value ?? '').trim()
  if (!str) return { valid: true, value: '' }
  if (type === 'numeric') {
    if (!/^\d+([.,]\d+)?$/.test(str)) {
      return { valid: false, message: 'Informe um valor numérico (ex: 32, 48).' }
    }
    return { valid: true, value: str.replace(',', '.') }
  }
  return { valid: true, value: str }
}
