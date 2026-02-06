<template>
  <div class="space-y-6 pb-20 md:pb-6">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Financeiro</h1>
        <p class="text-gray-600 mt-1">Visão geral e lançamentos</p>
      </div>
      <div class="flex gap-2 mt-4 md:mt-0">
        <router-link to="/financeiro/lancamentos" class="btn-secondary">Ver lançamentos</router-link>
        <router-link to="/financeiro/lancamentos/novo" class="btn-primary">Novo Lançamento</router-link>
      </div>
    </div>

    <!-- Saldo Efetivo (só efetivados) -->
    <div>
      <h2 class="text-lg font-semibold text-gray-900 mb-3">Saldo efetivo</h2>
      <p class="text-sm text-gray-500 mb-2">Apenas lançamentos efetivados (já realizados).</p>
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
      <p class="text-sm text-gray-500 mb-2">Todos os lançamentos (pendentes + efetivados). Previsão do mês.</p>
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

    <div class="card">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-gray-900">Lançamentos</h2>
        <router-link to="/financeiro/lancamentos" class="text-green-600 hover:underline text-sm font-medium">
          Ver todos →
        </router-link>
      </div>
      <div v-if="financialStore.loading && financialStore.entries.length === 0" class="text-center py-8 text-gray-500">
        Carregando...
      </div>
      <div v-else-if="financialStore.entries.length === 0" class="text-center py-8 text-gray-500">
        Nenhum lançamento. <router-link to="/financeiro/lancamentos/novo" class="text-green-600 hover:underline">Criar o primeiro</router-link>.
      </div>
      <div v-else class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
              <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
              <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200">
            <tr v-for="e in financialStore.entries.slice(0, 10)" :key="e.id" class="hover:bg-gray-50">
              <td class="px-4 py-2 text-sm text-gray-900">{{ formatDate(e.get('date')) }}</td>
              <td class="px-4 py-2 text-sm">
                <span :class="e.get('type') === 'entrada' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'" class="px-2 py-0.5 text-xs font-medium rounded-full">
                  {{ subtypeLabel(e.get('type'), e.get('subtype')) }}
                </span>
              </td>
              <td class="px-4 py-2 text-sm text-right font-medium" :class="e.get('type') === 'entrada' ? 'text-green-700' : 'text-red-700'">
                {{ e.get('type') === 'entrada' ? '+' : '-' }} {{ formatMoney(e.get('value')) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { onMounted, computed } from 'vue'
import { useFinancialStore } from '../../stores/financial'

const SUBTYPE_LABELS = {
  entrada: { 
    mensalidade: 'Mensalidade', 
    pagamento_semestral: 'Pag. Semestral',
    pagamento_anual: 'Pag. Anual',
    rematricula: 'Rematrícula',
    taxa_participacao: 'Taxa Part.',
    figurino: 'Figurino',
    vendas: 'Vendas', 
    outros: 'Outros' 
  },
  saida: { pagamento: 'Pagamento', contas: 'Contas', compras: 'Compras', impostos: 'Impostos', outros: 'Outros' }
}

const financialStore = useFinancialStore()
const totals = computed(() => financialStore.totals)

function formatDate(d) {
  if (!d) return '—'
  const x = d instanceof Date ? d : new Date(d)
  return isNaN(x.getTime()) ? '—' : x.toLocaleDateString('pt-BR')
}

function formatMoney(v) {
  const n = Number(v)
  return isNaN(n) ? '0,00' : n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function subtypeLabel(type, subtype) {
  const t = SUBTYPE_LABELS[type]
  return (t && t[subtype]) || subtype || '—'
}

onMounted(async () => {
  await financialStore.setFilters({})
})
</script>
