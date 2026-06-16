import Parse from 'parse'
import { studentRepository, studentCrewRepository, crewRepository, registerRepository, financialCategoryRepository, financialEntryRepository, paymentRepository, userRepository, itemCategoryRepository, productRepository, saleRepository } from '../repositories/index.js'
import { parseDateForStorage } from '../utils/date.js'
import { DEFAULT_FINANCIAL_CATEGORIES, slugifyCategoryCode } from '../utils/financialCategories.js'
import { DEFAULT_ITEM_CATEGORIES, normalizeAttributeFields, validateAttributeValue } from '../utils/itemCategories.js'

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
    if (studentData.birthday != null && typeof studentData.birthday === 'string') {
      studentData.birthday = parseDateForStorage(studentData.birthday)
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
    
    // Remover campos que não devem ser atualizados
    delete rest.dateRegistry // Data de registro não pode ser alterada
    delete rest.objectId
    delete rest.createdAt
    delete rest.updatedAt
    
    // Converter foto se necessário
    if (rest.photo && typeof File !== 'undefined' && rest.photo instanceof File) {
      rest.photo = new Parse.File(rest.photo.name, rest.photo)
    } else if (rest.photo instanceof Parse.File) {
      // Se é um Parse.File novo (sem URL), manter; se já salvo, ignorar
      if (rest.photo.url()) {
        delete rest.photo
      }
      // Se não tem url(), é um Parse.File novo — manter no payload
    } else if (rest.photo && typeof rest.photo === 'object' && rest.photo.url) {
      // Outro objeto com url (ex: objeto plain) — ignorar
      delete rest.photo
    }
    
    // Converter datas se necessário (YYYY-MM-DD do formulário = calendário local)
    if (rest.birthday && typeof rest.birthday === 'string') {
      rest.birthday = parseDateForStorage(rest.birthday)
    }
    
    // Garantir tipos numéricos
    if (rest.valorMensalidade !== undefined && rest.valorMensalidade !== null && rest.valorMensalidade !== '') {
      rest.valorMensalidade = Number(rest.valorMensalidade) || 0
    } else if (rest.valorMensalidade === '' || rest.valorMensalidade === null) {
      rest.valorMensalidade = 0
    }
    
    if (rest.melhorDiaPagamento !== undefined && rest.melhorDiaPagamento !== null && rest.melhorDiaPagamento !== '') {
      rest.melhorDiaPagamento = Number(rest.melhorDiaPagamento) || null
    } else if (rest.melhorDiaPagamento === '') {
      rest.melhorDiaPagamento = null
    }
    
    if (rest.addressNumber !== undefined && rest.addressNumber !== null && rest.addressNumber !== '') {
      rest.addressNumber = Number(rest.addressNumber) || 0
    } else if (rest.addressNumber === '') {
      rest.addressNumber = null
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
    
    console.log('updateStudent payload:', JSON.stringify(rest, null, 2))
    
    if (Object.keys(rest).length) {
      return this.repository.update(id, rest)
    }
    return this.repository.findById(id)
  }

  /**
   * Gera lançamentos pendentes de mensalidade para uma aluna.
   * APENAS para planos Mensal e MensalRecorrente.
   * Gera do mês atual até dezembro do ano corrente.
   */
  async generatePendingPayments(studentId, studentName, valorMensalidade, tipoPlano) {
    if (!studentId || !studentName || !valorMensalidade || valorMensalidade <= 0) {
      console.warn('generatePendingPayments: dados inválidos', { studentId, studentName, valorMensalidade })
      return
    }

    // Só gera lançamentos automáticos para Mensal e MensalRecorrente
    if (tipoPlano !== 'Mensal' && tipoPlano !== 'MensalRecorrente') {
      console.log(`Plano ${tipoPlano} não gera lançamentos automáticos`)
      return
    }

    const now = new Date()
    const currentMonth = now.getMonth() // 0-11
    const currentYear = now.getFullYear()
    const mensalidadeCode = await financialCategoryService.resolveBehaviorCode('mensalidade')
    
    // Gerar do mês atual até dezembro (mês 11)
    for (let month = currentMonth; month <= 11; month++) {
      const referenceDate = new Date(currentYear, month, 1)
      try {
        await financialEntryRepository.create({
          type: 'entrada',
          subtype: mensalidadeCode,
          status: 'pendente',
          date: null, // Data do pagamento será preenchida quando for efetivado
          dateReference: referenceDate, // Mês de referência
          value: valorMensalidade,
          description: `Mensalidade - ${studentName}`,
          studentId: studentId,
          teacherId: null
        })
      } catch (err) {
        console.error(`Erro ao criar lançamento para mês ${month}:`, err)
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

    // Só atualiza/gera para Mensal e MensalRecorrente
    if (tipoPlano !== 'Mensal' && tipoPlano !== 'MensalRecorrente') {
      console.log(`Plano ${tipoPlano} não gera lançamentos automáticos`)
      return
    }

    try {
      const now = new Date()
      const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const mensalidadeCode = await financialCategoryService.resolveBehaviorCode('mensalidade')

      // Buscar lançamentos pendentes futuros desta aluna
      const allEntries = await financialEntryRepository.findEntries(1000, 0, {
        type: 'entrada',
        subtype: mensalidadeCode,
        studentId: studentId,
        status: 'pendente'
      })

      // Filtrar apenas lançamentos a partir do mês atual (usando dateReference)
      const futureEntries = allEntries.filter(e => {
        const refDate = e.get('dateReference') || e.get('date')
        return refDate && refDate >= startOfCurrentMonth
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

    if (filters.pending) {
      const allPending = await this.repository.findPending(10000, 0)
      const queryLower = query.toLowerCase()
      const filtered = allPending.filter((student) => {
        const name = student.get('name') || ''
        const cpf = student.get('cpf') || ''
        return name.toLowerCase().includes(queryLower) || cpf.includes(query)
      })
      filtered.sort((a, b) => {
        const nameA = a.get('name') || ''
        const nameB = b.get('name') || ''
        return nameA.localeCompare(nameB, 'pt-BR')
      })
      return filtered.slice(skip, skip + pageSize)
    }

    const allResults = await this.repository.searchAll(query, filters)
    return allResults.slice(skip, skip + pageSize)
  }

  async countSearchStudents(query, filters = {}) {
    if (filters.pending) {
      const allPending = await this.repository.findPending(10000, 0)
      const queryLower = query.toLowerCase()
      return allPending.filter((student) => {
        const name = student.get('name') || ''
        const cpf = student.get('cpf') || ''
        return name.toLowerCase().includes(queryLower) || cpf.includes(query)
      }).length
    }

    const allResults = await this.repository.searchAll(query, filters)
    return allResults.length
  }

  async countStudents(filters = {}) {
    return this.repository.countWithFilters(filters)
  }

  /**
   * Count total students (all)
   */
  async countAllStudents() {
    return this.repository.countAll()
  }

  /**
   * Count only active students
   */
  async countActiveStudents() {
    return this.repository.countActiveStudents()
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
   * Reactivate student (reativa aluna inativada)
   */
  async reactivateStudent(id) {
    return this.repository.update(id, { active: true, inactive: false })
  }

  /**
   * Busca alunos ativos que NÃO pagaram (para tela de mensalidades pendentes).
   * Retorna { student, pendencyType }:
   * - Mensal/MensalRecorrente: sem mensalidade do mês anterior → mensalidade_em_atraso
   * - Semestral: sem pagamento_semestral nos últimos 6 meses → semestral_pendente (ex: pagou em jan, vence jul; se não pagar ago, em set aparece)
   * - Anual: sem pagamento_anual nos últimos 12 meses → anual_pendente
   */
  async getStudentsWithoutPaymentThisMonth() {
    try {
      const now = new Date()
      
      const activeStudents = await this.repository.findActive(10000, 0, { active: true })
      if (!activeStudents.length) return []

      const mensalStudents = activeStudents.filter(s => 
        s.get('tipoPlano') === 'Mensal' || s.get('tipoPlano') === 'MensalRecorrente'
      )
      const semestralStudents = activeStudents.filter(s => s.get('tipoPlano') === 'Semestral')
      const anualStudents = activeStudents.filter(s => s.get('tipoPlano') === 'Anual')

      const unpaidStudents = []
      const mensalidadeCode = await financialCategoryService.resolveBehaviorCode('mensalidade')
      const semestralCode = await financialCategoryService.resolveBehaviorCode('pagamento_semestral')
      const anualCode = await financialCategoryService.resolveBehaviorCode('pagamento_anual')

      // 1. MENSAL/MENSAL RECORRENTE: não pagou mês anterior → mensalidade em atraso
      if (mensalStudents.length > 0) {
        const previousMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1
        const previousYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()
        const startOfPreviousMonth = new Date(previousYear, previousMonth, 1)
        const endOfPreviousMonth = new Date(previousYear, previousMonth + 1, 0, 23, 59, 59, 999)

        const mensalidadeEntries = await financialEntryRepository.findEntries(10000, 0, {
          type: 'entrada',
          subtype: mensalidadeCode,
          status: 'efetivado',
          dateReferenceFrom: startOfPreviousMonth,
          dateReferenceTo: endOfPreviousMonth
        })
        const paidMensalIds = new Set(mensalidadeEntries.map(e => e.get('studentId')).filter(Boolean))
        
        mensalStudents.forEach(s => {
          if (!paidMensalIds.has(s.id)) {
            unpaidStudents.push({ student: s, pendencyType: 'mensalidade_em_atraso' })
          }
        })
      }

      // 2. SEMESTRAL: mostrar só se não tiver lançamento nos últimos 6 meses (ex: pagou jan, vence jul; sem pagar ago → em set aparece)
      if (semestralStudents.length > 0) {
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1)
        
        const semestralEntries = await financialEntryRepository.findEntries(10000, 0, {
          type: 'entrada',
          subtype: semestralCode,
          status: 'efetivado',
          dateReferenceFrom: sixMonthsAgo,
          dateReferenceTo: now
        })
        const paidSemestralIds = new Set(semestralEntries.map(e => e.get('studentId')).filter(Boolean))
        
        semestralStudents.forEach(s => {
          if (!paidSemestralIds.has(s.id)) {
            unpaidStudents.push({ student: s, pendencyType: 'semestral_pendente' })
          }
        })
      }

      // 3. ANUAL: mostrar só se não tiver lançamento nos últimos 12 meses
      if (anualStudents.length > 0) {
        const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1)
        
        const anualEntries = await financialEntryRepository.findEntries(10000, 0, {
          type: 'entrada',
          subtype: anualCode,
          status: 'efetivado',
          dateReferenceFrom: oneYearAgo,
          dateReferenceTo: now
        })
        const paidAnualIds = new Set(anualEntries.map(e => e.get('studentId')).filter(Boolean))
        
        anualStudents.forEach(s => {
          if (!paidAnualIds.has(s.id)) {
            unpaidStudents.push({ student: s, pendencyType: 'anual_pendente' })
          }
        })
      }

      return unpaidStudents
    } catch (error) {
      console.error('Error fetching unpaid students:', error)
      return []
    }
  }

  /**
   * Busca alunos semestrais/anuais com contrato próximo do vencimento.
   * - Semestral: pagamento_semestral com dateReference há mais de 5 meses
   * - Anual: pagamento_anual com dateReference há mais de 11 meses
   */
  async getStudentsWithExpiringContracts() {
    try {
      const now = new Date()
      const expiringStudents = []
      const semestralCode = await financialCategoryService.resolveBehaviorCode('pagamento_semestral')
      const anualCode = await financialCategoryService.resolveBehaviorCode('pagamento_anual')

      // Buscar todos os alunos ativos semestrais e anuais
      const activeStudents = await this.repository.findActive(10000, 0, { active: true })
      const semestralStudents = activeStudents.filter(s => s.get('tipoPlano') === 'Semestral')
      const anualStudents = activeStudents.filter(s => s.get('tipoPlano') === 'Anual')

      // SEMESTRAL: pegar quem pagou entre 5-6 meses atrás (próximo de vencer)
      if (semestralStudents.length > 0) {
        const fiveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1)
        const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1)
        
        const semestralEntries = await financialEntryRepository.findEntries(10000, 0, {
          type: 'entrada',
          subtype: semestralCode,
          status: 'efetivado',
          dateReferenceFrom: sixMonthsAgo,
          dateReferenceTo: fiveMonthsAgo
        })
        const expiringSemestralIds = new Set(semestralEntries.map(e => e.get('studentId')).filter(Boolean))
        
        semestralStudents.forEach(s => {
          if (expiringSemestralIds.has(s.id)) {
            expiringStudents.push({ student: s, type: 'semestral' })
          }
        })
      }

      // ANUAL: pegar quem pagou entre 11-12 meses atrás (próximo de vencer)
      if (anualStudents.length > 0) {
        const elevenMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1)
        const twelveMonthsAgo = new Date(now.getFullYear() - 1, now.getMonth(), 1)
        
        const anualEntries = await financialEntryRepository.findEntries(10000, 0, {
          type: 'entrada',
          subtype: anualCode,
          status: 'efetivado',
          dateReferenceFrom: twelveMonthsAgo,
          dateReferenceTo: elevenMonthsAgo
        })
        const expiringAnualIds = new Set(anualEntries.map(e => e.get('studentId')).filter(Boolean))
        
        anualStudents.forEach(s => {
          if (expiringAnualIds.has(s.id)) {
            expiringStudents.push({ student: s, type: 'anual' })
          }
        })
      }

      return expiringStudents
    } catch (error) {
      console.error('Error fetching expiring contracts:', error)
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

  async countCrews(filters = {}) {
    return this.repository.countWithFilters(filters)
  }

  async countCrewsByTeacher(teacherId, filters = {}) {
    return this.repository.countByTeacher(teacherId, filters)
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

  /**
   * Conta alunos ativos por turma para múltiplas turmas.
   * Retorna mapa crewId -> count
   */
  async countStudentsByCrews(crewIds) {
    return studentCrewRepository.countStudentsByCrews(crewIds)
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

  async countRegisters(filters = {}) {
    return this.repository.countRegisters(filters)
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
      dateregister: data.dateregister
        ? (data.dateregister instanceof Date ? data.dateregister : parseDateForStorage(data.dateregister))
        : new Date(),
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
      payload.dateregister = data.dateregister instanceof Date
        ? data.dateregister
        : parseDateForStorage(data.dateregister)
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

  /**
   * Insights de frequência para o dashboard:
   * - Alunas ausentes nas últimas 3 chamadas da turma
   * - Turmas ativas sem chamada na última semana
   * @param {string[]|null} crewIdsFilter - restringe às turmas informadas (ex.: turmas da professora)
   */
  async getDashboardAttendanceInsights(crewIdsFilter = null) {
    try {
      let crews
      if (crewIdsFilter?.length) {
        crews = (await Promise.all(
          crewIdsFilter.map((id) => crewRepository.findById(id))
        )).filter((c) => this._isActiveCrew(c))
      } else {
        crews = (await crewRepository.findActive(500, 0, { active: true }))
          .filter((c) => this._isActiveCrew(c))
      }

      if (!crews.length) {
        return { absentStudents: [], crewsWithoutRecentRegister: [] }
      }

      const crewIds = crews.map((c) => c.id)
      const activeCrewIdSet = new Set(crewIds)
      const weekAgo = new Date()
      weekAgo.setDate(weekAgo.getDate() - 7)
      weekAgo.setHours(0, 0, 0, 0)

      const [allRegisters, weekRegisters] = await Promise.all([
        this.repository.findRegisters(10000, 0, { crewIds }),
        this.repository.findRegisters(10000, 0, { crewIds, dateFrom: weekAgo })
      ])

      const crewsWithWeekRegister = new Set(
        weekRegisters
          .map((r) => r.get('crewId'))
          .filter((cid) => cid && activeCrewIdSet.has(cid))
      )
      const crewsWithoutRecentRegister = crews
        .filter((c) => !crewsWithWeekRegister.has(c.id))
        .map((crew) => ({
          crew,
          crewName: this._formatCrewLabel(crew)
        }))
        .sort((a, b) => a.crewName.localeCompare(b.crewName, 'pt-BR'))

      const lastThreeByCrew = {}
      for (const reg of allRegisters) {
        const cid = reg.get('crewId')
        if (!cid || !activeCrewIdSet.has(cid)) continue
        if (!lastThreeByCrew[cid]) lastThreeByCrew[cid] = []
        if (lastThreeByCrew[cid].length < 3) lastThreeByCrew[cid].push(reg)
      }

      const absentStudents = []
      for (const crew of crews) {
        const lastRegisters = lastThreeByCrew[crew.id] || []
        if (lastRegisters.length < 3) continue

        const students = await studentCrewRepository.findByCrew(crew.id)
        const crewName = this._formatCrewLabel(crew)

        for (const student of students) {
          const absentInAll = lastRegisters.every((reg) =>
            this._isStudentAbsentInRegister(student.id, reg)
          )
          if (absentInAll) {
            absentStudents.push({ student, crew, crewName })
          }
        }
      }

      absentStudents.sort((a, b) => {
        const nameCmp = (a.student.get('name') || '').localeCompare(b.student.get('name') || '', 'pt-BR')
        if (nameCmp !== 0) return nameCmp
        return a.crewName.localeCompare(b.crewName, 'pt-BR')
      })

      return { absentStudents, crewsWithoutRecentRegister }
    } catch (error) {
      console.error('Error fetching dashboard attendance insights:', error)
      return { absentStudents: [], crewsWithoutRecentRegister: [] }
    }
  }

  _formatCrewLabel(crew) {
    if (!crew) return '—'
    return `${crew.get('Name') || ''} – ${crew.get('Key') || ''}`.trim() || crew.id
  }

  _isActiveCrew(crew) {
    return crew?.get('Active') === true
  }

  _isStudentAbsentInRegister(studentId, register) {
    const arr = register.get('studentRegisters') || []
    const entry = arr.find((x) => x && x.studentId === studentId)
    return !entry || entry.present !== true
  }
}

export class FinancialEntryService {
  constructor(repository) {
    this.repository = repository
  }

  _normalizeEntryFilters(filters = {}) {
    const { monthYear, ...rest } = filters
    const f = { ...rest }
    if (monthYear && monthYear !== 'all') {
      const [y, m] = monthYear.split('-').map(Number)
      if (y && m) {
        f.dateReferenceFrom = new Date(y, m - 1, 1)
        f.dateReferenceTo = new Date(y, m, 0, 23, 59, 59, 999)
      }
    }
    return f
  }

  async getEntries(page = 0, pageSize = 100, filters = {}) {
    const skip = page * pageSize
    return this.repository.findEntries(pageSize, skip, this._normalizeEntryFilters(filters))
  }

  async countEntries(filters = {}) {
    return this.repository.countEntries(this._normalizeEntryFilters(filters))
  }

  async getEntryById(id) {
    return this.repository.findById(id)
  }

  /**
   * createEntry: createdByUserId = currentUser.id; status = data.status || 'efetivado'.
   */
  async createEntry(data) {
    const user = Parse.User.current()
    const date = data.date instanceof Date ? data.date : parseDateForStorage(data.date)
    const dateReference = data.dateReference
      ? (data.dateReference instanceof Date ? data.dateReference : parseDateForStorage(data.dateReference))
      : date // Se não tiver dateReference, usar a mesma data
    
    const payload = {
      type: data.type,
      subtype: data.subtype,
      date: date,
      dateReference: dateReference,
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
    if (data.date !== undefined) payload.date = data.date instanceof Date ? data.date : parseDateForStorage(data.date)
    if (data.dateReference !== undefined) {
      payload.dateReference = data.dateReference instanceof Date
        ? data.dateReference
        : parseDateForStorage(data.dateReference)
    }
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

  /** Deleta TODOS os lançamentos financeiros (usar com cuidado!) */
  async deleteAllEntries() {
    const entries = await this.repository.findEntries(10000, 0, {})
    for (const entry of entries) {
      await this.repository.delete(entry.id)
    }
    return entries.length
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
   * filters.monthYear = 'YYYY-MM' para filtrar por mês de referência; omitir ou 'all' = todos os lançamentos.
   * { totalEntradas, totalSaidas, saldo, totalEntradasProjetado, totalSaidasProjetado, saldoProjetado }
   */
  async getTotals(filters = {}) {
    const { status, type, monthYear, ...f } = filters
    let dateRef = {}
    if (monthYear && monthYear !== 'all') {
      const [y, m] = monthYear.split('-').map(Number)
      if (y && m) {
        dateRef = {
          dateReferenceFrom: new Date(y, m - 1, 1),
          dateReferenceTo: new Date(y, m, 0, 23, 59, 59, 999)
        }
      }
    }
    const base = { ...f, ...dateRef }
    const [totalEntradas, totalSaidas, totalEntradasProjetado, totalSaidasProjetado] = await Promise.all([
      this.repository.sumByType('entrada', { ...base, effectiveOnly: true }),
      this.repository.sumByType('saida', { ...base, effectiveOnly: true }),
      this.repository.sumByType('entrada', base),
      this.repository.sumByType('saida', base)
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

  /**
   * Distribuição por categoria (subtype) para gráficos.
   * effectiveOnly: true = só efetivados (padrão); false = pendentes + efetivados.
   */
  async getDistributionBySubtype(filters = {}, { effectiveOnly = true } = {}) {
    const { status, type, monthYear, ...f } = filters
    let dateRef = {}
    if (monthYear && monthYear !== 'all') {
      const [y, m] = monthYear.split('-').map(Number)
      if (y && m) {
        dateRef = {
          dateReferenceFrom: new Date(y, m - 1, 1),
          dateReferenceTo: new Date(y, m, 0, 23, 59, 59, 999)
        }
      }
    }
    const base = { ...f, ...dateRef, effectiveOnly }
    const [entradaMap, saidaMap] = await Promise.all([
      this.repository.sumGroupedBySubtype('entrada', base),
      this.repository.sumGroupedBySubtype('saida', base)
    ])
    const toArray = (map) =>
      Object.entries(map)
        .filter(([, value]) => value > 0)
        .map(([code, value]) => ({ code, value }))
        .sort((a, b) => b.value - a.value)
    return {
      entrada: toArray(entradaMap),
      saida: toArray(saidaMap)
    }
  }

  /** Comparativo entre dois meses (referência dateReference). extraFilters: studentId, etc. */
  async getMonthComparison(monthA, monthB, extraFilters = {}) {
    const [totalsA, totalsB] = await Promise.all([
      this.getTotals({ ...extraFilters, monthYear: monthA }),
      this.getTotals({ ...extraFilters, monthYear: monthB })
    ])
    return { monthA, monthB, totalsA, totalsB }
  }
}

export class FinancialCategoryService {
  constructor(repository, entryRepository) {
    this.repository = repository
    this.entryRepository = entryRepository
    this.behaviorCodeCache = {}
  }

  clearBehaviorCache() {
    this.behaviorCodeCache = {}
  }

  async resolveBehaviorCode(behavior) {
    if (this.behaviorCodeCache[behavior]) return this.behaviorCodeCache[behavior]
    try {
      const cat = await this.repository.findBySystemBehavior(behavior)
      const code = cat?.get('code') || behavior
      this.behaviorCodeCache[behavior] = code
      return code
    } catch (_) {
      return behavior
    }
  }

  async ensureDefaults() {
    try {
      const count = await this.repository.countAll()
      if (count > 0) return
      for (const item of DEFAULT_FINANCIAL_CATEGORIES) {
        await this.repository.create({ ...item, active: true })
      }
      this.clearBehaviorCache()
    } catch (err) {
      console.error('Erro ao criar categorias padrão:', err)
    }
  }

  async getCategories(filters = {}) {
    await this.ensureDefaults()
    return this.repository.findCategories(200, 0, filters)
  }

  async getCategoryById(id) {
    return this.repository.findById(id)
  }

  async createCategory(data) {
    const label = String(data.label || '').trim()
    if (!label) throw new Error('Informe o nome da categoria.')
    if (!data.type || !['entrada', 'saida'].includes(data.type)) {
      throw new Error('Selecione o tipo (entrada ou saída).')
    }

    let code = slugifyCategoryCode(data.code || label)
    if (!code) throw new Error('Não foi possível gerar um código para a categoria.')

    const existing = await this.repository.findByCode(code, data.type)
    if (existing) {
      let suffix = 2
      while (await this.repository.findByCode(`${code}_${suffix}`, data.type)) suffix++
      code = `${code}_${suffix}`
    }

    const created = await this.repository.create({
      type: data.type,
      code,
      label,
      requiresStudent: !!data.requiresStudent,
      requiresTeacher: !!data.requiresTeacher,
      requiresDescription: !!data.requiresDescription,
      systemBehavior: null,
      active: data.active !== false,
      sortOrder: Number(data.sortOrder) || 99
    })
    this.clearBehaviorCache()
    return created
  }

  async updateCategory(id, data) {
    const category = await this.repository.findById(id)
    const payload = {}

    if (data.label !== undefined) {
      const label = String(data.label || '').trim()
      if (!label) throw new Error('Informe o nome da categoria.')
      payload.label = label
    }
    if (data.requiresStudent !== undefined) payload.requiresStudent = !!data.requiresStudent
    if (data.requiresTeacher !== undefined) payload.requiresTeacher = !!data.requiresTeacher
    if (data.requiresDescription !== undefined) payload.requiresDescription = !!data.requiresDescription
    if (data.active !== undefined) payload.active = !!data.active
    if (data.sortOrder !== undefined) payload.sortOrder = Number(data.sortOrder) || 0

    const updated = await this.repository.update(id, payload)
    this.clearBehaviorCache()
    return updated
  }

  async deleteCategory(id) {
    const category = await this.repository.findById(id)
    if (category.get('systemBehavior')) {
      throw new Error('Esta categoria é usada pelo sistema e não pode ser excluída. Você pode desativá-la.')
    }

    const entries = await this.entryRepository.findEntries(1, 0, {
      type: category.get('type'),
      subtype: category.get('code')
    })
    if (entries.length > 0) {
      throw new Error('Existem lançamentos com esta categoria. Desative-a em vez de excluir.')
    }

    await this.repository.delete(id)
    this.clearBehaviorCache()
  }

  async countEntriesForCategory(category) {
    return this.entryRepository.findEntries(10000, 0, {
      type: category.get('type'),
      subtype: category.get('code')
    }).then((list) => list.length)
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

  /**
   * Exclui _User Professora (Master). Remove teacherId de todas as Crew.
   */
  async deleteTeacher(userId) {
    await Parse.Cloud.run('deleteTeacher', { userId })
  }
}

export class ItemCategoryService {
  constructor(repository, productRepository) {
    this.repository = repository
    this.productRepository = productRepository
  }

  async ensureDefaults() {
    try {
      const count = await this.repository.countAll()
      if (count > 0) return
      for (const item of DEFAULT_ITEM_CATEGORIES) {
        await this.repository.create({
          ...item,
          attributeFields: normalizeAttributeFields(item.attributeFields),
          active: true
        })
      }
    } catch (err) {
      console.error('Erro ao criar categorias padrão:', err)
    }
  }

  async getCategories(filters = {}) {
    await this.ensureDefaults()
    return this.repository.findCategories(200, 0, filters)
  }

  async getCategoryById(id) {
    return this.repository.findById(id)
  }

  async createCategory(data) {
    const label = String(data.label || '').trim()
    if (!label) throw new Error('Informe o nome da categoria.')

    let code = slugifyCategoryCode(data.code || label)
    if (!code) throw new Error('Não foi possível gerar um código para a categoria.')

    const existing = await this.repository.findByCode(code)
    if (existing) {
      let suffix = 2
      while (await this.repository.findByCode(`${code}_${suffix}`)) suffix++
      code = `${code}_${suffix}`
    }

    return this.repository.create({
      code,
      label,
      attributeFields: normalizeAttributeFields(data.attributeFields),
      active: data.active !== false,
      sortOrder: Number(data.sortOrder) || 99
    })
  }

  async updateCategory(id, data) {
    await this.repository.findById(id)
    const payload = {}

    if (data.label !== undefined) {
      const label = String(data.label || '').trim()
      if (!label) throw new Error('Informe o nome da categoria.')
      payload.label = label
    }
    if (data.attributeFields !== undefined) {
      payload.attributeFields = normalizeAttributeFields(data.attributeFields)
    }
    if (data.active !== undefined) payload.active = !!data.active
    if (data.sortOrder !== undefined) payload.sortOrder = Number(data.sortOrder) || 0

    return this.repository.update(id, payload)
  }

  async deleteCategory(id) {
    const category = await this.repository.findById(id)
    const code = category.get('code')
    const label = category.get('label')
    if (await this.productRepository.hasProductsInCategory(code, label)) {
      throw new Error('Existem produtos com esta categoria. Desative-a em vez de excluir.')
    }

    try {
      await this.repository.delete(id)
    } catch (err) {
      const message = String(err?.message || '')
      const permissionDenied =
        message.toLowerCase().includes('permission') ||
        message.toLowerCase().includes('unauthorized') ||
        err?.code === 119

      if (!permissionDenied) {
        throw new Error(message || 'Erro ao excluir categoria.')
      }

      try {
        await Parse.Cloud.run('deleteItemCategory', { categoryId: id })
      } catch (cloudErr) {
        const cloudMsg = String(cloudErr?.message || '')
        if (cloudMsg.includes('Invalid function') || cloudMsg.toLowerCase().includes('not found')) {
          throw new Error('Não foi possível excluir. Atualize o Cloud Code (deleteItemCategory) no Back4App.')
        }
        throw cloudErr
      }
    }
  }
}

export class ProductService {
  constructor(repository) {
    this.repository = repository
  }

  _normalizeAttributes(attributes, categoryFields = []) {
    const raw = attributes && typeof attributes === 'object' ? attributes : {}
    const normalized = {}
    const fields = normalizeAttributeFields(categoryFields)
    for (const field of fields) {
      const val = raw[field.key]
      if (val == null || !String(val).trim()) continue
      const check = validateAttributeValue(field.type, val)
      if (!check.valid) throw new Error(`${field.label}: ${check.message}`)
      normalized[field.key] = check.value
    }
    for (const [key, val] of Object.entries(raw)) {
      if (normalized[key] != null) continue
      if (val != null && String(val).trim()) normalized[key] = String(val).trim()
    }
    return normalized
  }

  _buildProductPayload(data, { partial = false } = {}) {
    const payload = {}
    if (!partial || data.name !== undefined) {
      const name = String(data.name || '').trim()
      if (!name) throw new Error('Nome do produto é obrigatório')
      payload.name = name
    }
    if (!partial || data.price !== undefined) {
      const price = Number(data.price) || 0
      if (price < 0) throw new Error('Preço inválido')
      payload.price = price
    }
    if (!partial || data.stockQuantity !== undefined) {
      const stock = Number(data.stockQuantity) || 0
      if (stock < 0) throw new Error('Quantidade em estoque inválida')
      payload.stockQuantity = stock
    }
    if (!partial || data.categoryCode !== undefined || data.category !== undefined) {
      const categoryCode = data.categoryCode != null
        ? String(data.categoryCode).trim()
        : data.category != null
          ? String(data.category).trim()
          : ''
      payload.categoryCode = categoryCode
      payload.category = categoryCode
    }
    if (!partial || data.description !== undefined) {
      payload.description = data.description ? String(data.description).trim() : ''
    }
    if (!partial || data.active !== undefined) {
      payload.active = data.active !== false
    }
    if (!partial || data.attributes !== undefined) {
      payload.attributes = this._normalizeAttributes(data.attributes, data.categoryAttributeFields)
    }
    if (data.photo && typeof File !== 'undefined' && data.photo instanceof File) {
      payload.photo = new Parse.File(data.photo.name, data.photo)
    } else if (data.photo instanceof Parse.File && !data.photo.url()) {
      payload.photo = data.photo
    }
    return payload
  }

  async getProducts(page = 0, pageSize = 100, filters = {}) {
    const skip = page * pageSize
    return this.repository.findProducts(pageSize, skip, filters)
  }

  async searchProducts(term, page = 0, pageSize = 50, filters = {}) {
    const skip = page * pageSize
    if (!term || !term.trim()) return this.getProducts(page, pageSize, filters)
    return this.repository.searchByName(term.trim(), pageSize, skip, filters)
  }

  async getProductById(id) {
    return this.repository.findById(id)
  }

  async getProductsByGroup(name, categoryCode) {
    return this.repository.findByNameAndCategory(name, categoryCode)
  }

  async createProduct(data) {
    const payload = this._buildProductPayload(data)
    return this.repository.create(payload)
  }

  async updateProduct(id, data) {
    const payload = this._buildProductPayload(data, { partial: true })
    if (Object.keys(payload).length === 0) return this.repository.findById(id)
    return this.repository.update(id, payload)
  }

  async deleteProduct(id) {
    return this.repository.delete(id)
  }
}

export class SaleService {
  constructor(saleRepo, productRepo, financialRepo) {
    this.repository = saleRepo
    this.productRepository = productRepo
    this.financialRepository = financialRepo
  }

  async getSales(page = 0, pageSize = 100, filters = {}) {
    const skip = page * pageSize
    return this.repository.findSales(pageSize, skip, filters)
  }

  async getSaleById(id) {
    return this.repository.findById(id)
  }

  _buildSaleItems(items, productMap) {
    return items.map((item) => {
      const product = productMap[item.productId]
      const unitPrice = item.unitPrice != null ? Number(item.unitPrice) : Number(product.get('price')) || 0
      const quantity = Number(item.quantity) || 0
      const productName = item.productName || product.get('name')
      return {
        productId: item.productId,
        productName,
        quantity,
        unitPrice,
        lineTotal: unitPrice * quantity
      }
    })
  }

  _buildSaleDescription(saleItems, data) {
    const itemsDescription = saleItems.map((i) => `${i.quantity}x ${i.productName}`).join(', ')
    const customerLabel = data.customerName ? String(data.customerName).trim() : ''
    let description = itemsDescription
    if (customerLabel) description = `Venda para ${customerLabel}: ${itemsDescription}`
    if (data.notes) description = `${description} — ${String(data.notes).trim()}`
    return description
  }

  async _validateSaleItems(items) {
    if (!items.length) throw new Error('Adicione ao menos um produto à venda')
    const productMap = {}
    for (const item of items) {
      const productId = item.productId
      if (!productId) throw new Error('Produto inválido na venda')
      if (!productMap[productId]) {
        productMap[productId] = await this.productRepository.findById(productId)
      }
      const product = productMap[productId]
      const qty = Number(item.quantity) || 0
      if (qty <= 0) throw new Error(`Quantidade inválida para ${product.get('name')}`)
      const stock = Number(product.get('stockQuantity')) || 0
      if (stock < qty) {
        throw new Error(`Estoque insuficiente para "${product.get('name')}" (disponível: ${stock})`)
      }
    }
    return productMap
  }

  async _applyStockChanges(saleItems, direction) {
    const factor = direction === 'restore' ? 1 : -1
    for (const item of saleItems) {
      const product = await this.productRepository.findById(item.productId)
      const current = Number(product.get('stockQuantity')) || 0
      const next = current + factor * (Number(item.quantity) || 0)
      await this.productRepository.update(item.productId, { stockQuantity: next })
    }
  }

  /**
   * Registra venda, baixa estoque e cria lançamento financeiro (entrada/vendas).
   */
  async createSale(data) {
    const user = Parse.User.current()
    const items = Array.isArray(data.items) ? data.items : []
    const productMap = await this._validateSaleItems(items)
    const saleItems = this._buildSaleItems(items, productMap)

    const totalValue = saleItems.reduce((sum, i) => sum + i.lineTotal, 0)
    if (totalValue <= 0) throw new Error('Valor total da venda deve ser maior que zero')

    const date = data.date instanceof Date ? data.date : parseDateForStorage(data.date || new Date())
    const description = this._buildSaleDescription(saleItems, data)

    const financialEntry = await this.financialRepository.create({
      type: 'entrada',
      subtype: 'vendas',
      status: 'efetivado',
      date,
      dateReference: date,
      value: totalValue,
      description,
      studentId: data.studentId || null,
      teacherId: null,
      createdByUserId: user ? user.id : null
    })

    const sale = await this.repository.create({
      date,
      totalValue,
      items: saleItems,
      customerName: data.customerName ? String(data.customerName).trim() : '',
      studentId: data.studentId || null,
      notes: data.notes ? String(data.notes).trim() : '',
      financialEntryId: financialEntry.id,
      createdByUserId: user ? user.id : null,
      status: 'concluida'
    })

    await this.financialRepository.update(financialEntry.id, { saleId: sale.id })
    await this._applyStockChanges(saleItems, 'deduct')
    return sale
  }

  /**
   * Atualiza venda, ajusta estoque e sincroniza lançamento financeiro.
   */
  async updateSale(id, data) {
    const sale = await this.repository.findById(id)
    const oldItems = sale.get('items') || []
    await this._applyStockChanges(oldItems, 'restore')

    const items = Array.isArray(data.items) ? data.items : []
    const productMap = await this._validateSaleItems(items)
    const saleItems = this._buildSaleItems(items, productMap)

    const totalValue = saleItems.reduce((sum, i) => sum + i.lineTotal, 0)
    if (totalValue <= 0) throw new Error('Valor total da venda deve ser maior que zero')

    const date = data.date instanceof Date ? data.date : parseDateForStorage(data.date || sale.get('date'))
    const description = this._buildSaleDescription(saleItems, data)

    const updated = await this.repository.update(id, {
      date,
      totalValue,
      items: saleItems,
      customerName: data.customerName != null ? String(data.customerName).trim() : sale.get('customerName') || '',
      studentId: data.studentId !== undefined ? (data.studentId || null) : sale.get('studentId') || null,
      notes: data.notes != null ? String(data.notes).trim() : sale.get('notes') || ''
    })

    const financialEntryId = sale.get('financialEntryId')
    if (financialEntryId) {
      await this.financialRepository.update(financialEntryId, {
        date,
        dateReference: date,
        value: totalValue,
        description,
        studentId: data.studentId !== undefined ? (data.studentId || null) : sale.get('studentId') || null
      })
    }

    await this._applyStockChanges(saleItems, 'deduct')
    return updated
  }

  /**
   * Exclui venda, devolve estoque e remove lançamento financeiro.
   */
  async deleteSale(id) {
    const sale = await this.repository.findById(id)
    const items = sale.get('items') || []
    await this._applyStockChanges(items, 'restore')

    const financialEntryId = sale.get('financialEntryId')
    if (financialEntryId) {
      try {
        await this.financialRepository.delete(financialEntryId)
      } catch (_) {}
    }

    await this.repository.delete(id)
  }
}

// Export service instances
export const itemCategoryService = new ItemCategoryService(itemCategoryRepository, productRepository)
export const financialCategoryService = new FinancialCategoryService(financialCategoryRepository, financialEntryRepository)
export const studentService = new StudentService(studentRepository)
export const crewService = new CrewService(crewRepository)
export const teacherService = new TeacherService(userRepository, crewRepository)
export const registerService = new RegisterService(registerRepository)
export const financialEntryService = new FinancialEntryService(financialEntryRepository)
export const paymentService = new PaymentService(paymentRepository)
export const authService = new AuthService(userRepository)
export const productService = new ProductService(productRepository)
export const saleService = new SaleService(saleRepository, productRepository, financialEntryRepository)

// Export repositories for direct access if needed
export { userRepository }
