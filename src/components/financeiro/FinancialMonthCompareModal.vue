<template>
  <div
    v-if="open"
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
    @click.self="$emit('close')"
  >
    <div
      class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="month-compare-title"
    >
      <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-start justify-between gap-4">
        <div>
          <h2 id="month-compare-title" class="text-lg font-semibold text-gray-900">Comparativo mês a mês</h2>
          <p class="text-sm text-gray-500 mt-0.5">Saldo efetivo por mês de referência dos lançamentos</p>
        </div>
        <button
          type="button"
          class="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
          aria-label="Fechar"
          @click="$emit('close')"
        >
          <XMarkIcon class="w-5 h-5" />
        </button>
      </div>

      <div class="p-6 space-y-5">
        <div v-if="studentId" class="text-sm text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
          Comparando apenas lançamentos da aluna selecionada no filtro da tela.
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Mês base</label>
            <input v-model="monthBase" type="month" class="input" @change="loadComparison" />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Comparar com</label>
            <input v-model="monthCompare" type="month" class="input" @change="loadComparison" />
          </div>
        </div>

        <div class="flex flex-wrap gap-2">
          <button type="button" class="btn-secondary text-sm py-1.5" @click="setPreviousMonth">
            Mês anterior
          </button>
          <button type="button" class="btn-secondary text-sm py-1.5" @click="setCurrentVsPrevious">
            Atual vs anterior
          </button>
        </div>

        <AppLoading v-if="loading" card message="Carregando comparativo..." />

        <div v-else-if="error" class="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {{ error }}
        </div>

        <template v-else-if="comparison">
          <div class="overflow-x-auto rounded-lg border border-gray-200">
            <table class="min-w-full divide-y divide-gray-200 text-sm">
              <thead class="bg-gray-50">
                <tr>
                  <th class="px-4 py-3 text-left font-medium text-gray-500">Indicador</th>
                  <th class="px-4 py-3 text-right font-medium text-gray-500">{{ labelBase }}</th>
                  <th class="px-4 py-3 text-right font-medium text-gray-500">{{ labelCompare }}</th>
                  <th class="px-4 py-3 text-right font-medium text-gray-500">Variação</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 bg-white">
                <tr v-for="row in rows" :key="row.key" class="hover:bg-gray-50">
                  <td class="px-4 py-3 font-medium text-gray-900">{{ row.label }}</td>
                  <td class="px-4 py-3 text-right font-medium" :class="row.valueClass">
                    {{ formatMoney(row.valueA) }}
                  </td>
                  <td class="px-4 py-3 text-right font-medium" :class="row.valueClass">
                    {{ formatMoney(row.valueB) }}
                  </td>
                  <td class="px-4 py-3 text-right">
                    <span :class="variationClass(row.delta, row.invertColor)">
                      {{ formatVariation(row.delta, row.percent) }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <p class="text-xs text-gray-500">
            Variação = valor do mês comparado menos o mês base. Considera apenas lançamentos efetivados.
          </p>
        </template>
      </div>

      <div class="border-t border-gray-200 px-6 py-4 flex justify-end">
        <button type="button" class="btn-secondary" @click="$emit('close')">Fechar</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { XMarkIcon } from '@heroicons/vue/24/outline'
import { financialEntryService } from '../../services/index.js'
import AppLoading from '../common/AppLoading.vue'
import {
  currentMonthKey,
  previousMonthKey,
  formatMonthLabel,
  formatMoney,
  monthVariation
} from '../../utils/financialMonth.js'

const props = defineProps({
  open: { type: Boolean, default: false },
  studentId: { type: String, default: '' }
})

defineEmits(['close'])

const monthBase = ref(previousMonthKey(currentMonthKey()))
const monthCompare = ref(currentMonthKey())
const loading = ref(false)
const error = ref(null)
const comparison = ref(null)

const labelBase = computed(() => formatMonthLabel(monthBase.value))
const labelCompare = computed(() => formatMonthLabel(monthCompare.value))

const rows = computed(() => {
  if (!comparison.value) return []
  const { totalsA, totalsB } = comparison.value
  return [
    {
      key: 'entradas',
      label: 'Entradas',
      valueA: totalsA.totalEntradas,
      valueB: totalsB.totalEntradas,
      valueClass: 'text-green-700',
      invertColor: false,
      ...monthVariation(totalsA.totalEntradas, totalsB.totalEntradas)
    },
    {
      key: 'saidas',
      label: 'Saídas',
      valueA: totalsA.totalSaidas,
      valueB: totalsB.totalSaidas,
      valueClass: 'text-red-700',
      invertColor: true,
      ...monthVariation(totalsA.totalSaidas, totalsB.totalSaidas)
    },
    {
      key: 'saldo',
      label: 'Saldo',
      valueA: totalsA.saldo,
      valueB: totalsB.saldo,
      valueClass: 'text-gray-900',
      invertColor: false,
      ...monthVariation(totalsA.saldo, totalsB.saldo)
    }
  ]
})

function buildExtraFilters() {
  const f = {}
  if (props.studentId) f.studentId = props.studentId
  return f
}

async function loadComparison() {
  if (!monthBase.value || !monthCompare.value) return
  loading.value = true
  error.value = null
  try {
    comparison.value = await financialEntryService.getMonthComparison(
      monthBase.value,
      monthCompare.value,
      buildExtraFilters()
    )
  } catch (err) {
    error.value = err?.message || 'Erro ao carregar comparativo'
    comparison.value = null
  } finally {
    loading.value = false
  }
}

function setPreviousMonth() {
  monthCompare.value = monthBase.value
  monthBase.value = previousMonthKey(monthBase.value)
  loadComparison()
}

function setCurrentVsPrevious() {
  monthCompare.value = currentMonthKey()
  monthBase.value = previousMonthKey(monthCompare.value)
  loadComparison()
}

function formatVariation(delta, percent) {
  const sign = delta > 0 ? '+' : ''
  const pct = `${percent >= 0 ? '+' : ''}${percent.toFixed(1)}%`
  return `${sign}${formatMoney(delta)} (${pct})`
}

function variationClass(delta, invertColor) {
  if (delta === 0) return 'text-gray-500'
  const positive = delta > 0
  const good = invertColor ? !positive : positive
  return good ? 'text-green-700 font-medium' : 'text-red-700 font-medium'
}

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      setCurrentVsPrevious()
    }
  }
)

watch(
  () => props.studentId,
  () => {
    if (props.open) loadComparison()
  }
)
</script>
