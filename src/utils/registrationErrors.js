/**
 * Tradução de erros do cadastro público para mensagens claras ao cliente.
 */

export const SUPPORT_EMAIL = 'balletkas@gmail.com'

/** Etapas do cadastro (usadas na mensagem e no e-mail de suporte). */
export const STEP_LABELS = {
  validacao: 'Validação dos dados',
  carregar_turmas: 'Carregamento das turmas',
  envio_foto: 'Envio da foto',
  criacao_cadastro: 'Gravação do cadastro',
  vinculo_turmas: 'Vínculo com as turmas'
}

export class ValidationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ValidationError'
  }
}

/** Código curto para o cliente informar ao suporte. */
export function generateReference() {
  return `REG-${Date.now().toString(36).toUpperCase()}`
}

function isOffline(err) {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) return true
  const msg = String(err?.message || '').toLowerCase()
  return msg.includes('failed to fetch') || msg.includes('network') || msg.includes('xmlhttprequest')
}

/**
 * Converte um erro (Parse ou comum) em { message, technical, code }.
 * message: texto amigável; technical: detalhe original para suporte.
 */
export function describeRegistrationError(err, step) {
  const code = err?.code
  const raw = String(err?.message || err || 'Erro desconhecido')
  const technical = [code != null ? `código ${code}` : null, raw].filter(Boolean).join(' - ')

  let message
  if (isOffline(err) || code === 100) {
    message = 'Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente.'
  } else if (code === 124) {
    message = 'O servidor demorou demais para responder. Tente novamente em instantes.'
  } else if (code === 155 || code === 159) {
    message = 'Foram feitas muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.'
  } else if (code === 137) {
    message = 'Já existe um cadastro com estes dados.'
  } else if (code === 119 || code === 206 || code === 209) {
    message = 'O sistema não permitiu concluir o cadastro (permissão). Nossa equipe precisa verificar.'
  } else if (code === 111) {
    message = 'Algum campo foi preenchido em um formato que o sistema não aceita. Revise os dados e tente novamente.'
  } else if (step === 'envio_foto') {
    message = 'Não foi possível enviar a foto. Tente outra imagem (JPG ou PNG) ou faça o cadastro sem foto.'
  } else if (step === 'vinculo_turmas') {
    message = 'A matrícula foi registrada, mas não conseguimos vincular as turmas escolhidas. Nossa equipe fará o ajuste.'
  } else {
    message = 'Não foi possível concluir o cadastro por um problema no sistema.'
  }

  return { message, technical, code: code != null ? String(code) : '' }
}

const onlyDigits = (v) => String(v || '').replace(/\D/g, '')

/**
 * Valida o formulário e lança ValidationError com a primeira mensagem encontrada.
 */
export function validateRegistration(form, photoFile) {
  if (String(form.name || '').trim().length < 3) {
    throw new ValidationError('Informe o nome completo da aluna.')
  }
  if (!form.birthday) {
    throw new ValidationError('Informe a data de nascimento da aluna.')
  }
  const birth = new Date(`${form.birthday}T00:00:00`)
  if (isNaN(birth.getTime()) || birth > new Date() || birth.getFullYear() < 1900) {
    throw new ValidationError('A data de nascimento informada é inválida.')
  }
  if (String(form.nameResponsible || '').trim().length < 3) {
    throw new ValidationError('Informe o nome completo do responsável.')
  }
  if (onlyDigits(form.cpf).length !== 11) {
    throw new ValidationError('O CPF do responsável deve ter 11 números.')
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(form.email || '').trim())) {
    throw new ValidationError('Informe um e-mail válido (ex.: nome@email.com).')
  }
  if (onlyDigits(form.telephone).length < 10) {
    throw new ValidationError('Informe o telefone com DDD (mínimo 10 números).')
  }
  if (form.hasAllergy && !String(form.allergy || '').trim()) {
    throw new ValidationError('Descreva a alergia/restrição alimentar da aluna.')
  }
  if (photoFile) {
    if (!String(photoFile.type || '').startsWith('image/')) {
      throw new ValidationError('O arquivo da foto precisa ser uma imagem (JPG ou PNG).')
    }
    if (photoFile.size > 10 * 1024 * 1024) {
      throw new ValidationError('A foto é muito grande (máximo de 10 MB). Escolha uma imagem menor.')
    }
  }
}
