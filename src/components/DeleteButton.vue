<script setup lang="ts">
import { Trash2, Loader2 } from 'lucide-vue-next';
import { Button } from '@/components/ui/button';
import { useConfirmDialog } from '@/composables/useConfirmDialog';
import { ref } from 'vue';

const props = defineProps<{
    onConfirm: () => Promise<void>;
    confirmMessage?: string;
}>();

const isLoading = ref(false);
const { openConfirm } = useConfirmDialog();

const handleClick = () => {
    openConfirm({
        type: 'delete',
        message: props.confirmMessage || 'Apakah Anda yakin ingin menghapus data ini? Tindakan ini tidak dapat dibatalkan.',
        onConfirm: async () => {
            isLoading.value = true;
            try {
                await props.onConfirm();
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