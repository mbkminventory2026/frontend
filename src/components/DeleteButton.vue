<script setup lang="ts">
import { Trash2, Loader2 } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { useConfirmDialog } from '@/composables/useConfirmDialog';
import { useDeleteError } from '@/composables/useDeleteError';
import { ref } from 'vue';

const props = withDefaults(defineProps<{
    onConfirm: () => Promise<void>;
    confirmMessage?: string;
    resourceName?: string;
}>(), {
    resourceName: 'Data'
});

const isLoading = ref(false);
const { openConfirm } = useConfirmDialog();
const { handleDeleteError } = useDeleteError();

const handleClick = () => {
    openConfirm({
        type: 'delete',
        message: props.confirmMessage || 'Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.',
        onConfirm: async () => {
            isLoading.value = true;
            try {
                await props.onConfirm();
                import('vue-sonner').then(({ toast }) => {
                    toast.success(`${props.resourceName} berhasil dihapus.`);
                });
            } catch (error) {
                handleDeleteError(error, props.resourceName);
            } finally {
                isLoading.value = false;
            }
        },
    });
};
</script>

<template>
    <Button
        variant="ghost"
        size="sm"
        class="text-red-500 hover:text-red-700 hover:bg-red-50"
        :disabled="isLoading"
        @click.stop="handleClick"
    >
        <Loader2 v-if="isLoading" class="w-4 h-4 animate-spin" />
        <Trash2 v-else class="w-4 h-4" />
    </Button>
</template>