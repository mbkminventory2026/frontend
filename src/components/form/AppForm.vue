<script setup lang="ts">
import { provide } from 'vue'

interface Props {
  form: any // The object returned by useForm
}

const props = defineProps<Props>()

// Provide the form state to all child fields
provide('formContext', props.form)

const handleSubmit = () => {
  props.form.save()
}
</script>

<template>
  <form @submit.prevent="handleSubmit" class="space-y-6">
    <slot :form="props.form"></slot>
  </form>
</template>
