import { ref } from "vue";

interface UseDeleteOptions {
    onSuccess?: () => void;
    onError?: (error: any) => void;
}

export function useDelete(options: UseDeleteOptions = {}) {
    const isLoading = ref(false);

    const deleteItem = async (deleteFn: () => Promise<any>, message = 'Apakah Anda yakin ingin menghapus data ini?') => {
        if(!confirm(message)) return;

        isLoading.value = true;
        try {
            await deleteFn();
            options.onSuccess?.();
        } catch (error) {
            options.onError?.(error);
            console.error("Delete error: ", error)
            alert("Gagal menghapus data.");
        } finally {
            isLoading.value = false;
        }
    };

    return {
        deleteItem,
        isLoading
    }
}