<template>
  <div class="space-y-6 pb-20 md:pb-6">
    <AppLoading v-if="loading" card message="Carregando venda..." />

    <template v-else-if="sale">
      <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <router-link to="/vendas" class="text-sm text-green-600 hover:text-green-700 mb-2 inline-block">
            ← Voltar às vendas
          </router-link>
          <h1 class="text-2xl font-bold text-gray-900">Detalhes da venda</h1>
          <p class="text-gray-600 mt-1">{{ formatDate(sale.get('date')) }}</p>
        </div>
        <div class="text-right">
          <p class="text-3xl font-bold text-green-700">R$ {{ formatMoney(sale.get('totalValue')) }}</p>
          <span class="inline-block mt-2 text-xs text-green-700 bg-green-50 px-3 py-1 rounded-full">
            Entrada registrada no financeiro
          </span>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div class="card">
          <h2 class="text-base font-semibold text-gray-900 mb-3">Cliente</h2>
          <p class="text-gray-900">{{ customerLabel }}</p>
          <p v-if="sale.get('notes')" class="text-sm text-gray-600 mt-2">{{ sale.get('notes') }}</p>
        </div>
        <div class="card">
          <h2 class="text-base font-semibold text-gray-900 mb-3">Financeiro</h2>
          <p class="text-sm text-gray-600">Lançamento automático como entrada — subtipo Vendas</p>
          <router-link
            v-if="sale.get('financialEntryId')"
            :to="`/financeiro/lancamentos/${sale.get('financialEntryId')}/edit`"
            class="text-sm text-green-600 hover:text-green-700 mt-2 inline-block"
          >
            Ver lançamento no financeiro →
          </router-link>
        </div>
      </div>

      <div class="card">
        <h2 class="text-base font-semibold text-gray-900 mb-4">Itens vendidos</h2>
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Preço un.</th>
                <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 uppercase">Qtd</th>
                <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100">
              <tr v-for="(item, i) in items" :key="i">
                <td class="px-3 py-2 text-sm text-gray-900">{{ item.productName }}</td>
                <td class="px-3 py-2 text-sm text-right text-gray-600">R$ {{ formatMoney(item.unitPrice) }}</td>
                <td class="px-3 py-2 text-sm text-center text-gray-600">{{ item.quantity }}</td>
                <td class="px-3 py-2 text-sm text-right font-medium text-gray-900">
                  R$ {{ formatMoney(item.lineTotal ?? item.unitPrice * item.quantity) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSaleStore } from '../../stores/sale'
import { studentService } from '../../services/index.js'
import { formatDateBR } from '../../utils/date.js'
import AppLoading from '../../components/common/AppLoading.vue'

const route = useRoute()
const router = useRouter()
const saleStore = useSaleStore()
const sale = ref(null)
const loading = ref(true)
const studentName = ref('')

const items = computed(() => sale.value?.get('items') || [])

const customerLabel = computed(() => {
  if (studentName.value) return studentName.value
  const name = sale.value?.get('customerName')
  return name || 'Cliente avulso'
})

function formatMoney(v) {
  const n = Number(v)
  return isNaN(n) ? '0,00' : n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatDate(d) {
  return formatDateBR(d) || '—'
}

onMounted(async () => {
  try {
    sale.value = await saleStore.getSaleById(route.params.id)
    const studentId = sale.value.get('studentId')
    if (studentId) {
      try {
        const student = await studentService.getStudentById(studentId)
        studentName.value = student.get('name')
      } catch (_) {}
    }
  } catch (_) {
    router.push('/vendas')
  } finally {
    loading.value = false
  }
})
</script>
