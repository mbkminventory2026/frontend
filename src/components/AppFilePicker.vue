<script setup lang="ts">
import { ref, onUnmounted, computed } from 'vue'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Trash2, FileText } from 'lucide-vue-next'

const props = defineProps<{
  modelValue?: File | string | null
  accept?: string
  label?: string
  preview?: boolean
}>()

const emit = defineEmits(['update:modelValue'])
const previewUrl = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)

const isPdf = computed(() => {
  const value = props.modelValue;
  if (!value) return false;
  if (value instanceof File) {
    return value.type === 'application/pdf';
  }
  if (typeof value === 'string') {
    return value.startsWith('data:application/pdf') || value.toLowerCase().endsWith('.pdf');
  }
  return false;
});

const selectedFileName = computed(() => {
  const value = props.modelValue;
  if (value instanceof File) {
    return value.name;
  }
  return 'Attached PO Document.pdf';
});

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
    <!-- Preview Section with Delete Button — shown when file is selected (File object OR base64 string) -->
    <div v-if="preview && (previewUrl || modelValue)" 
         class="animate-in fade-in zoom-in duration-300">

      <!-- PDF Preview -->
      <div v-if="isPdf" class="flex items-center gap-3 p-3 bg-red-50/70 border border-red-200 rounded-lg max-w-sm">
        <FileText class="w-7 h-7 text-red-500 flex-shrink-0" />
        <div class="flex-1 min-w-0">
          <p class="text-[9px] font-bold uppercase tracking-wider text-red-400">PDF Document Selected</p>
          <p class="text-xs font-semibold truncate text-neutral-800">{{ selectedFileName }}</p>
        </div>
        <Button 
          type="button"
          size="icon" 
          variant="ghost"
          class="h-7 w-7 flex-shrink-0 text-red-400 hover:text-red-600 hover:bg-red-100 rounded-md transition-colors"
          @click="clearFile"
        >
          <Trash2 class="h-3.5 w-3.5" />
        </Button>
      </div>

      <!-- Image Preview -->
      <div v-else class="relative w-fit group">
        <img 
          :src="previewUrl || (modelValue as string)" 
          class="max-h-40 rounded-lg border-2 border-muted shadow-sm object-cover transition-all group-hover:ring-2 group-hover:ring-primary/20" 
        />
        <!-- Always-visible delete button for images -->
        <Button 
          type="button"
          size="icon" 
          variant="destructive" 
          class="absolute -top-2 -right-2 h-7 w-7 rounded-full shadow-md hover:scale-110 active:scale-95 transition-transform z-10"
          @click="clearFile"
        >
          <Trash2 class="h-3.5 w-3.5" />
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
