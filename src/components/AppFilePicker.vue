<script setup lang="ts">
import { ref, onUnmounted } from 'vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-vue-next'

const props = defineProps<{
  modelValue?: File | string | null
  accept?: string
  label?: string
  preview?: boolean
}>()

const emit = defineEmits(['update:modelValue'])
const previewUrl = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const handleChange = (e: Event) => {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (file) {
    emit('update:modelValue', file)
    if (props.preview) {
      if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
      previewUrl.value = URL.createObjectURL(file)
    }
  }
}

const clearFile = () => {
  emit('update:modelValue', null)
  if (previewUrl.value) {
    URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = null
  }
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

onUnmounted(() => {
  if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
})
</script>

<template>
  <div class="space-y-3">
    <!-- Preview Section with Delete Button -->
    <div v-if="preview && (previewUrl || (modelValue && typeof modelValue === 'string'))" 
         class="relative w-fit group animate-in fade-in zoom-in duration-300">
      <img 
        :src="previewUrl || (modelValue as string)" 
        class="max-h-40 rounded-lg border-2 border-muted shadow-sm object-cover transition-all group-hover:ring-2 group-hover:ring-primary/20" 
      />
      
      <div class="absolute -top-2 -right-2 opacity-0 group-hover:opacity-100 transition-all duration-200 scale-90 group-hover:scale-100">
        <Button 
          type="button"
          size="icon" 
          variant="destructive" 
          class="h-8 w-8 rounded-full shadow-lg hover:scale-110 active:scale-95 transition-transform"
          @click="clearFile"
        >
          <Trash2 class="h-4 w-4" />
        </Button>
      </div>
    </div>

    <!-- Input Section -->
    <div class="flex items-center gap-2">
      <Input 
        ref="fileInput"
        type="file" 
        :accept="accept" 
        class="cursor-pointer file:cursor-pointer hover:bg-muted/50 transition-colors"
        @change="handleChange" 
      />
    </div>
  </div>
</template>
