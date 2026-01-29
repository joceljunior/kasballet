<template>
  <div class="space-y-6 pb-20 md:pb-6">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">
          Olá, {{ authStore.user?.get('username') }}!
        </h1>
        <p class="text-gray-600 mt-1">Bem-vindo ao sistema de gestão</p>
      </div>

      <!-- Master Dashboard -->
      <div v-if="authStore.isMaster" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Total de Alunos</p>
              <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats.totalStudents || 0 }}</p>
            </div>
            <div class="bg-blue-100 p-3 rounded-full">
              <UserGroupIcon class="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>

        <div class="card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Turmas Ativas</p>
              <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats.totalCrews || 0 }}</p>
            </div>
            <div class="bg-green-100 p-3 rounded-full">
              <AcademicCapIcon class="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        <div class="card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Professores</p>
              <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats.totalTeachers || 0 }}</p>
            </div>
            <div class="bg-purple-100 p-3 rounded-full">
              <UserIcon class="h-8 w-8 text-purple-600" />
            </div>
          </div>
        </div>

        <div class="card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Alunos Pendentes</p>
              <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats.pendingStudents || 0 }}</p>
            </div>
            <div class="bg-yellow-100 p-3 rounded-full">
              <ClockIcon class="h-8 w-8 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      <!-- Financeiro (Master) -->
      <div v-if="authStore.isMaster" class="space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900">Financeiro</h2>
          <router-link to="/financeiro" class="text-sm text-green-600 hover:underline font-medium">Ver detalhes</router-link>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="card">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Saldo Efetivo</p>
                <p class="text-2xl font-bold mt-1" :class="(stats.financial?.saldo ?? 0) >= 0 ? 'text-green-700' : 'text-red-700'">
                  {{ formatMoney(stats.financial?.saldo ?? 0) }}
                </p>
                <p class="text-xs text-gray-500 mt-1">Só lançamentos efetivados</p>
              </div>
              <div class="bg-green-100 p-3 rounded-full">
                <CurrencyDollarIcon class="h-8 w-8 text-green-600" />
              </div>
            </div>
          </div>
          <div class="card border-amber-200 bg-amber-50/50">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-sm text-gray-600">Saldo Projetado</p>
                <p class="text-2xl font-bold mt-1" :class="(stats.financial?.saldoProjetado ?? 0) >= 0 ? 'text-green-700' : 'text-red-700'">
                  {{ formatMoney(stats.financial?.saldoProjetado ?? 0) }}
                </p>
                <p class="text-xs text-gray-500 mt-1">Pendentes + efetivados</p>
              </div>
              <div class="bg-amber-100 p-3 rounded-full">
                <BanknotesIcon class="h-8 w-8 text-amber-600" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Teacher Dashboard -->
      <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Minhas Turmas</p>
              <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats.myCrews || 0 }}</p>
            </div>
            <div class="bg-green-100 p-3 rounded-full">
              <AcademicCapIcon class="h-8 w-8 text-green-600" />
            </div>
          </div>
        </div>

        <div class="card">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-gray-600">Chamadas Hoje</p>
              <p class="text-2xl font-bold text-gray-900 mt-1">{{ stats.todayRegisters || 0 }}</p>
            </div>
            <div class="bg-blue-100 p-3 rounded-full">
              <ClipboardDocumentListIcon class="h-8 w-8 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="card">
        <h2 class="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <router-link
            v-if="authStore.isMaster"
            to="/alunos/novo"
            class="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <UserPlusIcon class="h-8 w-8 text-green-600 mb-2" />
            <span class="text-sm font-medium text-gray-700">Novo Aluno</span>
          </router-link>
          <router-link
            v-if="authStore.isMaster"
            to="/turmas/nova"
            class="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <AcademicCapIcon class="h-8 w-8 text-blue-600 mb-2" />
            <span class="text-sm font-medium text-gray-700">Nova Turma</span>
          </router-link>
          <router-link
            to="/chamadas/nova"
            class="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <ClipboardDocumentListIcon class="h-8 w-8 text-purple-600 mb-2" />
            <span class="text-sm font-medium text-gray-700">Nova Chamada</span>
          </router-link>
          <router-link
            v-if="authStore.isMaster"
            to="/alunos/pendentes"
            class="flex flex-col items-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
          >
            <ClockIcon class="h-8 w-8 text-yellow-600 mb-2" />
            <span class="text-sm font-medium text-gray-700">Pendentes</span>
          </router-link>
        </div>
      </div>
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { studentService, crewService, userRepository, financialEntryService } from '../../services/index.js'
import {
  UserGroupIcon,
  AcademicCapIcon,
  UserIcon,
  ClockIcon,
  ClipboardDocumentListIcon,
  UserPlusIcon,
  CurrencyDollarIcon,
  BanknotesIcon
} from '@heroicons/vue/24/outline'

const authStore = useAuthStore()
const stats = ref({
  totalStudents: 0,
  totalCrews: 0,
  totalTeachers: 0,
  pendingStudents: 0,
  myCrews: 0,
  todayRegisters: 0,
  financial: null
})

function formatMoney(v) {
  const n = Number(v)
  return isNaN(n) ? '0,00' : n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

onMounted(async () => {
  try {
    if (authStore.isMaster) {
      // Load master stats - usando contagens reais do banco + financeiro
      const [totalStudents, totalCrews, teachers, pendingStudents, financial] = await Promise.all([
        studentService.countAllStudents(),
        crewService.countActiveCrews(),
        userRepository.findByRole('Professora', 1000, 0),
        studentService.countPendingStudents(),
        financialEntryService.getTotals({}).catch(() => ({ saldo: 0, saldoProjetado: 0 }))
      ])
      
      stats.value = {
        totalStudents,
        totalCrews,
        totalTeachers: teachers.length,
        pendingStudents,
        financial
      }
    } else {
      // Load teacher stats
      const userId = authStore.user?.id
      if (userId) {
        const crews = await crewService.getCrewsByTeacher(userId, 0, 100)
        stats.value = {
          myCrews: crews.length,
          todayRegisters: 0 // TODO: Implement
        }
      }
    }
  } catch (error) {
    console.error('Error loading dashboard stats:', error)
  }
})
</script>
