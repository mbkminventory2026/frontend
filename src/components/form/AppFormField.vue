<script setup lang="ts">
import { inject } from 'vue'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import AppFilePicker from '@/components/AppFilePicker.vue'
import AppAddressPicker from '@/components/AppAddressPicker.vue'

interface Props {
  name: string
  label?: string
  type?: 'text' | 'textarea' | 'email' | 'tel' | 'file' | 'address'
  placeholder?: string
  className?: string
}

const props = withDefaults(defineProps<Props>(), {
  type: 'text'
})

const form = inject<any>('formContext')

if (!form) {
  throw new Error('AppFormField must be used inside AppForm')
}

const { values } = form
</script>

<template>
  <div :class="['space-y-2', props.className]">
    <Label v-if="props.label" :for="props.name">{{ props.label }}</Label>
    
    <!-- File Picker -->
    <template v-if="props.type === 'file'">
      <AppFilePicker 
        v-model="values[props.name]"
        accept="image/*"
        :preview="true"
      />
    </template>

    <!-- Address Picker -->
    <template v-else-if="props.type === 'address'">
      <AppAddressPicker v-model="values[props.name]" />
    </template>

    <!-- Textarea -->
    <template v-else-if="props.type === 'textarea'">
      <Textarea 
        :id="props.name"
        v-model="values[props.name]" 
        :placeholder="props.placeholder"
        class="min-h-[200px] leading-relaxed"
      />
    </template>

    <!-- Standard Input -->
    <template v-else>
      <Input 
        :id="props.name"
        :type="props.type" 
        v-model="values[props.name]" 
        :placeholder="props.placeholder" 
      />
    </template>
  </div>
</template>
