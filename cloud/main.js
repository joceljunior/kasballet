/**
 * Cloud Code para Kas Ballet - Back4App
 *
 * Funções:
 * - createTeacher: cria _User com Role 'Professora' e active (apenas Master)
 * - updateTeacher: atualiza email, senha e/ou active de uma Professora (apenas Master)
 * - deleteTeacher: exclui Professora, zera teacherId nas Crew (apenas Master)
 *
 * _User: adicione a coluna "active" (Boolean, opcional). default true = ativa.
 */

Parse.Cloud.define('createTeacher', async (request) => {
  const user = request.user
  if (!user || user.get('Role') !== 'Master') {
    throw new Error('Apenas Master pode criar professoras.')
  }
  const { username, password, email, active } = request.params
  if (!username || !password) {
    throw new Error('username e password são obrigatórios.')
  }
  if (!email || (typeof email === 'string' && email.trim() === '')) {
    throw new Error('E-mail é obrigatório.')
  }
  const u = new Parse.User()
  u.set('username', username)
  u.set('password', password)
  u.set('email', String(email).trim())
  u.set('Role', 'Professora')
  u.set('active', active !== false)
  await u.signUp(null, { useMasterKey: true })
  return { id: u.id }
})

Parse.Cloud.define('updateTeacher', async (request) => {
  const user = request.user
  if (!user || user.get('Role') !== 'Master') {
    throw new Error('Apenas Master pode atualizar professoras.')
  }
  const { userId, email, password, active } = request.params
  if (!userId) throw new Error('userId é obrigatório.')
  const u = await new Parse.Query(Parse.User).get(userId, { useMasterKey: true })
  if (!u) throw new Error('Professora não encontrada.')
  const role = u.get('Role')
  if (!role || String(role).toLowerCase() !== 'professora') {
    throw new Error('Só é possível atualizar usuários com Role Professora. (Role atual: ' + (role || 'vazio') + ')')
  }
  if (active === false) {
    const q = new Parse.Query('Crew')
    q.equalTo('teacherId', userId)
    q.limit(10000)
    const crews = await q.find({ useMasterKey: true })
    for (const c of crews) {
      c.set('teacherId', null)
      await c.save(null, { useMasterKey: true })
    }
  }
  if (email !== undefined && email != null && String(email).trim() !== '') {
    u.set('email', String(email).trim())
  }
  if (password !== undefined && password != null && String(password).length > 0) {
    u.set('password', password)
  }
  if (active !== undefined) u.set('active', active)
  await u.save(null, { useMasterKey: true })
  return { ok: true }
})

Parse.Cloud.define('deleteTeacher', async (request) => {
  const user = request.user
  if (!user || user.get('Role') !== 'Master') {
    throw new Error('Apenas Master pode excluir professoras.')
  }
  const { userId } = request.params
  if (!userId) throw new Error('userId é obrigatório.')
  const u = await new Parse.Query(Parse.User).get(userId, { useMasterKey: true })
  if (!u) throw new Error('Professora não encontrada.')
  const role = u.get('Role')
  if (!role || String(role).toLowerCase() !== 'professora') {
    throw new Error('Só é possível excluir usuários com Role Professora.')
  }
  const q = new Parse.Query('Crew')
  q.equalTo('teacherId', userId)
  q.limit(10000)
  const crews = await q.find({ useMasterKey: true })
  for (const c of crews) {
    c.set('teacherId', null)
    await c.save(null, { useMasterKey: true })
  }
  await u.destroy({ useMasterKey: true })
  return { ok: true }
})

Parse.Cloud.define('deleteItemCategory', async (request) => {
  const user = request.user
  if (!user || user.get('Role') !== 'Master') {
    throw new Error('Apenas Master pode excluir categorias.')
  }
  const { categoryId } = request.params
  if (!categoryId) throw new Error('categoryId é obrigatório.')

  const category = await new Parse.Query('ItemCategory').get(categoryId, { useMasterKey: true })
  const code = category.get('code')
  const label = category.get('label')

  async function hasProducts(field, value) {
    if (!value) return false
    const q = new Parse.Query('Product')
    q.equalTo(field, value)
    return (await q.limit(1).count({ useMasterKey: true })) > 0
  }

  if (code && (await hasProducts('categoryCode', code) || await hasProducts('category', code))) {
    throw new Error('Existem produtos com esta categoria. Desative-a em vez de excluir.')
  }
  if (label && label !== code && await hasProducts('category', label)) {
    throw new Error('Existem produtos com esta categoria. Desative-a em vez de excluir.')
  }

  await category.destroy({ useMasterKey: true })
  return { ok: true }
})

/* ------------------------------------------------------------------ */
/* Notificações por e-mail do cadastro público (matrícula)            */
/* ------------------------------------------------------------------ */

const TEAM_EMAIL = 'balletkas@gmail.com'
const APP_TIMEZONE = 'America/Sao_Paulo'

// Limite simples (por instância) para evitar abuso das funções públicas
const NOTIFY_WINDOW_MS = 10 * 60 * 1000
const NOTIFY_MAX_PER_WINDOW = 30
let notifyTimestamps = []

function assertNotifyRateLimit() {
  const now = Date.now()
  notifyTimestamps = notifyTimestamps.filter((t) => now - t < NOTIFY_WINDOW_MS)
  if (notifyTimestamps.length >= NOTIFY_MAX_PER_WINDOW) {
    throw new Error('Muitas notificações em pouco tempo. Tente novamente em alguns minutos.')
  }
  notifyTimestamps.push(now)
}

function escapeHtml(value) {
  return String(value == null ? '' : value).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ))
}

function clip(value, max) {
  return String(value == null ? '' : value).slice(0, max)
}

function formatDateTimeBR(date) {
  return new Date(date || Date.now()).toLocaleString('pt-BR', { timeZone: APP_TIMEZONE })
}

function formatDateBR(date) {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
}

function renderRows(rows) {
  const body = rows
    .map(([label, value]) =>
      `<tr><td style="padding:4px 12px 4px 0;color:#6b7280;vertical-align:top">${escapeHtml(label)}</td>` +
      `<td style="padding:4px 0;color:#111827">${escapeHtml(value == null || value === '' ? '-' : value)}</td></tr>`
    )
    .join('')
  return `<table style="border-collapse:collapse;font-family:Arial,sans-serif;font-size:14px">${body}</table>`
}

/**
 * Envia e-mail para a equipe usando o mail adapter do Parse Server
 * (Back4App: configure em Server Settings > Email/Mailgun).
 */
async function sendTeamEmail(subject, html) {
  await Parse.Cloud.sendEmail({
    from: process.env.MAIL_FROM || TEAM_EMAIL,
    to: TEAM_EMAIL,
    subject,
    html
  })
}

/**
 * notifyRegistration({ studentId })
 * Chamada pelo cadastro público logo após a matrícula. Só notifica cadastros
 * pendentes criados nos últimos 15 minutos e apenas uma vez por aluna.
 */
Parse.Cloud.define('notifyRegistration', async (request) => {
  const { studentId } = request.params
  if (!studentId || typeof studentId !== 'string') throw new Error('studentId é obrigatório.')
  assertNotifyRateLimit()

  const student = await new Parse.Query('Student').get(studentId, { useMasterKey: true })
  const ageMs = Date.now() - student.createdAt.getTime()
  if (student.get('active') !== false || ageMs > 15 * 60 * 1000) {
    throw new Error('Cadastro não elegível para notificação.')
  }
  if (student.get('registrationNotifiedAt')) return { ok: true, alreadyNotified: true }

  let crewNames = []
  try {
    const links = await new Parse.Query('StudentCrews')
      .equalTo('studentId', studentId)
      .limit(50)
      .find({ useMasterKey: true })
    const crewIds = links.map((l) => l.get('crewId')).filter(Boolean)
    if (crewIds.length) {
      const crews = await new Parse.Query('Crew').containedIn('objectId', crewIds).find({ useMasterKey: true })
      crewNames = crews.map((c) => [c.get('Name'), c.get('Key')].filter(Boolean).join(' - '))
    }
  } catch (e) {
    console.error('notifyRegistration: erro ao buscar turmas', e)
  }

  const address = [
    student.get('address'),
    student.get('addressNumber'),
    student.get('complement'),
    student.get('addressDistrict'),
    student.get('addressCity')
  ].filter((x) => x !== undefined && x !== null && x !== '').join(', ')

  const html =
    `<h2 style="font-family:Arial,sans-serif;color:#15803d">Nova matrícula efetuada</h2>` +
    `<p style="font-family:Arial,sans-serif">Recebida em ${escapeHtml(formatDateTimeBR(student.createdAt))} pelo link público de cadastro.</p>` +
    renderRows([
      ['Aluna', student.get('name')],
      ['Nascimento', formatDateBR(student.get('birthday'))],
      ['Escola / Série', [student.get('schoolName'), student.get('schoolGrade')].filter(Boolean).join(' / ')],
      ['Alergia', student.get('allergy') || 'Não informada'],
      ['Responsável', `${student.get('nameResponsible') || '-'} (${student.get('relationship') || '-'})`],
      ['E-mail', student.get('email')],
      ['Telefone', student.get('telephone')],
      ['Endereço', address],
      ['Turmas', crewNames.join(', ') || 'Nenhuma selecionada'],
      ['Plano', student.get('tipoPlano')],
      ['Melhor dia de pagamento', student.get('melhorDiaPagamento')],
      ['Uso de imagem', student.get('useImage') ? 'Autorizado' : 'Não autorizado'],
      ['ID do cadastro', student.id]
    ])

  try {
    await sendTeamEmail(`Nova matrícula: ${clip(student.get('name'), 80)}`, html)
  } catch (e) {
    console.error('notifyRegistration: falha ao enviar e-mail', e)
    return { ok: false }
  }

  try {
    student.set('registrationNotifiedAt', new Date())
    await student.save(null, { useMasterKey: true })
  } catch (e) {
    console.error('notifyRegistration: falha ao marcar como notificado', e)
  }
  return { ok: true }
})

/**
 * reportRegistrationError({ reference, step, message, code, technical, form, userAgent, url, partialStudentId })
 * Avisa a equipe quando algo dá errado no cadastro público. Aceita só texto
 * curto (tudo é truncado e escapado) e envia sempre para o e-mail da escola.
 */
Parse.Cloud.define('reportRegistrationError', async (request) => {
  assertNotifyRateLimit()
  const p = request.params || {}
  const form = p.form && typeof p.form === 'object' ? p.form : {}

  const html =
    `<h2 style="font-family:Arial,sans-serif;color:#b91c1c">Erro no cadastro público</h2>` +
    renderRows([
      ['Referência', clip(p.reference, 40)],
      ['Quando', formatDateTimeBR()],
      ['Etapa', clip(p.step, 80)],
      ['Mensagem exibida', clip(p.message, 500)],
      ['Código do erro', clip(p.code, 40)],
      ['Detalhe técnico', clip(p.technical, 1500)],
      ['Cadastro parcial (ID)', clip(p.partialStudentId, 40)],
      ['Aluna', clip(form.name, 120)],
      ['Responsável', clip(form.nameResponsible, 120)],
      ['E-mail', clip(form.email, 120)],
      ['Telefone', clip(form.telephone, 40)],
      ['Navegador', clip(p.userAgent, 300)],
      ['Página', clip(p.url, 300)]
    ])

  try {
    await sendTeamEmail(`[Erro no cadastro] ${clip(p.step, 60)} - ${clip(p.reference, 30)}`, html)
  } catch (e) {
    console.error('reportRegistrationError: falha ao enviar e-mail', e)
    return { ok: false }
  }
  return { ok: true }
})
