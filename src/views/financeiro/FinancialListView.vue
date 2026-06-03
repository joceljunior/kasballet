<template>
  <div class="space-y-6 pb-20 md:pb-6">
    <AppLoading v-if="pageLoading" card message="Carregando lançamentos..." />

    <template v-else>
    <div class="flex flex-col md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Lançamentos</h1>
        <p class="text-gray-600 mt-1">Entradas e saídas</p>
      </div>
      <div class="flex flex-wrap gap-2 mt-4 md:mt-0">
        <button type="button" class="btn-secondary" @click="monthCompareOpen = true">Comparativo</button>
        <router-link to="/financeiro" class="btn-secondary">Voltar</router-link>
        <router-link to="/financeiro/categorias" class="btn-secondary">Categorias</router-link>
        <router-link to="/financeiro/lancamentos/novo" class="btn-primary">Novo Lançamento</router-link>
      </div>
    </div>

    <!-- Filtros -->
    <div class="card">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <StudentFilterSelect v-model="filterStudentId" @change="applyFilters" />
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
          <select v-model="filterType" @change="applyFilters" class="input">
            <option value="">Todos</option>
            <option value="entrada">Entrada</option>
            <option value="saida">Saída</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
          <select v-model="filterStatus" @change="applyFilters" class="input">
            <option value="">Todos</option>
            <option value="pendente">Pendente</option>
            <option value="efetivado">Efetivado</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
          <select v-model="filterSubtype" @change="applyFilters" class="input">
            <option value="">Todos</option>
            <option v-for="s in filterSubtypes" :key="`${filterType}-${s.value}-${s.label}`" :value="s.value">
              {{ s.label }}
            </option>
          </select>
        </div>
      </div>
      <div class="flex flex-wrap items-end gap-4">
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Data de</label>
          <input v-model="filterDateFrom" type="date" class="input w-auto" @change="applyFilters" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Data até</label>
          <input v-model="filterDateTo" type="date" class="input w-auto" @change="applyFilters" />
        </div>
        <button type="button" @click="clearFilters" class="btn-secondary">Limpar</button>
      </div>
    </div>

    <AppLoading v-if="financialStore.loading" card message="Carregando lançamentos..." />

    <template v-else>
    <!-- Saldo Efetivo e Projetado (respeitam o filtro de data) -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="card">
        <h2 class="text-base font-semibold text-gray-900 mb-2">Saldo efetivo</h2>
        <p class="text-xs text-gray-500 mb-3">Apenas lançamentos efetivados no período filtrado.</p>
        <div class="grid grid-cols-3 gap-2 text-center">
          <div>
            <p class="text-xs text-gray-500">Entradas</p>
            <p class="text-lg font-bold text-green-700">{{ formatMoney(financialStore.totals.totalEntradas) }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500">Saídas</p>
            <p class="text-lg font-bold text-red-700">{{ formatMoney(financialStore.totals.totalSaidas) }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-500">Saldo</p>
            <p class="text-lg font-bold" :class="financialStore.totals.saldo >= 0 ? 'text-green-700' : 'text-red-700'">
              {{ formatMoney(financialStore.totals.saldo) }}
            </p>
          </div>
        </div>
      </div>
      <div class="card border-amber-200 bg-amber-50/50">
        <h2 class="text-base font-semibold text-gray-900 mb-2">Saldo projetado</h2>
        <p class="text-xs text-gray-500 mb-3">Todos os lançamentos (pendentes + efetivados) no período filtrado.</p>
        <div class="grid grid-cols-3 gap-2 text-center">
          <div>
            <p class="text-xs text-gray-600">Entradas (proj.)</p>
            <p class="text-lg font-bold text-green-700">{{ formatMoney(financialStore.totals.totalEntradasProjetado) }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-600">Saídas (proj.)</p>
            <p class="text-lg font-bold text-red-700">{{ formatMoney(financialStore.totals.totalSaidasProjetado) }}</p>
          </div>
          <div>
            <p class="text-xs text-gray-600">Saldo (proj.)</p>
            <p class="text-lg font-bold" :class="financialStore.totals.saldoProjetado >= 0 ? 'text-green-700' : 'text-red-700'">
              {{ formatMoney(financialStore.totals.saldoProjetado) }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <div v-if="financialStore.entries.length === 0" class="card text-center py-12">
      <CurrencyDollarIcon class="h-12 w-12 mx-auto text-gray-400" />
      <p class="mt-4 text-gray-600">Nenhum lançamento</p>
    </div>

    <div v-else class="card overflow-hidden">
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lançamento</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Referência</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="e in financialStore.entries" :key="e.id" class="hover:bg-gray-50">
              <td class="px-4 py-3 text-sm text-gray-900">{{ formatDateBR(e.get('date')) || '-' }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ formatDateBR(e.get('dateReference')) || '-' }}</td>
              <td class="px-4 py-3 text-sm">
                <span :class="e.get('type') === 'entrada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'" class="px-2 py-0.5 text-xs font-medium rounded-full">
                  {{ subtypeLabel(e.get('type'), e.get('subtype')) }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm">
                <span :class="(e.get('status') === 'pendente') ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-800'" class="px-2 py-0.5 text-xs font-medium rounded-full">
                  {{ (e.get('status') === 'pendente') ? 'Pendente' : 'Efetivado' }}
                </span>
              </td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ getDescriptionOrRef(e) }}</td>
              <td class="px-4 py-3 text-sm text-right font-medium" :class="e.get('type') === 'entrada' ? 'text-green-700' : 'text-red-700'">
                {{ e.get('type') === 'entrada' ? '+' : '-' }} {{ formatMoney(e.get('value')) }}
              </td>
              <td class="px-4 py-3 text-sm text-right">
                <router-link :to="`/financeiro/lancamentos/${e.id}/edit`" class="text-green-600 hover:underline mr-3">Editar</router-link>
                <button type="button" @click="toDelete = e" class="text-red-600 hover:underline">Excluir</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border-t border-gray-200 bg-gray-50">
        <p class="text-sm text-gray-600">
          <template v-if="totalCount > 0">
            Mostrando {{ rangeStart }}–{{ rangeEnd }} de {{ totalCount }} lançamento{{ totalCount === 1 ? '' : 's' }}
          </template>
          <template v-else>Nenhum lançamento</template>
        </p>
        <div v-if="totalPages > 1" class="flex items-center gap-2">
          <button
            type="button"
            class="btn-secondary text-sm py-1.5 px-3 disabled:opacity-50"
            :disabled="financialStore.loading || financialStore.currentPage === 0"
            @click="goPrevPage"
          >
            Anterior
          </button>
          <span class="text-sm text-gray-700 whitespace-nowrap">
            Página {{ financialStore.currentPage + 1 }} de {{ totalPages }}
          </span>
          <button
            type="button"
            class="btn-secondary text-sm py-1.5 px-3 disabled:opacity-50"
            :disabled="financialStore.loading || financialStore.currentPage >= totalPages - 1"
            @click="goNextPage"
          >
            Próxima
          </button>
        </div>
      </div>
    </div>
    </template>

    <div v-if="toDelete" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" @click.self="toDelete = null">
      <div class="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
        <p class="text-gray-700">Excluir este lançamento?</p>
        <div class="flex gap-3 mt-6">
          <button type="button" @click="doDelete" class="btn-primary flex-1">Excluir</button>
          <button type="button" @click="toDelete = null" class="btn-secondary flex-1">Cancelar</button>
        </div>
      </div>
    </div>
    </template>
  </div>

  <FinancialMonthCompareModal
    :open="monthCompareOpen"
    :student-id="filterStudentId"
    @close="monthCompareOpen = false"
  />
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useFinancialStore } from '../../stores/financial'
import { useFinancialCategoryStore } from '../../stores/financialCategory'
import { studentService, userRepository } from '../../services/index.js'
import { formatDateBR } from '../../utils/date.js'
import { CurrencyDollarIcon } from '@heroicons/vue/24/outline'
import StudentFilterSelect from '../../components/common/StudentFilterSelect.vue'
import AppLoading from '../../components/common/AppLoading.vue'
import FinancialMonthCompareModal from '../../components/financeiro/FinancialMonthCompareModal.vue'

const financialStore = useFinancialStore()
const categoryStore = useFinancialCategoryStore()
const pageLoading = ref(true)
const monthCompareOpen = ref(false)
const filterStudentId = ref('')
const filterType = ref('')
const filterStatus = ref('')
const filterSubtype = ref('')
const filterDateFrom = ref('')
const filterDateTo = ref('')
const studentMap = ref({})
const teacherMap = ref({})
const toDelete = ref(null)

const filterSubtypes = computed(() => categoryStore.filterOptions(filterType.value))

const totalCount = computed(() => financialStore.totalCount)
const totalPages = computed(() => Math.max(1, Math.ceil(totalCount.value / financialStore.pageSize)))
const rangeStart = computed(() => {
  if (totalCount.value === 0) return 0
  return financialStore.currentPage * financialStore.pageSize + 1
})
const rangeEnd = computed(() => {
  if (totalCount.value === 0) return 0
  return Math.min(totalCount.value, (financialStore.currentPage + 1) * financialStore.pageSize)
})

function formatMoney(v) {
  const n = Number(v)
  return isNaN(n) ? '0,00' : n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function subtypeLabel(type, subtype) {
  return categoryStore.labelFor(type, subtype)
}

function getDescriptionOrRef(e) {
  const d = e.get('description')
  if (d && String(d).trim()) return String(d).trim()
  if (e.get('studentId')) return studentMap.value[e.get('studentId')]?.get('name') || e.get('studentId')
  if (e.get('teacherId')) return teacherMap.value[e.get('teacherId')]?.get('username') || e.get('teacherId')
  return '—'
}

async function loadMaps() {
  const entries = financialStore.entries
  const sIds = [...new Set(entries.map((x) => x.get('studentId')).filter(Boolean))]
  const tIds = [...new Set(entries.map((x) => x.get('teacherId')).filter(Boolean))]
  try {
    const [students, teachers] = await Promise.all([
      sIds.length ? studentService.getStudentsByIds(sIds) : [],
      tIds.length ? userRepository.findByIds(tIds) : []
    ])
    studentMap.value = Object.fromEntries((students || []).map((s) => [s.id, s]))
    teacherMap.value = Object.fromEntries((teachers || []).map((t) => [t.id, t]))
  } catch (_) {
    studentMap.value = {}
    teacherMap.value = {}
  }
}

function syncFromStore() {
  const f = financialStore.filters
  filterStudentId.value = f.studentId || ''
  filterType.value = f.type || ''
  filterStatus.value = f.status || ''
  filterSubtype.value = f.subtype || ''
  filterDateFrom.value = f.dateFrom || ''
  filterDateTo.value = f.dateTo || ''
}

async function applyFilters() {
  const f = {}
  if (filterStudentId.value) f.studentId = filterStudentId.value
  if (filterType.value) f.type = filterType.value
  if (filterStatus.value) f.status = filterStatus.value
  if (filterSubtype.value) f.subtype = filterSubtype.value
  if (filterDateFrom.value) f.dateFrom = filterDateFrom.value
  if (filterDateTo.value) f.dateTo = filterDateTo.value
  await financialStore.setFilters(f)
  await loadMaps()
}

function clearFilters() {
  filterStudentId.value = ''
  filterType.value = ''
  filterStatus.value = ''
  filterSubtype.value = ''
  filterDateFrom.value = ''
  filterDateTo.value = ''
  applyFilters()
}

async function doDelete() {
  if (!toDelete.value) return
  try {
    await financialStore.deleteEntry(toDelete.value.id)
    toDelete.value = null
    await loadMaps()
  } catch (_) {}
}

async function goPrevPage() {
  await financialStore.prevPage()
  await loadMaps()
}

async function goNextPage() {
  await financialStore.nextPage()
  await loadMaps()
}

watch(() => financialStore.entries, () => loadMaps(), { deep: true })

watch(filterType, () => {
  if (!categoryStore.isValidForType(filterType.value, filterSubtype.value)) {
    filterSubtype.value = ''
  }
})

onMounted(async () => {
  try {
    await categoryStore.load()
    syncFromStore()
    await applyFilters()
  } finally {
    pageLoading.value = false
  }
})
</script>
