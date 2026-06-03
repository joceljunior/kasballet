<template>
  <div class="space-y-6 pb-20 md:pb-6">
      <AppLoading v-if="pageLoading" card message="Carregando painel..." />

      <template v-else>
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

      <!-- Alunas Inadimplentes do Mês (Master) -->
      <div v-if="authStore.isMaster && unpaidStudents.length > 0" class="space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ExclamationTriangleIcon class="w-5 h-5 text-amber-500" />
            Mensalidades Pendentes - {{ currentMonthName }}
          </h2>
          <span class="text-sm text-gray-500">{{ unpaidStudents.length }} aluna(s)</span>
        </div>
        
        <div class="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div
              v-for="item in displayedUnpaidStudents"
              :key="item.student.id"
              class="bg-white rounded-lg border border-amber-100 p-3 flex items-center gap-3 hover:shadow-md transition-shadow"
            >
              <!-- Foto -->
              <div class="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                <img v-if="item.student.get('photo')" :src="item.student.get('photo').url()" alt="" class="w-full h-full object-cover" />
                <UserCircleIcon v-else class="w-8 h-8 text-gray-400" />
              </div>
              
              <!-- Info -->
              <div class="flex-1 min-w-0">
                <router-link :to="`/alunos/${item.student.id}`" class="font-medium text-gray-900 hover:text-green-600 truncate block">
                  {{ item.student.get('name') }}
                </router-link>
                        <div class="flex items-center gap-2 mt-1">
                  <!-- Tipo de pendência -->
                  <span
                    :class="getPendencyClass(item.pendencyType)"
                    class="text-xs px-2 py-0.5 rounded-full font-medium"
                  >
                    {{ getPendencyLabel(item.pendencyType) }}
                  </span>
                  <!-- Valor -->
                  <span v-if="item.student.get('valorMensalidade')" class="text-xs text-gray-500">
                    R$ {{ formatMoney(item.student.get('valorMensalidade')) }}
                  </span>
                </div>
              </div>
              
              <!-- WhatsApp/Telefone -->
              <a
                v-if="item.student.get('telephone')"
                :href="`https://wa.me/55${item.student.get('telephone').replace(/\D/g, '')}`"
                target="_blank"
                class="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                title="Enviar WhatsApp"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
            </div>
          </div>
          <div v-if="hasMoreUnpaidStudents" class="flex justify-center pt-4">
            <button
              type="button"
              class="btn-secondary text-sm"
              @click="showAllUnpaidStudents = true"
            >
              Ver mais ({{ remainingUnpaidCount }} aluna(s))
            </button>
          </div>
        </div>
      </div>

      <!-- Frequência: ausências e turmas sem chamada -->
      <div v-if="showAttendanceSection" class="space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ClipboardDocumentListIcon class="w-5 h-5 text-red-500" />
            Frequência e Chamadas
          </h2>
          <span class="text-sm text-gray-500">
            {{ absentStudents.length }} ausência(s) · {{ crewsWithoutRecentRegister.length }} turma(s) sem chamada
          </span>
        </div>

        <div class="bg-red-50 border border-red-200 rounded-xl p-4">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            <!-- Coluna esquerda: alunas ausentes nas últimas 3 aulas -->
            <div class="space-y-3 md:pr-6 md:border-r md:border-red-200 min-w-0">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-semibold text-gray-900">Ausentes nas últimas 3 aulas (turmas ativas)</h3>
                <span class="text-xs text-gray-500">{{ absentStudents.length }} aluna(s)</span>
              </div>

              <div v-if="absentStudents.length === 0" class="bg-white rounded-lg border border-red-100 p-4 text-sm text-gray-500 text-center">
                Nenhuma aluna ausente nas últimas 3 chamadas das turmas.
              </div>

              <div v-else class="space-y-2">
                <div
                  v-for="item in displayedAbsentStudents"
                  :key="`${item.student.id}-${item.crew.id}`"
                  class="bg-white rounded-lg border border-red-100 p-3 flex items-center gap-3 hover:shadow-md transition-shadow"
                >
                  <div class="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <img v-if="item.student.get('photo')" :src="item.student.get('photo').url()" alt="" class="w-full h-full object-cover" />
                    <UserCircleIcon v-else class="w-8 h-8 text-gray-400" />
                  </div>

                  <div class="flex-1 min-w-0">
                    <router-link :to="`/alunos/${item.student.id}`" class="font-medium text-gray-900 hover:text-green-600 truncate block">
                      {{ item.student.get('name') }}
                    </router-link>
                    <div class="flex items-center gap-2 mt-1 flex-wrap">
                      <router-link
                        :to="`/turmas/${item.crew.id}`"
                        class="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-800 hover:bg-red-200"
                      >
                        {{ item.crewName }}
                      </router-link>
                      <span class="text-xs text-gray-500">3 faltas seguidas</span>
                    </div>
                  </div>

                  <a
                    v-if="item.student.get('telephone')"
                    :href="`https://wa.me/55${item.student.get('telephone').replace(/\D/g, '')}`"
                    target="_blank"
                    class="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                    title="Enviar WhatsApp"
                  >
                    <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  </a>
                </div>

                <div v-if="hasMoreAbsentStudents" class="flex justify-center pt-2">
                  <button
                    type="button"
                    class="btn-secondary text-sm"
                    @click="showAllAbsentStudents = true"
                  >
                    Ver mais ({{ remainingAbsentCount }} aluna(s))
                  </button>
                </div>
              </div>
            </div>

            <!-- Coluna direita: turmas sem chamada na última semana -->
            <div class="space-y-3 min-w-0 pt-4 md:pt-0 border-t md:border-t-0 border-red-200">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-semibold text-gray-900">Turmas ativas sem chamada na última semana</h3>
                <span class="text-xs text-gray-500">{{ crewsWithoutRecentRegister.length }} turma(s)</span>
              </div>

              <div v-if="crewsWithoutRecentRegister.length === 0" class="bg-white rounded-lg border border-red-100 p-4 text-sm text-gray-500 text-center">
                Todas as turmas tiveram chamada nos últimos 7 dias.
              </div>

              <div v-else class="space-y-2">
                <div
                  v-for="item in displayedCrewsWithoutRegister"
                  :key="item.crew.id"
                  class="bg-white rounded-lg border border-red-100 p-3 flex items-center gap-3 hover:shadow-md transition-shadow"
                >
                  <div class="bg-red-100 p-2.5 rounded-full flex-shrink-0">
                    <AcademicCapIcon class="w-6 h-6 text-red-600" />
                  </div>

                  <div class="flex-1 min-w-0">
                    <router-link :to="`/turmas/${item.crew.id}`" class="font-medium text-gray-900 hover:text-green-600 truncate block">
                      {{ item.crewName }}
                    </router-link>
                    <p class="text-xs text-red-600 mt-1">Sem chamada nos últimos 7 dias</p>
                  </div>

                  <router-link
                    :to="`/chamadas/nova`"
                    class="text-xs px-3 py-1.5 rounded-lg font-medium bg-red-600 text-white hover:bg-red-700 transition-colors flex-shrink-0"
                  >
                    Nova chamada
                  </router-link>
                </div>

                <div v-if="hasMoreCrewsWithoutRegister" class="flex justify-center pt-2">
                  <button
                    type="button"
                    class="btn-secondary text-sm"
                    @click="showAllCrewsWithoutRegister = true"
                  >
                    Ver mais ({{ remainingCrewsWithoutRegisterCount }} turma(s))
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Contratos Vencendo (Semestral/Anual) -->
      <div v-if="authStore.isMaster && expiringContracts.length > 0" class="space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ClockIcon class="w-5 h-5 text-orange-500" />
            Contratos Próximos do Vencimento
          </h2>
          <span class="text-sm text-gray-500">{{ expiringContracts.length }} aluna(s)</span>
        </div>
        
        <div class="bg-orange-50 border border-orange-200 rounded-xl p-4">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div
              v-for="item in expiringContracts"
              :key="item.student.id"
              class="bg-white rounded-lg border border-orange-100 p-3 flex items-center gap-3 hover:shadow-md transition-shadow"
            >
              <!-- Foto -->
              <div class="w-12 h-12 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
                <img v-if="item.student.get('photo')" :src="item.student.get('photo').url()" alt="" class="w-full h-full object-cover" />
                <UserCircleIcon v-else class="w-8 h-8 text-gray-400" />
              </div>
              
              <!-- Info -->
              <div class="flex-1 min-w-0">
                <router-link :to="`/alunos/${item.student.id}`" class="font-medium text-gray-900 hover:text-green-600 truncate block">
                  {{ item.student.get('name') }}
                </router-link>
                <div class="flex items-center gap-2 mt-1">
                  <span 
                    :class="item.type === 'anual' ? 'bg-green-100 text-green-800' : 'bg-purple-100 text-purple-800'"
                    class="text-xs px-2 py-0.5 rounded-full font-medium"
                  >
                    {{ item.type === 'anual' ? 'Anual' : 'Semestral' }}
                  </span>
                  <span class="text-xs text-orange-600 font-medium">Vence em breve</span>
                </div>
              </div>
              
              <!-- WhatsApp -->
              <a
                v-if="item.student.get('telephone')"
                :href="`https://wa.me/55${item.student.get('telephone').replace(/\D/g, '')}`"
                target="_blank"
                class="p-2 text-green-600 hover:bg-green-50 rounded-full transition-colors"
                title="Enviar WhatsApp"
              >
                <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                </svg>
              </a>
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
      </template>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { studentService, crewService, registerService, userRepository } from '../../services/index.js'
import {
  UserGroupIcon,
  AcademicCapIcon,
  UserIcon,
  ClockIcon,
  ClipboardDocumentListIcon,
  UserPlusIcon,
  ExclamationTriangleIcon,
  UserCircleIcon
} from '@heroicons/vue/24/outline'

import AppLoading from '../../components/common/AppLoading.vue'

const authStore = useAuthStore()
const pageLoading = ref(true)
const stats = ref({
  totalStudents: 0,
  totalCrews: 0,
  totalTeachers: 0,
  pendingStudents: 0,
  myCrews: 0,
  todayRegisters: 0
})
const unpaidStudents = ref([])
const expiringContracts = ref([])
const absentStudents = ref([])
const crewsWithoutRecentRegister = ref([])
const UNPAID_INITIAL_LIMIT = 12
const ATTENDANCE_INITIAL_LIMIT = 8
const showAllUnpaidStudents = ref(false)
const showAllAbsentStudents = ref(false)
const showAllCrewsWithoutRegister = ref(false)

const showAttendanceSection = computed(() => authStore.isMaster || authStore.isTeacher)

const displayedUnpaidStudents = computed(() => {
  if (showAllUnpaidStudents.value) return unpaidStudents.value
  return unpaidStudents.value.slice(0, UNPAID_INITIAL_LIMIT)
})

const hasMoreUnpaidStudents = computed(
  () => !showAllUnpaidStudents.value && unpaidStudents.value.length > UNPAID_INITIAL_LIMIT
)

const remainingUnpaidCount = computed(
  () => unpaidStudents.value.length - UNPAID_INITIAL_LIMIT
)

const displayedAbsentStudents = computed(() => {
  if (showAllAbsentStudents.value) return absentStudents.value
  return absentStudents.value.slice(0, ATTENDANCE_INITIAL_LIMIT)
})

const hasMoreAbsentStudents = computed(
  () => !showAllAbsentStudents.value && absentStudents.value.length > ATTENDANCE_INITIAL_LIMIT
)

const remainingAbsentCount = computed(
  () => absentStudents.value.length - ATTENDANCE_INITIAL_LIMIT
)

const displayedCrewsWithoutRegister = computed(() => {
  if (showAllCrewsWithoutRegister.value) return crewsWithoutRecentRegister.value
  return crewsWithoutRecentRegister.value.slice(0, ATTENDANCE_INITIAL_LIMIT)
})

const hasMoreCrewsWithoutRegister = computed(
  () => !showAllCrewsWithoutRegister.value && crewsWithoutRecentRegister.value.length > ATTENDANCE_INITIAL_LIMIT
)

const remainingCrewsWithoutRegisterCount = computed(
  () => crewsWithoutRecentRegister.value.length - ATTENDANCE_INITIAL_LIMIT
)

// Nome do mês anterior (para exibir inadimplentes do mês passado)
const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
const now = new Date()
const previousMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1
const currentMonthName = monthNames[previousMonth]

function formatMoney(v) {
  const n = Number(v)
  return isNaN(n) ? '0,00' : n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatTipoPlano(tipo) {
  const map = {
    'PIX': 'Mensal',
    'Mensal': 'Mensal',
    'MensalRecorrente': 'Mensal Recorrente',
    'RecorrenteMensal': 'Mensal Recorrente',
    'RecorrenteAnual': 'Anual',
    'Anual': 'Anual',
    'RecorrenteSemestral': 'Semestral',
    'Semestral': 'Semestral'
  }
  return map[tipo] || tipo || 'Não definido'
}

function getTipoPlanoClass(tipo) {
  // Normalizar para as novas nomenclaturas
  const normalized = {
    'PIX': 'Mensal',
    'MensalRecorrente': 'MensalRecorrente',
    'RecorrenteMensal': 'MensalRecorrente',
    'RecorrenteAnual': 'Anual',
    'RecorrenteSemestral': 'Semestral'
  }[tipo] || tipo
  
  const classes = {
    'Mensal': 'bg-blue-100 text-blue-800',
    'MensalRecorrente': 'bg-indigo-100 text-indigo-800',
    'Semestral': 'bg-purple-100 text-purple-800',
    'Anual': 'bg-green-100 text-green-800'
  }
  return classes[normalized] || 'bg-gray-100 text-gray-800'
}

function getPendencyLabel(pendencyType) {
  const labels = {
    mensalidade_em_atraso: 'Mensalidade em atraso',
    semestral_pendente: 'Pag. Semestral pendente',
    anual_pendente: 'Pag. Anual pendente'
  }
  return labels[pendencyType] || 'Pendente'
}

function getPendencyClass(pendencyType) {
  const classes = {
    mensalidade_em_atraso: 'bg-red-100 text-red-800',
    semestral_pendente: 'bg-purple-100 text-purple-800',
    anual_pendente: 'bg-amber-100 text-amber-800'
  }
  return classes[pendencyType] || 'bg-amber-100 text-amber-800'
}

onMounted(async () => {
  try {
    if (authStore.isMaster) {
      // Load master stats - usando contagens reais do banco + financeiro
      const [totalStudents, totalCrews, teachers, pendingStudents, unpaid, expiring, attendance] = await Promise.all([
        studentService.countActiveStudents(),
        crewService.countActiveCrews(),
        userRepository.findByRole('Professora', 1000, 0),
        studentService.countPendingStudents(),
        studentService.getStudentsWithoutPaymentThisMonth(),
        studentService.getStudentsWithExpiringContracts(),
        registerService.getDashboardAttendanceInsights()
      ])
      
      stats.value = {
        totalStudents,
        totalCrews,
        totalTeachers: teachers.length,
        pendingStudents
      }
      
      unpaidStudents.value = unpaid
      expiringContracts.value = expiring
      absentStudents.value = attendance.absentStudents
      crewsWithoutRecentRegister.value = attendance.crewsWithoutRecentRegister
    } else {
      // Load teacher stats
      const userId = authStore.user?.id
      if (userId) {
        const crews = await crewService.getCrewsByTeacher(userId, 0, 100, { active: true })
        const crewIds = crews.map((c) => c.id)
        const [attendance] = await Promise.all([
          registerService.getDashboardAttendanceInsights(crewIds)
        ])
        stats.value = {
          myCrews: crews.length,
          todayRegisters: 0 // TODO: Implement
        }
        absentStudents.value = attendance.absentStudents
        crewsWithoutRecentRegister.value = attendance.crewsWithoutRecentRegister
      }
    }
  } catch (error) {
    console.error('Error loading dashboard stats:', error)
  } finally {
    pageLoading.value = false
  }
})
</script>
