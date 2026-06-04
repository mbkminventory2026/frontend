<script setup lang="ts">
import { computed } from 'vue'
import { Trash2, TriangleAlert, Info, CircleCheck, Loader2 } from 'lucide-vue-next'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { type ConfirmDialogType } from '@/composables/useConfirmDialog'

// ---------------------------------------------------------------------------
// Props & Emits
// ---------------------------------------------------------------------------

interface Props {
    isOpen: boolean
    isLoading?: boolean
    title?: string
    message?: string
    type?: ConfirmDialogType
    confirmLabel?: string
    cancelLabel?: string
    showCancel?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    isLoading: false,
    type: 'info',
    cancelLabel: 'Batal',
    showCancel: true,
})

const emit = defineEmits<{
    confirm: []
    cancel: []
    'update:isOpen': [value: boolean]
}>()

// ---------------------------------------------------------------------------
// Type-driven config — icon, colors, default labels & titles
// ---------------------------------------------------------------------------

const typeConfig = computed(() => {
    const map: Record<
        ConfirmDialogType,
        {
            icon: typeof Trash2
            iconClass: string
            accentClass: string
            confirmVariant: 'destructive' | 'default' | 'outline' | 'secondary'
            defaultTitle: string
            defaultConfirmLabel: string
        }
    > = {
        delete: {
            icon: Trash2,
            iconClass: 'text-destructive',
            accentClass: 'border-destructive/30 bg-destructive/5',
            confirmVariant: 'destructive',
            defaultTitle: 'Konfirmasi Hapus',
            defaultConfirmLabel: 'Hapus',
        },
        warning: {
            icon: TriangleAlert,
            iconClass: 'text-amber-500',
            accentClass: 'border-amber-400/30 bg-amber-50/50 dark:bg-amber-950/20',
            confirmVariant: 'default',
            defaultTitle: 'Peringatan',
            defaultConfirmLabel: 'Lanjutkan',
        },
        info: {
            icon: Info,
            iconClass: 'text-blue-500',
            accentClass: 'border-blue-400/30 bg-blue-50/50 dark:bg-blue-950/20',
            confirmVariant: 'default',
            defaultTitle: 'Konfirmasi',
            defaultConfirmLabel: 'Konfirmasi',
        },
        success: {
            icon: CircleCheck,
            iconClass: 'text-emerald-500',
            accentClass: 'border-emerald-400/30 bg-emerald-50/50 dark:bg-emerald-950/20',
            confirmVariant: 'default',
            defaultTitle: 'Berhasil',
            defaultConfirmLabel: 'OK',
        },
    }
    return map[props.type ?? 'info']
})

const resolvedTitle = computed(() => props.title ?? typeConfig.value.defaultTitle)
const resolvedConfirmLabel = computed(() => props.confirmLabel ?? typeConfig.value.defaultConfirmLabel)

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

function onConfirm() {
    emit('confirm')
}

function onCancel() {
    emit('cancel')
}

function onOpenChange(val: boolean) {
    if (!val) onCancel()
    emit('update:isOpen', val)
}
</script>

<template>
    <Dialog :open="props.isOpen" @update:open="onOpenChange">
        <DialogContent class="sm:max-w-[400px]">
            <DialogHeader>
                <!-- Icon + Title row -->
                <div class="flex items-center gap-3">
                    <div
                        class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border"
                        :class="typeConfig.accentClass"
                    >
                        <component
                            :is="typeConfig.icon"
                            class="h-5 w-5"
                            :class="typeConfig.iconClass"
                        />
                    </div>
                    <div>
                        <DialogTitle class="text-base leading-tight">
                            {{ resolvedTitle }}
                        </DialogTitle>
                    </div>
                </div>

                <!-- Message -->
                <DialogDescription v-if="props.message" class="mt-3 pl-[52px] text-sm">
                    {{ props.message }}
                </DialogDescription>
            </DialogHeader>

            <DialogFooter class="mt-2 flex gap-2 sm:justify-end">
                <Button
                    v-if="props.showCancel"
                    variant="outline"
                    :disabled="props.isLoading"
                    @click="onCancel"
                >
                    {{ props.cancelLabel }}
                </Button>
                <Button
                    :variant="typeConfig.confirmVariant"
                    :disabled="props.isLoading"
                    @click="onConfirm"
                >
                    <Loader2
                        v-if="props.isLoading"
                        class="mr-2 h-4 w-4 animate-spin"
                    />
                    {{ resolvedConfirmLabel }}
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>
</template>
