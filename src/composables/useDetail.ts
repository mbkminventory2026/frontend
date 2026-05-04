import { ref, onMounted } from 'vue';

interface UseDetailOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
  immediate?: boolean;
}

export function useDetail<T>(
  fetchFn: (id: string | number) => Promise<T>,
  id: string | number,
  options: UseDetailOptions<T> = {}
) {
  const data = ref<T | null>(null) as any;
  const isLoading = ref(false);
  const error = ref<any>(null);

  const fetchData = async () => {
    if (!id) return;
    
    isLoading.value = true;
    error.value = null;
    try {
      const result = await fetchFn(id);
      data.value = result;
      options.onSuccess?.(result);
    } catch (e) {
      error.value = e;
      options.onError?.(e);
      console.error("Fetch detail error:", e);
    } finally {
      isLoading.value = false;
    }
  };

  onMounted(() => {
    if (options.immediate !== false) {
      fetchData();
    }
  });

  return {
    data,
    isLoading,
    error,
    fetchData,
  };
}
