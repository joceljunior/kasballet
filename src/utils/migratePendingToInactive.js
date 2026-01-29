/**
 * Script para migrar alunos pendentes para inativos
 * Execute este script uma vez para marcar todos os alunos pendentes atuais como inativos
 * 
 * Uso no console do navegador:
 * import { studentService } from './services/index.js'
 * await studentService.migratePendingToInactive()
 */

import { studentService } from '../services/index.js'

export async function migratePendingToInactive() {
  try {
    const count = await studentService.migratePendingToInactive()
    console.log(`✅ ${count} alunos pendentes foram marcados como inativos`)
    return count
  } catch (error) {
    console.error('❌ Erro ao migrar alunos pendentes:', error)
    throw error
  }
}
