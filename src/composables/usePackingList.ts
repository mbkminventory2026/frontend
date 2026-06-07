import { ref } from 'vue';
import { getPackingListById, createPackingList } from '@/api/packing-list/packing-list';
import type { PackingListResponse } from '@/schemas/packing-list/response';
import type { CreatePackingListRequest } from '@/schemas/packing-list/request';

export function usePackingList() {
    const isLoading = ref(false);
    const isSaving = ref(false);
    const detail = ref<PackingListResponse | null>(null);

    const fetchDetail = async (id: string | number) => {
        isLoading.value = true;
        try {
            const data = await getPackingListById(id);
            detail.value = data;
            return data;
        } catch (error) {
            console.error("Gagal load packing list detail:", error);
            throw error;
        } finally {
            isLoading.value = false;
        }
    };

    const savePackingList = async (payload: CreatePackingListRequest) => {
        isSaving.value = true;
        try {
            const data = await createPackingList(payload);
            return data;
        } catch (error) {
            console.error("Gagal save packing list:", error);
            throw error;
        } finally {
            isSaving.value = false;
        }
    };

    return {
        isLoading,
        isSaving,
        detail,
        fetchDetail,
        savePackingList,
    };
}
