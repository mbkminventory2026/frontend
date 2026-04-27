<script setup lang="ts">
import { RouterProvider } from '@tanstack/vue-router'
import { router } from './router'
import { toast } from 'vue-sonner'
import AppConfirmDialog from '@/components/AppConfirmDialog.vue'
import { useConfirmDialog } from '@/composables/useConfirmDialog'

const { state, handleConfirm, handleCancel } = useConfirmDialog()
</script>

<template>
  <RouterProvider :router="router" />
  <toast />

  <!-- Global confirmation dialog — dikontrol via useConfirmDialog() composable -->
  <AppConfirmDialog
    :is-open="state.isOpen"
    :is-loading="state.isLoading"
    :title="state.options?.title"
    :message="state.options?.message ?? ''"
    :type="state.options?.type"
    :confirm-label="state.options?.confirmLabel"
    :cancel-label="state.options?.cancelLabel"
    @confirm="handleConfirm"
    @cancel="handleCancel"
    @update:is-open="(v) => { if (!v) handleCancel() }"
  />
</template>
