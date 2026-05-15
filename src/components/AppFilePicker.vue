<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { Input } from '@/components/ui/input'

const props = defineProps<{
  modelValue?: File | string | null
  accept?: string
  label?: string
  preview?: boolean
}>()

const emit = defineEmits(['update:modelValue'])
const previewUrl = ref<string | null>(null)

const handleChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) {
    emit('update:modelValue', file)
    if (props.preview) {
      if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
      previewUrl.value = URL.createObjectURL(file)
    }
  } else {
    emit('update:modelValue', null)
    if (previewUrl.value) {
      URL.revokeObjectURL(previewUrl.value)
      previewUrl.value = null
    }
  }
}

onUnmounted(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})
</script>

<template>
  <div class="space-y-2">
    <Input type="file" :accept="accept" @change="handleChange" />
    <div v-if="preview && (previewUrl || (modelValue && typeof modelValue === 'string'))" class="mt-2">
      <img :src="previewUrl || (modelValue as string)" class="max-h-32 rounded-md border object-cover" />
    </div>
  </div>
</template>
