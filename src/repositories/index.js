import Parse from 'parse'
import { BaseRepository } from './base/BaseRepository.js'

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
   * Search students by name or CPF
   * Aceita filtros opcionais (ex: active)
   * Busca case-insensitive usando regex para nome
   * Nota: filtro 'pending' é tratado no serviço, não aqui
   */
  async search(query, limit = 30, skip = 0, filters = {}) {
    // Fazer duas buscas separadas e combinar resultados
    const nameQuery = new Parse.Query(this.ParseObject)
    nameQuery.matches('name', new RegExp(query, 'i'))
    
    // Aplicar filtros na query de nome (exceto 'pending' e 'inactive' que são tratados no serviço)
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '' && key !== 'pending' && key !== 'inactive') {
        nameQuery.equalTo(key, filters[key])
      }
    })
    
    const cpfQuery = new Parse.Query(this.ParseObject)
    cpfQuery.equalTo('cpf', query)
    
    // Aplicar filtros na query de CPF (exceto 'pending' e 'inactive' que são tratados no serviço)
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '' && key !== 'pending' && key !== 'inactive') {
        cpfQuery.equalTo(key, filters[key])
      }
    })
    
    // Executar ambas as buscas em paralelo
    const [nameResults, cpfResults] = await Promise.all([
      nameQuery.ascending('name').limit(limit).skip(skip).find(),
      cpfQuery.ascending('name').limit(limit).skip(skip).find()
    ])
    
    // Combinar resultados e remover duplicatas
    const allResults = [...nameResults, ...cpfResults]
    const uniqueResults = []
    const seenIds = new Set()
    
    for (const result of allResults) {
      if (!seenIds.has(result.id)) {
        seenIds.add(result.id)
        uniqueResults.push(result)
      }
    }
    
    // Ordenar por nome e limitar
    uniqueResults.sort((a, b) => {
      const nameA = a.get('name') || ''
      const nameB = b.get('name') || ''
      return nameA.localeCompare(nameB)
    })
    
    return uniqueResults.slice(0, limit)
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
    const query = new Parse.Query(this.ParseObject)
    if (filters.active === true) {
      query.equalTo('Active', true)
    } else if (filters.active === false) {
      query.equalTo('Active', false)
    }
    query.ascending('Name')
    query.limit(limit)
    query.skip(skip)
    return query.find()
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
    const query = new Parse.Query(this.ParseObject)
    query.equalTo('teacherId', teacherId)
    if (filters.active === true) query.equalTo('Active', true)
    else if (filters.active === false) query.equalTo('Active', false)
    query.ascending('Name')
    query.limit(limit)
    query.skip(skip)
    return query.find()
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
    const query = new Parse.Query(this.ParseObject)
    if (filters.crewId != null && filters.crewId !== '') {
      query.equalTo('crewId', filters.crewId)
    } else if (filters.crewIds && filters.crewIds.length > 0) {
      query.containedIn('crewId', filters.crewIds)
    }
    if (filters.dateFrom != null) {
      const d = filters.dateFrom instanceof Date ? filters.dateFrom : new Date(filters.dateFrom)
      if (!isNaN(d.getTime())) query.greaterThanOrEqualTo('dateregister', d)
    }
    if (filters.dateTo != null) {
      const d = filters.dateTo instanceof Date ? filters.dateTo : new Date(filters.dateTo)
      if (!isNaN(d.getTime())) query.lessThanOrEqualTo('dateregister', d)
    }
    query.descending('dateregister')
    query.limit(limit)
    query.skip(skip)
    return query.find()
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

export class FinancialEntryRepository extends BaseRepository {
  constructor() {
    super('FinancialEntry')
  }

  /**
   * Find entries com filtros: type, subtype, status, dateFrom, dateTo, studentId, teacherId. Ordem: date desc.
   * status: "pendente" | "efetivado" (opcional)
   */
  async findEntries(limit = 100, skip = 0, filters = {}) {
    const query = new Parse.Query(this.ParseObject)
    if (filters.type) query.equalTo('type', filters.type)
    if (filters.subtype) query.equalTo('subtype', filters.subtype)
    if (filters.status) query.equalTo('status', filters.status)
    if (filters.studentId) query.equalTo('studentId', filters.studentId)
    if (filters.teacherId) query.equalTo('teacherId', filters.teacherId)
    // Filtros por date (data do lançamento)
    if (filters.dateFrom != null) {
      const d = filters.dateFrom instanceof Date ? filters.dateFrom : new Date(filters.dateFrom)
      if (!isNaN(d.getTime())) query.greaterThanOrEqualTo('date', d)
    }
    if (filters.dateTo != null) {
      const d = filters.dateTo instanceof Date ? filters.dateTo : new Date(filters.dateTo)
      if (!isNaN(d.getTime())) query.lessThanOrEqualTo('date', d)
    }
    // Filtros por dateReference (mês de referência)
    if (filters.dateReferenceFrom != null) {
      const d = filters.dateReferenceFrom instanceof Date ? filters.dateReferenceFrom : new Date(filters.dateReferenceFrom)
      if (!isNaN(d.getTime())) query.greaterThanOrEqualTo('dateReference', d)
    }
    if (filters.dateReferenceTo != null) {
      const d = filters.dateReferenceTo instanceof Date ? filters.dateReferenceTo : new Date(filters.dateReferenceTo)
      if (!isNaN(d.getTime())) query.lessThanOrEqualTo('dateReference', d)
    }
    // Ordenar por date, com fallback para createdAt quando date é null
    query.addDescending('date')
    query.addDescending('createdAt')
    query.limit(limit)
    query.skip(skip)
    return query.find()
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
    return this.findEntries(limit, skip, { type: 'saida', subtype: 'pagamento', teacherId })
  }

  /**
   * Soma dos valores por type. filters: dateFrom, dateTo, subtype, studentId, teacherId.
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
      const d = rest.dateFrom instanceof Date ? rest.dateFrom : new Date(rest.dateFrom)
      if (!isNaN(d.getTime())) query.greaterThanOrEqualTo('date', d)
    }
    if (rest.dateTo != null) {
      const d = rest.dateTo instanceof Date ? rest.dateTo : new Date(rest.dateTo)
      if (!isNaN(d.getTime())) query.lessThanOrEqualTo('date', d)
    }
    const list = await query.limit(10000).find()
    const toSum = effectiveOnly === true
      ? list.filter((o) => { const s = o.get('status'); return s === 'efetivado' || s === null || s === undefined || s === '' })
      : list
    return toSum.reduce((s, o) => s + (Number(o.get('value')) || 0), 0)
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

// Export all repositories
export const studentRepository = new StudentRepository()
export const studentCrewRepository = new StudentCrewRepository()
export const crewRepository = new CrewRepository()
export const registerRepository = new RegisterRepository()
export const financialEntryRepository = new FinancialEntryRepository()
export const paymentRepository = new PaymentRepository()
export const userRepository = new UserRepository()
