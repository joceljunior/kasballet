import Parse from 'parse'
import { studentRepository, studentCrewRepository, crewRepository, registerRepository, financialEntryRepository, paymentRepository, userRepository } from '../repositories/index.js'

export class StudentService {
  constructor(repository) {
    this.repository = repository
  }

  /**
   * Get students with pagination
   */
  async getStudents(page = 0, pageSize = 30, filters = {}) {
    const skip = page * pageSize
    return this.repository.findActive(pageSize, skip, filters)
  }

  /**
   * Get pending students
   */
  async getPendingStudents(page = 0, pageSize = 30) {
    const skip = page * pageSize
    return this.repository.findPending(pageSize, skip)
  }

  /**
   * Get student by ID
   */
  async getStudentById(id) {
    return this.repository.findById(id)
  }

  /**
   * Get students by ids (para montar mapa em detalhe de chamada, etc.)
   */
  async getStudentsByIds(ids) {
    return this.repository.findByIds(ids || [])
  }

  /**
   * Retorna mapa studentId -> Crew[] para uma lista de alunos (vínculos N:N).
   */
  async getCrewsForStudents(students) {
    return studentCrewRepository.findByStudents(students)
  }

  /**
   * Create student
   * @param {object} data - Dados do aluno
   * @param {boolean} isPublicRegistration - Se true, cria como pendente (active: false). Se false ou undefined, cria como ativo (active: true) para Master
   */
  async createStudent(data, isPublicRegistration = false) {
    const { crewIds, ...rest } = data
    const studentData = {
      ...rest,
      // Se for registro público, cria como pendente (active: false)
      // Se for criação pelo Master, cria como ativo (active: true)
      active: isPublicRegistration ? false : (rest.active !== undefined ? rest.active : true),
      inactive: false, // Campo para marcar alunos inativados manualmente
      dateRegistry: rest.dateRegistry || new Date(),
      useImage: rest.useImage !== undefined ? rest.useImage : true
    }
    // photo: Parse.File já vem do formulário; File do input: converter
    if (studentData.photo && typeof File !== 'undefined' && studentData.photo instanceof File) {
      studentData.photo = new Parse.File(studentData.photo.name, studentData.photo)
    }
    const student = await this.repository.create(studentData)
    if (crewIds?.length) {
      await studentCrewRepository.setForStudent(student.id, crewIds)
    }
    
    // Gerar lançamentos pendentes se tiver valorMensalidade e tipoPlano (apenas para alunos ativos)
    if (studentData.active && studentData.valorMensalidade && Number(studentData.valorMensalidade) > 0) {
      try {
        await this.generatePendingPayments(student.id, student.get('name'), Number(studentData.valorMensalidade), studentData.tipoPlano)
      } catch (err) {
        console.error('Erro ao gerar lançamentos pendentes:', err)
      }
    }
    
    return student
  }

  /**
   * Update student
   */
  async updateStudent(id, data) {
    const { crewIds, hasAllergy, ...rest } = data
    
    // Converter foto se necessário
    if (rest.photo && typeof File !== 'undefined' && rest.photo instanceof File) {
      rest.photo = new Parse.File(rest.photo.name, rest.photo)
    }
    
    // Converter datas se necessário
    if (rest.birthday && typeof rest.birthday === 'string') {
      rest.birthday = new Date(rest.birthday)
    }
    if (rest.dateRegistry && typeof rest.dateRegistry === 'string') {
      rest.dateRegistry = new Date(rest.dateRegistry)
    }
    
    // Garantir tipos numéricos
    if (rest.valorMensalidade !== undefined && rest.valorMensalidade !== null) {
      rest.valorMensalidade = Number(rest.valorMensalidade) || 0
    }
    if (rest.melhorDiaPagamento !== undefined && rest.melhorDiaPagamento !== null) {
      rest.melhorDiaPagamento = Number(rest.melhorDiaPagamento) || null
    }
    if (rest.addressNumber !== undefined && rest.addressNumber !== null && rest.addressNumber !== '') {
      rest.addressNumber = Number(rest.addressNumber) || 0
    }
    
    if (crewIds !== undefined) {
      await studentCrewRepository.setForStudent(id, crewIds)
    }
    
    // Se valorMensalidade foi definido e é maior que 0, atualizar lançamentos pendentes
    if (rest.valorMensalidade !== undefined && rest.valorMensalidade > 0) {
      try {
        const student = await this.repository.findById(id)
        const studentName = rest.name || student.get('name')
        const valorMensalidade = Number(rest.valorMensalidade)
        const tipoPlano = rest.tipoPlano !== undefined ? rest.tipoPlano : student.get('tipoPlano')
        
        if (studentName && valorMensalidade > 0) {
          await this.updateOrGeneratePendingPayments(id, studentName, valorMensalidade, tipoPlano)
        }
      } catch (err) {
        console.error('Erro ao atualizar lançamentos pendentes:', err)
        // Não interrompe a atualização do aluno por causa desse erro
      }
    }
    
    if (Object.keys(rest).length) {
      return this.repository.update(id, rest)
    }
    return this.repository.findById(id)
  }

  /**
   * Gera lançamentos pendentes de mensalidade para uma aluna.
   * Quantidade de meses baseada no tipo de plano.
   */
  async generatePendingPayments(studentId, studentName, valorMensalidade, tipoPlano) {
    if (!studentId || !studentName || !valorMensalidade || valorMensalidade <= 0) {
      console.warn('generatePendingPayments: dados inválidos', { studentId, studentName, valorMensalidade })
      return
    }

    // Determinar quantidade de meses baseado no plano
    const monthsMap = {
      'Mensal': 12,
      'MensalRecorrente': 12,
      'Semestral': 6,
      'Anual': 12
    }
    const months = monthsMap[tipoPlano] || 12

    const now = new Date()

    // Criar lançamentos um a um
    for (let i = 0; i < months; i++) {
      const entryDate = new Date(now.getFullYear(), now.getMonth() + i, 1)
      try {
        await financialEntryRepository.create({
          type: 'entrada',
          subtype: 'mensalidade',
          status: 'pendente',
          date: entryDate,
          value: valorMensalidade,
          description: `Mensalidade - ${studentName}`,
          studentId: studentId,
          teacherId: null
        })
      } catch (err) {
        console.error(`Erro ao criar lançamento para mês ${i}:`, err)
      }
    }
  }

  /**
   * Atualiza lançamentos pendentes existentes ou gera novos se não existirem.
   * Só atualiza lançamentos com status 'pendente' a partir do mês atual.
   */
  async updateOrGeneratePendingPayments(studentId, studentName, valorMensalidade, tipoPlano) {
    if (!studentId || !studentName || !valorMensalidade || valorMensalidade <= 0) {
      console.warn('updateOrGeneratePendingPayments: dados inválidos', { studentId, studentName, valorMensalidade })
      return
    }

    try {
      const now = new Date()
      const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)

      // Buscar lançamentos pendentes futuros desta aluna
      const allEntries = await financialEntryRepository.findEntries(1000, 0, {
        type: 'entrada',
        subtype: 'mensalidade',
        studentId: studentId,
        status: 'pendente'
      })

      // Filtrar apenas lançamentos a partir do mês atual
      const futureEntries = allEntries.filter(e => {
        const entryDate = e.get('date')
        return entryDate && entryDate >= startOfCurrentMonth
      })

      if (futureEntries.length > 0) {
        // Atualizar valor e descrição dos lançamentos pendentes existentes
        for (const entry of futureEntries) {
          try {
            await financialEntryRepository.update(entry.id, {
              value: valorMensalidade,
              description: `Mensalidade - ${studentName}`
            })
          } catch (err) {
            console.error(`Erro ao atualizar lançamento ${entry.id}:`, err)
          }
        }
      } else {
        // Não existem lançamentos pendentes, gerar novos
        await this.generatePendingPayments(studentId, studentName, valorMensalidade, tipoPlano)
      }
    } catch (err) {
      console.error('Erro em updateOrGeneratePendingPayments:', err)
    }
  }

  /**
   * Approve student (set active to true)
   * Também gera lançamentos pendentes se aluno tiver valorMensalidade
   */
  async approveStudent(id) {
    const student = await this.repository.findById(id)
    const valorMensalidade = student.get('valorMensalidade')
    const tipoPlano = student.get('tipoPlano')
    const studentName = student.get('name')

    // Gerar lançamentos pendentes se tiver valorMensalidade
    if (valorMensalidade && Number(valorMensalidade) > 0 && studentName) {
      try {
        await this.generatePendingPayments(id, studentName, Number(valorMensalidade), tipoPlano)
      } catch (err) {
        console.error('Erro ao gerar lançamentos pendentes na aprovação:', err)
      }
    }

    return this.repository.update(id, { active: true })
  }

  /**
   * Delete student
   */
  async deleteStudent(id) {
    await studentCrewRepository.setForStudent(id, []) // remove vínculos com turmas
    return this.repository.delete(id)
  }

  /**
   * Search students
   */
  async searchStudents(query, page = 0, pageSize = 30, filters = {}) {
    const skip = page * pageSize
    
    // Se filtro de pendentes, buscar pendentes e depois filtrar por nome/CPF
    if (filters.pending) {
      const allPending = await this.repository.findPending(10000, 0)
      
      // Filtrar por nome ou CPF
      const filtered = allPending.filter(student => {
        const name = student.get('name') || ''
        const cpf = student.get('cpf') || ''
        const queryLower = query.toLowerCase()
        return name.toLowerCase().includes(queryLower) || cpf.includes(query)
      })
      
      // Ordenar e aplicar paginação
      filtered.sort((a, b) => {
        const nameA = a.get('name') || ''
        const nameB = b.get('name') || ''
        return nameA.localeCompare(nameB)
      })
      
      return filtered.slice(skip, skip + pageSize)
    }
    
    // Busca normal
    return this.repository.search(query, pageSize, skip, filters)
  }

  /**
   * Count total students (all)
   */
  async countAllStudents() {
    return this.repository.countAll()
  }

  /**
   * Count pending students (active: false AND inactive: false ou undefined)
   */
  async countPendingStudents() {
    return this.repository.countPending()
  }

  /**
   * Migrate all pending students to inactive
   * Marca todos os alunos pendentes (active: false) como inativos (inactive: true)
   */
  async migratePendingToInactive() {
    const query = new Parse.Query(this.repository.ParseObject)
    query.equalTo('active', false)
    query.limit(10000) // Buscar todos
    const pendingStudents = await query.find()
    
    const updates = pendingStudents.map(student => {
      student.set('inactive', true)
      return student
    })
    
    if (updates.length > 0) {
      await Parse.Object.saveAll(updates)
    }
    
    return updates.length
  }

  /**
   * Inactivate student (marca como inativo)
   */
  async inactivateStudent(id) {
    return this.repository.update(id, { active: false, inactive: true })
  }

  /**
   * Busca alunos ativos que NÃO pagaram a mensalidade do mês ANTERIOR ao atual.
   * Retorna array de alunos com informações de pagamento.
   */
  async getStudentsWithoutPaymentThisMonth() {
    try {
      // Obter início e fim do mês ANTERIOR
      const now = new Date()
      const previousMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1
      const previousYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
      const startOfPreviousMonth = new Date(previousYear, previousMonth, 1)
      const endOfPreviousMonth = new Date(previousYear, previousMonth + 1, 0, 23, 59, 59, 999)

      // Buscar todos os alunos ativos
      const activeStudents = await this.repository.findActive(10000, 0, { active: true })
      if (!activeStudents.length) return []

      // Buscar todas as mensalidades do mês anterior
      const entries = await financialEntryRepository.findEntries(10000, 0, {
        type: 'entrada',
        subtype: 'mensalidade',
        dateFrom: startOfPreviousMonth,
        dateTo: endOfPreviousMonth
      })

      // Criar set de studentIds que pagaram
      const paidStudentIds = new Set(entries.map(e => e.get('studentId')).filter(Boolean))

      // Filtrar alunos que NÃO pagaram
      const unpaidStudents = activeStudents.filter(s => !paidStudentIds.has(s.id))

      return unpaidStudents
    } catch (error) {
      console.error('Error fetching unpaid students:', error)
      return []
    }
  }
}

export class CrewService {
  constructor(repository) {
    this.repository = repository
  }

  /**
   * Get crews with pagination and optional filters (active: true|false for ativas|inativas)
   */
  async getCrews(page = 0, pageSize = 50, filters = {}) {
    const skip = page * pageSize
    return this.repository.findActive(pageSize, skip, filters)
  }

  /**
   * Get crew by ID
   */
  async getCrewById(id) {
    return this.repository.findById(id)
  }

  /**
   * Create crew
   */
  async createCrew(data) {
    const crewData = {
      ...data,
      Active: data.Active !== undefined ? data.Active : true
    }
    return this.repository.create(crewData)
  }

  /**
   * Update crew
   */
  async updateCrew(id, data) {
    return this.repository.update(id, data)
  }

  /**
   * Delete crew
   */
  async deleteCrew(id) {
    return this.repository.delete(id)
  }

  /**
   * Get crews by teacher (Crew.teacherId). filters.active: true|false|undefined
   */
  async getCrewsByTeacher(teacherId, page = 0, pageSize = 50, filters = {}) {
    const skip = page * pageSize
    return this.repository.findByTeacher(teacherId, pageSize, skip, filters)
  }

  /**
   * Get students by crew ID
   */
  async getStudentsByCrew(crewId) {
    return studentCrewRepository.findByCrew(crewId)
  }

  /**
   * Count total active crews
   */
  async countActiveCrews() {
    return crewRepository.countActive()
  }
}

export class RegisterService {
  constructor(repository) {
    this.repository = repository
  }

  /**
   * Get registers with pagination and filters (crewId, dateFrom, dateTo).
   */
  async getRegisters(page = 0, pageSize = 50, filters = {}) {
    const skip = page * pageSize
    return this.repository.findRegisters(pageSize, skip, filters)
  }

  /**
   * Get registers by crew
   */
  async getRegistersByCrew(crewId, page = 0, pageSize = 30) {
    const skip = page * pageSize
    return this.repository.findByCrew(crewId, pageSize, skip)
  }

  /**
   * Get register by ID
   */
  async getRegisterById(id) {
    return this.repository.findById(id)
  }

  /**
   * Create register. calledByUserId é preenchido com o currentUser; se não logado, fica null.
   * studentRegisters: Array<{ studentId: string, present: boolean }>
   */
  async createRegister(data) {
    const user = Parse.User.current()
    const registerData = {
      crewId: data.crewId,
      dateregister: data.dateregister ? (data.dateregister instanceof Date ? data.dateregister : new Date(data.dateregister)) : new Date(),
      studentRegisters: Array.isArray(data.studentRegisters) ? data.studentRegisters : [],
      calledByUserId: user ? user.id : null
    }
    return this.repository.create(registerData)
  }

  /**
   * Update register. calledByUserId não é alterado (mantém quem fez a chamada original).
   * Para registrar quem alterou, pode-se adicionar updatedByUserId no futuro.
   */
  async updateRegister(id, data) {
    const payload = {}
    if (data.crewId !== undefined) payload.crewId = data.crewId
    if (data.dateregister !== undefined) {
      payload.dateregister = data.dateregister instanceof Date ? data.dateregister : new Date(data.dateregister)
    }
    if (data.studentRegisters !== undefined) payload.studentRegisters = Array.isArray(data.studentRegisters) ? data.studentRegisters : []
    return this.repository.update(id, payload)
  }

  /**
   * Delete register
   */
  async deleteRegister(id) {
    return this.repository.delete(id)
  }
}

export class FinancialEntryService {
  constructor(repository) {
    this.repository = repository
  }

  async getEntries(page = 0, pageSize = 100, filters = {}) {
    const skip = page * pageSize
    return this.repository.findEntries(pageSize, skip, filters)
  }

  async getEntryById(id) {
    return this.repository.findById(id)
  }

  /**
   * createEntry: createdByUserId = currentUser.id; status = data.status || 'efetivado'.
   */
  async createEntry(data) {
    const user = Parse.User.current()
    const payload = {
      type: data.type,
      subtype: data.subtype,
      date: data.date instanceof Date ? data.date : new Date(data.date),
      value: Number(data.value) || 0,
      description: data.description != null ? String(data.description) : '',
      studentId: data.studentId || null,
      teacherId: data.teacherId || null,
      status: data.status === 'pendente' ? 'pendente' : 'efetivado',
      createdByUserId: user ? user.id : null
    }
    return this.repository.create(payload)
  }

  async updateEntry(id, data) {
    const payload = {}
    if (data.type !== undefined) payload.type = data.type
    if (data.subtype !== undefined) payload.subtype = data.subtype
    if (data.date !== undefined) payload.date = data.date instanceof Date ? data.date : new Date(data.date)
    if (data.value !== undefined) payload.value = Number(data.value) || 0
    if (data.description !== undefined) payload.description = String(data.description)
    if (data.studentId !== undefined) payload.studentId = data.studentId || null
    if (data.teacherId !== undefined) payload.teacherId = data.teacherId || null
    if (data.status !== undefined) payload.status = data.status === 'pendente' ? 'pendente' : 'efetivado'
    return this.repository.update(id, payload)
  }

  async deleteEntry(id) {
    return this.repository.delete(id)
  }

  /** Histórico de mensalidades do aluno */
  async getEntriesByStudent(studentId, page = 0, pageSize = 100) {
    const skip = page * pageSize
    return this.repository.findByStudent(studentId, pageSize, skip)
  }

  /** Histórico de pagamentos à professora */
  async getEntriesByTeacher(teacherId, page = 0, pageSize = 100) {
    const skip = page * pageSize
    return this.repository.findByTeacher(teacherId, pageSize, skip)
  }

  /**
   * Totais: efetivo (só efetivados) e projetado (todos). status e type não afetam a soma (são da listagem).
   * { totalEntradas, totalSaidas, saldo, totalEntradasProjetado, totalSaidasProjetado, saldoProjetado }
   */
  async getTotals(filters = {}) {
    const { status, type, ...f } = filters
    const [totalEntradas, totalSaidas, totalEntradasProjetado, totalSaidasProjetado] = await Promise.all([
      this.repository.sumByType('entrada', { ...f, effectiveOnly: true }),
      this.repository.sumByType('saida', { ...f, effectiveOnly: true }),
      this.repository.sumByType('entrada', f),
      this.repository.sumByType('saida', f)
    ])
    return {
      totalEntradas,
      totalSaidas,
      saldo: totalEntradas - totalSaidas,
      totalEntradasProjetado,
      totalSaidasProjetado,
      saldoProjetado: totalEntradasProjetado - totalSaidasProjetado
    }
  }
}

export class PaymentService {
  constructor(repository) {
    this.repository = repository
  }

  /**
   * Get payments with pagination
   */
  async getPayments(page = 0, pageSize = 30, filters = {}) {
    const skip = page * pageSize
    return this.repository.findAll(pageSize, skip, filters)
  }

  /**
   * Get payments by student
   */
  async getPaymentsByStudent(studentId, page = 0, pageSize = 30) {
    const skip = page * pageSize
    return this.repository.findByStudent(studentId, pageSize, skip)
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(id) {
    return this.repository.findById(id)
  }

  /**
   * Create payment
   */
  async createPayment(data) {
    const paymentData = {
      ...data,
      statusPagamento: data.statusPagamento || 'Pendente',
      dataPagamento: data.dataPagamento || null
    }
    return this.repository.create(paymentData)
  }

  /**
   * Update payment
   */
  async updatePayment(id, data) {
    return this.repository.update(id, data)
  }

  /**
   * Delete payment
   */
  async deletePayment(id) {
    return this.repository.delete(id)
  }
}

export class AuthService {
  constructor(repository) {
    this.repository = repository
  }

  /**
   * Login user
   */
  async login(username, password) {
    return this.repository.login(username, password)
  }

  /**
   * Logout user
   */
  async logout() {
    return this.repository.logout()
  }

  /**
   * Get current user
   */
  getCurrentUser() {
    return this.repository.getCurrentUser()
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return this.repository.getCurrentUser() !== null
  }

  /**
   * Get user role
   */
  getUserRole() {
    const user = this.repository.getCurrentUser()
    return user ? user.get('Role') : null
  }
}

export class TeacherService {
  constructor(userRepository, crewRepository) {
    this.userRepository = userRepository
    this.crewRepository = crewRepository
  }

  async getTeachers() {
    return this.userRepository.findByRole('Professora', 100, 0)
  }

  async getTeacherById(id) {
    return this.userRepository.findUserById(id)
  }

  /**
   * Cria _User com Role Professora via Cloud Function createTeacher.
   * Em seguida atribui as turmas (crewIds) ao professor (Crew.teacherId) somente se active.
   * - Se active: crewIds deve ter ao menos 1 (validado no formulário).
   * - Se inativa: crewIds deve ser [] (validado no formulário).
   */
  async createTeacher({ username, password, email, active = true, crewIds }) {
    const params = { username, password, active: active !== false }
    const em = (email != null && typeof email === 'string') ? String(email).trim() : ''
    if (em !== '') params.email = em
    const res = await Parse.Cloud.run('createTeacher', params)
    const id = res && (res.id || res.objectId)
    if (!id) throw new Error('createTeacher não retornou o id da professora.')
    for (const cid of active !== false ? (crewIds || []) : []) {
      await this.crewRepository.update(cid, { teacherId: id })
    }
    return this.getTeacherById(id)
  }

  /**
   * Atualiza email/senha/ativo via Cloud Function e/ou reassigna turmas (crewIds).
   * Ao inativar (active=false): Cloud remove teacherId de todas as Crew.
   * Ao reativar: exige ao menos uma turma em crewIds (validado no formulário).
   * Só envia params definidos para evitar ParseError (ex.: undefined).
   */
  async updateTeacher(userId, { email, password, active, crewIds }) {
    const cloudParams = { userId }
    const em = (email != null && typeof email === 'string') ? String(email).trim() : ''
    if (em !== '') cloudParams.email = em
    if (password != null && String(password).length > 0) cloudParams.password = String(password)
    if (active !== undefined) cloudParams.active = active
    if (Object.keys(cloudParams).length > 1) {
      await Parse.Cloud.run('updateTeacher', cloudParams)
    }
    if (crewIds !== undefined && active !== false) {
      const crews = await this.crewRepository.findByTeacher(userId, 10000, 0, {})
      for (const c of crews) {
        if (!crewIds.includes(c.id)) {
          await this.crewRepository.update(c.id, { teacherId: null })
        }
      }
      for (const cid of crewIds) {
        await this.crewRepository.update(cid, { teacherId: userId })
      }
    }
    return this.getTeacherById(userId)
  }
}

// Export service instances
export const studentService = new StudentService(studentRepository)
export const crewService = new CrewService(crewRepository)
export const teacherService = new TeacherService(userRepository, crewRepository)
export const registerService = new RegisterService(registerRepository)
export const financialEntryService = new FinancialEntryService(financialEntryRepository)
export const paymentService = new PaymentService(paymentRepository)
export const authService = new AuthService(userRepository)

// Export repositories for direct access if needed
export { userRepository }
