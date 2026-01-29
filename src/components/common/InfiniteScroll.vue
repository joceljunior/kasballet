<template>
  <div class="infinite-scroll-container">
    <slot />
    <div
      ref="sentinel"
      class="h-10 flex items-center justify-center"
      v-if="hasMore"
    >
      <div v-if="loading" class="text-gray-500">
        <svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      </div>
    </div>
    <div v-if="!hasMore && !loading" class="text-center py-4 text-gray-500">
      Não há mais itens para carregar
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  hasMore: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['load-more'])

const sentinel = ref(null)
let observer = null

onMounted(() => {
  if (typeof IntersectionObserver !== 'undefined') {
    observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0]
        if (entry.isIntersecting && props.hasMore && !props.loading) {
          emit('load-more')
        }
      },
      {
        rootMargin: '100px'
      }
    )

    if (sentinel.value) {
      observer.observe(sentinel.value)
    }
  }
})

onUnmounted(() => {
  if (observer && sentinel.value) {
    observer.unobserve(sentinel.value)
  }
})
</script>
