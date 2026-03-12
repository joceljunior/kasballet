<template>
  <div class="space-y-6 pb-20 md:pb-6">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Lançamentos</h1>
        <p class="text-gray-600 mt-1">Entradas e saídas</p>
      </div>
      <router-link to="/financeiro/lancamentos/novo" class="btn-primary mt-4 md:mt-0">
        Novo Lançamento
      </router-link>
    </div>

    <!-- Filtros -->
    <div class="card">
      <div class="grid grid-cols-1 md:grid-cols-6 gap-4">
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
          <label class="block text-sm font-medium text-gray-700 mb-1">Subtipo</label>
          <select v-model="filterSubtype" @change="applyFilters" class="input">
            <option value="">Todos</option>
            <template v-if="filterType !== 'saida'">
              <option value="mensalidade">Mensalidade</option>
              <option value="vendas">Vendas</option>
              <option value="outros">Outros (entrada)</option>
            </template>
            <template v-if="filterType !== 'entrada'">
              <option value="pagamento">Pagamento</option>
              <option value="contas">Contas</option>
              <option value="compras">Compras</option>
              <option value="impostos">Impostos</option>
              <option value="outros">Outros (saída)</option>
            </template>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Data de</label>
          <input v-model="filterDateFrom" type="date" class="input" @change="applyFilters" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Data até</label>
          <input v-model="filterDateTo" type="date" class="input" @change="applyFilters" />
        </div>
        <div class="flex items-end">
          <button type="button" @click="clearFilters" class="btn-secondary w-full md:w-auto">Limpar</button>
        </div>
      </div>
    </div>

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

    <div v-if="financialStore.loading && financialStore.entries.length === 0" class="card text-center py-12">
      <p class="text-gray-600">Carregando...</p>
    </div>

    <div v-else-if="financialStore.entries.length === 0" class="card text-center py-12">
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
              <td class="px-4 py-3 text-sm text-gray-900">{{ formatDate(e.get('date')) || '-' }}</td>
              <td class="px-4 py-3 text-sm text-gray-600">{{ formatDateShort(e.get('dateReference')) }}</td>
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
    </div>

    <div v-if="toDelete" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" @click.self="toDelete = null">
      <div class="bg-white rounded-lg shadow-xl max-w-sm w-full p-6">
        <p class="text-gray-700">Excluir este lançamento?</p>
        <div class="flex gap-3 mt-6">
          <button type="button" @click="doDelete" class="btn-primary flex-1">Excluir</button>
          <button type="button" @click="toDelete = null" class="btn-secondary flex-1">Cancelar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { useFinancialStore } from '../../stores/financial'
import { studentService, userRepository } from '../../services/index.js'
import { CurrencyDollarIcon } from '@heroicons/vue/24/outline'

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
const filterType = ref('')
const filterStatus = ref('')
const filterSubtype = ref('')
const filterDateFrom = ref('')
const filterDateTo = ref('')
const studentMap = ref({})
const teacherMap = ref({})
const toDelete = ref(null)

function formatDate(d) {
  if (!d) return '—'
  const x = d instanceof Date ? d : new Date(d)
  return isNaN(x.getTime()) ? '—' : x.toLocaleDateString('pt-BR')
}

function formatDateShort(d) {
  if (!d) return '-'
  const date = d instanceof Date ? d : new Date(d)
  if (isNaN(date.getTime())) return '-'
  return date.toLocaleDateString('pt-BR')
}

function formatMoney(v) {
  const n = Number(v)
  return isNaN(n) ? '0,00' : n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function subtypeLabel(type, subtype) {
  const t = SUBTYPE_LABELS[type]
  return (t && t[subtype]) || subtype || '—'
}

function getDescriptionOrRef(e) {
  const d = e.get('description')
  if (d && String(d).trim()) return String(d).trim()
  if (e.get('subtype') === 'mensalidade' && e.get('studentId')) return studentMap.value[e.get('studentId')]?.get('name') || e.get('studentId')
  if (e.get('subtype') === 'pagamento' && e.get('teacherId')) return teacherMap.value[e.get('teacherId')]?.get('username') || e.get('teacherId')
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

async function applyFilters() {
  const f = {}
  if (filterType.value) f.type = filterType.value
  if (filterStatus.value) f.status = filterStatus.value
  if (filterSubtype.value) f.subtype = filterSubtype.value
  if (filterDateFrom.value) f.dateFrom = filterDateFrom.value
  if (filterDateTo.value) f.dateTo = filterDateTo.value
  await financialStore.setFilters(f)
  await loadMaps()
}

function clearFilters() {
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
  } catch (_) {}
}

watch(() => financialStore.entries, () => loadMaps(), { deep: true })

onMounted(() => applyFilters())
</script>
