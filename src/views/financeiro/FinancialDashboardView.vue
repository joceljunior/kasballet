<template>
  <div class="space-y-6 pb-20 md:pb-6">
    <AppLoading v-if="pageLoading" card message="Carregando financeiro..." />

    <template v-else>
    <div class="flex flex-col md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Financeiro</h1>
        <p class="text-gray-600 mt-1">Visão geral – filtre por período ou veja os totais gerais</p>
      </div>
      <div class="flex gap-2 mt-4 md:mt-0">
        <button type="button" class="btn-secondary" @click="monthCompareOpen = true">Comparativo</button>
        <router-link to="/financeiro/categorias" class="btn-secondary">Categorias</router-link>
        <router-link to="/financeiro/lancamentos" class="btn-secondary">Ver lançamentos</router-link>
        <router-link to="/financeiro/lancamentos/novo" class="btn-primary">Novo Lançamento</router-link>
      </div>
    </div>

    <!-- Filtros -->
    <div class="card">
      <h2 class="text-base font-semibold text-gray-900 mb-3">Filtrar</h2>
      <div class="flex flex-wrap items-end gap-4">
        <StudentFilterSelect v-model="filterStudentId" @change="applyFilters" />
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Data de</label>
          <input v-model="filterDateFrom" type="date" class="input w-auto" @change="applyFilters" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Data até</label>
          <input v-model="filterDateTo" type="date" class="input w-auto" @change="applyFilters" />
        </div>
        <button type="button" @click="clearFilters" class="btn-secondary">Limpar filtro</button>
      </div>
      <p class="text-xs text-gray-500 mt-2">Deixe em branco para ver os totais gerais.</p>
    </div>

    <AppLoading v-if="financialStore.loading" card message="Atualizando..." />

    <template v-else>
    <!-- Saldo Efetivo (só efetivados) -->
    <div>
      <h2 class="text-lg font-semibold text-gray-900 mb-3">Saldo efetivo</h2>
      <p class="text-sm text-gray-500 mb-2">
        {{ hasFilters ? 'Apenas lançamentos efetivados com os filtros selecionados.' : 'Apenas lançamentos efetivados (já realizados).' }}
      </p>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="card">
          <p class="text-sm font-medium text-gray-500">Entradas</p>
          <p class="text-2xl font-bold text-green-700 mt-1">{{ formatMoney(totals.totalEntradas) }}</p>
        </div>
        <div class="card">
          <p class="text-sm font-medium text-gray-500">Saídas</p>
          <p class="text-2xl font-bold text-red-700 mt-1">{{ formatMoney(totals.totalSaidas) }}</p>
        </div>
        <div class="card">
          <p class="text-sm font-medium text-gray-500">Saldo</p>
          <p class="text-2xl font-bold mt-1" :class="totals.saldo >= 0 ? 'text-green-700' : 'text-red-700'">
            {{ formatMoney(totals.saldo) }}
          </p>
        </div>
      </div>
    </div>

    <!-- Saldo Projetado (todos: pendentes + efetivados) -->
    <div>
      <h2 class="text-lg font-semibold text-gray-900 mb-3">Saldo projetado</h2>
      <p class="text-sm text-gray-500 mb-2">
        {{ hasFilters ? 'Todos os lançamentos (pendentes + efetivados) com os filtros selecionados.' : 'Todos os lançamentos (pendentes + efetivados). Previsão geral.' }}
      </p>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="card border-amber-200 bg-amber-50/50">
          <p class="text-sm font-medium text-gray-600">Entradas (proj.)</p>
          <p class="text-2xl font-bold text-green-700 mt-1">{{ formatMoney(totals.totalEntradasProjetado) }}</p>
        </div>
        <div class="card border-amber-200 bg-amber-50/50">
          <p class="text-sm font-medium text-gray-600">Saídas (proj.)</p>
          <p class="text-2xl font-bold text-red-700 mt-1">{{ formatMoney(totals.totalSaidasProjetado) }}</p>
        </div>
        <div class="card border-amber-200 bg-amber-50/50">
          <p class="text-sm font-medium text-gray-600">Saldo (proj.)</p>
          <p class="text-2xl font-bold mt-1" :class="totals.saldoProjetado >= 0 ? 'text-green-700' : 'text-red-700'">
            {{ formatMoney(totals.saldoProjetado) }}
          </p>
        </div>
      </div>
    </div>
    <!-- Distribuição por categoria -->
    <div>
      <h2 class="text-lg font-semibold text-gray-900 mb-3">Distribuição por categoria</h2>
      <p class="text-sm text-gray-500 mb-4">
        {{ hasFilters ? 'Lançamentos efetivados com os filtros selecionados.' : 'Lançamentos efetivados (já realizados).' }}
      </p>
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div class="card">
          <h3 class="text-base font-semibold text-green-800 mb-4 text-center">Entradas</h3>
          <PieChart :items="entradaChartItems" :colors="entradaColors" />
        </div>
        <div class="card">
          <h3 class="text-base font-semibold text-red-800 mb-4 text-center">Saídas</h3>
          <PieChart :items="saidaChartItems" :colors="saidaColors" empty-text="Nenhuma saída efetivada no período" />
        </div>
      </div>
    </div>
    </template>
    </template>

    <FinancialMonthCompareModal
      :open="monthCompareOpen"
      :student-id="filterStudentId"
      @close="monthCompareOpen = false"
    />
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useFinancialStore } from '../../stores/financial'
import { useFinancialCategoryStore } from '../../stores/financialCategory'
import StudentFilterSelect from '../../components/common/StudentFilterSelect.vue'
import PieChart from '../../components/common/PieChart.vue'
import AppLoading from '../../components/common/AppLoading.vue'
import FinancialMonthCompareModal from '../../components/financeiro/FinancialMonthCompareModal.vue'

const financialStore = useFinancialStore()
const categoryStore = useFinancialCategoryStore()
const pageLoading = ref(true)
const monthCompareOpen = ref(false)
const totals = computed(() => financialStore.totals)
const distribution = computed(() => financialStore.distribution)
const filterStudentId = ref('')
const filterDateFrom = ref('')
const filterDateTo = ref('')

const hasFilters = computed(() => !!(filterStudentId.value || filterDateFrom.value || filterDateTo.value))

const entradaColors = [
  '#16a34a', '#059669', '#0d9488', '#0891b2', '#0284c7',
  '#2563eb', '#4f46e5', '#7c3aed', '#9333ea', '#c026d3'
]

const saidaColors = [
  '#dc2626', '#ea580c', '#d97706', '#ca8a04', '#e11d48',
  '#be123c', '#9f1239', '#b45309', '#c2410c', '#991b1b'
]

const entradaChartItems = computed(() =>
  distribution.value.entrada.map((item) => ({
    label: categoryStore.labelFor('entrada', item.code),
    value: item.value
  }))
)

const saidaChartItems = computed(() =>
  distribution.value.saida.map((item) => ({
    label: categoryStore.labelFor('saida', item.code),
    value: item.value
  }))
)

function syncFromStore() {
  const f = financialStore.filters
  filterStudentId.value = f.studentId || ''
  filterDateFrom.value = f.dateFrom || ''
  filterDateTo.value = f.dateTo || ''
}

function buildFilters() {
  const f = {}
  if (filterStudentId.value) f.studentId = filterStudentId.value
  if (filterDateFrom.value) f.dateFrom = filterDateFrom.value
  if (filterDateTo.value) f.dateTo = filterDateTo.value
  return f
}

async function applyFilters() {
  await financialStore.setFilters(buildFilters())
}

function clearFilters() {
  filterStudentId.value = ''
  filterDateFrom.value = ''
  filterDateTo.value = ''
  applyFilters()
}

function formatMoney(v) {
  const n = Number(v)
  return isNaN(n) ? '0,00' : n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

onMounted(async () => {
  syncFromStore()
  try {
    await categoryStore.load()
    await applyFilters()
  } finally {
    pageLoading.value = false
  }
})
</script>
