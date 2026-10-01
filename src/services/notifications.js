import Parse from './parse.js'

/**
 * Notificações por e-mail para a equipe (via Cloud Code).
 * Nunca lançam erro: uma falha na notificação não pode atrapalhar o cadastro.
 */

/** Avisa a equipe que uma nova matrícula foi efetuada. */
export async function notifyRegistrationSuccess(studentId) {
  try {
    const result = await Parse.Cloud.run('notifyRegistration', { studentId })
    return result?.ok === true
  } catch (err) {
    console.warn('Não foi possível notificar a matrícula por e-mail:', err)
    return false
  }
}

/** Avisa a equipe que ocorreu um erro no cadastro público. Retorna true se foi enviado. */
export async function reportRegistrationError(payload) {
  try {
    const result = await Parse.Cloud.run('reportRegistrationError', {
      ...payload,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      url: typeof window !== 'undefined' ? window.location.href : ''
    })
    return result?.ok === true
  } catch (err) {
    console.warn('Não foi possível reportar o erro por e-mail:', err)
    return false
  }
}
