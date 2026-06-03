<template>
  <div class="flex flex-col items-center">
    <div
      class="rounded-full border border-gray-100 shadow-inner flex-shrink-0"
      :style="chartStyle"
      :class="hasData ? '' : 'bg-gray-100'"
    />
    <p v-if="!hasData" class="text-sm text-gray-500 mt-4 text-center">{{ emptyText }}</p>
    <ul v-else class="mt-4 w-full space-y-2">
      <li
        v-for="(item, index) in slices"
        :key="item.label"
        class="flex items-center gap-2 text-sm"
      >
        <span
          class="w-3 h-3 rounded-full flex-shrink-0"
          :style="{ backgroundColor: item.color }"
        />
        <span class="flex-1 min-w-0 truncate text-gray-700">{{ item.label }}</span>
        <span class="text-gray-500 flex-shrink-0">{{ item.percent }}%</span>
        <span class="font-medium text-gray-900 flex-shrink-0">{{ formatMoney(item.value) }}</span>
      </li>
    </ul>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  },
  colors: {
    type: Array,
    default: () => [
      '#16a34a', '#059669', '#0d9488', '#0891b2', '#0284c7',
      '#2563eb', '#4f46e5', '#7c3aed', '#9333ea', '#c026d3'
    ]
  },
  size: {
    type: Number,
    default: 220
  },
  emptyText: {
    type: String,
    default: 'Sem dados no período'
  }
})

const total = computed(() =>
  props.items.reduce((sum, item) => sum + (Number(item.value) || 0), 0)
)

const hasData = computed(() => total.value > 0)

const slices = computed(() => {
  if (!hasData.value) return []
  return props.items.map((item, index) => {
    const value = Number(item.value) || 0
    const percent = total.value > 0 ? Math.round((value / total.value) * 1000) / 10 : 0
    return {
      label: item.label,
      value,
      percent: percent.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 1 }),
      color: item.color || props.colors[index % props.colors.length]
    }
  })
})

const chartStyle = computed(() => {
  const sizePx = `${props.size}px`
  if (!hasData.value) {
    return { width: sizePx, height: sizePx }
  }

  let angle = 0
  const stops = slices.value.map((slice) => {
    const sweep = (slice.value / total.value) * 360
    const start = angle
    angle += sweep
    return `${slice.color} ${start}deg ${angle}deg`
  })

  return {
    width: sizePx,
    height: sizePx,
    background: `conic-gradient(${stops.join(', ')})`
  }
})

function formatMoney(v) {
  const n = Number(v)
  return isNaN(n) ? '0,00' : n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}
</script>
