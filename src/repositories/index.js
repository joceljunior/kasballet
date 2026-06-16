import Parse from 'parse'
import { BaseRepository } from './base/BaseRepository.js'
import { parseFilterDateFrom, parseFilterDateTo } from '../utils/date.js'

export class StudentRepository extends BaseRepository {
  constructor() {
    super('Student')
  }

  /**
   * Find pending students (active: false AND inactive: false ou undefined)
   * Alunos pendentes são aqueles que ainda não foram aprovados nem inativados
   */
  async findPending(limit = 30, skip = 0) {
    try {
      // Buscar todos os alunos com active: false
      const query = new Parse.Query(this.ParseObject)
      query.equalTo('active', false)
      query.limit(10000) // Buscar todos para filtrar
      const students = await query.find()
      
      // Filtrar no código: apenas os que não têm inactive: true
      const pending = students.filter(s => {
        const inactive = s.get('inactive')
        return inactive !== true
      })
      
      // Ordenar por nome
      pending.sort((a, b) => {
        const nameA = a.get('name') || ''
        const nameB = b.get('name') || ''
        return nameA.localeCompare(nameB)
      })
      
      // Aplicar paginação
      return pending.slice(skip, skip + limit)
    } catch (error) {
      console.error('Error finding pending students:', error)
      return []
    }
  }

  /**
   * Count all students (ativos e inativos)
   */
  async countAll() {
    return this.count({})
  }

  /**
   * Count only active students (active: true)
   */
  async countActiveStudents() {
    return this.count({ active: true })
  }

  /**
   * Count pending students (active: false AND inactive: false ou undefined)
   * Busca alunos onde active é false e inactive não é true
   */
  async countPending() {
    try {
      // Buscar todos os alunos com active: false
      const query = new Parse.Query(this.ParseObject)
      query.equalTo('active', false)
      query.limit(10000) // Buscar todos para filtrar
      const students = await query.find()
      
      // Filtrar no código: contar apenas os que não têm inactive: true
      const pending = students.filter(s => {
        const inactive = s.get('inactive')
        return inactive !== true
      })
      
      return pending.length
    } catch (error) {
      console.error('Error counting pending students:', error)
      // Fallback: retornar 0 se houver erro
      return 0
    }
  }

  /**
   * Find students (com filtros opcionais, incluindo active)
   * Se filters.active não for especificado, retorna todos (ativos e inativos)
   * Se filters.pending for true, busca apenas pendentes
   * Se filters.inactive for true, busca apenas inativos
   */
  async findActive(limit = 30, skip = 0, filters = {}) {
    // Se filtro de pendentes, usar lógica específica
    if (filters.pending) {
      return this.findPending(limit, skip)
    }
    
    // Se filtro de inativos
    if (filters.inactive) {
      const query = new Parse.Query(this.ParseObject)
      query.equalTo('active', false)
      query.equalTo('inactive', true)
      query.ascending('name')
      query.limit(limit)
      query.skip(skip)
      return query.find()
    }
    
    // Aplicar filtros normais apenas se especificados
    const query = new Parse.Query(this.ParseObject)
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '' && key !== 'pending' && key !== 'inactive') {
        query.equalTo(key, filters[key])
      }
    })
    
    query.ascending('name')
    query.limit(limit)
    query.skip(skip)
    return query.find()
  }

  /**
   * Conta alunos com os mesmos filtros de findActive.
   */
  async countWithFilters(filters = {}) {
    if (filters.pending) {
      return this.countPending()
    }

    if (filters.inactive) {
      const query = new Parse.Query(this.ParseObject)
      query.equalTo('active', false)
      query.equalTo('inactive', true)
      return query.count()
    }

    const query = new Parse.Query(this.ParseObject)
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '' && key !== 'pending' && key !== 'inactive') {
        query.equalTo(key, filters[key])
      }
    })
    return query.count()
  }

  _applySearchFilters(query, filters = {}) {
    if (filters.inactive) {
      query.equalTo('active', false)
      query.equalTo('inactive', true)
    }
    Object.keys(filters).forEach((key) => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '' && key !== 'pending' && key !== 'inactive') {
        query.equalTo(key, filters[key])
      }
    })
  }

  _dedupeStudentsById(results) {
    const uniqueResults = []
    const seenIds = new Set()
    for (const result of results) {
      if (!seenIds.has(result.id)) {
        seenIds.add(result.id)
        uniqueResults.push(result)
      }
    }
    uniqueResults.sort((a, b) => {
      const nameA = a.get('name') || ''
      const nameB = b.get('name') || ''
      return nameA.localeCompare(nameB, 'pt-BR')
    })
    return uniqueResults
  }

  /**
   * Busca todos os alunos que correspondem ao termo (nome ou CPF), sem paginar.
   */
  async searchAll(query, filters = {}) {
    const nameQuery = new Parse.Query(this.ParseObject)
    nameQuery.matches('name', new RegExp(query, 'i'))
    this._applySearchFilters(nameQuery, filters)

    const cpfQuery = new Parse.Query(this.ParseObject)
    cpfQuery.equalTo('cpf', query)
    this._applySearchFilters(cpfQuery, filters)

    const [nameResults, cpfResults] = await Promise.all([
      nameQuery.ascending('name').limit(10000).find(),
      cpfQuery.ascending('name').limit(10000).find()
    ])

    return this._dedupeStudentsById([...nameResults, ...cpfResults])
  }

  /**
   * Search students by name or CPF
   * Aceita filtros opcionais (ex: active)
   * Busca case-insensitive usando regex para nome
   * Nota: filtro 'pending' é tratado no serviço, não aqui
   */
  async search(query, limit = 30, skip = 0, filters = {}) {
    const allResults = await this.searchAll(query, filters)
    return allResults.slice(skip, skip + limit)
  }

  /**
   * Find students by ids (para montar mapa em listagens, ex. detalhe de chamada)
   */
  async findByIds(ids) {
    if (!ids || !ids.length) return []
    const query = new Parse.Query(this.ParseObject)
    query.containedIn('objectId', ids)
    return query.find()
  }
}

/**
 * Tabela de vínculo aluno–turma (N:N). Uma aluna pode estar em várias turmas.
 * Usa studentId e crewId como strings (não Pointers).
 */
export class StudentCrewRepository {
  /**
   * Busca vínculos para os alunos e retorna mapa studentId -> Crew[]
   */
  async findByStudents(students) {
    if (!students?.length) return {}
    const ids = students.map((s) => s.id || s.objectId).filter(Boolean)
    if (!ids.length) return {}

    try {
      const q = new Parse.Query('StudentCrews')
      q.containedIn('studentId', ids)
      q.limit(5000)
      const rows = await q.find()

      // Coletar todos os crewIds únicos
      const crewIds = [...new Set(rows.map((r) => r.get('crewId')).filter(Boolean))]
      if (crewIds.length === 0) return {}

      // Buscar os Crews
      const Crew = Parse.Object.extend('Crew')
      const crewQuery = new Parse.Query(Crew)
      crewQuery.containedIn('objectId', crewIds)
      const crews = await crewQuery.find()
      const crewMap = {}
      for (const crew of crews) {
        crewMap[crew.id] = crew
      }

      // Construir mapa studentId -> Crew[]
      const map = {}
      for (const row of rows) {
        const sid = row.get('studentId')
        const cid = row.get('crewId')
        if (sid && cid && crewMap[cid]) {
          if (!map[sid]) map[sid] = []
          map[sid].push(crewMap[cid])
        }
      }
      return map
    } catch (error) {
      console.error('Error in findByStudents:', error)
      return {}
    }
  }

  /**
   * Substitui as turmas do aluno: remove vínculos atuais e cria os novos.
   */
  async setForStudent(studentId, crewIds) {
    const q = new Parse.Query('StudentCrews')
    q.equalTo('studentId', studentId)
    const toDestroy = await q.find()
    if (toDestroy.length) await Parse.Object.destroyAll(toDestroy)

    // Criar novos vínculos usando strings
    for (const cid of crewIds || []) {
      const sc = new Parse.Object('StudentCrews')
      sc.set('studentId', studentId)
      sc.set('crewId', cid)
      await sc.save()
    }
  }

  /**
   * Conta alunos ativos por turma para múltiplas turmas.
   * Retorna mapa crewId -> count (number)
   */
  async countStudentsByCrews(crewIds) {
    if (!crewIds?.length) return {}
    try {
      const q = new Parse.Query('StudentCrews')
      q.containedIn('crewId', crewIds)
      q.limit(10000)
      const rows = await q.find()

      // Coletar todos os studentIds únicos
      const allStudentIds = [...new Set(rows.map(r => r.get('studentId')).filter(Boolean))]
      if (allStudentIds.length === 0) return {}

      // Buscar apenas alunos ativos
      const Student = Parse.Object.extend('Student')
      const studentQuery = new Parse.Query(Student)
      studentQuery.containedIn('objectId', allStudentIds)
      studentQuery.equalTo('active', true)
      studentQuery.limit(10000)
      const activeStudents = await studentQuery.find()
      const activeIds = new Set(activeStudents.map(s => s.id))

      // Montar mapa crewId -> count (apenas alunos ativos)
      const countMap = {}
      for (const row of rows) {
        const cid = row.get('crewId')
        const sid = row.get('studentId')
        if (cid && sid && activeIds.has(sid)) {
          countMap[cid] = (countMap[cid] || 0) + 1
        }
      }
      return countMap
    } catch (error) {
      console.error('Error in countStudentsByCrews:', error)
      return {}
    }
  }

  /**
   * Busca alunos vinculados a uma turma específica.
   * Retorna apenas alunos ativos (active: true).
   */
  async findByCrew(crewId) {
    if (!crewId) return []
    try {
      const q = new Parse.Query('StudentCrews')
      q.equalTo('crewId', crewId)
      q.limit(5000)
      const rows = await q.find()

      // Coletar todos os studentIds únicos
      const studentIds = [...new Set(rows.map((r) => r.get('studentId')).filter(Boolean))]
      if (studentIds.length === 0) return []

      // Buscar os Students (apenas ativos)
      const Student = Parse.Object.extend('Student')
      const studentQuery = new Parse.Query(Student)
      studentQuery.containedIn('objectId', studentIds)
      studentQuery.equalTo('active', true) // Filtrar apenas alunos ativos
      studentQuery.ascending('name')
      const students = await studentQuery.find()
      return students
    } catch (error) {
      console.error('Error in findByCrew:', error)
      return []
    }
  }
}

export class CrewRepository extends BaseRepository {
  constructor() {
    super('Crew')
  }

  /**
   * Find crews com filtro opcional: active (true=ativas, false=inativas, undefined=todos)
   */
  async findActive(limit = 50, skip = 0, filters = {}) {
    const query = this._buildCrewsQuery(filters)
    query.ascending('Name')
    query.limit(limit)
    query.skip(skip)
    return query.find()
  }

  _buildCrewsQuery(filters = {}) {
    const query = new Parse.Query(this.ParseObject)
    if (filters.active === true) {
      query.equalTo('Active', true)
    } else if (filters.active === false) {
      query.equalTo('Active', false)
    }
    return query
  }

  async countWithFilters(filters = {}) {
    return this._buildCrewsQuery(filters).count()
  }

  /**
   * Count active crews
   */
  async countActive() {
    return this.count({ Active: true })
  }

  /**
   * Find crews by teacher ID (Crew.teacherId = _User id). Uma turma tem 1 professora.
   * filters.active: true=ativas, false=inativas, undefined=todas
   */
  async findByTeacher(teacherId, limit = 50, skip = 0, filters = {}) {
    const query = this._buildTeacherQuery(teacherId, filters)
    query.ascending('Name')
    query.limit(limit)
    query.skip(skip)
    return query.find()
  }

  _buildTeacherQuery(teacherId, filters = {}) {
    const query = new Parse.Query(this.ParseObject)
    query.equalTo('teacherId', teacherId)
    if (filters.active === true) query.equalTo('Active', true)
    else if (filters.active === false) query.equalTo('Active', false)
    return query
  }

  async countByTeacher(teacherId, filters = {}) {
    return this._buildTeacherQuery(teacherId, filters).count()
  }
}

export class RegisterRepository extends BaseRepository {
  constructor() {
    super('Register')
  }

  /**
   * Find registers com filtros (crewId, opcional data início/fim) e ordem por dateregister desc.
   * studentRegisters: Array<{ studentId, present }>
   */
  async findRegisters(limit = 50, skip = 0, filters = {}) {
    const query = this._buildRegistersQuery(filters)
    query.descending('dateregister')
    query.limit(limit)
    query.skip(skip)
    return query.find()
  }

  _buildRegistersQuery(filters = {}) {
    const query = new Parse.Query(this.ParseObject)
    if (filters.crewId != null && filters.crewId !== '') {
      query.equalTo('crewId', filters.crewId)
    } else if (filters.crewIds && filters.crewIds.length > 0) {
      query.containedIn('crewId', filters.crewIds)
    }
    if (filters.dateFrom != null) {
      const d = parseFilterDateFrom(filters.dateFrom)
      if (d && !isNaN(d.getTime())) query.greaterThanOrEqualTo('dateregister', d)
    }
    if (filters.dateTo != null) {
      const d = parseFilterDateTo(filters.dateTo)
      if (d && !isNaN(d.getTime())) query.lessThanOrEqualTo('dateregister', d)
    }
    return query
  }

  async countRegisters(filters = {}) {
    return this._buildRegistersQuery(filters).count()
  }

  /**
   * Find registers by crew ID (alias para findRegisters com filtro crewId)
   */
  async findByCrew(crewId, limit = 30, skip = 0) {
    return this.findRegisters(limit, skip, { crewId })
  }

  /**
   * Find registers by date range
   */
  async findByDateRange(startDate, endDate, limit = 30, skip = 0) {
    return this.findRegisters(limit, skip, { dateFrom: startDate, dateTo: endDate })
  }
}

export class FinancialCategoryRepository extends BaseRepository {
  constructor() {
    super('FinancialCategory')
  }

  async findCategories(limit = 200, skip = 0, filters = {}) {
    const query = new Parse.Query(this.ParseObject)
    if (filters.type) query.equalTo('type', filters.type)
    if (filters.active === true) query.equalTo('active', true)
    else if (filters.active === false) query.equalTo('active', false)
    query.ascending('sortOrder')
    query.addAscending('label')
    query.limit(limit)
    query.skip(skip)
    return query.find()
  }

  async findByCode(code, type = null) {
    const query = new Parse.Query(this.ParseObject)
    query.equalTo('code', code)
    if (type) query.equalTo('type', type)
    return query.first()
  }

  async findBySystemBehavior(behavior) {
    const query = new Parse.Query(this.ParseObject)
    query.equalTo('systemBehavior', behavior)
    query.equalTo('active', true)
    return query.first()
  }

  async countAll() {
    const query = new Parse.Query(this.ParseObject)
    return query.count()
  }
}

export class FinancialEntryRepository extends BaseRepository {
  constructor() {
    super('FinancialEntry')
  }

  /**
   * Monta query com os filtros de lançamentos (reutilizado em find/count).
   */
  _buildEntriesQuery(filters = {}) {
    const query = new Parse.Query(this.ParseObject)
    if (filters.type) query.equalTo('type', filters.type)
    if (filters.subtype) query.equalTo('subtype', filters.subtype)
    if (filters.status) query.equalTo('status', filters.status)
    if (filters.studentId) query.equalTo('studentId', filters.studentId)
    if (filters.teacherId) query.equalTo('teacherId', filters.teacherId)
    if (filters.dateFrom != null) {
      const d = parseFilterDateFrom(filters.dateFrom)
      if (d && !isNaN(d.getTime())) query.greaterThanOrEqualTo('date', d)
    }
    if (filters.dateTo != null) {
      const d = parseFilterDateTo(filters.dateTo)
      if (d && !isNaN(d.getTime())) query.lessThanOrEqualTo('date', d)
    }
    if (filters.dateReferenceFrom != null) {
      const d = parseFilterDateFrom(filters.dateReferenceFrom)
      if (d && !isNaN(d.getTime())) query.greaterThanOrEqualTo('dateReference', d)
    }
    if (filters.dateReferenceTo != null) {
      const d = parseFilterDateTo(filters.dateReferenceTo)
      if (d && !isNaN(d.getTime())) query.lessThanOrEqualTo('dateReference', d)
    }
    return query
  }

  /**
   * Find entries com filtros: type, subtype, status, dateFrom, dateTo, studentId, teacherId. Ordem: date desc.
   * status: "pendente" | "efetivado" (opcional)
   */
  async findEntries(limit = 100, skip = 0, filters = {}) {
    const query = this._buildEntriesQuery(filters)
    query.addDescending('date')
    query.addDescending('createdAt')
    query.limit(limit)
    query.skip(skip)
    return query.find()
  }

  /**
   * Conta lançamentos com os mesmos filtros da listagem.
   */
  async countEntries(filters = {}) {
    const query = this._buildEntriesQuery(filters)
    return query.count()
  }

  /**
   * Histórico de lançamentos de um aluno (todas as entradas vinculadas: mensalidade, rematrícula, taxa, figurino)
   */
  async findByStudent(studentId, limit = 100, skip = 0) {
    // Retornar apenas lançamentos efetivos para o histórico da aluna
    return this.findEntries(limit, skip, { type: 'entrada', studentId, status: 'efetivado' })
  }

  /**
   * Histórico de pagamentos a uma professora (saida, pagamento, teacherId)
   */
  async findByTeacher(teacherId, limit = 100, skip = 0) {
    return this.findEntries(limit, skip, { type: 'saida', teacherId })
  }

  /**
   * Soma dos valores por type. filters: dateFrom, dateTo, dateReferenceFrom, dateReferenceTo, subtype, studentId, teacherId.
   * effectiveOnly: true = só status 'efetivado' ou vazio (saldo efetivo); false/omitido = todos (saldo projetado).
   */
  async sumByType(type, filters = {}) {
    const { effectiveOnly, ...rest } = filters
    const query = new Parse.Query(this.ParseObject)
    query.equalTo('type', type)
    if (rest.subtype) query.equalTo('subtype', rest.subtype)
    if (rest.studentId) query.equalTo('studentId', rest.studentId)
    if (rest.teacherId) query.equalTo('teacherId', rest.teacherId)
    if (rest.dateFrom != null) {
      const d = parseFilterDateFrom(rest.dateFrom)
      if (d && !isNaN(d.getTime())) query.greaterThanOrEqualTo('date', d)
    }
    if (rest.dateTo != null) {
      const d = parseFilterDateTo(rest.dateTo)
      if (d && !isNaN(d.getTime())) query.lessThanOrEqualTo('date', d)
    }
    if (rest.dateReferenceFrom != null) {
      const d = parseFilterDateFrom(rest.dateReferenceFrom)
      if (d && !isNaN(d.getTime())) query.greaterThanOrEqualTo('dateReference', d)
    }
    if (rest.dateReferenceTo != null) {
      const d = parseFilterDateTo(rest.dateReferenceTo)
      if (d && !isNaN(d.getTime())) query.lessThanOrEqualTo('dateReference', d)
    }
    const list = await query.limit(10000).find()
    const toSum = effectiveOnly === true
      ? list.filter((o) => { const s = o.get('status'); return s === 'efetivado' || s === null || s === undefined || s === '' })
      : list
    return toSum.reduce((s, o) => s + (Number(o.get('value')) || 0), 0)
  }

  /**
   * Soma valores agrupados por subtype para um type.
   * Retorna mapa subtype -> total.
   */
  async sumGroupedBySubtype(type, filters = {}) {
    const { effectiveOnly, ...rest } = filters
    const query = this._buildEntriesQuery({ ...rest, type })
    const list = await query.limit(10000).find()
    const toSum = effectiveOnly === true
      ? list.filter((o) => { const s = o.get('status'); return s === 'efetivado' || s === null || s === undefined || s === '' })
      : list
    const map = {}
    for (const o of toSum) {
      const subtype = o.get('subtype') || 'outros'
      map[subtype] = (map[subtype] || 0) + (Number(o.get('value')) || 0)
    }
    return map
  }
}

export class PaymentRepository extends BaseRepository {
  constructor() {
    super('Payment')
  }

  /**
   * Find payments by student ID
   */
  async findByStudent(studentId, limit = 30, skip = 0) {
    const query = new Parse.Query(this.ParseObject)
    query.equalTo('studentId', studentId)
    query.limit(limit)
    query.skip(skip)
    query.descending('ano', 'mes')
    
    return query.find()
  }

  /**
   * Find payments by month and year
   */
  async findByMonthYear(month, year, limit = 100, skip = 0) {
    return this.findAll(limit, skip, { mes: month, ano: year })
  }
}

export class UserRepository extends BaseRepository {
  constructor() {
    super('_User')
  }

  /**
   * Find users by role
   */
  async findByRole(role, limit = 50, skip = 0) {
    return this.findAll(limit, skip, { Role: role })
  }

  /**
   * Find _User by id (usa Parse.User)
   */
  async findUserById(id) {
    const q = new Parse.Query(Parse.User)
    return q.get(id)
  }

  /**
   * Find users by ids (para montar mapa userId -> username em listagens)
   */
  async findByIds(ids) {
    if (!ids || !ids.length) return []
    const q = new Parse.Query(Parse.User)
    q.containedIn('objectId', ids)
    return q.find()
  }

  /**
   * Login user
   */
  async login(username, password) {
    try {
      // O Parse SDK gerencia o InstallationController automaticamente
      // Em produção, o Parse pode precisar criar o controller na primeira operação
      return await Parse.User.logIn(username, password)
    } catch (error) {
      // Se houver erro relacionado ao InstallationController, tentar novamente
      // após garantir que o Parse está totalmente inicializado
      if (error.message && error.message.includes('currentInstallationId')) {
        console.warn('Parse InstallationController error, retrying login...')
        // Aguardar um pouco para o Parse inicializar o controller
        await new Promise(resolve => setTimeout(resolve, 100))
        return await Parse.User.logIn(username, password)
      }
      throw error
    }
  }

  /**
   * Logout current user
   */
  async logout() {
    return Parse.User.logOut()
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return Parse.User.current()
  }
}

export class ItemCategoryRepository extends BaseRepository {
  constructor() {
    super('ItemCategory')
  }

  async create(data) {
    const object = new this.ParseObject()
    Object.keys(data).forEach((key) => {
      if (data[key] !== undefined && data[key] !== null) {
        object.set(key, data[key])
      }
    })
    const user = Parse.User.current()
    if (user) {
      const acl = new Parse.ACL(user)
      acl.setPublicReadAccess(true)
      object.setACL(acl)
    }
    return object.save()
  }

  async findCategories(limit = 200, skip = 0, filters = {}) {
    const query = new Parse.Query(this.ParseObject)
    if (filters.active === true) query.equalTo('active', true)
    else if (filters.active === false) query.equalTo('active', false)
    query.ascending('sortOrder')
    query.addAscending('label')
    query.limit(limit)
    query.skip(skip)
    return query.find()
  }

  async findByCode(code) {
    const query = new Parse.Query(this.ParseObject)
    query.equalTo('code', code)
    return query.first()
  }

  async countAll() {
    const query = new Parse.Query(this.ParseObject)
    return query.count()
  }
}

export class ProductRepository extends BaseRepository {
  constructor() {
    super('Product')
  }

  _applyProductFilters(query, filters = {}) {
    if (filters.active === true) query.equalTo('active', true)
    else if (filters.active === false) query.equalTo('active', false)
    if (filters.lowStock === true) {
      query.lessThanOrEqualTo('stockQuantity', 5)
    }
    return query
  }

  /**
   * Lista produtos com filtros opcionais (active, category/categoryCode). Ordem: name asc.
   */
  async findProducts(limit = 100, skip = 0, filters = {}) {
    let query = new Parse.Query(this.ParseObject)
    this._applyProductFilters(query, filters)
    if (filters.category) {
      const byCode = new Parse.Query(this.ParseObject)
      this._applyProductFilters(byCode, filters)
      byCode.equalTo('categoryCode', filters.category)
      const byLegacy = new Parse.Query(this.ParseObject)
      this._applyProductFilters(byLegacy, filters)
      byLegacy.equalTo('category', filters.category)
      query = Parse.Query.or(byCode, byLegacy)
    }
    query.ascending('name')
    query.limit(limit)
    query.skip(skip)
    return query.find()
  }

  async searchByName(term, limit = 50, skip = 0, filters = {}) {
    const query = new Parse.Query(this.ParseObject)
    query.matches('name', new RegExp(term, 'i'))
    this._applyProductFilters(query, filters)
    query.ascending('name')
    query.limit(limit)
    query.skip(skip)
    return query.find()
  }

  async findByName(name, limit = 200) {
    const trimmed = String(name || '').trim()
    if (!trimmed) return []
    const query = new Parse.Query(this.ParseObject)
    query.equalTo('name', trimmed)
    query.ascending('name')
    query.limit(limit)
    return query.find()
  }

  async countProducts(filters = {}) {
    let query = new Parse.Query(this.ParseObject)
    this._applyProductFilters(query, filters)
    if (filters.category) {
      try {
        const byCode = new Parse.Query(this.ParseObject)
        this._applyProductFilters(byCode, filters)
        byCode.equalTo('categoryCode', filters.category)
        const byLegacy = new Parse.Query(this.ParseObject)
        this._applyProductFilters(byLegacy, filters)
        byLegacy.equalTo('category', filters.category)
        query = Parse.Query.or(byCode, byLegacy)
      } catch (_) {
        query = new Parse.Query(this.ParseObject)
        this._applyProductFilters(query, filters)
        query.equalTo('category', filters.category)
      }
    }
    return query.count()
  }

  async hasProductsInCategory(categoryCode, categoryLabel) {
    async function hasMatch(field, value) {
      if (!value) return false
      try {
        const query = new Parse.Query(this.ParseObject)
        query.equalTo(field, value)
        return (await query.limit(1).count()) > 0
      } catch (_) {
        return false
      }
    }

    if (categoryCode) {
      if (await hasMatch.call(this, 'categoryCode', categoryCode)) return true
      if (await hasMatch.call(this, 'category', categoryCode)) return true
    }
    if (categoryLabel && categoryLabel !== categoryCode) {
      if (await hasMatch.call(this, 'category', categoryLabel)) return true
    }
    return false
  }
}

export class SaleRepository extends BaseRepository {
  constructor() {
    super('Sale')
  }

  /**
   * Lista vendas com filtros: dateFrom, dateTo, studentId. Ordem: date desc.
   */
  async findSales(limit = 100, skip = 0, filters = {}) {
    const query = new Parse.Query(this.ParseObject)
    if (filters.studentId) query.equalTo('studentId', filters.studentId)
    if (filters.dateFrom != null) {
      const d = parseFilterDateFrom(filters.dateFrom)
      if (d && !isNaN(d.getTime())) query.greaterThanOrEqualTo('date', d)
    }
    if (filters.dateTo != null) {
      const d = parseFilterDateTo(filters.dateTo)
      if (d && !isNaN(d.getTime())) query.lessThanOrEqualTo('date', d)
    }
    query.addDescending('date')
    query.addDescending('createdAt')
    query.limit(limit)
    query.skip(skip)
    return query.find()
  }
}

// Export all repositories
export const studentRepository = new StudentRepository()
export const studentCrewRepository = new StudentCrewRepository()
export const crewRepository = new CrewRepository()
export const registerRepository = new RegisterRepository()
export const financialCategoryRepository = new FinancialCategoryRepository()
export const financialEntryRepository = new FinancialEntryRepository()
export const paymentRepository = new PaymentRepository()
export const userRepository = new UserRepository()
export const itemCategoryRepository = new ItemCategoryRepository()
export const productRepository = new ProductRepository()
export const saleRepository = new SaleRepository()
