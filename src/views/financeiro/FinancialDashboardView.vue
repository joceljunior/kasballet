<template>
  <div class="space-y-6 pb-20 md:pb-6">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Financeiro</h1>
        <p class="text-gray-600 mt-1">Visão geral – filtre por período ou veja os totais gerais</p>
      </div>
      <div class="flex gap-2 mt-4 md:mt-0">
        <router-link to="/financeiro/lancamentos" class="btn-secondary">Ver lançamentos</router-link>
        <router-link to="/financeiro/lancamentos/novo" class="btn-primary">Novo Lançamento</router-link>
      </div>
    </div>

    <!-- Filtro de data -->
    <div class="card">
      <h2 class="text-base font-semibold text-gray-900 mb-3">Filtrar por período</h2>
      <div class="flex flex-wrap items-end gap-4">
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
      <p class="text-xs text-gray-500 mt-2">Deixe em branco para ver os totais de todos os períodos.</p>
    </div>

    <!-- Saldo Efetivo (só efetivados) -->
    <div>
      <h2 class="text-lg font-semibold text-gray-900 mb-3">Saldo efetivo</h2>
      <p class="text-sm text-gray-500 mb-2">
        {{ hasDateFilter ? 'Apenas lançamentos efetivados no período selecionado.' : 'Apenas lançamentos efetivados (já realizados).' }}
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
        {{ hasDateFilter ? 'Todos os lançamentos (pendentes + efetivados) no período selecionado.' : 'Todos os lançamentos (pendentes + efetivados). Previsão geral.' }}
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
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { useFinancialStore } from '../../stores/financial'

const financialStore = useFinancialStore()
const totals = computed(() => financialStore.totals)
const filterDateFrom = ref('')
const filterDateTo = ref('')

const hasDateFilter = computed(() => !!(filterDateFrom.value || filterDateTo.value))

function buildFilters() {
  const f = {}
  if (filterDateFrom.value) f.dateFrom = filterDateFrom.value
  if (filterDateTo.value) f.dateTo = filterDateTo.value
  return f
}

async function applyFilters() {
  await financialStore.setFilters(buildFilters())
}

function clearFilters() {
  filterDateFrom.value = ''
  filterDateTo.value = ''
  applyFilters()
}

function formatMoney(v) {
  const n = Number(v)
  return isNaN(n) ? '0,00' : n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

onMounted(() => applyFilters())
</script>
