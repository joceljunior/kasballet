<template>
  <div class="infinite-scroll-container">
    <slot />
    <div
      ref="sentinel"
      class="h-10 flex items-center justify-center"
      v-if="hasMore"
    >
      <AppLoading v-if="loading" size="sm" inline />
    </div>
    <div v-if="!hasMore && !loading" class="text-center py-4 text-gray-500">
      Não há mais itens para carregar
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import AppLoading from './AppLoading.vue'

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
