<template>
  <div class="space-y-6 pb-20 md:pb-6">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between">
      <div>
        <h1 class="text-2xl font-bold text-gray-900">Vendas</h1>
        <p class="text-gray-600 mt-1">Registro de vendas da loja da escola</p>
      </div>
      <div class="flex flex-wrap gap-2 mt-4 md:mt-0">
        <router-link to="/vendas/nova" class="btn-primary">Nova Venda</router-link>
      </div>
    </div>

    <div class="card">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StudentFilterSelect v-model="filterStudentId" label="Aluna" placeholder="Todas as alunas" @change="applyFilters" />
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Data de</label>
          <input v-model="filterDateFrom" type="date" class="input" @change="applyFilters" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-1">Data até</label>
          <input v-model="filterDateTo" type="date" class="input" @change="applyFilters" />
        </div>
      </div>
    </div>

    <AppLoading v-if="saleStore.loading && saleStore.sales.length === 0" card message="Carregando vendas..." />

    <div v-else-if="saleStore.sales.length === 0" class="card text-center py-12">
      <ShoppingCartIcon class="h-12 w-12 mx-auto text-gray-400" />
      <p class="mt-4 text-gray-600">Nenhuma venda registrada</p>
      <router-link to="/vendas/nova" class="btn-primary mt-4 inline-block">Registrar venda</router-link>
    </div>

    <div v-else class="card overflow-hidden">
      <div class="divide-y divide-gray-200">
        <div
          v-for="sale in saleStore.sales"
          :key="sale.id"
          class="p-4 hover:bg-gray-50 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
          @click="$router.push(`/vendas/${sale.id}`)"
        >
          <div>
            <p class="font-semibold text-gray-900">{{ formatDate(sale.get('date')) }}</p>
            <p class="text-sm text-gray-600 mt-0.5">
              {{ getCustomerLabel(sale) }}
            </p>
            <p class="text-xs text-gray-500 mt-1">{{ getItemsSummary(sale) }}</p>
          </div>
          <div class="text-right">
            <p class="text-lg font-bold text-green-700">R$ {{ formatMoney(sale.get('totalValue')) }}</p>
            <span class="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Lançado no financeiro</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useSaleStore } from '../../stores/sale'
import { studentService } from '../../services/index.js'
import StudentFilterSelect from '../../components/common/StudentFilterSelect.vue'
import { ShoppingCartIcon } from '@heroicons/vue/24/outline'
import { formatDateBR } from '../../utils/date.js'
import AppLoading from '../../components/common/AppLoading.vue'

const saleStore = useSaleStore()
const filterStudentId = ref('')
const filterDateFrom = ref('')
const filterDateTo = ref('')
const studentMap = ref({})

function formatMoney(v) {
  const n = Number(v)
  return isNaN(n) ? '0,00' : n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(d) {
  return formatDateBR(d) || '—'
}

function getCustomerLabel(sale) {
  const studentId = sale.get('studentId')
  if (studentId && studentMap.value[studentId]) {
    return studentMap.value[studentId].get('name')
  }
  const name = sale.get('customerName')
  return name || 'Cliente avulso'
}

function getItemsSummary(sale) {
  const items = sale.get('items') || []
  if (!items.length) return '—'
  if (items.length === 1) return `${items[0].quantity}x ${items[0].productName}`
  return `${items.length} itens`
}

function applyFilters() {
  const filters = {}
  if (filterStudentId.value) filters.studentId = filterStudentId.value
  if (filterDateFrom.value) filters.dateFrom = filterDateFrom.value
  if (filterDateTo.value) filters.dateTo = filterDateTo.value
  saleStore.setFilters(filters)
}

onMounted(async () => {
  applyFilters()
  try {
    const students = await studentService.getStudents(0, 500, { active: true })
    const map = {}
    for (const s of students) map[s.id] = s
    studentMap.value = map
  } catch (_) {}
})
</script>
