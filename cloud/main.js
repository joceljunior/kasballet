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
