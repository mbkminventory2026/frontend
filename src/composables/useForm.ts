import { ref, onMounted } from 'vue'
import { toast } from 'vue-sonner'

interface UseFormOptions {
  api: {
    get?: (...args: any[]) => Promise<any>
    update?: (id: any, data: any) => Promise<any>
    create?: (data: any) => Promise<any>
  }
  onSuccess?: (data: any) => void
  onError?: (error: any) => void
  id?: any // Required for update
  immediate?: boolean
}

export function useForm<T = any>(options: UseFormOptions) {
  const values = ref<T>({} as T)
  const originalValues = ref<T>({} as T)
  const isLoading = ref(false)
  const isSaving = ref(false)
  const isEditing = ref(false)

  const load = async (...args: any[]) => {
    if (!options.api.get) return
    
    isLoading.value = true
    try {
      const response = await options.api.get(...args)
      // Standardize response: handle array vs object
      const data = Array.isArray(response.results) ? response.results[0] : response.results
      
      if (data) {
        values.value = { ...data }
        originalValues.value = { ...data }
      }
      return data
    } catch (error) {
      console.error('Form load error:', error)
      toast.error('Gagal mengambil data')
      options.onError?.(error)
    } finally {
      isLoading.value = false
    }
  }

  const save = async (payloadOverride?: any) => {
    const isUpdate = !!options.id && options.api.update
    const apiCall = isUpdate ? options.api.update : options.api.create
    
    if (!apiCall) {
      console.warn('No API call defined for save')
      return
    }

    isSaving.value = true
    try {
      const payload = payloadOverride || { ...values.value }
      
      const response = isUpdate 
        ? await options.api.update!(options.id, payload)
        : await options.api.create!(payload)
        
      toast.success(isUpdate ? 'Data berhasil diperbarui' : 'Data berhasil disimpan')
      
      isEditing.value = false
      options.onSuccess?.(response)
      
      // Refresh data after save if it was an update
      if (isUpdate) await load()
      
      return response
    } catch (error: any) {
      console.error('Form save error:', error)
      const message = error.response?.data?.message || 'Gagal menyimpan data'
      toast.error(message)
      options.onError?.(error)
    } finally {
      isSaving.value = false
    }
  }

  const reset = () => {
    values.value = { ...originalValues.value }
  }

  const toggleEdit = () => {
    if (isEditing.value) {
      reset()
    }
    isEditing.value = !isEditing.value
  }

  if (options.immediate) {
    onMounted(() => load())
  }

  return {
    values,
    isLoading,
    isSaving,
    isEditing,
    load,
    save,
    reset,
    toggleEdit
  }
}
